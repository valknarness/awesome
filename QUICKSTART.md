# 🚀 AWESOME - Quick Start Guide

## Installation

```bash
cd /home/valknar/Projects/node.js/awesome
pnpm install
pnpm rebuild better-sqlite3
chmod +x awesome
```

## First Run

### Option 1: Download Pre-Built Database (Fast! ⚡)

1. **Download Database** (takes ~1 minute)
   ```bash
   ./awesome db
   ```
   Or use the script:
   ```bash
   ./scripts/download-db.sh
   ```
   This will:
   - Show available database builds
   - Let you select one to download
   - Automatically install it
   - Backup your existing database (if any)

2. **Start Exploring**
   ```bash
   ./awesome
   ```
   Opens the beautiful interactive menu with all features!

### Option 2: Build Index Locally (Slow - 1-2 hours)

1. **Build the Index** (takes 1-2 hours)
   ```bash
   ./awesome index
   ```
   This will:
   - Fetch the main awesome list from sindresorhus/awesome
   - Let you choose what to index (everything, sample, or specific categories)
   - Recursively crawl and index README files
   - Collect GitHub stats (stars, forks, etc.)

2. **Start Exploring**
   ```bash
   ./awesome
   ```
   Opens the beautiful interactive menu with all features!

## Common Workflows

### Discovery Workflow
```bash
./awesome
# Choose: Search READMEs
# Enter a query like "react hooks"
# Select a result to view
# Read the README
# Bookmark it if you like it!
```

### Curation Workflow
```bash
./awesome bookmarks     # View your saved repos
./awesome lists         # Create a custom awesome list
# Add bookmarked items to your list
# Export as Markdown with awesome badges!
```

### Shell Power User
```bash
./awesome shell
awesome> search "nodejs performance"
awesome> random          # Discover something new!
awesome> stats           # See your index stats
awesome> help
```

## All Commands

| Command | Description |
|---------|-------------|
| `./awesome` | Interactive menu (recommended) |
| `./awesome db` | Download pre-built database ⚡ |
| `./awesome index` | Build/rebuild index locally |
| `./awesome search "query"` | Quick search |
| `./awesome shell` | Interactive shell |
| `./awesome browse` | Browse awesome lists |
| `./awesome random` | Random README discovery |
| `./awesome bookmarks` | Manage bookmarks |
| `./awesome lists` | Manage custom lists |
| `./awesome history` | Reading history |
| `./awesome stats` | Statistics dashboard |
| `./awesome settings` | Configure app |
| `./awesome checkout owner/repo` | Clone repository |

## Debug Mode

```bash
node --inspect=9230 awesome
```

Then connect with Chrome DevTools or your favorite Node.js debugger!

## Features Highlights

✨ **Full-Text Search** - SQLite FTS5 powered lightning-fast search
📖 **Beautiful README Viewer** - Styled markdown in your terminal
⭐ **Smart Bookmarks** - Tags, categories, notes, and more
📝 **Custom Lists** - Create and export your own awesome lists
🎲 **Random Discovery** - Serendipitous exploration
📊 **Rich Statistics** - Track your exploration journey
✍️ **Annotations** - Add notes to documents or specific lines
📜 **Reading History** - Never lose track of what you've explored
🚀 **Git Integration** - Clone repos directly from the app
🎨 **Export Options** - Markdown, JSON (PDF & EPUB coming soon!)

## Tips & Tricks

1. **Shell History** - The shell remembers your commands in `~/.awesome/shell_history.txt`

2. **Quick Navigation** - Use arrow keys in all menus for faster navigation

3. **Batch Operations** - When indexing, choose "sample" to try out 10 random lists first

4. **Tag Everything** - Use tags and categories liberally - they make search better!

5. **Annotations** - Add notes while reading to remember why something is important

6. **Custom Lists** - Create thematic collections like "Learning Resources" or "Production Tools"

## Database Location

All data is stored in:
```
~/.awesome/awesome.db
~/.awesome/shell_history.txt
```

## Color Theme

The entire app uses a beautiful **purple, pink, and gold** gradient theme for maximum awesomeness! 💜💗💛

## Need Help?

- Type `help` in the shell
- Check `README.md` for full documentation
- All menus have clear navigation options

---

**Stay Awesome!** ✨

Made with 💜 and lots of ✨
