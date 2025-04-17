import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export async function getFinancialAdvice(
  question: string,
  context?: { expenses: number; budget: number },
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a smart financial advisor. Give useful advice on personal finance, budgeting and spending management. " +
            "If a user mentions an expense but is unclear, ask again to confirm before adding it to the system.\n\n" +
            "How to respond:\n" +
            "- Use bullet points (-) for important points\n" +
            "- Separate sections with blank lines\n" +
            "- Emphasize key numbers and recommendations\n" +
            "- End with a brief advice\n\n" +
            "For expenses, you can help directly if the information is complete:\n" +
            "- Amount\n" +
            "- Spending purpose\n" +
            "- Category (if unclear, it will be automatically classified)",
        },
        {
          role: "user",
          content: `Question: ${question}\nInformation: ${context
            ? `Monthly Expenses: ${context.expenses.toLocaleString()}đ, Budget: ${context.budget.toLocaleString()}đ`
            : "No financial information yet"
            }`,
        },
      ],
    });

    return response.choices[0].message.content || "Sorry, I can't give advice at this time.";
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error("Unable to get financial advice: " + error.message);
  }
}