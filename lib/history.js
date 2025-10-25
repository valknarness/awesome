const inquirer = require('inquirer');
const chalk = require('chalk');
const Table = require('cli-table3');
const { purpleGold, sectionHeader } = require('./banner');
const db = require('./db-operations');

// Show reading history
async function show() {
  console.clear();
  sectionHeader('READING HISTORY', '📖');

  const history = db.getHistory(100);

  if (history.length === 0) {
    console.log(chalk.yellow('  No reading history yet.\n'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    return;
  }

  console.log(chalk.hex('#FFD700')(`  ${history.length} items\n`));

  // Display history table
  const table = new Table({
    head: [
      chalk.hex('#DA22FF')('#'),
      chalk.hex('#DA22FF')('Name'),
      chalk.hex('#DA22FF')('Viewed At'),
      chalk.hex('#DA22FF')('Duration')
    ],
    colWidths: [5, 35, 20, 12],
    wordWrap: true,
    style: {
      head: [],
      border: ['gray']
    }
  });

  history.slice(0, 25).forEach((item, idx) => {
    const date = new Date(item.viewed_at);
    const duration = item.duration_seconds > 0 ? `${item.duration_seconds}s` : '-';

    table.push([
      chalk.gray(idx + 1),
      chalk.hex('#FF69B4')(item.name),
      chalk.gray(date.toLocaleString()),
      chalk.hex('#FFD700')(duration)
    ]);
  });

  console.log(table.toString());
  console.log();

  if (history.length > 25) {
    console.log(chalk.gray(`  ... and ${history.length - 25} more items\n`));
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Options:',
      choices: [
        { name: chalk.hex('#DA22FF')('🔍 View details'), value: 'view' },
        { name: chalk.hex('#FF69B4')('🗑️  Clear history'), value: 'clear' },
        { name: chalk.gray('← Back'), value: 'back' }
      ]
    }
  ]);

  if (action === 'view') {
    const choices = history.slice(0, 50).map((item, idx) => ({
      name: `${idx + 1}. ${chalk.hex('#FF69B4')(item.name)}`,
      value: item
    }));

    choices.push(new inquirer.Separator());
    choices.push({ name: chalk.gray('← Back'), value: null });

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select an item:',
        choices: choices,
        pageSize: 15
      }
    ]);

    if (selected) {
      const search = require('./search');
      await search.viewRepository({ repository_id: selected.repository_id });
    }

    await show();
  } else if (action === 'clear') {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Clear all reading history?',
        default: false
      }
    ]);

    if (confirm) {
      const dbInstance = require('./database').getDb();
      dbInstance.exec('DELETE FROM reading_history');
      console.log(chalk.green('\n  ✓ History cleared\n'));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await show();
  }
}

module.exports = {
  show
};
