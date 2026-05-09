import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ReplySuggestion {
  text: string;
  explanation: string;
}

export type Vibe = 'funny' | 'subtle' | 'flirty' | 'mysterious';

export interface DateSuggestion {
  idea: string;
  response: string;
  tips: string;
}

export interface LoveAdvice {
  dos: string[];
  donts: string[];
  strategy: string;
}

export interface LoveSummary {
  finalStrategy: string;
  keyInsights: string[];
  nextSteps: string[];
}

const VIBE_PROMPTS: Record<Vibe, string> = {
  funny: "Hài hước, dí dỏm, tạo tiếng cười tự nhiên nhưng không vô duyên.",
  subtle: "Tinh tế, sâu sắc, quan tâm nhẹ nhàng nhưng không quá vồ vập.",
  flirty: "Thả thính nhẹ nhàng, tạo sự rung động và tò mò.",
  mysterious: "Bí ẩn, ngắn gọn, khiến đối phương phải suy nghĩ và muốn tìm hiểu thêm."
};

export interface JournalEntry {
  id: string;
  timestamp: string;
  content: string;
  mood?: string;
  image?: string;
}

export interface JournalAnalysis {
  progress: string;
  nextBestAction: string;
  suggestedTime: string;
  reasoning: string;
}

export async function analyzeJournal(entries: JournalEntry[]): Promise<JournalAnalysis> {
  const journalText = entries.map(e => `[${e.timestamp}] ${e.content}`).join('\n');

  const systemInstruction = `Bạn là chuyên gia chiến lược tình cảm và phân tích hành vi.
Dựa trên nhật ký các hoạt động hẹn hò của người dùng, hãy:
1. Đánh giá tiến triển hiện tại (Ấm áp, mập mờ, hay đang tiến triển tốt...).
2. Gợi ý hành động tiếp theo nên làm (Hoạt động cụ thể).
3. Gợi ý thời gian cụ thể (Ngày nào, mấy giờ) để thực hiện hành động đó dựa trên thói quen trong nhật ký.
4. Giải thích tại sao hành động và thời gian đó lại hiệu quả.

Ngôn ngữ: Tinh tế, có chiều sâu tâm lý, thực tế.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Đây là nhật ký hẹn hò của tôi:\n${journalText}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            progress: { type: Type.STRING },
            nextBestAction: { type: Type.STRING },
            suggestedTime: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["progress", "nextBestAction", "suggestedTime", "reasoning"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Journal API Error:", error);
    return { 
      progress: "Chưa thể phân tích.", 
      nextBestAction: "Hãy tiếp tục quan tâm cô ấy.", 
      suggestedTime: "Dịp cuối tuần tới", 
      reasoning: "Lỗi kết nối AI." 
    };
  }
}

export async function getReplySuggestions(crushMessage: string, vibe: Vibe): Promise<ReplySuggestion[]> {
  const vibeDescription = VIBE_PROMPTS[vibe];
  
  const systemInstruction = `Bạn là một trợ lý tán gái thông minh và tinh tế. 
Nhiệm vụ của bạn là giúp người dùng trả lời tin nhắn từ Crush một cách ấn tượng nhất.
Phong cách yêu cầu hiện tại: ${vibeDescription}

Nguyên tắc:
- Ngôn ngữ: Tiếng Việt tự nhiên, trẻ trung, phù hợp với giới trẻ hiện nay (Gen Z).
- Không được trả lời quá dài dòng trừ khi thực sự cần thiết.
- Tránh các câu trả lời sáo rỗng, quá lố hoặc gây khó chịu.
- Mỗi gợi ý phải có một phần giải thích ngắn gọn tại sao câu trả lời này lại hiệu quả.

Bạn phải trả về kết quả dưới dạng mảng JSON gồm 3 đối tượng, mỗi đối tượng có 'text' (nội dung tin nhắn) và 'explanation' (giải thích ý đồ).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Crush vừa nhắn: "${crushMessage}"\n\nHãy gợi ý cho tôi 3 cách trả lời hay nhất theo phong cách ${vibeDescription}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["text", "explanation"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [{ text: "Có chút lỗi kỹ thuật rồi, thử lại sau nhé!", explanation: "Lỗi kết nối API" }];
  }
}

