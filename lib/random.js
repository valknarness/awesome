const chalk = require('chalk');
const inquirer = require('inquirer');
const { purpleGold, goldPink } = require('./banner');
const db = require('./db-operations');

// Show random README
async function showRandom() {
  console.clear();
  console.log(goldPink('\n🎲 RANDOM README DISCOVERY 🎲\n'));

  const repo = db.getRandomRepository();

  if (!repo) {
    console.log(chalk.yellow('  No repositories indexed yet. Run "awesome index" first.\n'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    return;
  }

  const readme = db.getReadme(repo.id);

  console.log(purpleGold(`✨ ${repo.name} ✨\n`));
  console.log(chalk.gray('━'.repeat(70)));
  console.log(chalk.hex('#DA22FF')('  URL:        ') + chalk.cyan(repo.url));
  console.log(chalk.hex('#FF69B4')('  Description:') + ` ${repo.description || chalk.gray('No description')}`);
  console.log(chalk.hex('#FFD700')('  Language:   ') + ` ${repo.language || chalk.gray('Unknown')}`);
  console.log(chalk.hex('#9733EE')('  Stars:      ') + ` ${repo.stars || '0'}`);
  console.log(chalk.gray('━'.repeat(70)));
  console.log();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: chalk.hex('#DA22FF')('📖 Read README'), value: 'read' },
        { name: chalk.hex('#FF69B4')('⭐ Bookmark'), value: 'bookmark' },
        { name: chalk.hex('#FFD700')('🎲 Another random'), value: 'random' },
        { name: chalk.hex('#9733EE')('🌐 Open in browser'), value: 'browser' },
        { name: chalk.gray('← Back'), value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'read':
      if (readme) {
        const viewer = require('./viewer');
        await viewer.viewReadme(repo, readme);
        await showRandom();
      } else {
        console.log(chalk.yellow('\n  README not indexed\n'));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter...' }]);
        await showRandom();
      }
      break;

    case 'bookmark':
      const isBookmarked = db.isBookmarked(repo.id);
      if (!isBookmarked) {
        const { notes, tags } = await inquirer.prompt([
          {
            type: 'input',
            name: 'notes',
            message: 'Notes (optional):',
            default: ''
          },
          {
            type: 'input',
            name: 'tags',
            message: 'Tags (comma-separated):',
            default: ''
          }
        ]);
        db.addBookmark(repo.id, notes, tags, '');
        console.log(chalk.green('\n  ✓ Bookmarked!\n'));
      } else {
        console.log(chalk.yellow('\n  Already bookmarked!\n'));
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
      await showRandom();
      break;

    case 'random':
      await showRandom();
      break;

    case 'browser':
      const { spawn } = require('child_process');
      spawn('xdg-open', [repo.url], { detached: true, stdio: 'ignore' });
      await showRandom();
      break;

    case 'back':
      break;
  }
}

module.exports = {
  showRandom
};
