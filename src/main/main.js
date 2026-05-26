const { app, BrowserWindow, ipcMain, Menu, Tray, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Load Services
const db = require('./services/db');
const scraper = require('./services/scraper');
const gemini = require('./services/gemini');
const exporter = require('./services/exporter');
const telegram = require('./services/telegram');

let mainWindow = null;
let tray = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development';

// Log file configuration
const logFilePath = path.join(app.getPath('userData'), 'app.log');
function logToFile(message) {
  const time = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${time}] ${message}\n`, 'utf8');
}

// Giới hạn tần suất gọi API Gemini (Rate limiting protection)
let lastGeminiCallTime = 0;
async function enforceGeminiThrottle() {
  const now = Date.now();
  const timeSinceLast = now - lastGeminiCallTime;
  if (timeSinceLast < 3000) {
    const delay = 3000 - timeSinceLast;
    logToFile(`Enforcing API cooldown: Waiting ${delay}ms before next Gemini call...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastGeminiCallTime = Date.now();
}

// Khởi tạo cửa sổ chính
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Trend Aggregator'
  });

  // Tắt Menu bar mặc định để giao diện tối giản
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Sự kiện đóng cửa sổ - Ẩn xuống tray thay vì đóng app
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      
      // Tối ưu hóa RAM khi chạy ẩn
      try {
        if (process.platform === 'win32') {
          // Trực quan hóa việc giảm RAM của Windows OS khi thu nhỏ
          mainWindow.minimize();
        }
        mainWindow.hide();
        
        if (global.gc) {
          global.gc();
        }
      } catch (err) {
        logToFile(`RAM optimization error: ${err.message}`);
      }
      
      logToFile('App minimized to system tray with memory optimization.');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Khởi tạo System Tray