export async function getDateSuggestions(context: string): Promise<DateSuggestion[]> {
  const systemInstruction = `Bạn là chuyên gia tư vấn hẹn hò. 
Dựa trên tình huống người dùng cung cấp (ví dụ: 'Crush rủ đi cafe', 'Muốn rủ Crush đi xem phim'), hãy đưa ra 3 phương án hẹn hò sáng tạo.
Mỗi phương án bao gồm:
- idea: Ý tưởng buổi hẹn (địa điểm, hoạt động).
- response: Cách nhắn tin trả lời hoặc lời mời tinh tế.
- tips: Lưu ý quan trọng để buổi hẹn thành công.

Ngôn ngữ: Tiếng Việt Gen Z, tinh tế, hiện đại.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tình huống: "${context}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              idea: { type: Type.STRING },
              response: { type: Type.STRING },
              tips: { type: Type.STRING }
            },
            required: ["idea", "response", "tips"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
}

export async function getLoveAdvice(context: string, history: { context: string, advice: string }[] = []): Promise<LoveAdvice> {
  const historyText = history.length > 0 
    ? `\nLịch sử các tình huống trước đó:\n${history.map(h => `- Tình huống: ${h.context}\n  Lời khuyên: ${h.advice}`).join('\n')}`
    : '';

  const systemInstruction = `Bạn là một Love Coach chuyên nghiệp. 
Đưa ra lời khuyên cho người dùng về cách ứng xử với Crush trong tình huống cụ thể.
${historyText}

Nhiệm vụ:
- dos: Những điều nên làm (danh sách 3-4 mục).
- donts: Những điều tuyệt đối nên tránh (danh sách 3-4 mục).
- strategy: Chiến lược cụ thể cho tình huống NÀY, có tính đến bối cảnh lịch sử nếu có.

Hãy viết thật thực tế, tâm lý và có chút hài hước.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tình huống hiện tại: "${context}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dos: { type: Type.ARRAY, items: { type: Type.STRING } },
            donts: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategy: { type: Type.STRING }
          },
          required: ["dos", "donts", "strategy"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { dos: [], donts: [], strategy: "Lỗi kết nối AI." };
  }
}

export async function getFinalSummary(history: { context: string, advice: string }[]): Promise<LoveSummary> {
  const historyText = history.map(h => `- Tình huống: ${h.context}\n  Giải pháp đã gợi ý: ${h.advice}`).join('\n\n');

  const systemInstruction = `Bạn là một chuyên gia tâm lý và chiến lược tình cảm. 
Dựa trên chuỗi các tình huống và những lời khuyên đã đưa ra trước đó, hãy tổng hợp thành một CHIẾN LƯỢC TOÀN DIỆN để cưa đổ đối tượng này.

Yêu cầu kết quả hoàn chỉnh bao gồm:
- finalStrategy: Một bản kế hoạch tổng thể, đúc kết từ mọi tình huống.
- keyInsights: Những điểm mấu chốt quan trọng nhất về tâm lý đối phương cần ghi nhớ (3-4 điểm).
- nextSteps: Các bước cụ thể người dùng nên thực hiện tiếp theo (3-4 bước).

Ngôn ngữ: Chuyên nghiệp, thực tế, tạo động lực và tinh tế.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Đây là lịch sử hành trình cưa đổ crush:\n${historyText}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            finalStrategy: { type: Type.STRING },
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["finalStrategy", "keyInsights", "nextSteps"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { finalStrategy: "Lỗi kết nối AI.", keyInsights: [], nextSteps: [] };
  }
}

export interface ImageAnalysis {
  analysis: string;
  suggestions: string[];
}

export async function analyzeCrushImage(imageBase64: string, mimeType: string, mode: 'personality' | 'comment'): Promise<ImageAnalysis> {
  const systemInstruction = mode === 'personality' 
    ? `Bạn là chuyên gia tâm lý và đọc vị qua hình ảnh. 
Phân tích bức ảnh của Crush (có thể là ảnh cá nhân, ảnh đi chơi) để đưa ra:
1. Vibe/Phong cách của họ (ví dụ: năng động, hướng nội, sang chảnh...).
2. Dự đoán sở thích hoặc những điểm họ tự hào trong ảnh.
3. Gợi ý cách bắt chuyện hoặc chủ đề nên nói dựa trên ảnh này.

Hãy viết thật tinh tế, tích cực và tôn trọng.`
    : `Bạn là chuyên gia sáng tạo nội dung mạng xã hội.
Nhìn vào ảnh bài đăng/screenshot bài viết này, hãy:
1. Tóm tắt nội dung/thông điệp của bài đăng.
2. Gợi ý 3 câu comment phù hợp nhất: 1 câu hài hước, 1 câu khen ngợi tinh tế, 1 câu đặt câu hỏi để kéo dài hội thoại.

Ngôn ngữ: Trẻ trung, tự nhiên, không bị giả trân.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: mode === 'personality' ? "Hãy phân tích tính cách và sở thích của người trong ảnh này." : "Hãy gợi ý comment cho bài đăng này." },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["analysis", "suggestions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Image API Error:", error);
    return { analysis: "Không thể phân tích ảnh vào lúc này.", suggestions: [] };
  }
}
