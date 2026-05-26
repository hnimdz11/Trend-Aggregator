# Trend Aggregator 📊

**Trend Aggregator** là một ứng dụng Desktop thông minh (Windows) giúp thu thập dữ liệu đa nguồn từ các mạng xã hội và kênh RSS tùy chỉnh, kết hợp với sức mạnh của mô hình ngôn ngữ lớn Google Gemini để phân tích sắc thái dư luận, xu hướng và tự động gửi báo cáo chi tiết về Bot Telegram của bạn.

**Trend Aggregator** is a smart Desktop application (Windows) that aggregates multi-source data from social networks and custom RSS feeds. Powered by Google Gemini LLM, it analyzes sentiments and trends, and automatically dispatches detailed analysis reports to your Telegram Bot.

---

## 🌍 Ngôn ngữ / Languages
* [Tiếng Việt (#tiếng-việt)](#tiếng-việt)
* [English (#english)](#english)

---

## Tiếng Việt

### 🚀 Tính năng nổi bật
1. **Thu thập dữ liệu đa nguồn độc lập**:
   * **X / Twitter**: Quét dữ liệu thật thông qua đăng nhập bảo mật bằng Cookie của tài khoản cá nhân và gọi API GraphQL gốc. Tự động fallback về Nitter RSS hoặc mock data dự phòng.
   * **Reddit**: Tìm kiếm bài đăng, hỗ trợ giới hạn theo subreddit cụ thể và chế độ **Tìm sâu (Deep Search)** cào bình luận nổi bật.
   * **YouTube**: Tìm kiếm video và tải phụ đề/transcript tự động để làm tài liệu phân tích.
   * **TikTok & 9gag**: Thu thập tin bài và meme thịnh hành, tự động vượt rào bảo mật Cloudflare bằng trình duyệt ẩn danh của Electron.
   * **Hacker News & Polymarket**: Theo dõi các chủ đề công nghệ và tỷ lệ đặt cược dự đoán tài chính.
   * **RSS tùy biến**: Tự động phát hiện và cào tin tức từ các trang báo điện tử bất kỳ.
2. **Phân tích AI thông minh (Google Gemini)**:
   * Tự động tạo báo cáo Markdown hoàn chỉnh: Mục lục, Tóm tắt (Executive Summary), Phân tích sắc thái (Sentiment), So sánh và biểu đồ tần suất SVG trực quan.
   * **Xoay vòng API Keys**: Tự động đảo khóa API Gemini khi gặp lỗi Rate Limit (429).
   * **RAG Chat**: Cho phép trò chuyện trực tiếp với dữ liệu đã quét của từ khóa.
3. **Tích hợp Bot Telegram**:
   * Tự động gửi báo cáo tóm tắt kèm tệp tin `.md` chi tiết về kênh/chat Telegram của bạn ngay sau khi quét xong.
4. **Trải nghiệm tối giản (Minimalist UI/UX)**:
   * Chạy ẩn dưới khay hệ thống (System tray) giúp giải phóng RAM.
   * Giao diện Light Mode thanh lịch, hỗ trợ song ngữ Anh-Việt nhanh chóng.

### 🛠️ Hướng dẫn cài đặt cho lập trình viên
Yêu cầu hệ thống phải cài đặt **Node.js (phiên bản 18+)**.

1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
2. Khởi chạy ứng dụng trong chế độ phát triển (Development):
   ```bash
   npm run dev
   ```
3. Chạy unit tests:
   ```bash
   npx vitest run --root=. src/test/services.test.js
   ```

### 📦 Hướng dẫn đóng gói ứng dụng (Build .EXE)
Để biên dịch và đóng gói ứng dụng thành tệp cài đặt Installer và bản chạy trực tiếp Portable cho hệ điều hành Windows:
```bash
npm run build
```
Sau khi tiến trình hoàn tất, các tệp đóng gói sẽ nằm trong thư mục `dist-package/`:
* `Trend Aggregator Setup 1.0.0.exe` (Bộ cài đặt cài vào máy)
* `Trend Aggregator 1.0.0.exe` (Bản chạy trực tiếp Portable)

---

## English

### 🚀 Key Features
1. **Independent Multi-Source Scraper**:
   * **X / Twitter**: Scrapes real-time tweets by capturing secure login cookies and calling the official GraphQL Search API. Auto-falls back to Nitter RSS or simulated mock data.
   * **Reddit**: Scrapes posts, supports subreddit filters, and features **Deep Search** for top comments extraction.
   * **YouTube**: Retrieves videos and downloads transcripts automatically for contextual AI analysis.
   * **TikTok & 9gag**: Grabs trending posts and memes. Bypasses Cloudflare security checks using a hidden Electron BrowserWindow under the hood.
   * **Hacker News & Polymarket**: Tracks tech discussions and financial prediction market rates.
   * **Custom RSS Feeds**: Auto-detects and aggregates news from any site feed.
2. **Smart AI Analysis (Google Gemini)**:
   * Generates formatted Markdown reports: Table of Contents, Executive Summary, Sentiment Analysis, and SVG post frequency chart.
   * **API Key Rotation**: Automatically cycles Gemini API keys when hitting Rate Limit (429) blocks.
   * **RAG Chat**: Interactive AI chat based directly on the aggregated data context.
3. **Telegram Bot Integration**:
   * Auto-sends search summary messages and attaches the full `.md` report document file to your Telegram chat/channel.
4. **Sleek Desktop UX**:
   * Minimizes to Windows system tray with memory garbage collection to free up RAM.
   * Elegant Light Mode theme with fast English/Vietnamese language toggle.

### 🛠️ Development Setup
Requires **Node.js (version 18+)**.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch the app in development mode:
   ```bash
   npm run dev
   ```
3. Run unit tests:
   ```bash
   npx vitest run --root=. src/test/services.test.js
   ```

### 📦 Packaging the App (Build .EXE)
To compile and package the app into both an Installer `.exe` and a standalone Portable `.exe` for Windows:
```bash
npm run build
```
Once compilation completes, the packaged binaries will be located in the `dist-package/` directory:
* `Trend Aggregator Setup 1.0.0.exe` (NSIS Installer)
* `Trend Aggregator 1.0.0.exe` (Standalone Portable application)
