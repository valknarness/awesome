const chalk = require('chalk');
const inquirer = require('inquirer');
const { purpleGold, pinkPurple, sectionHeader } = require('./banner');
const db = require('./db-operations');

// Show statistics
async function show() {
  console.clear();
  sectionHeader('DATABASE STATISTICS', '📊');

  const stats = db.getStats();

  // Main stats
  console.log(pinkPurple('  📦 INDEX OVERVIEW\n'));
  console.log(chalk.hex('#DA22FF')('    Awesome Lists:     ') + chalk.hex('#FFD700').bold(stats.awesomeLists));
  console.log(chalk.hex('#FF69B4')('    Repositories:      ') + chalk.hex('#FFD700').bold(stats.repositories));
  console.log(chalk.hex('#9733EE')('    Indexed READMEs:   ') + chalk.hex('#FFD700').bold(stats.readmes));
  console.log();

  console.log(pinkPurple('  ⭐ USER DATA\n'));
  console.log(chalk.hex('#DA22FF')('    Bookmarks:         ') + chalk.hex('#FFD700').bold(stats.bookmarks));
  console.log(chalk.hex('#FF69B4')('    Custom Lists:      ') + chalk.hex('#FFD700').bold(stats.customLists));
  console.log(chalk.hex('#9733EE')('    History Items:     ') + chalk.hex('#FFD700').bold(stats.historyItems));
  console.log(chalk.hex('#DA22FF')('    Annotations:       ') + chalk.hex('#FFD700').bold(stats.annotations));
  console.log();

  console.log(pinkPurple('  🏷️  ORGANIZATION\n'));
  console.log(chalk.hex('#FF69B4')('    Tags:              ') + chalk.hex('#FFD700').bold(stats.tags));
  console.log(chalk.hex('#9733EE')('    Categories:        ') + chalk.hex('#FFD700').bold(stats.categories));
  console.log();

  // Calculate percentages
  const indexPercentage = stats.repositories > 0
    ? ((stats.readmes / stats.repositories) * 100).toFixed(1)
    : 0;

  console.log(pinkPurple('  📈 METRICS\n'));
  console.log(chalk.hex('#DA22FF')('    Index Coverage:    ') + chalk.hex('#FFD700').bold(`${indexPercentage}%`));
  console.log(chalk.hex('#FF69B4')('    Bookmark Rate:     ') + chalk.hex('#FFD700').bold(
    stats.repositories > 0 ? `${((stats.bookmarks / stats.repositories) * 100).toFixed(2)}%` : '0%'
  ));
  console.log();

  console.log(chalk.gray('━'.repeat(70)));
  console.log();

  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...'
    }
  ]);
}

module.exports = {
  show
};
