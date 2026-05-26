const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Helper: Tải ảnh về thư mục cục bộ và trả về đường dẫn tương đối
async function downloadImage(imgUrl, destFolder, relativePrefix) {
  try {
    // Tạo tên file ngẫu nhiên dựa trên hash của URL
    const hash = crypto.createHash('md5').update(imgUrl).digest('hex');
    
    // Đoán đuôi file ảnh
    let ext = 'jpg';
    if (imgUrl.includes('.png')) ext = 'png';
    else if (imgUrl.includes('.gif')) ext = 'gif';
    else if (imgUrl.includes('.webp')) ext = 'webp';
    
    const filename = `${hash}.${ext}`;
    const destPath = path.join(destFolder, filename);
    
    // Tải ảnh về
    const response = await axios({
      method: 'get',
      url: imgUrl,
      responseType: 'stream',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    return `${relativePrefix}/${filename}`;
  } catch (err) {
    console.warn(`Failed to download image ${imgUrl}:`, err.message);
    return imgUrl; // Fallback dùng link online ban đầu nếu tải lỗi
  }
}

// Xuất file Markdown chính
async function exportMarkdown(destFolder, keyword, articles, summaryMarkdown) {
  try {
    // Tạo thư mục lưu trữ ảnh đi kèm
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const cleanKeyword = keyword.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    // Tên file theo định dạng [date]_[keyword].md
    const mdFilename = `${dateStr}_${cleanKeyword}.md`;
    const mdFilePath = path.join(destFolder, mdFilename);
    
    const imagesFolderName = `${dateStr}_${cleanKeyword}_images`;
    const imagesFolderPath = path.join(destFolder, imagesFolderName);
    
    if (!fs.existsSync(imagesFolderPath)) {
      fs.mkdirSync(imagesFolderPath, { recursive: true });
    }
    
    // 1. Phân tích nội dung tóm tắt để tìm các ảnh mạng xã hội/YouTube cần tải về
    let processedSummary = summaryMarkdown;
    
    // Thường ảnh được nhúng dạng ![alt](url)
    const imgRegex = /!\[(.*?)\]\((https?:\/\/.*?)\)/g;
    let match;
    const downloadPromises = [];
    
    // Tìm toàn bộ link ảnh trong file tóm tắt
    while ((match = imgRegex.exec(summaryMarkdown)) !== null) {
      const altText = match[1];
      const imgUrl = match[2];
      downloadPromises.push({
        fullMatch: match[0],
        altText,
        imgUrl
      });
    }
    
    // Tải các hình ảnh song song
    for (const item of downloadPromises) {
      const localPath = await downloadImage(item.imgUrl, imagesFolderPath, `./${imagesFolderName}`);
      processedSummary = processedSummary.replace(item.fullMatch, `![${item.altText}](${localPath})`);
    }
    
    // 2. Tạo phần Metadata ở cuối file
    const metadata = `
---
## Thông tin Metadata Quét
- **Từ khóa quét**: \`${keyword}\`
- **Thời gian quét (GMT+7)**: \`${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\`
- **Số lượng nguồn tin đã quét**: \`${articles.length} bài đăng/tin tức\`
- **Phân bổ nguồn tin**:
${Object.entries(
  articles.reduce((acc, a) => {
    acc[a.source] = (acc[a.source] || 0) + 1;
    return acc;
  }, {})
).map(([source, count]) => `  - \`${source}\`: ${count} bài`).join('\n')}
- **Trình thu thập**: AI Trend Aggregator Windows Application.
`;
    
    const finalContent = `${processedSummary}\n${metadata}`;
    
    // Ghi file Markdown ra đĩa
    fs.writeFileSync(mdFilePath, finalContent, 'utf8');
    
    return {
      success: true,
      filePath: mdFilePath,
      fileName: mdFilename
    };
  } catch (err) {
    throw new Error(`Export Markdown failed: ${err.message}`);
  }
}

module.exports = {
  exportMarkdown
};
