const { GoogleGenAI } = require('@google/genai');

// Helper: Lấy client Gemini với key cụ thể
function getGeminiClient(apiKey) {
  return new GoogleGenAI({ apiKey });
}

// Xoay vòng gọi hàm của Gemini qua danh sách keys kèm cơ chế tự động thử lại (retry) lỗi tạm thời
async function callWithKeyRotation(keysList, apiFn) {
  if (!keysList || keysList.length === 0) {
    throw new Error('No Gemini API Keys found. Please add a key in Settings.');
  }
  
  let lastError = null;
  const maxRetriesPerKey = 3;
  
  for (let i = 0; i < keysList.length; i++) {
    const key = keysList[i];
    if (!key || !key.trim()) continue;
    
    let retryCount = 0;
    while (retryCount < maxRetriesPerKey) {
      try {
        const ai = getGeminiClient(key.trim());
        return await apiFn(ai);
      } catch (err) {
        lastError = err;
        
        // Nhận diện mã trạng thái HTTP hoặc từ khóa lỗi
        const status = err.status || (err.error && err.error.code);
        const errText = err.message || '';
        const isTransient = status === 503 || status === 429 || errText.includes('503') || errText.includes('429') || errText.includes('UNAVAILABLE');
        
        if (isTransient && retryCount < maxRetriesPerKey - 1) {
          retryCount++;
          const delay = retryCount * 1500;
          console.warn(`Gemini Key #${i+1} gặp lỗi tạm thời (${status || 'UNAVAILABLE'}). Thử lại sau ${delay}ms... (Lần ${retryCount}/${maxRetriesPerKey})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Lỗi vĩnh viễn (403, 400) hoặc đã hết số lượt thử lại
          console.warn(`Gemini Key #${i+1} lỗi vĩnh viễn hoặc hết lượt retry:`, err.message);
          break; // Chuyển sang Key tiếp theo
        }
      }
    }
  }
  throw lastError || new Error('All Gemini API Keys failed.');
}

// Test connection
async function testKey(key) {
  try {
    const ai = getGeminiClient(key);
    // Sử dụng model 2.5 Flash mặc định để test nhanh
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping. Reply with "Pong" if working.'
    });
    return response.text.includes('Pong') || response.text.length > 0;
  } catch (err) {
    throw new Error(`Connection test failed: ${err.message}`);
  }
}

