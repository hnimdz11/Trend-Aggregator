import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, History, Settings, Key, Rss, Plus, Trash2, 
  Download, RefreshCw, Send, CheckCircle2, AlertTriangle, 
  ArrowRight, FileText, Globe, Layers, BarChart3, MessageSquare 
} from 'lucide-react';
import appIcon from './icon.png';

// Dịch nghĩa song ngữ VI/EN
const i18n = {
  vi: {
    appName: "Trend Aggregator",
    searchTab: "Tìm kiếm",
    historyTab: "Lịch sử quét",
    settingsTab: "Cấu hình",
    keywordLabel: "Từ khóa cần quét",
    keywordPlaceholder: "Nhập từ khóa (ví dụ: Messi, AI, Bitcoin...)",
    dateRangeLabel: "Khoảng thời gian (Số ngày gần đây)",
    sourcesLabel: "Nguồn mạng xã hội quét",
    runSearch: "Bắt đầu quét",
    forceRefresh: "Làm mới Cache (Quét từ đầu)",
    progressTitle: "Tiến trình thu thập & Phân tích AI",
    summaryTitle: "Báo cáo AI Agent",
    chatTitle: "Chat RAG với dữ liệu",
    sendChatPlaceholder: "Hỏi AI bất kỳ câu hỏi nào về kết quả quét...",
    exportMd: "Xuất Markdown (.md)",
    metadataTitle: "Thông tin Metadata",
    noHistory: "Chưa có lịch sử quét nào được lưu.",
    searchHistory: "Lịch sử tìm kiếm gần đây",
    keysTitle: "Quản lý Gemini API Keys (Tự động xoay vòng khi bị limit)",
    addKey: "Thêm API Key",
    testConnection: "Test Key",
    rssTitle: "Quản lý Nguồn RSS tùy chỉnh",
    feedName: "Tên nguồn tin",
    feedUrl: "Đường dẫn RSS hoặc URL trang chủ",
    feedCategory: "Chuyên mục/Chủ đề",
    addFeedBtn: "Thêm RSS",
    dbActionsTitle: "Quản lý Cơ sở dữ liệu",
    vacuumBtn: "Tối ưu hóa dung lượng DB",
    exportDbBtn: "Backup/Export dữ liệu",
    importDbBtn: "Restore/Import dữ liệu",
    savedAlert: "Đã lưu cài đặt thành công!",
    chartTitle: "Biểu đồ tần suất bài đăng theo ngày",
    sentimentTitle: "Phân tích sắc thái dư luận",
    resultsText: "bài viết được tìm thấy",
    loadingText: "Đang tải dữ liệu...",
    closeAppText: "Ẩn xuống khay hệ thống",
    activeKeys: "Khóa đang hoạt động",
    statusSuccess: "Kết nối hoạt động tốt!",
    statusFail: "Khóa bị lỗi hoặc hết hạn.",
    redditSubredditLabel: "Subreddit Target (Tùy chọn)",
    redditSubredditPlaceholder: "Nhập các subreddit phân cách bằng dấu phẩy (ví dụ: reactjs, nodejs)",
    deepSearchLabel: "Tìm sâu Reddit (Cào bình luận nổi bật)",
    twitterConnectionTitle: "Kết nối tài khoản Twitter/X (Cào quét dữ liệu thật)",
    twitterStatusConnected: "Trạng thái: ĐÃ KẾT NỐI",
    twitterStatusDisconnected: "Trạng thái: CHƯA KẾT NỐI",
    twitterConnectedTip: "Sẵn sàng quét dữ liệu thật từ Twitter/X bằng cookies của bạn.",
    twitterDisconnectedTip: "Đăng nhập bằng tài khoản X của bạn để cào được tin thật thay vì tin giả lập.",
    twitterLoginBtn: "Kết nối tài khoản X.com",
    twitterLogoutBtn: "Ngắt kết nối",
    telegramTitle: "Cấu hình Bot Telegram (Gửi báo cáo tự động)",
    telegramBotToken: "Telegram Bot Token",
    telegramChatId: "Telegram Chat ID",
    telegramEnable: "Tự động gửi báo cáo phân tích qua Telegram sau khi quét xong",
    telegramTestBtn: "Gửi tin nhắn thử nghiệm",
    telegramSaveBtn: "Lưu cấu hình Telegram",
    telegramStatusConnected: "Đã kết nối với Telegram Bot",
    telegramSuccessAlert: "Cấu hình Telegram đã được lưu!",
    telegramTestSuccess: "Đã gửi tin nhắn thử nghiệm thành công đến Telegram!",
    telegramTestFail: "Gửi thử nghiệm thất bại: "
  },
  en: {
    appName: "Trend Aggregator",
    searchTab: "Search Trends",
    historyTab: "History",
    settingsTab: "Settings",
    keywordLabel: "Keyword to Scan",
    keywordPlaceholder: "Enter keyword (e.g., Messi, AI, Bitcoin...)",
    dateRangeLabel: "Date Range (Recent days)",
    sourcesLabel: "Social Networks to Scan",
    runSearch: "Initiate Scan",
    forceRefresh: "Force Refresh Cache",
    progressTitle: "Collection & AI Analysis Progress",
    summaryTitle: "AI Agent Report",
    chatTitle: "RAG Chat with Scraped Data",
    sendChatPlaceholder: "Ask AI anything about the scanned results...",
    exportMd: "Export Markdown (.md)",
    metadataTitle: "Metadata Information",
    noHistory: "No search history saved yet.",
    searchHistory: "Recent Search History",
    keysTitle: "Gemini API Keys Management (Auto-rotation on Rate Limit)",
    addKey: "Add API Key",
    testConnection: "Test Key",
    rssTitle: "Custom RSS Feeds Management",
    feedName: "Feed Name",
    feedUrl: "RSS Feed URL or Homepage URL",
    feedCategory: "Category/Topic",
    addFeedBtn: "Add RSS Feed",
    dbActionsTitle: "Database Management",
    vacuumBtn: "Optimize DB Storage",
    exportDbBtn: "Backup/Export DB",
    importDbBtn: "Restore/Import DB",
    savedAlert: "Settings saved successfully!",
    chartTitle: "Post Frequency Over Time",
    sentimentTitle: "Sentiment Analysis",
    resultsText: "articles found",
    loadingText: "Loading data...",
    closeAppText: "Hide to Tray",
    activeKeys: "Active Keys",
    statusSuccess: "Connection active!",
    statusFail: "Key expired or invalid.",
    redditSubredditLabel: "Target Subreddit(s) (Optional)",
    redditSubredditPlaceholder: "Enter subreddits separated by commas (e.g., reactjs, nodejs)",
    deepSearchLabel: "Reddit Deep Search (Scrape comments)",
    twitterConnectionTitle: "Twitter/X Account Connection (Real-time Scraping)",
    twitterStatusConnected: "Status: CONNECTED",
    twitterStatusDisconnected: "Status: DISCONNECTED",
    twitterConnectedTip: "Ready to scrape real tweets from Twitter/X using your cookies.",
    twitterDisconnectedTip: "Log in with your X.com account to scrape real tweets instead of mock placeholders.",
    twitterLoginBtn: "Connect X.com Account",
    twitterLogoutBtn: "Disconnect",
    telegramTitle: "Telegram Bot Settings (Auto-send reports)",
    telegramBotToken: "Telegram Bot Token",
    telegramChatId: "Telegram Chat ID",
    telegramEnable: "Automatically send analysis report to Telegram when scanning completes",
    telegramTestBtn: "Send Test Message",
    telegramSaveBtn: "Save Telegram Settings",
    telegramStatusConnected: "Connected to Telegram Bot",
    telegramSuccessAlert: "Telegram settings saved!",
    telegramTestSuccess: "Test message sent successfully to Telegram!",
    telegramTestFail: "Test failed: "
  }
};

