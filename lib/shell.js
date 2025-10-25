const inquirer = require('inquirer');
const inquirerAutocomplete = require('inquirer-autocomplete-prompt');
const chalk = require('chalk');
const fuzzy = require('fuzzy');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { purpleGold, pinkPurple, sectionHeader } = require('./banner');
const db = require('./db-operations');

// Register autocomplete prompt
inquirer.registerPrompt('autocomplete', inquirerAutocomplete);

// Command history file
const HISTORY_FILE = path.join(os.homedir(), '.awesome', 'shell_history.txt');
let commandHistory = [];

// Load command history
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf8');
      commandHistory = content.split('\n').filter(Boolean);
    }
  } catch (error) {
    commandHistory = [];
  }
}

// Save command to history
function saveToHistory(command) {
  if (command && !commandHistory.includes(command)) {
    commandHistory.push(command);
    try {
      fs.appendFileSync(HISTORY_FILE, command + '\n');
    } catch (error) {
      // Ignore errors
    }
  }
}

// Available commands
const COMMANDS = {
  search: 'Search through indexed READMEs',
  browse: 'Browse awesome lists',
  random: 'Show a random README',
  stats: 'Show database statistics',
  bookmarks: 'Manage bookmarks',
  lists: 'Manage custom lists',
  history: 'View reading history',
  index: 'Rebuild the index',
  settings: 'Manage settings',
  help: 'Show available commands',
  clear: 'Clear the screen',
  exit: 'Exit the shell'
};

// Start interactive shell
async function start() {
  console.clear();
  console.log(purpleGold('\n📚 AWESOME INTERACTIVE SHELL 📚\n'));
  console.log(chalk.gray('Type "help" for available commands, "exit" to quit\n'));
  console.log(chalk.gray('━'.repeat(70)));
  console.log();

  loadHistory();

  let running = true;

  while (running) {
    const { command } = await inquirer.prompt([
      {
        type: 'input',
        name: 'command',
        message: chalk.hex('#DA22FF')('awesome>'),
        prefix: '',
        suffix: ' '
      }
    ]);

    const trimmed = command.trim();
    if (!trimmed) continue;

    saveToHistory(trimmed);

    const [cmd, ...args] = trimmed.split(/\s+/);

    try {
      running = await executeCommand(cmd.toLowerCase(), args);
    } catch (error) {
      console.error(chalk.red('\nError:'), error.message);
      console.log();
    }
  }

  console.log(pinkPurple('\n✨ Thanks for using Awesome! ✨\n'));
}

// Execute command
async function executeCommand(cmd, args) {
  switch (cmd) {
    case 'search':
      if (args.length === 0) {
        console.log(chalk.yellow('Usage: search <query>'));
      } else {
        const search = require('./search');
        await search.performSearch(args.join(' '));
      }
      break;

    case 'browse':
      const browser = require('./browser');
      await browser.browse();
      break;

    case 'random':
      const random = require('./random');
      await random.showRandom();
      break;

    case 'stats':
      await showStats();
      break;

    case 'bookmarks':
      const bookmarks = require('./bookmarks');
      await bookmarks.manage();
      break;

    case 'lists':
      const customLists = require('./custom-lists');
      await customLists.manage();
      break;

    case 'history':
      const history = require('./history');
      await history.show();
      break;

    case 'index':
      const indexer = require('./indexer');
      await indexer.buildIndex();
      break;

    case 'settings':
      const settings = require('./settings');
      await settings.manage();
      break;

    case 'help':
      showHelp();
      break;

    case 'clear':
      console.clear();
      console.log(purpleGold('\n📚 AWESOME INTERACTIVE SHELL 📚\n'));
      console.log(chalk.gray('Type "help" for available commands, "exit" to quit\n'));
      break;

    case 'exit':
    case 'quit':
      return false;

    default:
      console.log(chalk.yellow(`Unknown command: ${cmd}`));
      console.log(chalk.gray('Type "help" for available commands'));
  }

  console.log();
  return true;
}

// Show help
function showHelp() {
  console.log();
  console.log(purpleGold('Available Commands:\n'));
  console.log(chalk.gray('━'.repeat(70)));

  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  ${chalk.hex('#FF69B4')(cmd.padEnd(12))} ${chalk.gray(desc)}`);
  });

  console.log(chalk.gray('━'.repeat(70)));
  console.log();
}

// Show statistics
async function showStats() {
  const stats = db.getStats();

  console.log();
  console.log(pinkPurple('📊 Database Statistics\n'));
  console.log(chalk.gray('━'.repeat(70)));
  console.log(chalk.hex('#DA22FF')('  Awesome Lists:    ') + chalk.hex('#FFD700').bold(stats.awesomeLists));
  console.log(chalk.hex('#FF69B4')('  Repositories:     ') + chalk.hex('#FFD700').bold(stats.repositories));
  console.log(chalk.hex('#9733EE')('  Indexed READMEs:  ') + chalk.hex('#FFD700').bold(stats.readmes));
  console.log(chalk.hex('#DA22FF')('  Bookmarks:        ') + chalk.hex('#FFD700').bold(stats.bookmarks));
  console.log(chalk.hex('#FF69B4')('  Custom Lists:     ') + chalk.hex('#FFD700').bold(stats.customLists));
  console.log(chalk.hex('#9733EE')('  History Items:    ') + chalk.hex('#FFD700').bold(stats.historyItems));
  console.log(chalk.hex('#DA22FF')('  Annotations:      ') + chalk.hex('#FFD700').bold(stats.annotations));
  console.log(chalk.gray('━'.repeat(70)));
}

module.exports = {
  start,
  executeCommand,
  loadHistory,
  saveToHistory
};
