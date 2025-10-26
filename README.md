# ✨ AWESOME ✨

> A next-level ground-breaking full-featured CLI application for exploring and curating awesome lists from GitHub

## 🎯 Features

### Core Features
- 🌟 **Browse Awesome Lists** - Navigate through thousands of curated awesome lists from [sindresorhus/awesome](https://github.com/sindresorhus/awesome)
- 🔍 **Full-Text Search** - Lightning-fast SQLite FTS5 powered search across all indexed READMEs
- 📚 **Interactive Shell** - Powerful shell with search completion and history
- 🎲 **Random Discovery** - Serendipitously discover random projects from the index
- 📖 **Beautiful README Viewer** - Styled markdown rendering in your terminal

### Organization & Curation
- ⭐ **Smart Bookmarks** - Save favorites with tags, categories, and notes
- 📝 **Custom Lists** - Create your own awesome lists with beautiful styling
- 🎨 **Export Options** - Export to Markdown, PDF, EPUB, and other ebook formats
- 🏷️ **Auto-Tagging** - Automatic extraction of tags and categories from content
- ✍️ **Annotations** - Add notes to entire documents or specific lines

### Intelligence & Insights
- 📊 **Statistics Dashboard** - Comprehensive stats about your index
- 📈 **GitHub Integration** - Stars, forks, last commit, and more
- 🔄 **Smart Updates** - Update bookmarked READMEs with diff preview
- 📜 **Reading History** - Track what you've explored
- 🎯 **Auto-Complete** - Intelligent completion for tags and categories

### Developer Features
- 🚀 **Git Integration** - Clone repositories directly from the app
- 🔧 **Recursive Indexing** - Deep crawl of awesome lists hierarchy
- 🎭 **Background Operations** - Fancy loaders for all async operations
- 🐛 **Debug Mode** - Accessible via Node.js debug port
- ⚙️ **Configurable** - Extensive settings via CLI

## 🎨 Theme

Beautiful purple, pink, and gold gradient color scheme throughout the entire application for a funky, cool, and awesome experience!

## 📦 Installation

### Option 1: Use Pre-Built Database (Recommended) ⚡

Skip the lengthy indexing process! Download a pre-built database that's automatically updated daily.

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/awesome.git
cd awesome

# Install dependencies
pnpm install
pnpm rebuild better-sqlite3
chmod +x awesome

# Download pre-built database (easiest - uses GitHub CLI)
./awesome db

# Or use the standalone script
./scripts/download-db.sh

# Start using immediately!
./awesome
```

**Database is rebuilt daily** by GitHub Actions with full indexing of all awesome lists!

**Two ways to download:**
- `./awesome db` - Built-in command with interactive menu
- `./scripts/download-db.sh` - Standalone script with more options

#### Download Database Manually

If you prefer manual download or the script doesn't work:

```bash
# Install GitHub CLI if needed
# macOS: brew install gh
# Ubuntu: sudo apt install gh
# Windows: winget install GitHub.cli

# Authenticate with GitHub
gh auth login

# Download latest database artifact
gh run download --repo YOUR_USERNAME/awesome -n awesome-database-latest

# Move to correct location
mkdir -p ~/.awesome
cp awesome-*.db ~/.awesome/awesome.db
```

### Option 2: Build Database Locally 🔨

Build the index yourself (takes 1-2 hours for full indexing):

```bash
cd /home/valknar/Projects/node.js/awesome
pnpm install
pnpm rebuild better-sqlite3
chmod +x awesome

# Build the index
./awesome index
```

## ⚡ GitHub Rate Limits - SOLVED with OAuth! 🔐

GitHub API has strict rate limits:
- **Without auth**: 60 requests/hour ⏰
- **With OAuth**: 5,000 requests/hour 🚀 (83x more!)

### 🎉 Super Easy OAuth Setup (30 seconds!):

```bash
./awesome settings
→ GitHub Authentication
→ OAuth (Recommended)
→ Browser opens, enter code, done! ✨
```

**That's it!** No manual token creation, no copy-pasting!

### Features:
- ✅ **Browser auto-opens** to GitHub auth page
- ✅ **Just enter the code** shown in terminal
- ✅ **Click authorize** and you're done!
- ✅ **83x more API requests** instantly
- ✅ **Secure** - token stored locally
- ✅ **Fallback** - manual token still available

When you hit rate limits (rare with OAuth), you get options:
- ⏭️ Skip remaining items
- ⏰ Wait and continue
- ❌ Abort

See [OAUTH_SETUP.md](OAUTH_SETUP.md) for complete guide!

## 🚀 Usage

### Interactive Mode
```bash
./awesome
```

### Commands
```bash
# Download pre-built database (fast!)
./awesome db

# Build the index locally (slow - 1-2 hours)
./awesome index

# Search
./awesome search "react hooks"

# Interactive shell
./awesome shell

# Browse lists
./awesome browse

# Random README
./awesome random

# Manage bookmarks
./awesome bookmarks

# Manage custom lists
./awesome lists

# View history
./awesome history

# Statistics
./awesome stats

# Settings
./awesome settings

# Clone a repository
./awesome checkout owner/repo

# Debug mode
node --inspect=9230 awesome
```

## 🗄️ Database Schema

The application uses SQLite3 with FTS5 for full-text search. Data is stored in `~/.awesome/awesome.db`.

### Tables
- **awesome_lists** - Indexed awesome lists (hierarchical)
- **repositories** - Individual projects with GitHub stats
- **readmes** - README content with versions
- **readmes_fts** - Full-text search index
- **bookmarks** - User bookmarks with tags/categories
- **custom_lists** - User-created awesome lists
- **custom_list_items** - Items in custom lists
- **reading_history** - Reading activity tracking
- **annotations** - Document and line annotations
- **tags** - Extracted and user-defined tags
- **categories** - Extracted and user-defined categories
- **settings** - Application configuration
- **readme_versions** - Version history for diffs

## 🎯 Workflow

1. **First Run**: `./awesome index` - Recursively crawls and indexes awesome lists
2. **Explore**: Search, browse, discover random projects
3. **Organize**: Bookmark favorites, add tags and categories
4. **Curate**: Create custom awesome lists
5. **Share**: Export your lists in multiple formats
6. **Update**: Keep your index fresh with smart diff-based updates

## 🛠️ Technology Stack

- **Node.js 22+** - Modern JavaScript runtime
- **SQLite3 + FTS5** - Fast, embedded database with full-text search
- **Inquirer.js** - Beautiful interactive prompts
- **Chalk & Gradient-String** - Colorful terminal output
- **Marked & Marked-Terminal** - Markdown rendering
- **Simple-Git** - Git operations
- **Axios** - HTTP client for GitHub API
- **Commander.js** - CLI framework
- **Ora & Nanospinner** - Loading animations
- **pnpm** - Fast, efficient package manager

## 🤖 Automated Database Builds

The repository includes GitHub Actions workflows for automated database management:

### Daily Database Build

**Schedule:** Runs daily at 02:00 UTC

**What it does:**
- Fetches all awesome lists from [sindresorhus/awesome](https://github.com/sindresorhus/awesome)
- Recursively indexes all README files
- Collects GitHub metadata (stars, forks, etc.)
- Compresses and uploads database as artifact
- Generates build report with statistics

**Manual Trigger:**
You can manually trigger a database build from the GitHub Actions tab:
```bash
gh workflow run build-database.yml -f index_mode=full
```

**Artifact Details:**
- **Retention:** 90 days
- **Size:** ~50-200MB (compressed)
- **Contains:** Full database + metadata JSON
- **Naming:** `awesome-database-{run_id}`

### Artifact Cleanup

**Schedule:** Runs daily at 03:00 UTC (after database build)

**What it does:**
- Removes artifacts older than 30 days (configurable)
- Cleans up old workflow runs
- Generates cleanup report
- Dry-run mode available for testing

**Manual Trigger:**
```bash
# Standard cleanup (30 days retention)
gh workflow run cleanup-artifacts.yml

# Custom retention period
gh workflow run cleanup-artifacts.yml -f retention_days=60

# Dry run (preview only)
gh workflow run cleanup-artifacts.yml -f dry_run=true
```

### Download Helper Script

The `scripts/download-db.sh` script provides an interactive interface to:
- List available database builds
- View build metadata (date, size, commit)
- Download and install selected database
- Backup existing database automatically

**Features:**
- Interactive selection menu
- Automatic backup of existing databases
- GitHub CLI integration
- Cross-platform support (Linux, macOS, Windows/Git Bash)

## 📝 License

MIT

## 🌟 Credits

Inspired by [sindresorhus/awesome](https://github.com/sindresorhus/awesome) - the awesome list of awesome lists!

---

Made with 💜 and lots of ✨
