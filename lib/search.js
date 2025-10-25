const inquirer = require('inquirer');
const chalk = require('chalk');
const Table = require('cli-table3');
const { purpleGold, pinkPurple, sectionHeader } = require('./banner');
const db = require('./db-operations');

// Interactive search
async function interactiveSearch() {
  console.clear();
  sectionHeader('SEARCH READMES', '🔍');

  const { query } = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: purpleGold('Enter your search query:'),
      validate: (input) => {
        if (!input.trim()) {
          return 'Please enter a search query';
        }
        return true;
      }
    }
  ]);

  await performSearch(query);
}

// Quick search from CLI
async function quickSearch(query, limit = 50) {
  console.clear();
  sectionHeader(`SEARCH RESULTS FOR "${query}"`, '🔍');
  await performSearch(query, limit);
}

// Perform search and display results
async function performSearch(query, limit = 50) {
  const results = db.searchReadmes(query, limit);

  if (results.length === 0) {
    console.log(chalk.yellow('  No results found.\n'));
    console.log(chalk.gray('  Try:\n'));
    console.log(chalk.gray('   • Using different keywords'));
    console.log(chalk.gray('   • Building the index with: awesome index'));
    console.log(chalk.gray('   • Checking for typos\n'));
    return;
  }

  console.log(chalk.hex('#FFD700')(`  Found ${results.length} results!\n`));

  // Display results table
  const table = new Table({
    head: [
      chalk.hex('#DA22FF')('#'),
      chalk.hex('#DA22FF')('Name'),
      chalk.hex('#DA22FF')('Description'),
      chalk.hex('#DA22FF')('⭐'),
      chalk.hex('#DA22FF')('Lang')
    ],
    colWidths: [5, 25, 50, 7, 12],
    wordWrap: true,
    style: {
      head: [],
      border: ['gray']
    }
  });

  results.slice(0, 20).forEach((result, idx) => {
    table.push([
      chalk.gray(idx + 1),
      chalk.hex('#FF69B4')(result.name),
      result.description ? result.description.substring(0, 80) : chalk.gray('No description'),
      chalk.hex('#FFD700')(result.stars || '-'),
      chalk.hex('#9733EE')(result.language || '-')
    ]);
  });

  console.log(table.toString());

  if (results.length > 20) {
    console.log(chalk.gray(`\n  ... and ${results.length - 20} more results\n`));
  }

  // Let user select a result
  const choices = results.map((result, idx) => ({
    name: `${idx + 1}. ${chalk.hex('#FF69B4')(result.name)} ${chalk.gray('-')} ${result.description ? result.description.substring(0, 60) : 'No description'}`,
    value: result,
    short: result.name
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.gray('← Back to menu'), value: null });

  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Select a repository:',
      choices: choices,
      pageSize: 15
    }
  ]);

  if (selected) {
    await viewRepository(selected);
  }
}

// View repository details and actions
async function viewRepository(result) {
  console.clear();
  const repo = db.getRepository(result.repository_id);
  const readme = db.getReadme(result.repository_id);
  const isBookmarked = db.isBookmarked(result.repository_id);

  // Display header
  console.log(purpleGold(`\n✨ ${repo.name} ✨\n`));
  console.log(chalk.gray('━'.repeat(70)));
  console.log(chalk.hex('#DA22FF')('  URL:        ') + chalk.cyan(repo.url));
  console.log(chalk.hex('#FF69B4')('  Description:') + ` ${repo.description || chalk.gray('No description')}`);
  console.log(chalk.hex('#FFD700')('  Language:   ') + ` ${repo.language || chalk.gray('Unknown')}`);
  console.log(chalk.hex('#9733EE')('  Stars:      ') + ` ${chalk.bold(repo.stars || '0')}`);
  console.log(chalk.hex('#DA22FF')('  Forks:      ') + ` ${repo.forks || '0'}`);

  if (repo.topics) {
    const topics = repo.topics.split(',').filter(Boolean);
    if (topics.length > 0) {
      console.log(chalk.hex('#FF69B4')('  Topics:     ') + ` ${topics.map(t => chalk.hex('#FFD700')(t)).join(', ')}`);
    }
  }

  console.log(chalk.gray('━'.repeat(70)));
  console.log();

  if (isBookmarked) {
    console.log(chalk.hex('#FFD700')('  ⭐ Bookmarked'));
  }

  // Record in history
  db.addToHistory(result.repository_id);

  // Actions menu
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: `${chalk.hex('#DA22FF')('📖')} Read README`, value: 'read' },
        { name: `${chalk.hex('#FF69B4')('⭐')} ${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}`, value: 'bookmark' },
        { name: `${chalk.hex('#FFD700')('📝')} Add to custom list`, value: 'list' },
        { name: `${chalk.hex('#9733EE')('🌐')} Open in browser`, value: 'browser' },
        { name: `${chalk.hex('#DA22FF')('📥')} Clone repository`, value: 'clone' },
        new inquirer.Separator(),
        { name: chalk.gray('← Back to search results'), value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'read':
      if (readme) {
        const viewer = require('./viewer');
        await viewer.viewReadme(repo, readme);
        await viewRepository(result);
      } else {
        console.log(chalk.yellow('\n  README not indexed yet\n'));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        await viewRepository(result);
      }
      break;

    case 'bookmark':
      await toggleBookmark(repo);
      await viewRepository(result);
      break;

    case 'list':
      const customLists = require('./custom-lists');
      await customLists.addToList(repo.id);
      await viewRepository(result);
      break;

    case 'browser':
      const { spawn } = require('child_process');
      spawn('xdg-open', [repo.url], { detached: true, stdio: 'ignore' });
      await viewRepository(result);
      break;

    case 'clone':
      const checkout = require('./checkout');
      await checkout.cloneRepository(repo.url);
      await viewRepository(result);
      break;

    case 'back':
      // Return to previous context
      break;
  }
}

// Toggle bookmark
async function toggleBookmark(repo) {
  const isBookmarked = db.isBookmarked(repo.id);

  if (isBookmarked) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Remove this bookmark?',
        default: false
      }
    ]);

    if (confirm) {
      db.removeBookmark(repo.id);
      console.log(chalk.yellow('\n  ✓ Bookmark removed\n'));
    }
  } else {
    const { notes, tags, categories } = await inquirer.prompt([
      {
        type: 'input',
        name: 'notes',
        message: 'Add notes (optional):',
        default: ''
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Add tags (comma-separated):',
        default: ''
      },
      {
        type: 'input',
        name: 'categories',
        message: 'Add categories (comma-separated):',
        default: ''
      }
    ]);

    db.addBookmark(repo.id, notes, tags, categories);
    console.log(chalk.green('\n  ✓ Bookmarked!\n'));
  }
}

module.exports = {
  interactiveSearch,
  quickSearch,
  performSearch,
  viewRepository
};