// Phân tích và tóm tắt bài viết cào được
async function summarizeArticles(keysList, model, keyword, articles, customSystemPrompt) {
  // Chuẩn bị dữ liệu bài viết
  const articlesContext = articles.map((a, i) => {
    const cleanSummary = (a.summary || '').substring(0, 400); // Cắt ngắn để tránh quá tải Token
    return `[Post #${i+1}]
Source: ${a.source}
Title: ${a.title}
Date: ${a.date}
Engagement: ${a.engagement}
URL: ${a.url}
Content Snippet: ${cleanSummary}
---`;
  }).join('\n\n');

  const defaultPrompt = `Bạn là một AI Agent nghiên cứu thông tin cao cấp. Tôi muốn bạn phân tích các bài viết, bài đăng mạng xã hội và tin tức RSS liên quan đến từ khóa "${keyword}" trong vòng 15 ngày qua.

Dưới đây là danh sách dữ liệu thô đã thu thập được:
${articlesContext}

Hãy tạo một báo cáo tóm tắt bằng tiếng Việt theo định dạng Markdown đầy đủ với các yêu cầu sau:
1. **Mục lục tự động (Table of Contents)** ở ngay đầu báo cáo.
2. **Tóm tắt tổng quan (Executive Summary)** (Tối đa 300 từ) tóm tắt các điểm cốt lõi, diễn biến chính và sắc thái dư luận về từ khóa "${keyword}".
3. **Phân tích sắc thái dư luận (Sentiment Analysis)**:
   - Thống kê tỷ lệ phần trăm hoặc số lượng các bài viết có sắc thái: Tích cực (Positive), Trung lập (Neutral), Tiêu cực (Negative).
   - Giải thích ngắn gọn lý do tại sao dư luận có sắc thái như vậy.
   - Hãy chèn một biểu đồ phân bổ sắc thái dạng bảng hoặc dạng văn bản (ASCII Chart).
4. **Các chủ đề/xu hướng nổi bật (Key Themes & Trends)**: Nhóm các bài viết có nội dung tương đồng lại thành các chủ đề lớn (ví dụ: Chuyên môn, Tin đồn chuyển nhượng, Đời tư...). Mỗi chủ đề phân tích rõ nguồn tin và nội dung chính.
5. **Bảng so sánh dữ liệu (Data Comparison Table)**: Lập bảng so sánh các bài đăng có lượng tương tác (engagement) cao nhất từ các nguồn khác nhau bao gồm: Tiêu đề, Nguồn, Lượt tương tác, Tóm tắt ngắn ý kiến dư luận.
6. **Kết luận & Góc nhìn AI (Conclusion & AI Insights)**: Các bài học rút ra, nhận định tương lai.
7. **Hộp thông báo Alerts**: Sử dụng cú pháp hộp thông báo của GitHub (ví dụ \`> [!IMPORTANT]\`, \`> [!NOTE]\`) để làm nổi bật các sự kiện hoặc tin tức quan trọng/đột phá nhất.

Chú ý: Hãy nhúng các link nguồn URL cho mỗi bài viết để tôi có thể click vào xem trực tiếp. Giữ văn phong chuyên nghiệp, khách quan.`;

  const finalPrompt = customSystemPrompt ? `${customSystemPrompt}\n\nTừ khóa: "${keyword}"\nDự liệu:\n${articlesContext}` : defaultPrompt;

  return await callWithKeyRotation(keysList, async (ai) => {
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: finalPrompt
    });
    return response.text;
  });
}

// Chat RAG với lịch sử đã cào
async function chatWithData(keysList, model, keyword, articles, chatHistory, userMessage) {
  // Lập ngữ cảnh dữ liệu
  const articlesContext = articles.map((a, i) => {
    const cleanSummary = (a.summary || '').substring(0, 500); // Cắt ngắn để tránh quá tải Token
    return `ID: #${i+1} | Source: ${a.source} | Title: ${a.title} | Engagement: ${a.engagement} | URL: ${a.url}\nSummary: ${cleanSummary}\n`;
  }).join('\n');

  // Xây dựng lịch sử hội thoại cho Gemini API
  const messages = [
    {
      role: 'user',
      parts: [{
        text: `Bạn là trợ lý AI thông minh tích hợp sẵn trong ứng dụng. Bạn có quyền truy cập vào toàn bộ dữ liệu chúng ta đã thu thập được về từ khóa "${keyword}".
Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng dựa TRÊN dữ liệu thu thập được dưới đây. 
Nếu câu trả lời không có trong dữ liệu, hãy nói rõ rằng dữ liệu thu thập được không đề cập đến thông tin đó nhưng bạn vẫn có thể đưa ra phân tích khách quan dựa trên kiến thức của bạn.

Dữ liệu thu thập được:
${articlesContext}`
      }]
    },
    {
      role: 'model',
      parts: [{
        text: `Tôi đã hiểu. Tôi sẵn sàng hỗ trợ bạn phân tích dữ liệu về từ khóa "${keyword}". Bạn muốn biết thông tin gì?`
      }]
    }
  ];

  // Nhúng lịch sử chat cũ
  for (const msg of chatHistory) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    });
  }

  // Nhập tin nhắn mới của user
  messages.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  return await callWithKeyRotation(keysList, async (ai) => {
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: messages
    });
    return response.text;
  });
}

module.exports = {
  testKey,
  summarizeArticles,
  chatWithData
};
