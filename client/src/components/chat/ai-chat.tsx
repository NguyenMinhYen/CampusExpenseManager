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

const expenseCategories = [
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Entertainment",
  "Other"
];

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: chatMutate, isPending } = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/chat", { question });
      return res.json();
    },
    onSuccess: (data) => {
      addMessage("assistant", data.reply);
    },
    onError: () => {
      toast({ title: "Error", description: "Something went wrong." });
    },
  });

  const { mutate: addExpenseMutate, isPending: isAddingExpense } = useMutation({
    mutationFn: async (expenseData: ParsedExpense) => {
      const res = await apiRequest("POST", "/api/expenses", expenseData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      addMessage(
        "assistant",
        `Expense added:\n` +
        `- Amount: $${data.amount.toFixed(2)}\n` +
        `- Category: ${data.category}\n` +
        `- Description: ${data.description}\n` +
        `- Date: ${data.date}`
      );
      toast({
        title: "Success",
        description: "Expense added!",
      });
    },
    onError: () => {
      addMessage(
        "assistant",
        "Sorry, I couldn't add this expense. Please try again or use the expense form."
      );
      toast({
        title: "Error",
        description: "Unable to add expense.",
        variant: "destructive",
      });
    },
  });

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const parseExpenseInput = (text: string): ExpenseParseResult => {
    // Multiple patterns to match different ways of expressing expenses
    const patterns = [
      // Pattern 1: "spent 50$ on food" or "chi 50$ cho đồ ăn"
      /(?:spent|paid|add|chi|tiêu)\s+([\d,.]+)\s*\$?\s*(?:on|for|cho|vào)\s+([a-zA-ZÀ-ỹ\s]+)/i,
      // Pattern 2: "50$ for noodles" or "50$ cho mì"
      /([\d,.]+)\s*\$?\s*(?:for|on|cho|vào)\s+([a-zA-ZÀ-ỹ\s]+)/i,
      // Pattern 3: "food expense 50 dollars" or "chi phí ăn uống 50 đô"
      /([a-zA-ZÀ-ỹ\s]+)\s+(?:expense|cost|chi phí|phí)\s+([\d,.]+)\s*(?:dollars|dollar|\$|đô)/i,
      // Pattern 4: "mua mì 50k" or "ăn sáng 100k"
      /(?:mua|ăn|uống)\s+([a-zA-ZÀ-ỹ\s]+)\s+([\d,.]+)\s*(k|nghìn|ngàn)/i,
      // Pattern 5: "50k mì" or "100k cà phê"
      /([\d,.]+)\s*(k|nghìn|ngàn)\s+([a-zA-ZÀ-ỹ\s]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = parseFloat(match[1].replace(',', ''));
        let description = "";

        // Handle different pattern groups
        if (pattern === patterns[3] || pattern === patterns[4]) {
          // For patterns like "mua mì 50k" or "50k mì"
          description = match[1] ? match[1].trim() : match[3].trim();
          if (match[2] && (match[2] === "k" || match[2].includes("nghìn") || match[2].includes("ngàn"))) {
            amount *= 1000; // Convert 50k to 50000
          }
        } else {
          // For other patterns
          description = match[2].trim();
        }

        // Find the best matching category
        const matchedCategory = expenseCategories.find(category =>
          description.toLowerCase().includes(category.toLowerCase())
        ) ||
        (description.toLowerCase().includes("rent") ||
        description.toLowerCase().includes("apartment") ||
        description.toLowerCase().includes("mortgage") ||
        description.toLowerCase().includes("house")) ? "Housing" :
       (description.toLowerCase().includes("gasoline") ||
        description.toLowerCase().includes("fuel") ||
        description.toLowerCase().includes("bus") ||
        description.toLowerCase().includes("taxi") ||
        description.toLowerCase().includes("vehicle") ||
        description.toLowerCase().includes("grab") ||
        description.toLowerCase().includes("uber")) ? "Transportation" :
       (description.toLowerCase().includes("eat") ||
        description.toLowerCase().includes("drink") ||
        description.toLowerCase().includes("noodles") ||
        description.toLowerCase().includes("rice") ||
        description.toLowerCase().includes("coffee") ||
        description.toLowerCase().includes("lunch") ||
        description.toLowerCase().includes("dinner") ||
        description.toLowerCase().includes("breakfast")) ? "Food" :
       (description.toLowerCase().includes("electricity") ||
        description.toLowerCase().includes("water") ||
        description.toLowerCase().includes("internet") ||
        description.toLowerCase().includes("wifi") ||
        description.toLowerCase().includes("phone bill")) ? "Utilities" :
       (description.toLowerCase().includes("insurance") ||
        description.toLowerCase().includes("life insurance") ||
        description.toLowerCase().includes("car insurance") ||
        description.toLowerCase().includes("health insurance")) ? "Insurance" :
       (description.toLowerCase().includes("hospital") ||
        description.toLowerCase().includes("clinic") ||
        description.toLowerCase().includes("medicine") ||
        description.toLowerCase().includes("pharmacy") ||
        description.toLowerCase().includes("doctor")) ? "Healthcare" :
       (description.toLowerCase().includes("movie") ||
        description.toLowerCase().includes("cinema") ||
        description.toLowerCase().includes("concert") ||
        description.toLowerCase().includes("game") ||
        description.toLowerCase().includes("netflix") ||
        description.toLowerCase().includes("spotify")) ? "Entertainment" :
       "Other";

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
      error: "Unable to identify spending information. Please enter in the format: '$50 for food' or 'spend 100k on books'"
    };
  };

  const handleUserInput = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    addMessage("user", userMessage);
    setInput("");

    // Try to parse as expense
    const { isValid, expenseData, error } = parseExpenseInput(userMessage);

    if (isValid && expenseData) {
      addExpenseMutate(expenseData);
    } else if (error) {
      addMessage("assistant", error);
    } else {
      // If not an expense, proceed with normal chat
      chatMutate(userMessage);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Financial Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-message break-words whitespace-pre-wrap max-w-full flex gap-2 items-start ${m.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {m.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                <span className={`rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                  {m.content}
                </span>
              </div>
            ))}
            {(isPending || isAddingExpense) && (
              <div className="flex gap-2 items-start">
                <Bot size={20} />
                <span className="bg-gray-100 rounded-xl px-3 py-2 text-sm">
                  <Loader2 className="animate-spin inline mr-2" size={16} />
                  Đang xử lý...
                </span>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUserInput()}
            placeholder="For example: '$50 for food' or 'spend 100k on books'"
          />
          <Button onClick={handleUserInput} disabled={isPending || isAddingExpense}>
            {(isPending || isAddingExpense) ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}