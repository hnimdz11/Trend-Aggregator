const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Gửi báo cáo phân tích Trend Aggregator đến Telegram
 * @param {string} token Telegram Bot Token
 * @param {string} chatId Telegram Chat ID
 * @param {string} keyword Từ khóa tìm kiếm
 * @param {number} dateRange Khoảng thời gian quét (ngày)
 * @param {number} articlesCount Số bài viết thu thập được
 * @param {string} filePath Đường dẫn đến file Markdown báo cáo đính kèm
 */
async function sendReport(token, chatId, keyword, dateRange, articlesCount, filePath) {
  try {
    // 1. Gửi tin nhắn text tóm tắt ngắn gọn
    const text = `📊 *Báo cáo Trend Aggregator mới nhất*
----------------------------------------
• *Từ khóa quét*: \`${keyword}\`
• *Phạm vi thời gian*: \`${dateRange} ngày gần đây\`
• *Số lượng tin cào*: \`${articlesCount} tin bài\`
• *Thời gian xuất bản*: \`${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\`

Báo cáo phân tích AI chi tiết đã được xuất thành tệp tin đính kèm dưới đây.`;

    const messageUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(messageUrl, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });

    // 2. Gửi tệp tin Markdown đính kèm nếu tồn tại
    if (filePath && fs.existsSync(filePath)) {
      const documentUrl = `https://api.telegram.org/bot${token}/sendDocument`;
      
      const formData = new FormData();
      formData.append('chat_id', chatId);
      
      const fileBuffer = fs.readFileSync(filePath);
      const fileBlob = new Blob([fileBuffer], { type: 'text/markdown' });
      formData.append('document', fileBlob, path.basename(filePath));

      await axios.post(documentUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    
    console.log(`Successfully sent report for keyword "${keyword}" to Telegram chat ${chatId}`);
    return { success: true };
  } catch (err) {
    const errorMsg = err.response?.data?.description || err.message;
    console.error('Failed to send Telegram report:', errorMsg);
    throw new Error(`Telegram error: ${errorMsg}`);
  }
}

/**
 * Kiểm tra kết nối tới Telegram bằng cách gửi tin nhắn thử nghiệm
 * @param {string} token Telegram Bot Token
 * @param {string} chatId Telegram Chat ID
 */
async function testConnection(token, chatId) {
  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: '🔔 *Trend Aggregator*: Kết nối thử nghiệm từ ứng dụng Desktop thành công! Bot đã sẵn sàng nhận báo cáo.',
      parse_mode: 'Markdown'
    });
    return { success: true };
  } catch (err) {
    const errorMsg = err.response?.data?.description || err.message;
    console.error('Telegram test connection failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

module.exports = {
  sendReport,
  testConnection
};
