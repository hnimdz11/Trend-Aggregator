const path = require('path');
const fs = require('fs');
let app = null;
try {
  const electron = require('electron');
  app = electron.app;
} catch (e) {
  // Chạy trong môi trường Node thuần (Unit Tests)
}

// Thư mục dữ liệu ứng dụng
const userDataPath = app 
  ? app.getPath('userData') 
  : path.join(__dirname, '..', '..', 'temp_userData');
const dbFilePath = path.join(userDataPath, 'data.db');
const jsonFilePath = path.join(userDataPath, 'data.json');

// Đảm bảo thư mục lưu trữ dữ liệu tồn tại
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

let dbInstance = null;
let useJsonFallback = false;

// Khởi tạo cơ sở dữ liệu
function initDatabase() {
  try {
    const Database = require('better-sqlite3');
    dbInstance = new Database(dbFilePath);
    
    // Tạo bảng SQLite
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_value TEXT UNIQUE NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS feeds (
        url TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        date_range INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        raw_data TEXT NOT NULL,
        summary TEXT NOT NULL,
        chart_data TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS cache (
        url TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        content TEXT,
        source TEXT NOT NULL,
        engagement INTEGER DEFAULT 0,
        date TEXT NOT NULL,
        query TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        history_id INTEGER NOT NULL,
        sender TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(history_id) REFERENCES history(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    
    console.log('SQLite database initialized successfully at:', dbFilePath);
  } catch (err) {
    console.warn('Failed to load better-sqlite3, falling back to JSON storage:', err.message);
    useJsonFallback = true;
    initJsonDb();
  }
}

// Khởi tạo file JSON nếu fallback
function initJsonDb() {
  if (!fs.existsSync(jsonFilePath)) {
    const defaultData = {
      keys: [],
      feeds: [],
      history: [],
      cache: [],
      chat_history: [],
      settings: {}
    };
    fs.writeFileSync(jsonFilePath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readJsonDb() {
  try {
    const content = fs.readFileSync(jsonFilePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading JSON DB, returning empty structure:', err);
    return { keys: [], feeds: [], history: [], cache: [], chat_history: [], settings: {} };
  }
}

function writeJsonDb(data) {
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON DB:', err);
  }
}

// Initialize on require
initDatabase();

module.exports = {
  // --- Quản lý Keys ---
  getKeys() {
    if (useJsonFallback) {
      const db = readJsonDb();
      return db.keys.map(k => k.key_value);
    }
    const stmt = dbInstance.prepare('SELECT key_value FROM keys');
    return stmt.all().map(row => row.key_value);
  },

  saveKeys(keysList) {
    if (useJsonFallback) {
      const db = readJsonDb();
      db.keys = keysList.map((val, idx) => ({ id: idx + 1, key_value: val }));
      writeJsonDb(db);
      return true;
    }
    const deleteStmt = dbInstance.prepare('DELETE FROM keys');
    const insertStmt = dbInstance.prepare('INSERT OR IGNORE INTO keys (key_value) VALUES (?)');
    
    const transaction = dbInstance.transaction((keys) => {
      deleteStmt.run();
      for (const k of keys) {
        if (k.trim()) insertStmt.run(k.trim());
      }
    });
    
    transaction(keysList);
    return true;
  },

  // --- Quản lý Feeds ---
  getFeeds() {
    if (useJsonFallback) {
      return readJsonDb().feeds;
    }
    return dbInstance.prepare('SELECT * FROM feeds').all();
  },

  addFeed(feed) {
    const { url, name, category } = feed;
    if (useJsonFallback) {
      const db = readJsonDb();
      // Lọc trùng url
      db.feeds = db.feeds.filter(f => f.url !== url);
      db.feeds.push({ url, name, category });
      writeJsonDb(db);
      return true;
    }
    const stmt = dbInstance.prepare('INSERT OR REPLACE INTO feeds (url, name, category) VALUES (?, ?, ?)');
    stmt.run(url, name, category);
    return true;
  },

  deleteFeed(url) {
    if (useJsonFallback) {
      const db = readJsonDb();
      db.feeds = db.feeds.filter(f => f.url !== url);
      writeJsonDb(db);
      return true;
    }
    const stmt = dbInstance.prepare('DELETE FROM feeds WHERE url = ?');
    stmt.run(url);
    return true;
  },

  // --- Quản lý Lịch sử quét ---
  getHistory() {
    if (useJsonFallback) {
      const db = readJsonDb();
      // Trả về list tóm tắt không chứa raw_data lớn để tối ưu hiệu năng
      return db.history.map(h => ({
        id: h.id,
        keyword: h.keyword,
        date_range: h.date_range,
        timestamp: h.timestamp
      })).reverse();
    }
    return dbInstance.prepare('SELECT id, keyword, date_range, timestamp FROM history ORDER BY timestamp DESC').all();
  },

  getHistoryDetail(id) {
    if (useJsonFallback) {
      const db = readJsonDb();
      const item = db.history.find(h => h.id === Number(id));
      if (!item) return null;
      return {
        ...item,
        raw_data: JSON.parse(item.raw_data),
        chart_data: JSON.parse(item.chart_data)
      };
    }
    const row = dbInstance.prepare('SELECT * FROM history WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      raw_data: JSON.parse(row.raw_data),
      chart_data: JSON.parse(row.chart_data)
    };
  },

  saveHistory(keyword, dateRange, rawData, summary, chartData) {
    const rawDataStr = JSON.stringify(rawData);
    const chartDataStr = JSON.stringify(chartData);
    
    if (useJsonFallback) {
      const db = readJsonDb();
      const id = db.history.length > 0 ? Math.max(...db.history.map(h => h.id)) + 1 : 1;
      const newItem = {
        id,
        keyword,
        date_range: Number(dateRange),
        timestamp: new Date().toISOString(),
        raw_data: rawDataStr,
        summary,
        chart_data: chartDataStr
      };
      db.history.push(newItem);
      writeJsonDb(db);
      return id;
    }
    
    const stmt = dbInstance.prepare(`
      INSERT INTO history (keyword, date_range, raw_data, summary, chart_data) 
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(keyword, Number(dateRange), rawDataStr, summary, chartDataStr);
    return result.lastInsertRowid;
  },

  deleteHistory(id) {
    if (useJsonFallback) {
      const db = readJsonDb();
      db.history = db.history.filter(h => h.id !== Number(id));
      db.chat_history = db.chat_history.filter(c => c.history_id !== Number(id));
      writeJsonDb(db);
      return true;
    }
    dbInstance.prepare('DELETE FROM history WHERE id = ?').run(id);
    dbInstance.prepare('DELETE FROM chat_history WHERE history_id = ?').run(id);
    return true;
  },

  // --- Quản lý Cache ---
  getCache(query, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString();
    
    if (useJsonFallback) {
      const db = readJsonDb();
      return db.cache.filter(c => c.query === query && c.timestamp >= cutoffStr);
    }
    
    return dbInstance.prepare(`
      SELECT * FROM cache 
      WHERE query = ? AND timestamp >= ?
    `).all(query, cutoffStr);
  },

  saveCache(articles, query) {
    if (useJsonFallback) {
      const db = readJsonDb();
      const existingUrls = new Set(db.cache.map(c => c.url));
      for (const a of articles) {
        const item = {
          url: a.url,
          title: a.title,
          summary: a.summary || '',
          content: a.content || '',
          source: a.source,
          engagement: a.engagement || 0,
          date: a.date,
          query,
          timestamp: new Date().toISOString()
        };
        db.cache = db.cache.filter(c => c.url !== a.url);
        db.cache.push(item);
      }
      writeJsonDb(db);
      return true;
    }
    
    const stmt = dbInstance.prepare(`
      INSERT OR REPLACE INTO cache (url, title, summary, content, source, engagement, date, query, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const transaction = dbInstance.transaction((items) => {
      for (const a of items) {
        stmt.run(
          a.url,
          a.title,
          a.summary || '',
          a.content || '',
          a.source,
          a.engagement || 0,
          a.date,
          query
        );
      }
    });
    
    transaction(articles);
    return true;
  },

  // --- Quản lý Chat RAG ---
  getChatHistory(historyId) {
    if (useJsonFallback) {
      return readJsonDb().chat_history.filter(c => c.history_id === Number(historyId));
    }
    return dbInstance.prepare('SELECT * FROM chat_history WHERE history_id = ? ORDER BY timestamp ASC').all(historyId);
  },

  saveChatMessage(historyId, sender, message) {
    if (useJsonFallback) {
      const db = readJsonDb();
      const id = db.chat_history.length > 0 ? Math.max(...db.chat_history.map(c => c.id)) + 1 : 1;
      db.chat_history.push({
        id,
        history_id: Number(historyId),
        sender,
        message,
        timestamp: new Date().toISOString()
      });
      writeJsonDb(db);
      return id;
    }
    const stmt = dbInstance.prepare('INSERT INTO chat_history (history_id, sender, message) VALUES (?, ?, ?)');
    const result = stmt.run(historyId, sender, message);
    return result.lastInsertRowid;
  },

  // --- Vacuum DB ---
  vacuum() {
    if (useJsonFallback) {
      // Dọn dẹp cache cũ hơn 30 ngày trong JSON
      const db = readJsonDb();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString();
      db.cache = db.cache.filter(c => c.timestamp >= cutoffStr);
      writeJsonDb(db);
      return true;
    }
    dbInstance.prepare("DELETE FROM cache WHERE timestamp < datetime('now', '-30 days')").run();
    dbInstance.exec('VACUUM');
    return true;
  },

  // --- Export / Import ---
  exportDb() {
    if (useJsonFallback) {
      return readJsonDb();
    }
    // Lấy hết các dữ liệu cần thiết sang JSON
    return {
      keys: dbInstance.prepare('SELECT * FROM keys').all(),
      feeds: dbInstance.prepare('SELECT * FROM feeds').all(),
      history: dbInstance.prepare('SELECT * FROM history').all(),
      chat_history: dbInstance.prepare('SELECT * FROM chat_history').all()
    };
  },

  importDb(data) {
    if (useJsonFallback) {
      const db = readJsonDb();
      db.keys = data.keys || [];
      db.feeds = data.feeds || [];
      db.history = data.history || [];
      db.chat_history = data.chat_history || [];
      writeJsonDb(db);
      return true;
    }
    
    // Dọn dẹp và chèn lại SQLite
    dbInstance.transaction(() => {
      dbInstance.prepare('DELETE FROM keys').run();
      dbInstance.prepare('DELETE FROM feeds').run();
      dbInstance.prepare('DELETE FROM history').run();
      dbInstance.prepare('DELETE FROM chat_history').run();
      try { dbInstance.prepare('DELETE FROM settings').run(); } catch (e) {}

      if (data.keys) {
        const stmt = dbInstance.prepare('INSERT OR IGNORE INTO keys (key_value) VALUES (?)');
        for (const k of data.keys) {
          stmt.run(k.key_value);
        }
      }
      if (data.feeds) {
        const stmt = dbInstance.prepare('INSERT INTO feeds (url, name, category) VALUES (?, ?, ?)');
        for (const f of data.feeds) {
          stmt.run(f.url, f.name, f.category);
        }
      }
      if (data.history) {
        const stmt = dbInstance.prepare('INSERT INTO history (id, keyword, date_range, timestamp, raw_data, summary, chart_data) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const h of data.history) {
          stmt.run(h.id, h.keyword, h.date_range, h.timestamp, h.raw_data, h.summary, h.chart_data);
        }
      }
      if (data.chat_history) {
        const stmt = dbInstance.prepare('INSERT INTO chat_history (id, history_id, sender, message, timestamp) VALUES (?, ?, ?, ?, ?)');
        for (const c of data.chat_history) {
          stmt.run(c.id, c.history_id, c.sender, c.message, c.timestamp);
        }
      }
      if (data.settings) {
        try {
          const stmt = dbInstance.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
          for (const [key, value] of Object.entries(data.settings)) {
            stmt.run(key, value);
          }
        } catch (e) {}
      }
    })();
    
    return true;
  },

  // --- Quản lý Settings ---
  getSetting(key, defaultValue) {
    if (useJsonFallback) {
      const db = readJsonDb();
      const settings = db.settings || {};
      return settings[key] !== undefined ? settings[key] : defaultValue;
    }
    try {
      const row = dbInstance.prepare('SELECT value FROM settings WHERE key = ?').get(key);
      return row ? row.value : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  saveSetting(key, value) {
    if (useJsonFallback) {
      const db = readJsonDb();
      if (!db.settings) db.settings = {};
      db.settings[key] = value;
      writeJsonDb(db);
      return true;
    }
    try {
      dbInstance.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
      return true;
    } catch (e) {
      console.error('Error saving setting:', e);
      return false;
    }
  }
};
