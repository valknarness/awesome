const { getDb } = require('./database');
const crypto = require('crypto');

// Helper to get hash of content
function getContentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Awesome Lists
function addAwesomeList(name, url, description, category, level = 0, parentId = null) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO awesome_lists (name, url, description, category, level, parent_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, url, description, category, level, parentId);
  return result.lastInsertRowid;
}

function getAwesomeList(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM awesome_lists WHERE id = ?').get(id);
}

function getAwesomeListByUrl(url) {
  const db = getDb();
  return db.prepare('SELECT * FROM awesome_lists WHERE url = ?').get(url);
}

function getAllAwesomeLists() {
  const db = getDb();
  return db.prepare('SELECT * FROM awesome_lists ORDER BY level, name').all();
}

function updateAwesomeListStats(id, stars, forks, lastCommit) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE awesome_lists
    SET stars = ?, forks = ?, last_commit = ?, last_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(stars, forks, lastCommit, id);
}

// Repositories
function addRepository(awesomeListId, name, url, description, stats = {}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO repositories
    (awesome_list_id, name, url, description, stars, forks, watchers, language, topics, last_commit, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    awesomeListId,
    name,
    url,
    description || '',
    stats.stars || 0,
    stats.forks || 0,
    stats.watchers || 0,
    stats.language || '',
    Array.isArray(stats.topics) ? stats.topics.join(',') : (stats.topics || ''),
    stats.pushedAt || null,
    stats.createdAt || null
  );

  return result.lastInsertRowid;
}

function getRepository(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM repositories WHERE id = ?').get(id);
}

function getRepositoryByUrl(url) {
  const db = getDb();
  return db.prepare('SELECT * FROM repositories WHERE url = ?').get(url);
}

function getRepositoriesByList(awesomeListId) {
  const db = getDb();
  return db.prepare('SELECT * FROM repositories WHERE awesome_list_id = ? ORDER BY stars DESC').all(awesomeListId);
}

// READMEs
function addReadme(repositoryId, content, rawContent) {
  const db = getDb();
  const hash = getContentHash(rawContent);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO readmes (repository_id, content, raw_content, version_hash)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(repositoryId, content, rawContent, hash);

  // Add to FTS index
  const repo = getRepository(repositoryId);
  if (repo) {
    const ftsStmt = db.prepare(`
      INSERT OR REPLACE INTO readmes_fts (rowid, repository_name, description, content, tags, categories)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    ftsStmt.run(result.lastInsertRowid, repo.name, repo.description, content, repo.topics || '', '');
  }

  return result.lastInsertRowid;
}

function getReadme(repositoryId) {
  const db = getDb();
  return db.prepare('SELECT * FROM readmes WHERE repository_id = ?').get(repositoryId);
}

// Search
function searchReadmes(query, limit = 50) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      r.id,
      r.repository_id,
      r.content,
      repo.name,
      repo.url,
      repo.description,
      repo.stars,
      repo.language,
      repo.topics,
      rank
    FROM readmes_fts
    JOIN readmes r ON r.id = readmes_fts.rowid
    JOIN repositories repo ON repo.id = r.repository_id
    WHERE readmes_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `);

  return stmt.all(query, limit);
}

// Bookmarks
function addBookmark(repositoryId, notes = '', tags = '', categories = '') {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO bookmarks (repository_id, notes, tags, categories, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  return stmt.run(repositoryId, notes, tags, categories);
}

function removeBookmark(repositoryId) {
  const db = getDb();
  return db.prepare('DELETE FROM bookmarks WHERE repository_id = ?').run(repositoryId);
}

function getBookmarks() {
  const db = getDb();
  return db.prepare(`
    SELECT b.*, r.name, r.url, r.description, r.stars, r.language
    FROM bookmarks b
    JOIN repositories r ON r.id = b.repository_id
    ORDER BY b.created_at DESC
  `).all();
}

function isBookmarked(repositoryId) {
  const db = getDb();
  const result = db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE repository_id = ?').get(repositoryId);
  return result.count > 0;
}

// Reading History
function addToHistory(repositoryId, durationSeconds = 0) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO reading_history (repository_id, duration_seconds)
    VALUES (?, ?)
  `);
  return stmt.run(repositoryId, durationSeconds);
}

function getHistory(limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT h.*, r.name, r.url, r.description
    FROM reading_history h
    JOIN repositories r ON r.id = h.repository_id
    ORDER BY h.viewed_at DESC
    LIMIT ?
  `).all(limit);
}

// Settings
function getSetting(key, defaultValue = null) {
  const db = getDb();
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return result ? result.value : defaultValue;
}

function setSetting(key, value) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(key, value);
}

// Statistics
function getStats() {
  const db = getDb();
  return {
    awesomeLists: db.prepare('SELECT COUNT(*) as count FROM awesome_lists').get().count,
    repositories: db.prepare('SELECT COUNT(*) as count FROM repositories').get().count,
    readmes: db.prepare('SELECT COUNT(*) as count FROM readmes').get().count,
    bookmarks: db.prepare('SELECT COUNT(*) as count FROM bookmarks').get().count,
    customLists: db.prepare('SELECT COUNT(*) as count FROM custom_lists').get().count,
    historyItems: db.prepare('SELECT COUNT(*) as count FROM reading_history').get().count,
    annotations: db.prepare('SELECT COUNT(*) as count FROM annotations').get().count,
    tags: db.prepare('SELECT COUNT(*) as count FROM tags').get().count,
    categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count
  };
}

// Random
function getRandomRepository() {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM repositories
    WHERE id IN (SELECT repository_id FROM readmes)
    ORDER BY RANDOM()
    LIMIT 1
  `).get();
}

module.exports = {
  addAwesomeList,
  getAwesomeList,
  getAwesomeListByUrl,
  getAllAwesomeLists,
  updateAwesomeListStats,
  addRepository,
  getRepository,
  getRepositoryByUrl,
  getRepositoriesByList,
  addReadme,
  getReadme,
  searchReadmes,
  addBookmark,
  removeBookmark,
  getBookmarks,
  isBookmarked,
  addToHistory,
  getHistory,
  getSetting,
  setSetting,
  getStats,
  getRandomRepository
};
