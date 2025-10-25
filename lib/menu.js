const inquirer = require('inquirer');
const chalk = require('chalk');
const { purpleGold, pinkPurple, sectionHeader } = require('./banner');

// Main menu
async function showMainMenu() {
  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: purpleGold('What would you like to do?'),
        pageSize: 12,
        choices: [
          { name: `${chalk.hex('#DA22FF')('🌟')} Browse Awesome Lists`, value: 'browse' },
          { name: `${chalk.hex('#FF69B4')('🔍')} Search READMEs`, value: 'search' },
          { name: `${chalk.hex('#FFD700')('📚')} Interactive Shell`, value: 'shell' },
          { name: `${chalk.hex('#DA22FF')('🎲')} Random README`, value: 'random' },
          new inquirer.Separator(chalk.gray('─'.repeat(50))),
          { name: `${chalk.hex('#FF69B4')('⭐')} My Bookmarks`, value: 'bookmarks' },
          { name: `${chalk.hex('#FFD700')('📝')} My Custom Lists`, value: 'lists' },
          { name: `${chalk.hex('#DA22FF')('📖')} Reading History`, value: 'history' },
          new inquirer.Separator(chalk.gray('─'.repeat(50))),
          { name: `${chalk.hex('#FF69B4')('🔧')} Build/Rebuild Index`, value: 'index' },
          { name: `${chalk.hex('#FFD700')('📊')} Statistics`, value: 'stats' },
          { name: `${chalk.hex('#DA22FF')('⚙️')}  Settings`, value: 'settings' },
          new inquirer.Separator(chalk.gray('─'.repeat(50))),
          { name: chalk.gray('Exit'), value: 'exit' }
        ]
      }
    ]);

    if (choice === 'exit') {
      console.log(pinkPurple('\n✨ Thanks for using Awesome! See you soon! ✨\n'));
      process.exit(0);
    }

    try {
      await handleMenuChoice(choice);
    } catch (error) {
      console.error(chalk.red('\nError:'), error.message);
      console.log(chalk.gray('\nPress Enter to continue...'));
      await inquirer.prompt([{ type: 'input', name: 'continue', message: '' }]);
    }
  }
}

// Handle menu choice
async function handleMenuChoice(choice) {
  switch (choice) {
    case 'browse':
      const browser = require('./browser');
      await browser.browse();
      break;

    case 'search':
      const search = require('./search');
      await search.interactiveSearch();
      break;

    case 'shell':
      const shell = require('./shell');
      await shell.start();
      break;

    case 'random':
      const random = require('./random');
      await random.showRandom();
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

    case 'stats':
      const stats = require('./stats');
      await stats.show();
      break;

    case 'settings':
      const settings = require('./settings');
      await settings.manage();
      break;

    default:
      console.log(chalk.yellow('Invalid choice'));
  }
}

module.exports = {
  showMainMenu,
  handleMenuChoice
};
