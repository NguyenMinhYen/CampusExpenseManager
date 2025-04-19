import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, User, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ParsedExpense {
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface ExpenseParseResult {
  isValid: boolean;
  expenseData?: ParsedExpense;
  error?: string;
}

interface InvestmentInfo {
  amount: number;
  timeHorizon: string;
  riskTolerance: string;
}

const expenseCategories = [
  "Housing", "Transportation", "Food", "Utilities",
  "Insurance", "Healthcare", "Entertainment", "Other"
];

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const chatMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/chat", { question });
      return res.json();
    },
    onSuccess: (data) => {
      const formattedResponse = data.response
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .join('\n\n');
      addMessage("assistant", formattedResponse);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { mutate: addExpenseMutate } = useMutation({
    mutationFn: async (expenseData: ParsedExpense) => {
      const res = await apiRequest("POST", "/api/expenses", expenseData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      addMessage("assistant",
        `Expense added:\n
        - Amount: $${data.amount.toFixed(2)}\n
        - Category: ${data.category}\n
        - Description: ${data.description}\n
        - Date: ${data.date}`
      );
      toast({ title: "Success", description: "Expense added!" });
    },
    onError: () => {
      addMessage("assistant", "Sorry, I couldn't add this expense. Please try again or use the expense form.");
      toast({ title: "Error", description: "Unable to add expense.", variant: "destructive" });
    },
  });

  const parseExpenseInput = (text: string): ExpenseParseResult => {
    const expensePatterns = [
      /(?:spent|paid|add|chi|tiêu)\s+([\d,.]+)\s*\$?\s*(?:on|for|cho|vào)\s+([a-zA-ZÀ-ỹ\s]+)/i,
      /([\d,.]+)\s*\$?\s*(?:for|on|cho|vào)\s+([a-zA-ZÀ-ỹ\s]+)/i,
      /([a-zA-ZÀ-ỹ\s]+)\s+(?:expense|cost|chi phí|phí)\s+([\d,.]+)\s*(?:dollars|dollar|\$|đô)/i,
      /(?:mua|ăn|uống)\s+([a-zA-ZÀ-ỹ\s]+)\s+([\d,.]+)\s*(k|nghìn|ngàn)/i,
      /([\d,.]+)\s*(k|nghìn|ngàn)\s+([a-zA-ZÀ-ỹ\s]+)/i,
    ];

    for (const pattern of expensePatterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = parseFloat(match[1].replace(',', ''));
        let description = "";

        if (pattern === expensePatterns[3] || pattern === expensePatterns[4]) {
          description = match[1] ? match[1].trim() : match[3].trim();
          if (match[2] && /k|nghìn|ngàn/i.test(match[2])) amount *= 1000;
        } else {
          description = match[2].trim();
        }

        const matchedCategory = expenseCategories.find(c =>
          description.toLowerCase().includes(c.toLowerCase())
        ) || (
            /rent|apartment|mortgage|house/i.test(description) ? "Housing" :
              /gasoline|fuel|bus|taxi|vehicle|grab|uber/i.test(description) ? "Transportation" :
                /eat|drink|noodles|rice|coffee|lunch|dinner|breakfast/i.test(description) ? "Food" :
                  /electricity|water|internet|wifi|phone bill/i.test(description) ? "Utilities" :
                    /insurance|life insurance|car insurance|health insurance/i.test(description) ? "Insurance" :
                      /hospital|clinic|medicine|pharmacy|doctor/i.test(description) ? "Healthcare" :
                        /movie|cinema|concert|game|netflix|spotify/i.test(description) ? "Entertainment" :
                          "Other"
          );

        return {
          isValid: true,
          expenseData: {
            amount,
            category: matchedCategory,
            description: description.charAt(0).toUpperCase() + description.slice(1),
            date: new Date().toISOString().split('T')[0],
          }
        };
      }
    }

    return {
      isValid: false,
      error: "Unable to identify spending information. Example: '50$ for food' or 'spend 100k on books'"
    };
  };

  const parseInvestmentInput = (text: string): { isInvestment: boolean; info?: InvestmentInfo } => {
    const investmentKeywords = [
      'invest', 'investment', 'savings', 'grow money', 'stock market',
      'bonds', 'etf', 'mutual fund', 'portfolio', 'retirement',
      'đầu tư', 'tiết kiệm', 'sinh lời', 'tích lũy', 'chứng khoán',
      'quỹ mở', 'cổ phiếu', 'trái phiếu', 'tài chính', 'lãi suất'
    ];
    const expenseKeywords = [
      'spend', 'expense', 'cost', 'payment', 'bill',
      'chi tiêu', 'thanh toán', 'mua sắm', 'tiêu dùng', 'chi phí'
    ];

    if (expenseKeywords.some(k => text.toLowerCase().includes(k))) {
      return { isInvestment: false };
    }

    const hasInvestmentKeyword = investmentKeywords.some(k => text.toLowerCase().includes(k));
    if (!hasInvestmentKeyword) return { isInvestment: false };

    const amountRegex = /(\d+[,.]?\d*)\s*(k|nghìn|ngàn|tr|triệu|million|đ|dollar|\$)/i;
    const timeRegex = /(short|medium|long)\s*term|ngắn hạn|trung hạn|dài hạn/i;
    const riskRegex = /(conservative|moderate|aggressive|an toàn|trung bình|mạo hiểm)/i;

    const amountMatch = text.match(amountRegex);
    const timeMatch = text.match(timeRegex);
    const riskMatch = text.match(riskRegex);

    return {
      isInvestment: true,
      info: {
        amount: amountMatch ? parseFloat(amountMatch[1].replace(',', '')) *
          (/tr|triệu/i.test(amountMatch[2]) ? 1000000 :
            /k|nghìn|ngàn/i.test(amountMatch[2]) ? 1000 : 1) : 0,
        timeHorizon: timeMatch ? (
          /short|ngắn/i.test(timeMatch[0]) ? 'short-term' :
            /medium|trung/i.test(timeMatch[0]) ? 'medium-term' : 'long-term'
        ) : 'medium-term',
        riskTolerance: riskMatch ? (
          /conservative|an toàn/i.test(riskMatch[0]) ? 'conservative' :
            /moderate|trung bình/i.test(riskMatch[0]) ? 'moderate' : 'aggressive'
        ) : 'moderate'
      }
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    addMessage("user", userMessage);
    setInput("");

    const { isInvestment, info } = parseInvestmentInput(userMessage);
    if (isInvestment) {
      const savings = 0;
      chatMutation.mutate(
        `Investment advice needed. ${info ?
          `Amount: ${info.amount}đ, Time horizon: ${info.timeHorizon}, Risk tolerance: ${info.riskTolerance}.` : ''} ${savings ? `Current savings: ${savings}đ.` : ''} ${userMessage}`
      );
      return;
    }

    const { isValid, expenseData } = parseExpenseInput(userMessage);
    if (isValid && expenseData) {
      addExpenseMutate(expenseData);
      return;
    }

    chatMutation.mutate(userMessage);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Financial Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 mb-4 border rounded p-2">
          {messages.map((msg, index) => (
            <div key={index} className="flex mb-3">
              {msg.role === "user" ? <User className="mr-2" /> : <Bot className="mr-2" />}
              <div>
                {msg.content.split('\n').map((line, idx) => (
                  <p key={idx} className="mb-1">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Ask or record a transaction..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit">
            <Send size={16} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
