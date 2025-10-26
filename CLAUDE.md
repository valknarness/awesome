# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWESOME is a full-featured CLI application for exploring, curating, and managing awesome lists from GitHub. It provides an interactive terminal interface with search, bookmarking, custom list creation, and export capabilities.

## Core Technologies

- **Node.js 22+** - Required runtime
- **better-sqlite3** - Embedded database with FTS5 full-text search
- **commander.js** - CLI framework and command routing
- **inquirer.js** - Interactive prompts and menus
- **marked + marked-terminal** - Terminal markdown rendering
- **axios** - GitHub API client with OAuth support

## Commands

### Development
```bash
pnpm install                          # Install dependencies
pnpm rebuild better-sqlite3           # Rebuild native module
chmod +x awesome                      # Make executable
node awesome                          # Run application
node --inspect=9230 awesome           # Debug mode
```

### Key Application Commands
```bash
./awesome                             # Interactive menu (default)
./awesome db                          # Download pre-built database from GitHub Actions
./awesome index                       # Build/rebuild index locally (first run required)
./awesome index -f                    # Force rebuild (clears data)
./awesome search "query"              # Quick search
./awesome shell                       # Interactive shell
./awesome settings                    # Configure GitHub OAuth
```

## Architecture

### Entry Point
- `awesome` - Main executable that initializes database and sets up Commander routes

### Data Flow
1. **Indexing** (`lib/indexer.js`) - Fetches sindresorhus/awesome, recursively crawls awesome lists
2. **Storage** (`lib/database.js`) - Creates schema; (`lib/db-operations.js`) - CRUD operations
3. **Search** (`lib/search.js`) - FTS5 queries across indexed READMEs
4. **Display** (`lib/viewer.js`) - Markdown rendering with pagination

### Database Schema
Located at `~/.awesome/awesome.db` with these key tables:
- `awesome_lists` - Hierarchical list storage (with parent_id foreign key)
- `repositories` - Individual projects with GitHub metadata
- `readmes` - Full README content with version hashing
- `readmes_fts` - FTS5 virtual table for full-text search
- `bookmarks` - User favorites with tags/categories
- `custom_lists` + `custom_list_items` - User-curated lists
- `settings` - App configuration including GitHub tokens

### Module Responsibilities

**Core Operations:**
- `lib/database.js` - Schema creation, connection management, lifecycle
- `lib/db-operations.js` - All SQL queries and data operations
- `lib/github-api.js` - GitHub API wrapper with rate limiting
- `lib/github-oauth.js` - Device flow OAuth authentication

**Features:**
- `lib/indexer.js` - Recursive crawler for awesome lists, parses markdown links
- `lib/search.js` - FTS5 search interface with interactive result selection
- `lib/viewer.js` - Paginated README viewer with annotations
- `lib/bookmarks.js` - Bookmark management (add/remove/tag/export)
- `lib/custom-lists.js` - User list creation and export
- `lib/browser.js` - Hierarchical list navigation
- `lib/shell.js` - Command shell with history (~/.awesome/shell_history.txt)
- `lib/random.js` - Random README discovery
- `lib/history.js` - Reading activity tracking
- `lib/stats.js` - Index statistics dashboard
- `lib/checkout.js` - Git clone integration
- `lib/settings.js` - Configuration management
- `lib/db-download.js` - Download pre-built databases from GitHub Actions artifacts

**UI:**
- `lib/menu.js` - Main interactive menu
- `lib/banner.js` - Gradient color scheme (purple/pink/gold theme), headers

### GitHub API Integration

**Rate Limiting:**
- Unauthenticated: 60 requests/hour
- OAuth authenticated: 5,000 requests/hour
- Rate limit handler in `lib/github-api.js` prompts user to wait/skip/abort
- OAuth setup via device flow in `lib/github-oauth.js`

**Indexing Strategy:**
- Parses markdown with regex: `- [Name](url) - Description`
- Detects awesome lists vs regular repos by name/description patterns
- Recursive crawling with level tracking for hierarchy
- Stores raw and processed content for diff-based updates

### Search Architecture

**FTS5 Implementation:**
- Indexes: repository name, description, content, tags, categories
- Content preprocessing in `lib/indexer.js`: strips code blocks, HTML, normalizes whitespace
- Query through `db-operations.js:searchReadmes()` using MATCH operator
- Results ranked by BM25 relevance score

### Export Capabilities
- Markdown with awesome-style badges
- JSON structured data
- PDF/EPUB via `markdown-pdf` and `epub-gen` (dependencies installed)

## Development Patterns

### Error Handling
- GitHub API errors display user-friendly prompts with wait/skip/abort options
- Rate limit detection via response headers (`x-ratelimit-remaining`)
- Special error code `'SKIP_RATE_LIMIT'` to skip remaining items

### Database Operations
- Uses prepared statements exclusively
- Foreign keys enabled with cascade deletes
- Content versioning via SHA256 hashing
- WAL mode for concurrent access

### UI Patterns
- Consistent gradient theme via `banner.js` color functions
- Loading states using `ora` and `nanospinner`
- Progress bars via `cli-progress` for batch operations
- Tables with `cli-table3` for result display

### State Management
- Database is single source of truth
- Shell history persisted to `~/.awesome/shell_history.txt`
- Settings stored in database `settings` table as key-value pairs
- OAuth tokens encrypted and stored in settings

## Important Notes

- **First Run:** Two options:
  - Fast: `./awesome db` to download pre-built database from GitHub Actions
  - Slow: `./awesome index` to build the search index locally (1-2 hours)
- **Native Module:** better-sqlite3 requires rebuild after installation
- **OAuth Recommended:** Dramatically increases API rate limits (see `OAUTH_SETUP.md`)
- **Data Location:** All data in `~/.awesome/` directory
- **Hierarchical Structure:** awesome_lists table uses parent_id for tree relationships
- **Content Hashing:** README versions tracked by SHA256 to enable smart updates with diffs
- **GitHub Actions:** Automated workflows build database daily and clean up old artifacts
- **Artifact Download:** CLI command `./awesome db` provides interactive database download
