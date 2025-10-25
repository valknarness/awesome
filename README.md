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

```bash
cd /home/valknar/Projects/node.js/awesome
pnpm install
pnpm rebuild better-sqlite3
chmod +x awesome
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
# Build the index (run this first!)
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

## 📝 License

MIT

## 🌟 Credits

Inspired by [sindresorhus/awesome](https://github.com/sindresorhus/awesome) - the awesome list of awesome lists!

---

Made with 💜 and lots of ✨