export default function App() {
  const [lang, setLang] = useState('vi');
  const t = i18n[lang];

  // Trạng thái tab chính
  const [activeTab, setActiveTab] = useState('search');

  // Trạng thái cấu hình tìm kiếm
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState(15);
  const [selectedSources, setSelectedSources] = useState(['Reddit', 'YouTube', 'Hacker News', 'Polymarket']);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [redditSubreddit, setRedditSubreddit] = useState('');
  const [deepSearch, setDeepSearch] = useState(false);
  const [twitterStatus, setTwitterStatus] = useState({ connected: false, username: null });
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  // Danh sách các nguồn hỗ trợ
  const availableSources = ['Reddit', 'Twitter', 'YouTube', 'TikTok', '9gag', 'Hacker News', 'Polymarket'];

  // Cấu hình Gemini & RSS
  const [geminiKeys, setGeminiKeys] = useState(['']);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [customPrompt, setCustomPrompt] = useState('');
  const [rssFeeds, setRssFeeds] = useState([]);
  const [newFeed, setNewFeed] = useState({ name: '', url: '', category: 'General' });

  // Tiến trình cào dữ liệu
  const [progressLog, setProgressLog] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // Kết quả lượt tìm kiếm hiện tại
  const [currentResult, setCurrentResult] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatting, setIsChatting] = useState(false);

  // Lịch sử tìm kiếm tổng hợp
  const [historyList, setHistoryList] = useState([]);
  
  const chatEndRef = useRef(null);

  // Load cài đặt ban đầu từ DB
  useEffect(() => {
    loadSettings();
    loadHistory();
    loadTwitterStatus();
    
    // Đăng ký nhận thông báo tiến trình IPC
    if (window.api) {
      const unsubscribe = window.api.onProgress((progress) => {
        setProgressLog((prev) => [...prev, `${progress.source}: ${progress.status}`]);
        setProgressPercent(progress.percentage);
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    // Tự động scroll xuống cuối khung chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const [outputFolder, setOutputFolder] = useState('');

  const loadSettings = async () => {
    if (!window.api) return;
    try {
      const keys = await window.api.invoke('db:getKeys');
      if (keys.length > 0) setGeminiKeys(keys);
      const feeds = await window.api.invoke('db:getFeeds');
      setRssFeeds(feeds);
      const folder = await window.api.invoke('db:getSetting', { key: 'output_folder', defaultValue: '' });
      setOutputFolder(folder || '');
      
      const tgSettings = await window.api.invoke('telegram:getSettings');
      setTelegramToken(tgSettings.token);
      setTelegramChatId(tgSettings.chatId);
      setTelegramEnabled(tgSettings.enabled);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectOutputFolder = async () => {
    if (!window.api) return;
    try {
      const selected = await window.api.invoke('app:selectDirectory');
      if (selected) {
        setOutputFolder(selected);
        await window.api.invoke('db:saveSetting', { key: 'output_folder', value: selected });
      }
    } catch (e) {
      alert(`Error choosing folder: ${e.message}`);
    }
  };

  const loadHistory = async () => {
    if (!window.api) return;
    try {
      const list = await window.api.invoke('db:getHistory');
      setHistoryList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTwitterStatus = async () => {
    if (!window.api) return;
    try {
      const status = await window.api.invoke('twitter:status');
      setTwitterStatus(status);
    } catch (e) {
      console.error('Error loading Twitter status:', e);
    }
  };

  const handleTwitterLogin = async () => {
    if (!window.api) return;
    try {
      const res = await window.api.invoke('twitter:login');
      if (res.success) {
        await loadTwitterStatus();
        alert(lang === 'vi' ? 'Kết nối tài khoản Twitter/X thành công!' : 'Connected Twitter/X account successfully!');
      } else if (res.reason !== 'Closed by user') {
        alert(`${lang === 'vi' ? 'Kết nối thất bại' : 'Connection failed'}: ${res.reason}`);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleTwitterLogout = async () => {
    if (!window.api) return;
    const confirmMsg = lang === 'vi' 
      ? 'Bạn có chắc chắn muốn ngắt kết nối tài khoản Twitter/X không?' 
      : 'Are you sure you want to disconnect your Twitter/X account?';
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const res = await window.api.invoke('twitter:logout');
      if (res.success) {
        await loadTwitterStatus();
        alert(lang === 'vi' ? 'Đã ngắt kết nối tài khoản Twitter/X.' : 'Disconnected Twitter/X account.');
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleSaveTelegramSettings = async () => {
    if (!window.api) return;
    try {
      await window.api.invoke('telegram:saveSettings', {
        token: telegramToken.trim(),
        chatId: telegramChatId.trim(),
        enabled: telegramEnabled
      });
      alert(t.telegramSuccessAlert);
    } catch (e) {
      alert(`Error saving Telegram settings: ${e.message}`);
    }
  };

  const handleTestTelegram = async () => {
    if (!window.api || !telegramToken.trim() || !telegramChatId.trim()) return;
    setIsTestingTelegram(true);
    try {
      const res = await window.api.invoke('telegram:test', {
        token: telegramToken.trim(),
        chatId: telegramChatId.trim()
      });
      if (res.success) {
        alert(t.telegramTestSuccess);
      } else {
        alert(`${t.telegramTestFail} ${res.error}`);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Quản lý API keys
  const handleKeyChange = (index, value) => {
    const updated = [...geminiKeys];
    updated[index] = value;
    setGeminiKeys(updated);
  };

  const addKeyField = () => {
    setGeminiKeys([...geminiKeys, '']);
  };

  const removeKeyField = (index) => {
    const updated = geminiKeys.filter((_, i) => i !== index);
    setGeminiKeys(updated.length > 0 ? updated : ['']);
  };

  const saveApiKeys = async () => {
    if (!window.api) return;
    try {
      await window.api.invoke('db:saveKeys', geminiKeys.filter(k => k.trim() !== ''));
      alert(t.savedAlert);
    } catch (e) {
      alert(`Error saving keys: ${e.message}`);
    }
  };

  const testKeyConnection = async (key) => {
    if (!window.api || !key.trim()) return;
    try {
      const result = await window.api.invoke('db:testKey', key);
      alert(result ? t.statusSuccess : t.statusFail);
    } catch (e) {
      alert(`${t.statusFail} (${e.message})`);
    }
  };

  // Quản lý RSS feeds
  const handleAddFeed = async () => {
    if (!window.api || !newFeed.name.trim() || !newFeed.url.trim()) return;
    try {
      await window.api.invoke('db:addFeed', newFeed);
      setNewFeed({ name: '', url: '', category: 'General' });
      loadSettings();
    } catch (e) {
      alert(`Error adding feed: ${e.message}`);
    }
  };

  const handleDeleteFeed = async (url) => {
    if (!window.api) return;
    try {
      await window.api.invoke('db:deleteFeed', url);
      loadSettings();
    } catch (e) {
      console.error(e);
    }
  };

  // Khởi động quét dữ liệu
  const handleStartSearch = async () => {
    if (!keyword.trim()) return;
    setIsScanning(true);
    setProgressLog([]);
    setProgressPercent(0);
    setCurrentResult(null);
    setChatHistory([]);

    try {
      setProgressLog([`Initializing search for "${keyword}"...`]);
      const res = await window.api.invoke('scrape:run', {
        keyword,
        dateRange: Number(dateRange),
        sources: selectedSources,
        useCache: true,
        forceRefresh,
        model: selectedModel,
        customPrompt: customPrompt.trim() || null,
        redditSubreddit,
        deepSearch
      });

      setCurrentResult(res);
      setProgressPercent(100);
      loadHistory(); // Reload history sidebar
    } catch (err) {
      setProgressLog((prev) => [...prev, `[ERROR] ${err.message}`]);
    } finally {
      setIsScanning(false);
    }
  };

  // Xem chi tiết lịch sử cũ
  const viewHistoryDetail = async (id) => {
    if (!window.api) return;
    try {
      const res = await window.api.invoke('db:getHistoryDetail', id);
      if (res) {
        setCurrentResult(res);
        setKeyword(res.keyword);
        setDateRange(res.date_range);
        
        // Load RAG Chat
        const chatLogs = await window.api.invoke('db:getChatHistory', id);
        setChatHistory(chatLogs || []);
        
        setActiveTab('search'); // Chuyển về màn hình xem kết quả
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteHistoryItem = async (id, e) => {
    e.stopPropagation();
    if (!window.api) return;
    try {
      await window.api.invoke('db:deleteHistory', id);
      loadHistory();
      if (currentResult && currentResult.historyId === id) {
        setCurrentResult(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Gửi chat RAG
  const handleSendChat = async () => {
    if (!chatMessage.trim() || isChatting || !currentResult) return;
    const msg = chatMessage;
    setChatMessage('');
    setIsChatting(true);

    // Thêm tin nhắn user tạm thời
    setChatHistory((prev) => [...prev, { sender: 'user', message: msg }]);

    try {
      const res = await window.api.invoke('gemini:chat', {
        historyId: currentResult.historyId,
        userMessage: msg,
        model: selectedModel
      });
      setChatHistory(res.chatHistory);
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: 'model', message: `Chat Error: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Xuất file Markdown
  const handleExportMarkdown = async () => {
    if (!currentResult || !window.api) return;
    try {
      const result = await window.api.invoke('export:markdown', {
        historyId: currentResult.historyId
      });
      if (result.success) {
        alert(`Exported successfully!\nFile: ${result.fileName}`);
      } else if (!result.canceled) {
        alert('Export failed.');
      }
    } catch (e) {
      alert(`Export error: ${e.message}`);
    }
  };

  // Quản trị DB
  const handleVacuum = async () => {
    if (!window.api) return;
    try {
      await window.api.invoke('db:vacuum');
      alert('Database vacuumed and cleaned successfully!');
    } catch (e) {
      alert(`Vacuum error: ${e.message}`);
    }
  };

  const handleExportDb = async () => {
    if (!window.api) return;
    try {
      const data = await window.api.invoke('db:exportDb');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "aggregator_backup.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert(`Export error: ${e.message}`);
    }
  };

  const handleImportDb = async (e) => {
    if (!window.api) return;
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        await window.api.invoke('db:importDb', json);
        alert('Database restored successfully!');
        loadSettings();
        loadHistory();
      } catch (err) {
        alert(`Import error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleMinimizeToTray = async () => {
    if (window.api) {
      await window.api.invoke('app:minimizeToTray');
    }
  };

  // Toggle nguồn dữ liệu
  const toggleSource = (src) => {
    if (selectedSources.includes(src)) {
      setSelectedSources(selectedSources.filter(s => s !== src));
    } else {
      setSelectedSources([...selectedSources, src]);
    }
  };

  // Vẽ biểu đồ SVG tần suất bài viết
  const renderSVGChart = (chartData) => {
    if (!chartData || chartData.length === 0) return null;
    
    const maxVal = Math.max(...chartData.map(d => d.count)) || 1;
    const width = 600;
    const height = 150;
    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 20;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const pointsCount = chartData.length;
    
    // Tính tọa độ cho mỗi điểm
    const points = chartData.map((d, index) => {
      const x = paddingLeft + (index / (pointsCount - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.count / maxVal) * chartHeight;
      return { x, y, date: d.date, count: d.count };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    
    return (
      <div className="w-full bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">{t.chartTitle}</h4>
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-36">
            {/* Grid Lines */}
            <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="#e2e8f0" strokeWidth="1" />
            
            {/* Line Graph */}
            {pointsCount > 1 && (
              <polyline
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
                points={polylinePoints}
              />
            )}
            
            {/* Dots and Labels */}
            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#ffffff"
                  stroke="#475569"
                  strokeWidth="2"
                />
                {/* Tooltip on Hover */}
                <title>{`${p.date}: ${p.count} posts`}</title>
                {/* X labels (Dates) */}
                {(i === 0 || i === pointsCount - 1 || pointsCount < 8) && (
                  <text
                    x={p.x}
                    y={height - 2}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#94a3b8"
                  >
                    {p.date.substring(5)}
                  </text>
                )}
              </g>
            ))}
            
            {/* Y axis numbers */}
            <text x={5} y={paddingTop + 4} fontSize="9" fill="#94a3b8">{maxVal}</text>
            <text x={5} y={paddingTop + chartHeight + 4} fontSize="9" fill="#94a3b8">0</text>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 select-none">
        <div className="flex items-center space-x-3">
          <img src={appIcon} alt="Logo" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">{t.appName}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Lang switcher */}
          <button 
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            className="flex items-center space-x-1 px-3 py-1 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition"
          >
            <Globe size={12} />
            <span>{lang === 'vi' ? 'English' : 'Tiếng Việt'}</span>
          </button>
          
          <button 
            onClick={handleMinimizeToTray}
            className="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 py-1 rounded transition border border-transparent"
          >
            {t.closeAppText}
          </button>
        </div>
      </header>

      {/* Main body layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none">
          <div className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'search' 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Search size={18} />
              <span>{t.searchTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'history' 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <History size={18} />
              <span>{t.historyTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'settings' 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings size={18} />
              <span>{t.settingsTab}</span>
            </button>
          </div>
          
          {/* Lịch sử nhanh ở góc dưới */}
          <div className="p-4 border-t border-slate-100 max-h-[300px] overflow-y-auto">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.searchHistory}</h3>
            {historyList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">{t.noHistory}</p>
            ) : (
              <div className="space-y-1">
                {historyList.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    onClick={() => viewHistoryDetail(h.id)}
                    className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer transition text-xs"
                  >
                    <span className="text-slate-700 truncate font-medium max-w-[120px]">{h.keyword}</span>
                    <span className="text-[10px] text-slate-400">{h.timestamp.split('T')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-6">
          {/* Tab 1: Tìm kiếm */}
          {activeTab === 'search' && (
            <div className="space-y-6 fade-in max-w-5xl mx-auto w-full">
              {/* Form Tìm kiếm */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Cột 1: Keyword */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.keywordLabel}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder={t.keywordPlaceholder}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 transition"
                      />
                      <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    </div>
                    {/* Hộp gợi ý toán tử logic */}
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 italic">
                      <span className="font-semibold">Tips:</span>
                      <span>Dùng AND, OR, NOT (vd: "messi AND barcelona", "messi NOT psg") để tối ưu kết quả.</span>
                    </div>
                  </div>

                  {/* Cột 2: Date range */}
                  <div className="space-y-2 col-span-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.dateRangeLabel}</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 transition"
                    />
                  </div>
                </div>

                {/* Subreddit Target (Chỉ hiển thị khi chọn Reddit) */}
                {selectedSources.includes('Reddit') && (
                  <div className="mt-4 space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{t.redditSubredditLabel}</label>
                    <input
                      type="text"
                      value={redditSubreddit}
                      onChange={(e) => setRedditSubreddit(e.target.value)}
                      placeholder={t.redditSubredditPlaceholder}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 transition"
                    />
                  </div>
                )}

                {/* Checklist Nguồn */}
                <div className="mt-6 space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{t.sourcesLabel}</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSources.map((src) => {
                      const isActive = selectedSources.includes(src);
                      return (
                        <button
                          key={src}
                          onClick={() => toggleSource(src)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            isActive 
                              ? 'bg-slate-800 border-slate-800 text-white' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {src}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* API Key warning if empty */}
                {geminiKeys.filter(k => k.trim() !== '').length === 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2 text-amber-800 text-xs">
                    <AlertTriangle size={16} />
                    <span>Vui lòng thêm Gemini API Key ở tab Cấu hình trước khi quét.</span>
                  </div>
                )}

                {/* Các nút bấm trigger */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center space-x-2 text-xs text-slate-600 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forceRefresh}
                        onChange={(e) => setForceRefresh(e.target.checked)}
                        className="rounded border-slate-300 text-slate-800 focus:ring-0"
                      />
                      <span>{t.forceRefresh}</span>
                    </label>

                    {selectedSources.includes('Reddit') && (
                      <label className="flex items-center space-x-2 text-xs text-slate-600 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deepSearch}
                          onChange={(e) => setDeepSearch(e.target.checked)}
                          className="rounded border-slate-300 text-slate-800 focus:ring-0"
                        />
                        <span>{t.deepSearchLabel}</span>
                      </label>
                    )}
                  </div>

                  <button
                    onClick={handleStartSearch}
                    disabled={isScanning || geminiKeys.filter(k => k.trim() !== '').length === 0}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        <span>{t.loadingText}</span>
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        <span>{t.runSearch}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Màn hình hiển thị Tiến trình */}
              {isScanning && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700">{t.progressTitle}</h3>
                    <span className="text-xs font-semibold text-slate-500">{progressPercent}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-slate-700 h-full transition-all duration-300" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {/* Logs */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-600">
                    {progressLog.map((log, idx) => (
                      <div key={idx} className="flex items-start space-x-1">
                        <ArrowRight size={10} className="mt-1 flex-shrink-0 text-slate-400" />
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Màn hình Kết quả */}
              {currentResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Cột trái: AI report & Articles list */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* SVG Chart */}
                    {renderSVGChart(currentResult.chartData)}

                    {/* AI Agent Report */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 relative">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="text-slate-600" size={20} />
                          <h3 className="text-base font-bold text-slate-800">{t.summaryTitle}</h3>
                        </div>
                        <button
                          onClick={handleExportMarkdown}
                          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          <Download size={14} />
                          <span>{t.exportMd}</span>
                        </button>
                      </div>

                      {/* Render markdown thô của Gemini có kèm thanh cuộn */}
                      <div className="prose prose-slate max-w-none text-slate-700 text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed font-sans">
                        {currentResult.summary}
                      </div>
                    </div>

                    {/* Danh sách các bài viết cào được */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="text-sm font-bold text-slate-800">
                          Danh sách bài viết thô ({currentResult.articles.length} {t.resultsText})
                        </h4>
                      </div>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {currentResult.articles.map((a, i) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">{a.source}</span>
                              <span className="text-[10px] text-slate-400">{new Date(a.date).toLocaleDateString()}</span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-800 mb-1 hover:underline">{a.title}</h5>
                            <p className="text-[11px] text-slate-500 line-clamp-2">{a.summary}</p>
                            <div className="mt-2 text-[10px] font-medium text-slate-400">
                              Engagement: <span className="text-slate-600 font-bold">{a.engagement}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: RAG Chat Panel */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[600px] sticky top-6">
                      <div className="p-4 border-b border-slate-100 flex items-center space-x-2 select-none">
                        <MessageSquare className="text-slate-600" size={18} />
                        <h3 className="text-sm font-bold text-slate-800">{t.chatTitle}</h3>
                      </div>

                      {/* Chat messages area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {chatHistory.length === 0 && (
                          <div className="text-center py-10 space-y-2">
                            <MessageSquare className="text-slate-300 mx-auto" size={32} />
                            <p className="text-xs text-slate-400 italic">Trò chuyện trực tiếp với dữ liệu đã quét của từ khóa.</p>
                          </div>
                        )}
                        {chatHistory.map((chat, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                                chat.sender === 'user'
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}
                            >
                              <div className="whitespace-pre-wrap">{chat.message}</div>
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 px-1">
                              {chat.sender === 'user' ? 'You' : 'AI Agent'}
                            </span>
                          </div>
                        ))}
                        {isChatting && (
                          <div className="flex items-center space-x-2 text-xs text-slate-400 italic">
                            <RefreshCw className="animate-spin" size={12} />
                            <span>AI Agent is thinking...</span>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input Chat */}
                      <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-xl flex items-center space-x-2">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                          placeholder={t.sendChatPlaceholder}
                          disabled={isChatting}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition"
                        />
                        <button
                          onClick={handleSendChat}
                          disabled={isChatting || !chatMessage.trim()}
                          className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition disabled:opacity-50"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Lịch sử đầy đủ */}
          {activeTab === 'history' && (
            <div className="space-y-6 fade-in max-w-4xl mx-auto w-full">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4">{t.historyTab}</h3>
                {historyList.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-6 text-center">{t.noHistory}</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {historyList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => viewHistoryDetail(item.id)}
                        className="flex items-center justify-between py-4 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition"
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-800">{item.keyword}</h4>
                          <div className="flex items-center space-x-3 text-xs text-slate-400">
                            <span>Quét: {item.date_range} ngày</span>
                            <span>•</span>
                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Cấu hình Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6 fade-in max-w-4xl mx-auto w-full">
              
              {/* Gemini API Keys */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Key className="text-slate-600" size={18} />
                    <h3 className="text-sm font-bold text-slate-800">{t.keysTitle}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {geminiKeys.map((key, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="password"
                        value={key}
                        onChange={(e) => handleKeyChange(index, e.target.value)}
                        placeholder="AIzaSy..."
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition"
                      />
                      <button
                        onClick={() => testKeyConnection(key)}
                        disabled={!key.trim()}
                        className="px-2.5 py-2 border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 rounded-lg transition"
                      >
                        {t.testConnection}
                      </button>
                      <button
                        onClick={() => removeKeyField(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={addKeyField}
                    className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    <Plus size={14} />
                    <span>{t.addKey}</span>
                  </button>
                  <button
                    onClick={saveApiKeys}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                  >
                    Lưu danh sách API Keys
                  </button>
                </div>

                {/* Lựa chọn Models */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Model Gemini sử dụng</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </select>
                  </div>
                </div>

                {/* Custom System Prompt */}
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-bold text-slate-600">Custom System Prompt (Tùy chọn - Đổi cấu trúc báo cáo)</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Mặc định sẽ xuất báo cáo tương tự last30days-skill. Bạn có thể tự chỉnh sửa prompt phân tích tại đây..."
                    rows="3"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              {/* Twitter/X Connection Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="text-slate-600" size={18} />
                    <h3 className="text-sm font-bold text-slate-800">{t.twitterConnectionTitle}</h3>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${twitterStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      <span className="text-xs font-bold text-slate-700">
                        {twitterStatus.connected ? t.twitterStatusConnected : t.twitterStatusDisconnected}
                      </span>
                      {twitterStatus.connected && twitterStatus.username && (
                        <span className="text-xs font-medium text-slate-500">({twitterStatus.username})</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {twitterStatus.connected ? t.twitterConnectedTip : t.twitterDisconnectedTip}
                    </p>
                  </div>
                  
                  <div>
                    {twitterStatus.connected ? (
                      <button
                        onClick={handleTwitterLogout}
                        className="px-4 py-2 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-xs font-semibold text-slate-700 rounded-lg transition"
                      >
                        {t.twitterLogoutBtn}
                      </button>
                    ) : (
                      <button
                        onClick={handleTwitterLogin}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                      >
                        {t.twitterLoginBtn}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Telegram settings */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Send className="text-slate-600" size={18} />
                    <h3 className="text-sm font-bold text-slate-800">{t.telegramTitle}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">{t.telegramBotToken}</label>
                    <input
                      type="password"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      placeholder="1234567890:ABCdefGhI..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">{t.telegramChatId}</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="-100123456789 hoặc ID chat cá nhân..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-600 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={telegramEnabled}
                      onChange={(e) => setTelegramEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-slate-800 focus:ring-0"
                    />
                    <span>{t.telegramEnable}</span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram || !telegramToken.trim() || !telegramChatId.trim()}
                    className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 rounded-lg transition disabled:opacity-50"
                  >
                    {isTestingTelegram ? <RefreshCw className="animate-spin" size={12} /> : <Send size={12} />}
                    <span>{t.telegramTestBtn}</span>
                  </button>
                  <button
                    onClick={handleSaveTelegramSettings}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                  >
                    {t.telegramSaveBtn}
                  </button>
                </div>
              </div>

              {/* RSS feeds manager */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Rss className="text-slate-600" size={18} />
                    <h3 className="text-sm font-bold text-slate-800">{t.rssTitle}</h3>
                  </div>
                </div>

                {/* Add new Feed form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newFeed.name}
                    onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                    placeholder={t.feedName}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition"
                  />
                  <input
                    type="text"
                    value={newFeed.url}
                    onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                    placeholder={t.feedUrl}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition"
                  />
                  <div className="flex space-x-2">
                    <select
                      value={newFeed.category}
                      onChange={(e) => setNewFeed({ ...newFeed, category: e.target.value })}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none flex-1"
                    >
                      <option value="General">General</option>
                      <option value="Sport">Sport</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Meme">Meme</option>
                    </select>
                    <button
                      onClick={handleAddFeed}
                      className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Custom Feeds List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {rssFeeds.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Chưa cấu hình nguồn RSS tùy chỉnh nào.</p>
                  ) : (
                    rssFeeds.map((feed, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <div className="truncate pr-4">
                          <span className="font-semibold text-slate-700">{feed.name}</span>
                          <span className="ml-2 text-[10px] text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-200">{feed.category}</span>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{feed.url}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteFeed(feed.url)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Output Folder Settings */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Download className="text-slate-600" size={18} />
                    <h3 className="text-sm font-bold text-slate-800">Thư mục mặc định xuất Markdown</h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={outputFolder}
                    readOnly
                    placeholder="Chưa cấu hình (Sẽ hiện hộp thoại chọn khi xuất file)"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none"
                  />
                  <button
                    onClick={handleSelectOutputFolder}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                  >
                    Chọn thư mục
                  </button>
                  {outputFolder && (
                    <button
                      onClick={async () => {
                        setOutputFolder('');
                        await window.api.invoke('db:saveSetting', { key: 'output_folder', value: '' });
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* DB Administration */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="text-slate-600" size={18} />
                    <h3 className="text-sm font-bold text-slate-800">{t.dbActionsTitle}</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleVacuum}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg transition"
                  >
                    {t.vacuumBtn}
                  </button>
                  
                  <button
                    onClick={handleExportDb}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg transition"
                  >
                    {t.exportDbBtn}
                  </button>

                  <label className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg transition cursor-pointer select-none">
                    <span>{t.importDbBtn}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDb}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
