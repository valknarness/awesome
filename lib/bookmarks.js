const inquirer = require('inquirer');
const chalk = require('chalk');
const Table = require('cli-table3');
const { purpleGold, sectionHeader } = require('./banner');
const db = require('./db-operations');

// Manage bookmarks
async function manage() {
  console.clear();
  sectionHeader('MY BOOKMARKS', '⭐');

  const bookmarks = db.getBookmarks();

  if (bookmarks.length === 0) {
    console.log(chalk.yellow('  No bookmarks yet. Search and bookmark your favorite projects!\n'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    return;
  }

  console.log(chalk.hex('#FFD700')(`  ${bookmarks.length} bookmarks\n`));

  // Display bookmarks table
  const table = new Table({
    head: [
      chalk.hex('#DA22FF')('#'),
      chalk.hex('#DA22FF')('Name'),
      chalk.hex('#DA22FF')('Tags'),
      chalk.hex('#DA22FF')('⭐')
    ],
    colWidths: [5, 30, 30, 7],
    wordWrap: true,
    style: {
      head: [],
      border: ['gray']
    }
  });

  bookmarks.slice(0, 20).forEach((bookmark, idx) => {
    table.push([
      chalk.gray(idx + 1),
      chalk.hex('#FF69B4')(bookmark.name),
      bookmark.tags ? chalk.hex('#FFD700')(bookmark.tags) : chalk.gray('No tags'),
      chalk.hex('#9733EE')(bookmark.stars || '-')
    ]);
  });

  console.log(table.toString());
  console.log();

  // Let user select a bookmark
  const choices = bookmarks.map((bookmark, idx) => ({
    name: `${idx + 1}. ${chalk.hex('#FF69B4')(bookmark.name)} ${chalk.gray('-')} ${bookmark.description || 'No description'}`,
    value: bookmark
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.gray('← Back'), value: null });

  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Select a bookmark:',
      choices: choices,
      pageSize: 15
    }
  ]);

  if (selected) {
    await viewBookmark(selected);
  }
}

// View single bookmark
async function viewBookmark(bookmark) {
  console.clear();
  console.log(purpleGold(`\n⭐ ${bookmark.name} ✨\n`));
  console.log(chalk.gray('━'.repeat(70)));
  console.log(chalk.hex('#DA22FF')('  URL:        ') + chalk.cyan(bookmark.url));
  console.log(chalk.hex('#FF69B4')('  Description:') + ` ${bookmark.description || chalk.gray('No description')}`));
  console.log(chalk.hex('#FFD700')('  Language:   ') + ` ${bookmark.language || chalk.gray('Unknown')}`);
  console.log(chalk.hex('#9733EE')('  Stars:      ') + ` ${bookmark.stars || '0'}`);

  if (bookmark.tags) {
    console.log(chalk.hex('#DA22FF')('  Tags:       ') + chalk.hex('#FFD700')(bookmark.tags));
  }

  if (bookmark.categories) {
    console.log(chalk.hex('#FF69B4')('  Categories: ') + chalk.hex('#9733EE')(bookmark.categories));
  }

  if (bookmark.notes) {
    console.log();
    console.log(chalk.hex('#FFD700')('  Notes:'));
    console.log(chalk.gray(`  ${bookmark.notes}`));
  }

  console.log(chalk.gray('━'.repeat(70)));
  console.log();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: chalk.hex('#DA22FF')('📖 Read README'), value: 'read' },
        { name: chalk.hex('#FF69B4')('✏️  Edit bookmark'), value: 'edit' },
        { name: chalk.hex('#FFD700')('🗑️  Remove bookmark'), value: 'remove' },
        { name: chalk.hex('#9733EE')('🌐 Open in browser'), value: 'browser' },
        { name: chalk.gray('← Back'), value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'read':
      const readme = db.getReadme(bookmark.repository_id);
      if (readme) {
        const viewer = require('./viewer');
        const repo = db.getRepository(bookmark.repository_id);
        await viewer.viewReadme(repo, readme);
      } else {
        console.log(chalk.yellow('\n  README not indexed\n'));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter...' }]);
      }
      await viewBookmark(bookmark);
      break;

    case 'edit':
      await editBookmark(bookmark);
      await manage();
      break;

    case 'remove':
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Remove this bookmark?',
          default: false
        }
      ]);
      if (confirm) {
        db.removeBookmark(bookmark.repository_id);
        console.log(chalk.green('\n  ✓ Bookmark removed\n'));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      await manage();
      break;

    case 'browser':
      const { spawn } = require('child_process');
      spawn('xdg-open', [bookmark.url], { detached: true, stdio: 'ignore' });
      await viewBookmark(bookmark);
      break;

    case 'back':
      await manage();
      break;
  }
}

// Edit bookmark
async function editBookmark(bookmark) {
  const { notes, tags, categories } = await inquirer.prompt([
    {
      type: 'input',
      name: 'notes',
      message: 'Notes:',
      default: bookmark.notes || ''
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma-separated):',
      default: bookmark.tags || ''
    },
    {
      type: 'input',
      name: 'categories',
      message: 'Categories (comma-separated):',
      default: bookmark.categories || ''
    }
  ]);

  db.addBookmark(bookmark.repository_id, notes, tags, categories);
  console.log(chalk.green('\n  ✓ Bookmark updated!\n'));
  await new Promise(resolve => setTimeout(resolve, 1000));
}

module.exports = {
  manage,
  viewBookmark,
  editBookmark
};