function createTray() {
  // Tạo icon tray giả lập nếu không có file ảnh icon.png
  // Trong Electron có thể sử dụng ảnh trống hoặc icon mặc định
  const iconPath = path.join(__dirname, 'icon.png');
  
  // Tạo file icon.png tạm nếu chưa tồn tại để tránh lỗi crash Electron tray
  if (!fs.existsSync(iconPath)) {
    // Lưu tạm 1 byte giả làm ảnh để tránh crash (tốt nhất là tạo ảnh nhỏ)
    fs.writeFileSync(iconPath, '');
  }

  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Mở ứng dụng (Open)', 
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      } 
    },
    { type: 'separator' },
    { 
      label: 'Thoát hoàn toàn (Quit)', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('Trend Aggregator (AI Powered)');
  tray.setContextMenu(contextMenu);

  // Click vào tray icon để hiện ứng dụng
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

// Vòng đời ứng dụng
app.whenReady().then(() => {
  logToFile('Application started.');
  
  // Tối ưu cơ sở dữ liệu khi mở
  try {
    db.vacuum();
    logToFile('Database vacuumed successfully.');
  } catch (err) {
    logToFile(`DB Vacuum failed: ${err.message}`);
  }

  createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- ĐĂNG KÝ IPC HANDLERS ---

// 1. Quản lý API Keys
ipcMain.handle('db:getKeys', async () => {
  return db.getKeys();
});

ipcMain.handle('db:saveKeys', async (event, keys) => {
  try {
    return db.saveKeys(keys);
  } catch (e) {
    logToFile(`Save Keys error: ${e.message}`);
    throw e;
  }
});

ipcMain.handle('db:testKey', async (event, key) => {
  try {
    return await gemini.testKey(key);
  } catch (e) {
    logToFile(`Test Key failed: ${e.message}`);
    return false;
  }
});

// 2. Quản lý RSS Feeds
ipcMain.handle('db:getFeeds', async () => {
  return db.getFeeds();
});

ipcMain.handle('db:addFeed', async (event, feed) => {
  try {
    // Nếu truyền vào trang chủ, tự phát hiện RSS URL
    if (feed.url && !feed.url.endsWith('.xml') && !feed.url.includes('/feed') && !feed.url.includes('/rss')) {
      try {
        const detectedUrl = await scraper.autoDetectRSS(feed.url);
        feed.url = detectedUrl;
      } catch (err) {
        logToFile(`RSS Detection failed: ${err.message}`);
      }
    }
    return db.addFeed(feed);
  } catch (e) {
    logToFile(`Add Feed error: ${e.message}`);
    throw e;
  }
});

ipcMain.handle('db:deleteFeed', async (event, url) => {
  return db.deleteFeed(url);
});

// 3. Quản lý Lịch sử quét
ipcMain.handle('db:getHistory', async () => {
  return db.getHistory();
});

ipcMain.handle('db:getHistoryDetail', async (event, id) => {
  return db.getHistoryDetail(id);
});

ipcMain.handle('db:deleteHistory', async (event, id) => {
  return db.deleteHistory(id);
});

// 4. Import / Export Database
ipcMain.handle('db:importDb', async (event, jsonData) => {
  try {
    return db.importDb(jsonData);
  } catch (e) {
    logToFile(`Import DB error: ${e.message}`);
    throw e;
  }
});

ipcMain.handle('db:exportDb', async () => {
  return db.exportDb();
});

ipcMain.handle('db:vacuum', async () => {
  return db.vacuum();
});

// 5. Cào Dữ Liệu Chính

// Helper: Tự động xuất và gửi báo cáo tạm thời sang Telegram
async function triggerTelegramReport(keyword, dateRange, articles, summary) {
  const telegramEnabled = db.getSetting('telegram_enabled', 'false') === 'true';
  const telegramToken = db.getSetting('telegram_token', '');
  const telegramChatId = db.getSetting('telegram_chat_id', '');

  if (telegramEnabled && telegramToken && telegramChatId) {
    logToFile(`Telegram auto-send is enabled. Exporting temp report for keyword "${keyword}"...`);
    try {
      const tempExportFolder = path.join(app.getPath('userData'), 'temp_exports');
      if (!fs.existsSync(tempExportFolder)) {
        fs.mkdirSync(tempExportFolder, { recursive: true });
      }
      
      const tempExport = await exporter.exportMarkdown(tempExportFolder, keyword, articles, summary);
      if (tempExport && tempExport.filePath) {
        logToFile(`Sending Markdown report to Telegram chat ${telegramChatId}...`);
        await telegram.sendReport(telegramToken, telegramChatId, keyword, dateRange, articles.length, tempExport.filePath);
        
        // Dọn dẹp tệp tạm thời
        try {
          fs.unlinkSync(tempExport.filePath);
          const cleanKeyword = keyword.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
          const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
          const imagesFolderName = `${dateStr}_${cleanKeyword}_images`;
          const imagesFolderPath = path.join(tempExportFolder, imagesFolderName);
          if (fs.existsSync(imagesFolderPath)) {
            fs.rmSync(imagesFolderPath, { recursive: true, force: true });
          }
        } catch (cleanupErr) {
          logToFile(`Failed to clean up temp Telegram files: ${cleanupErr.message}`);
        }
      }
    } catch (err) {
      logToFile(`Telegram auto-send failed: ${err.message}`);
    }
  }
}

ipcMain.handle('scrape:run', async (event, payload) => {
  const { keyword, dateRange, sources, useCache, forceRefresh, model, customPrompt, redditSubreddit, deepSearch } = payload;
  logToFile(`Initiated search for keyword: "${keyword}" (Subreddit: "${redditSubreddit || 'All'}", Deep Search: ${!!deepSearch}, Range: ${dateRange} days)`);

  try {
    // Lấy API Keys
    const keys = db.getKeys();
    if (keys.length === 0) {
      throw new Error('Gemini API key is missing. Please add a key in Settings.');
    }

    // Tạo cache key kết hợp để tránh trả về nhầm lẫn cache khi thay đổi tuỳ chọn lọc
    const cacheKey = redditSubreddit ? `${keyword}_sub:${redditSubreddit}_deep:${!!deepSearch}` : `${keyword}_deep:${!!deepSearch}`;

    // 1. Kiểm tra cache nếu không ép buộc làm mới
    if (useCache && !forceRefresh) {
      const cached = db.getCache(cacheKey, 1); // cache trong vòng 1 ngày như yêu cầu
      if (cached && cached.length > 0) {
        logToFile(`Using cached results for "${keyword}". Found ${cached.length} articles.`);
        
        // Gửi progress hoàn thành luôn
        event.sender.send('scrape:progress', {
          source: 'Cache',
          status: `Retrieved ${cached.length} cached posts.`,
          percentage: 100,
          completed: true
        });
        
        // Gọi AI tạo tóm tắt mới hoặc dùng lại tóm tắt lịch sử cũ gần nhất
        let summary;
        try {
          await enforceGeminiThrottle();
          summary = await gemini.summarizeArticles(keys, model, keyword, cached, customPrompt);
        } catch (err) {
          logToFile(`Gemini summarization failed (using cached results fallback): ${err.message}`);
          summary = `> [!WARNING]\n> **Không thể tạo báo cáo phân tích bằng AI do lỗi kết nối (Gemini API Error).**\n> Chi tiết lỗi: ${err.message}\n\n### Danh sách bài đăng đã thu thập từ Cache:\n\n` +
            cached.map((a, i) => `${i+1}. [**${a.title}**](${a.url}) (${a.source} - ${new Date(a.date).toLocaleDateString()}) - Tương tác: **${a.engagement}**`).join('\n');
        }
        
        // Tính toán chart_data
        const chartData = generateChartData(cached);
        
        // Lưu lịch sử quét
        const historyId = db.saveHistory(keyword, dateRange, cached, summary, chartData);
        
        // Gửi báo cáo Telegram bất đồng bộ (không block giao diện người dùng)
        triggerTelegramReport(keyword, dateRange, cached, summary);
        
        return {
          historyId,
          articles: cached,
          summary,
          chartData
        };
      }
    }

    // 2. Chạy Scraper cào mới
    const customFeeds = db.getFeeds();
    
    // Hàm gửi tiến độ qua IPC
    const winProgressSender = (progress) => {
      event.sender.send('scrape:progress', progress);
    };

    const scrapedArticles = await scraper.runScraper(keyword, dateRange, sources, customFeeds, winProgressSender, { redditSubreddit, deepSearch });
    
    if (scrapedArticles.length === 0) {
      throw new Error(`No articles found for keyword "${keyword}" in the last ${dateRange} days.`);
    }

    // Lưu cache
    db.saveCache(scrapedArticles, cacheKey);

    // 3. Xử lý AI tóm tắt
    let summary;
    try {
      logToFile(`Sending ${scrapedArticles.length} articles to Gemini for analysis.`);
      await enforceGeminiThrottle();
      summary = await gemini.summarizeArticles(keys, model, keyword, scrapedArticles, customPrompt);
    } catch (err) {
      logToFile(`Gemini summarization failed (fresh scrape fallback): ${err.message}`);
      summary = `> [!WARNING]\n> **Không thể tạo báo cáo phân tích bằng AI do lỗi kết nối (Gemini API Error).**\n> Chi tiết lỗi: ${err.message}\n\n### Danh sách bài đăng đã thu thập mới nhất:\n\n` +
        scrapedArticles.map((a, i) => `${i+1}. [**${a.title}**](${a.url}) (${a.source} - ${new Date(a.date).toLocaleDateString()}) - Tương tác: **${a.engagement}**`).join('\n');
    }

    // 4. Tạo dữ liệu biểu đồ
    const chartData = generateChartData(scrapedArticles);

    // 5. Lưu lịch sử quét
    const historyId = db.saveHistory(keyword, dateRange, scrapedArticles, summary, chartData);
    
    // Gửi báo cáo Telegram bất đồng bộ (không block giao diện người dùng)
    triggerTelegramReport(keyword, dateRange, scrapedArticles, summary);
    
    logToFile(`Search process finished. History Saved with ID: ${historyId}`);

    return {
      historyId,
      articles: scrapedArticles,
      summary,
      chartData
    };
  } catch (err) {
    logToFile(`Scrape/AI Execution failed: ${err.message}`);
    throw err;
  }
});

// Helper: Phân tích tần suất bài viết theo ngày để vẽ biểu đồ
function generateChartData(articles) {
  const freq = {};
  for (const a of articles) {
    try {
      const dateOnly = a.date.split('T')[0];
      freq[dateOnly] = (freq[dateOnly] || 0) + 1;
    } catch (e) {
      // Bỏ qua lỗi định dạng ngày
    }
  }
  
  // Sắp xếp ngày tăng dần
  const sortedDates = Object.keys(freq).sort();
  return sortedDates.map(date => ({
    date,
    count: freq[date]
  }));
}

// 6. RAG Chat
ipcMain.handle('gemini:chat', async (event, payload) => {
  const { historyId, userMessage, model } = payload;
  try {
    const keys = db.getKeys();
    const historyDetail = db.getHistoryDetail(historyId);
    if (!historyDetail) throw new Error('Search history detail not found.');
    
    const chatHistory = db.getChatHistory(historyId);
    
    // Gọi Gemini trả lời
    await enforceGeminiThrottle();
    const aiResponse = await gemini.chatWithData(
      keys,
      model,
      historyDetail.keyword,
      historyDetail.raw_data,
      chatHistory,
      userMessage
    );
    
    // Lưu lịch sử chat tin nhắn
    db.saveChatMessage(historyId, 'user', userMessage);
    db.saveChatMessage(historyId, 'model', aiResponse);
    
    return {
      response: aiResponse,
      chatHistory: [...chatHistory, { sender: 'user', message: userMessage }, { sender: 'model', message: aiResponse }]
    };
  } catch (err) {
    logToFile(`RAG Chat failed: ${err.message}`);
    throw err;
  }
});

// 7. Xuất file Markdown
ipcMain.handle('export:markdown', async (event, payload) => {
  const { historyId } = payload;
  try {
    const historyDetail = db.getHistoryDetail(historyId);
    if (!historyDetail) throw new Error('Search history detail not found.');

    // Thử lấy thư mục mặc định đã lưu cấu hình
    let targetFolder = db.getSetting('output_folder', null);
    
    if (!targetFolder) {
      // Mở hộp thoại chọn thư mục Windows mặc định nếu chưa cấu hình
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Chọn thư mục lưu file Markdown'
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }
      targetFolder = result.filePaths[0];
    }

    const exportResult = await exporter.exportMarkdown(
      targetFolder,
      historyDetail.keyword,
      historyDetail.raw_data,
      historyDetail.summary
    );

    return exportResult;
  } catch (err) {
    logToFile(`Export error: ${err.message}`);
    throw err;
  }
});

// 8. Chạy ẩn xuống Tray từ GUI
ipcMain.handle('app:minimizeToTray', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
  return true;
});

// 9. Cấu hình Settings và Chọn thư mục
ipcMain.handle('db:getSetting', async (event, payload) => {
  const { key, defaultValue } = payload || {};
  return db.getSetting(key, defaultValue);
});

ipcMain.handle('db:saveSetting', async (event, payload) => {
  const { key, value } = payload || {};
  return db.saveSetting(key, value);
});

ipcMain.handle('app:selectDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Chọn thư mục mặc định lưu Markdown'
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// 10. Đăng nhập & Đăng xuất Twitter/X
ipcMain.handle('twitter:login', async (event) => {
  return new Promise((resolve) => {
    if (!mainWindow) {
      resolve({ success: false, reason: 'Main window not initialized' });
      return;
    }

    const loginWin = new BrowserWindow({
      width: 600,
      height: 700,
      parent: mainWindow,
      modal: true,
      title: 'Đăng nhập Twitter/X',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Mở trang đăng nhập chính thức
    loginWin.loadURL('https://x.com/login');

    // Theo dõi cookies định kỳ mỗi giây để phát hiện đăng nhập thành công
    const interval = setInterval(async () => {
      if (loginWin.isDestroyed()) {
        clearInterval(interval);
        resolve({ success: false, reason: 'Closed by user' });
        return;
      }

      try {
        const cookies = await loginWin.webContents.session.cookies.get({ domain: '.x.com' });
        const authTokenCookie = cookies.find(c => c.name === 'auth_token');
        const ct0Cookie = cookies.find(c => c.name === 'ct0');

        if (authTokenCookie && ct0Cookie) {
          clearInterval(interval);
          
          // Lưu vào database settings
          db.saveSetting('twitter_auth_token', authTokenCookie.value);
          db.saveSetting('twitter_ct0', ct0Cookie.value);
          db.saveSetting('twitter_connected', 'true');
          
          logToFile('Twitter login successful: session cookies captured.');
          
          loginWin.destroy();
          resolve({ success: true });
        }
      } catch (err) {
        logToFile(`Error checking Twitter cookies: ${err.message}`);
      }
    }, 1000);

    loginWin.on('closed', () => {
      clearInterval(interval);
      resolve({ success: false, reason: 'Closed by user' });
    });
  });
});

ipcMain.handle('twitter:logout', async () => {
  try {
    db.saveSetting('twitter_auth_token', '');
    db.saveSetting('twitter_ct0', '');
    db.saveSetting('twitter_connected', 'false');
    
    // Clear cookies trong session của Electron để sạch phiên đăng nhập
    const { session } = require('electron');
    const cookies = await session.defaultSession.cookies.get({ domain: '.x.com' });
    for (const cookie of cookies) {
      try {
        await session.defaultSession.cookies.remove('https://x.com', cookie.name);
      } catch (e) {
        // ignore errors for individual cookie removals
      }
    }
    
    logToFile('Twitter session cleared.');
    return { success: true };
  } catch (err) {
    logToFile(`Twitter logout failed: ${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('twitter:status', async () => {
  const authToken = db.getSetting('twitter_auth_token', '');
  const connected = db.getSetting('twitter_connected', 'false');
  return {
    connected: connected === 'true' && !!authToken,
    username: connected === 'true' && !!authToken ? 'Connected Account' : null
  };
});

// 11. Cấu hình Bot Telegram
ipcMain.handle('telegram:test', async (event, payload) => {
  const { token, chatId } = payload;
  return telegram.testConnection(token, chatId);
});

ipcMain.handle('telegram:getSettings', async () => {
  const token = db.getSetting('telegram_token', '');
  const chatId = db.getSetting('telegram_chat_id', '');
  const enabled = db.getSetting('telegram_enabled', 'false');
  return {
    token,
    chatId,
    enabled: enabled === 'true'
  };
});

ipcMain.handle('telegram:saveSettings', async (event, payload) => {
  const { token, chatId, enabled } = payload;
  db.saveSetting('telegram_token', token);
  db.saveSetting('telegram_chat_id', chatId);
  db.saveSetting('telegram_enabled', enabled ? 'true' : 'false');
  return { success: true };
});

