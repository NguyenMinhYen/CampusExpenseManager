import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
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
            "You are a financial advisor. Provide helpful advice about personal finance, budgeting, and expense management.",
        },
        {
          role: "user",
          content: `Question: ${question}\nContext: ${
            context
              ? `Current monthly expenses: $${context.expenses}, Budget: $${context.budget}`
              : "No financial context provided"
          }`,
        },
      ],
    });

    return response.choices[0].message.content || "Sorry, I couldn't generate advice at this time.";
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error("Failed to get financial advice: " + error.message);
  }
}