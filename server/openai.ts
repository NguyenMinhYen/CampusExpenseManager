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
            "Bạn là một cố vấn tài chính. Hãy đưa ra lời khuyên hữu ích về tài chính cá nhân, lập ngân sách và quản lý chi tiêu. Hãy trả lời bằng tiếng Việt và định dạng câu trả lời của bạn thành các phần rõ ràng:\n\n" +
            "1. Sử dụng dấu gạch đầu dòng (-) cho các điểm quan trọng\n" +
            "2. Tách các phần bằng dòng trống\n" +
            "3. Nhấn mạnh các con số và khuyến nghị chính\n" +
            "4. Kết thúc bằng một lời khuyên ngắn gọn",
        },
        {
          role: "user",
          content: `Câu hỏi: ${question}\nThông tin: ${
            context
              ? `Chi tiêu hàng tháng: ${context.expenses.toLocaleString()}đ, Ngân sách: ${context.budget.toLocaleString()}đ`
              : "Chưa có thông tin tài chính"
          }`,
        },
      ],
    });

    return response.choices[0].message.content || "Xin lỗi, tôi không thể đưa ra lời khuyên lúc này.";
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error("Không thể lấy lời khuyên tài chính: " + error.message);
  }
}