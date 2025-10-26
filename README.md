<div align="center">

# 🚀 ✨ AWESOME CLI ✨ 🚀
### *The Mothership Has Landed! Command Your Terminal Like a Cosmic Conductor!*

![Cosmic Funk](https://i.gifer.com/Wr4i.gif)

> 🎤 *"Citizens of the universe! I bring you the MOTHERSHIP CONNECTION - a command-line interface so COSMIC, so POWERFUL, it'll make your terminal TRANSCEND to another dimension! We're talking full-text search at LIGHT SPEED, baby! We're talking SQLite FTS5 powered by the ATOMIC DOG! Climb aboard the MOTHERSHIP and explore the galaxy of awesome lists like you never imagined possible! Dr. Funkenstein himself couldn't have designed it better!"*
>
> **— George Clinton, Commander of the Mothership & Supreme Funkentelechy**

[![Mothership Status](https://img.shields.io/badge/Mothership-OPERATIONAL-DA22FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyIDJsMyA3aDcuNWwtNiA0LjUgMi41IDcuNUwxMiAxNmwtNyA1IDIuNS03LjVMMS41IDloNy41TDEyIDJ6IiBmaWxsPSIjRkZENzAwIi8+PC9zdmc+)](https://github.com)
[![Cosmic Power](https://img.shields.io/badge/⚡%20Cosmic%20Power-UNLIMITED-FF69B4?style=for-the-badge)](https://github.com)
[![Funk Factor](https://img.shields.io/badge/🎸%20Funk%20Factor-STRATOSPHERIC-FFD700?style=for-the-badge)](https://github.com)
[![Mind Blown](https://img.shields.io/badge/💥%20Mind%20Status-BLOWN-9733EE?style=for-the-badge)](https://github.com)

**🎸 Engineered By The P-Funk All Stars:** Node.js 22+ • SQLite3 + FTS5 • Inquirer.js • Chalk • Marked • Commander.js

---

</div>

## 🌌 What Is This Cosmic Creation?

Yo, EARTHLINGS! This ain't just another CLI tool - this is the **MOTHERSHIP OF AWESOME**! We're talking about a NEXT-LEVEL, GROUND-BREAKING, FULL-FEATURED command-line application that lets you explore, search, bookmark, and curate THOUSANDS of awesome lists from GitHub!

Built with the same purple/pink/gold COSMIC PALETTE that powers the universe itself, this CLI brings the FUNK to your terminal! Dr. Funkenstein would be PROUD!

### 🎯 Core Features (The Cosmic Arsenal)

#### 🌟 **Exploration & Discovery (Navigate The Galaxy!)**
- **Browse Awesome Lists** - Cruise through THOUSANDS of curated lists from [sindresorhus/awesome](https://github.com/sindresorhus/awesome) 🚀
- **Full-Text Search** - SQLite FTS5 powered search FASTER than the speed of light! ⚡
- **Interactive Shell** - Command center with search completion and history - like piloting the MOTHERSHIP! 🎮
- **Random Discovery** - Serendipitously discover random projects - let the COSMOS guide you! 🎲
- **Beautiful README Viewer** - Styled markdown rendering that'll make your TERMINAL sing! 📖

#### ⭐ **Organization & Curation (Build Your Own Funkadelic Universe!)**
- **Smart Bookmarks** - Save favorites with tags, categories, and notes - ORGANIZE that knowledge! 🏷️
- **Custom Lists** - Create your OWN awesome lists with BEAUTIFUL styling! 📝
- **Export Options** - Export to Markdown, PDF, EPUB, and other formats - SHARE the wealth! 🎨
- **Auto-Tagging** - Automatic extraction of tags and categories - let the AI do the WORK! 🤖
- **Annotations** - Add notes to documents or specific lines - WISDOM preserved! ✍️

#### 📊 **Intelligence & Insights (The Cosmic Brain!)**
- **Statistics Dashboard** - Comprehensive stats about your index - NUMBERS don't lie! 📈
- **GitHub Integration** - Stars, forks, last commit - ALL the metadata you crave! 💫
- **Smart Updates** - Update bookmarked READMEs with diff preview - SEE what changed! 🔄
- **Reading History** - Track your cosmic journey through the codebase! 📜
- **Auto-Complete** - Intelligent completion for tags and categories - SMOOTH as silk! 🎯

#### 🚀 **Developer Features (Power Tools for the Funkateers!)**
- **Git Integration** - Clone repositories DIRECTLY from the app - one command, DONE! 🔧
- **Recursive Indexing** - Deep crawl of awesome lists hierarchy - WE GO DEEP! 🕳️
- **Background Operations** - Fancy loaders for async operations - STYLE while you wait! 🎭
- **Debug Mode** - Node.js debug port access - FIX bugs like a PRO! 🐛
- **Configurable** - Extensive settings via CLI - CUSTOMIZE your experience! ⚙️

---

## 🎨 The Cosmic Aesthetic

We got that **PURPLE/PINK/GOLD GRADIENT** flowing through EVERY pixel of this CLI! It's like a RAINBOW exploded in your terminal, but in a GOOD way!

```css
/* The Cosmic Palette of Dr. Funkenstein */
--awesome-purple: #DA22FF;    /* 💜 The MOTHER of all purples */
--awesome-pink: #FF69B4;      /* 💗 Pink POWER */
--awesome-gold: #FFD700;      /* 💛 Golden GLORY */
```

Your terminal will look SO FLY, you'll want to FRAME IT! 🖼️

---

## 📦 Installation (Boarding The Mothership!)

Alright space cadets, let's get you ON BOARD! Two ways to launch:

### Option 1: Use Pre-Built Database (FAST LANE! ⚡ Recommended!)

Why wait 1-2 hours when you can be FUNKIFYING in 30 SECONDS? Download our pre-built database that's automatically updated DAILY by the cosmic robots (GitHub Actions)!

```bash
# Clone the mothership repository
git clone https://github.com/YOUR_USERNAME/awesome.git
cd awesome

# Install the cosmic dependencies
pnpm install
pnpm rebuild better-sqlite3
chmod +x awesome

# Download pre-built database (EASIEST - uses GitHub CLI magic!)
./awesome db

# Or use the standalone script (also cool!)
./scripts/download-db.sh

# START FUNKIFYING IMMEDIATELY! 🎸
./awesome
```

**Database is rebuilt DAILY** with full indexing of ALL awesome lists! Fresh as MORNING DEW!

**Two ways to download (your choice, player!):**
- `./awesome db` - Built-in command with interactive menu (FANCY!)
- `./scripts/download-db.sh` - Standalone script with more options (POWERFUL!)

#### Download Database Manually (For the Control Freaks!)

If you like doing things YOUR way (respect!), here's the manual route:

```bash
# Install GitHub CLI if you ain't got it yet
# macOS: brew install gh
# Ubuntu: sudo apt install gh
# Windows: winget install GitHub.cli

# Authenticate with GitHub (tell 'em Dr. Funkenstein sent you!)
gh auth login

# Download latest database artifact
gh run download --repo YOUR_USERNAME/awesome -n awesome-database-latest

# Move to the cosmic location
mkdir -p ~/.awesome
cp awesome-*.db ~/.awesome/awesome.db

# BOOM! You're ready to ROLL! 🚀
```

### Option 2: Build Database Locally (SLOW LANE! 🔨 For the Patient!)

Build the index yourself from SCRATCH! Takes 1-2 hours but you'll feel ACCOMPLISHED!

```bash
cd /home/valknar/Projects/node.js/awesome
pnpm install
pnpm rebuild better-sqlite3
chmod +x awesome

# Build the index (grab a SANDWICH, this takes a while!)
./awesome index

# Then UNLEASH THE FUNK! 🎸
./awesome
```

---

## ⚡ GitHub Rate Limits - CRUSHED with OAuth! 🔐

GitHub API got RATE LIMITS that'll slow you down:
- **Without auth**: 60 requests/hour ⏰ (That's WEAK!)
- **With OAuth**: 5,000 requests/hour 🚀 (Now we're TALKING! 83x MORE!)

### 🎉 Super Easy OAuth Setup (30 Seconds of Your Life!)

```bash
./awesome settings
→ GitHub Authentication
→ OAuth (Recommended - The SMART choice!)
→ Browser opens, enter code, BOOM - DONE! ✨
```

**That's IT, baby!** No manual token nonsense, no copy-pasting HEADACHES!

### Features That'll Make You SMILE:
- ✅ **Browser auto-opens** - We do the HEAVY lifting!
- ✅ **Just enter the code** - Even a CHILD could do it!
- ✅ **Click authorize** - ONE click and you're GOLDEN!
- ✅ **83x more API requests** - POWER to the people!
- ✅ **Secure** - Token stored LOCALLY, not in some sketchy cloud!
- ✅ **Fallback** - Manual token still available (we got OPTIONS!)

When you hit rate limits (RARE with OAuth!), you get OPTIONS:
- ⏭️ Skip remaining items
- ⏰ Wait and continue (PATIENCE!)
- ❌ Abort (retreat to fight another day!)

See [OAUTH_SETUP.md](OAUTH_SETUP.md) for the complete COSMIC guide!

---

## 🚀 Usage (Piloting The Mothership!)

### Interactive Mode (The MAIN event!)
```bash
./awesome
# Welcome aboard the MOTHERSHIP! 🚀
```

### Commands (The Arsenal!)

```bash
# Download pre-built database (FAST like a ROCKET!)
./awesome db

# Build the index locally (SLOW but THOROUGH!)
./awesome index

# Search the cosmos (find ANYTHING!)
./awesome search "react hooks"

# Interactive shell (the COMMAND center!)
./awesome shell

# Browse lists (EXPLORE the galaxy!)
./awesome browse

# Random README (SURPRISE me!)
./awesome random

# Manage bookmarks (ORGANIZE your treasures!)
./awesome bookmarks

# Manage custom lists (CREATE your own MASTERPIECE!)
./awesome lists

# View history (where have we BEEN?)
./awesome history

# Statistics (NUMBERS tell stories!)
./awesome stats

# Settings (CUSTOMIZE the experience!)
./awesome settings

# Clone a repository (GET THE CODE!)
./awesome checkout owner/repo

# Debug mode (FIX those bugs like Dr. Funkenstein fixes GROOVES!)
node --inspect=9230 awesome
```

---

## 🗄️ Database Schema (The Cosmic Architecture!)

We use SQLite3 with FTS5 for FULL-TEXT SEARCH that'll make your head SPIN! Data lives in `~/.awesome/awesome.db`.

### Tables (The Data Mothership!)
- **awesome_lists** - Indexed awesome lists (HIERARCHICAL organization!)
- **repositories** - Individual projects with GitHub stats (ALL the metadata!)
- **readmes** - README content with versions (VERSIONED for your pleasure!)
- **readmes_fts** - Full-text search index (FTS5 MAGIC!)
- **bookmarks** - User bookmarks with tags/categories (YOUR favorites!)
- **custom_lists** - User-created awesome lists (YOUR creations!)
- **custom_list_items** - Items in custom lists (THE details!)
- **reading_history** - Reading activity tracking (BREADCRUMBS!)
- **annotations** - Document and line annotations (YOUR wisdom!)
- **tags** - Extracted and user-defined tags (ORGANIZE!)
- **categories** - Extracted and user-defined categories (CATEGORIZE!)
- **settings** - Application configuration (YOUR preferences!)
- **readme_versions** - Version history for diffs (SEE what changed!)

---

## 🎯 Workflow (The Cosmic Journey!)

1. **First Run**: `./awesome index` - Recursively crawls and indexes awesome lists (THE BEGINNING!)
2. **Explore**: Search, browse, discover random projects (THE ADVENTURE!)
3. **Organize**: Bookmark favorites, add tags and categories (THE ORGANIZATION!)
4. **Curate**: Create custom awesome lists (THE CREATION!)
5. **Share**: Export your lists in multiple formats (THE SHARING!)
6. **Update**: Keep your index fresh with smart diff-based updates (THE MAINTENANCE!)

---

## 🛠️ Technology Stack (The Cosmic Toolkit!)

**The Tools of Dr. Funkenstein:**
- **Node.js 22+** - Modern JavaScript runtime (CUTTING EDGE!)
- **SQLite3 + FTS5** - Fast embedded database with full-text search (SPEED DEMON!)
- **Inquirer.js** - Beautiful interactive prompts (ASK and you shall RECEIVE!)
- **Chalk & Gradient-String** - Colorful terminal output (RAINBOW in your terminal!)
- **Marked & Marked-Terminal** - Markdown rendering (BEAUTIFUL docs!)
- **Simple-Git** - Git operations (VERSION control!)
- **Axios** - HTTP client for GitHub API (GET that data!)
- **Commander.js** - CLI framework (COMMAND the terminal!)
- **Ora & Nanospinner** - Loading animations (STYLE while you wait!)
- **pnpm** - Fast, efficient package manager (SPEED and EFFICIENCY!)

---

## 🤖 Automated Database Builds (The Cosmic Robots!)

We got GitHub Actions workflows that work while you SLEEP! Automated database management like CLOCKWORK!

### Daily Database Build (The Morning Ritual!)

**Schedule:** Runs daily at 02:00 UTC (while you're DREAMING!)

**What the cosmic robots do:**
- Fetch ALL awesome lists from [sindresorhus/awesome](https://github.com/sindresorhus/awesome) 📚
- Recursively index ALL README files (DEEP DIVE!)
- Collect GitHub metadata (stars, forks, etc.) - ALL the juicy stats! 📊
- Compress and upload database as artifact (PACKAGED with love!) 📦
- Generate build report with statistics (TRANSPARENCY!) 📈

**Manual Trigger (For when you can't WAIT!):**
```bash
gh workflow run build-database.yml -f index_mode=full
# Fire at will, commander! 🚀
```

**Artifact Details:**
- **Retention:** 90 days (PLENTY of time!)
- **Size:** ~50-200MB compressed (EFFICIENT!)
- **Contains:** Full database + metadata JSON (EVERYTHING you need!)
- **Naming:** `awesome-database-{run_id}` (ORGANIZED!)

### Artifact Cleanup (The Cosmic Janitor!)

**Schedule:** Runs daily at 03:00 UTC (AFTER database build - SMART!)

**What it cleans up:**
- Removes artifacts older than 30 days (configurable - YOUR choice!)
- Cleans up old workflow runs (OUT with the old!)
- Generates cleanup report (TRANSPARENCY!)
- Dry-run mode available for testing (SAFETY first!)

**Manual Trigger:**
```bash
# Standard cleanup (30 days retention)
gh workflow run cleanup-artifacts.yml

# Custom retention period (YOU decide!)
gh workflow run cleanup-artifacts.yml -f retention_days=60

# Dry run (preview only - NO commitments!)
gh workflow run cleanup-artifacts.yml -f dry_run=true
```

### Download Helper Script (The Cosmic Assistant!)

The `scripts/download-db.sh` script provides an interactive interface to:
- List available database builds (SEE your options!)
- View build metadata (date, size, commit - ALL the details!)
- Download and install selected database (ONE command!)
- Backup existing database automatically (SAFETY net!)

**Features:**
- Interactive selection menu (CHOOSE your destiny!)
- Automatic backup of existing databases (PROTECTION!)
- GitHub CLI integration (SEAMLESS!)
- Cross-platform support (Linux, macOS, Windows/Git Bash - EVERYONE's invited!)

---

## 🌟 What Makes This Cosmically AWESOME?

1. **🎨 Funkadelic Aesthetics** - Purple/pink/gold theme that'll make your EYES happy!
2. **⚡ Lightning Search** - FTS5 search faster than a PHOTON!
3. **💾 Smart Indexing** - Recursive crawling that GOES DEEP!
4. **🤖 Automation** - Daily builds while you SLEEP!
5. **📱 Portability** - SQLite database you can take ANYWHERE!
6. **♿ Accessibility** - Keyboard shortcuts, beautiful prompts, semantic EVERYTHING!
7. **🌗 Terminal Beauty** - Colors and gradients that make your terminal SING!
8. **✨ Smooth UX** - Loading animations smoother than BUTTER!

---

## 📜 License

MIT License - Free as a BIRD, baby! Use it, share it, MODIFY it!

---

<div align="center">

## ⭐ CREDITS ⭐

### 🚀 The Mothership Commander Himself 🚀

<img src="https://i.gifer.com/embedded/download/72SN.gif" width="200">

**Built with 💜💗💛 by cosmic coders worldwide**

*"Free your mind and your CLI will follow!"*

---

### Special Shoutout To The Cosmic Crew:

🎤 **George Clinton** - For the MOTHERSHIP vision and COSMIC inspiration
🌟 **Parliament-Funkadelic** - For the GROOVE that powers the universe
🎸 **Dr. Funkenstein** - For showing us the way to FUNKY enlightenment
⭐ **sindresorhus/awesome** - For the original awesome lists (THE foundation!)
💜 **The Open Source Community** - For keeping the COSMIC SLOP flowing

---

### 🎸 One Nation Under A Groove, Gettin' Down Just For The Funk Of It! 🎸

*If this CLI makes your terminal TRANSCEND, drop us a ⭐ STAR ⭐ on GitHub!*
*Let's spread the FUNK across the command line, one awesome list at a time!*

![Footer Cosmic](https://i.gifer.com/XOsX.gif)

**THE MOTHERSHIP CONNECTION IS UNBROKEN!** 🚀✨🎸

*P.S. - Citizens of the universe, remember: "If you hear any noise, it's just me and the boys!"*

</div>
