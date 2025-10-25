const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Database path
const DB_DIR = path.join(os.homedir(), '.awesome');
const DB_PATH = path.join(DB_DIR, 'awesome.db');

let db = null;

// Initialize database
function initialize() {
  // Ensure directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Open database
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  createTables();

  return db;
}

// Create database schema
function createTables() {
  // Awesome lists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS awesome_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      description TEXT,
      category TEXT,
      stars INTEGER DEFAULT 0,
      forks INTEGER DEFAULT 0,
      last_commit DATETIME,
      level INTEGER DEFAULT 0,
      parent_id INTEGER,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_updated DATETIME,
      FOREIGN KEY (parent_id) REFERENCES awesome_lists(id) ON DELETE CASCADE
    )
  `);

  // Repositories/Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      awesome_list_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      description TEXT,
      stars INTEGER DEFAULT 0,
      forks INTEGER DEFAULT 0,
      watchers INTEGER DEFAULT 0,
      language TEXT,
      topics TEXT,
      last_commit DATETIME,
      created_at DATETIME,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (awesome_list_id) REFERENCES awesome_lists(id) ON DELETE CASCADE
    )
  `);

  // READMEs table with content
  db.exec(`
    CREATE TABLE IF NOT EXISTS readmes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL UNIQUE,
      content TEXT,
      raw_content TEXT,
      version_hash TEXT,
      indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
    )
  `);

  // Full-text search virtual table
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS readmes_fts USING fts5(
      repository_name,
      description,
      content,
      tags,
      categories,
      content_rowid UNINDEXED
    )
  `);

  // Bookmarks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL UNIQUE,
      notes TEXT,
      tags TEXT,
      categories TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
    )
  `);

  // Custom awesome lists (user-created collections)
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      author TEXT,
      badge_style TEXT DEFAULT 'flat',
      badge_color TEXT DEFAULT 'purple',
      icon TEXT DEFAULT '📚',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Custom list items
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      custom_list_id INTEGER NOT NULL,
      repository_id INTEGER NOT NULL,
      notes TEXT,
      order_index INTEGER DEFAULT 0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (custom_list_id) REFERENCES custom_lists(id) ON DELETE CASCADE,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
      UNIQUE(custom_list_id, repository_id)
    )
  `);

  // Reading history
  db.exec(`
    CREATE TABLE IF NOT EXISTS reading_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_seconds INTEGER DEFAULT 0,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
    )
  `);

  // Document annotations
  db.exec(`
    CREATE TABLE IF NOT EXISTS annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL,
      line_number INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
    )
  `);

  // Tags (extracted and user-defined)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'user',
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories (extracted and user-defined)
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'user',
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // README update history (for diff viewing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS readme_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repository_id INTEGER NOT NULL,
      content TEXT,
      version_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
    )
  `);

  // Create indices for better performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_repos_awesome_list ON repositories(awesome_list_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_readmes_repo ON readmes(repository_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bookmarks_repo ON bookmarks(repository_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_custom_list_items_list ON custom_list_items(custom_list_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_custom_list_items_repo ON custom_list_items(repository_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reading_history_repo ON reading_history(repository_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reading_history_time ON reading_history(viewed_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_annotations_repo ON annotations(repository_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_awesome_lists_parent ON awesome_lists(parent_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_awesome_lists_level ON awesome_lists(level)`);
}

// Get database instance
function getDb() {
  return db;
}

// Close database
function close() {
  if (db) {
    db.close();
  }
}

// Export functions
module.exports = {
  initialize,
  getDb,
  close,
  DB_DIR,
  DB_PATH
};
