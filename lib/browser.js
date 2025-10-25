const inquirer = require('inquirer');
const chalk = require('chalk');
const { purpleGold, pinkPurple, sectionHeader } = require('./banner');
const github = require('./github-api');
const indexer = require('./indexer');
const db = require('./db-operations');

// Browse awesome lists
async function browse() {
  console.clear();
  sectionHeader('BROWSE AWESOME LISTS', '🌟');

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'What would you like to browse?',
      choices: [
        { name: chalk.hex('#DA22FF')('🌐 Fetch from GitHub (sindresorhus/awesome)'), value: 'github' },
        { name: chalk.hex('#FF69B4')('💾 Browse indexed lists'), value: 'indexed' },
        { name: chalk.gray('← Back'), value: 'back' }
      ]
    }
  ]);

  if (choice === 'github') {
    await browseFromGitHub();
  } else if (choice === 'indexed') {
    await browseIndexed();
  }
}

// Browse from GitHub
async function browseFromGitHub() {
  console.log(chalk.hex('#FFD700')('\n  Fetching awesome lists from GitHub...\n'));

  try {
    const markdown = await github.getAwesomeListsIndex();
    const lists = indexer.parseMarkdownLinks(markdown);

    // Group by category
    const byCategory = {};
    lists.forEach(list => {
      const cat = list.category || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(list);
    });

    // Let user select category
    const categories = Object.keys(byCategory).sort();
    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Select a category:',
        choices: categories.map(cat => ({
          name: `${chalk.hex('#DA22FF')(cat)} ${chalk.gray(`(${byCategory[cat].length} lists)`)}`,
          value: cat
        })),
        pageSize: 15
      }
    ]);

    // Let user select list
    const categoryLists = byCategory[category];
    const choices = categoryLists.map(list => ({
      name: `${chalk.hex('#FF69B4')(list.name)} ${chalk.gray('-')} ${list.description}`,
      value: list
    }));

    choices.push(new inquirer.Separator());
    choices.push({ name: chalk.gray('← Back'), value: null });

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select an awesome list:',
        choices: choices,
        pageSize: 15
      }
    ]);

    if (selected) {
      await viewList(selected);
    }
  } catch (error) {
    console.error(chalk.red('\nError fetching lists:'), error.message);
  }
}

// Browse indexed lists
async function browseIndexed() {
  const lists = db.getAllAwesomeLists();

  if (lists.length === 0) {
    console.log(chalk.yellow('\n  No lists indexed yet. Run "awesome index" first.\n'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    return;
  }

  const choices = lists.map(list => ({
    name: `${chalk.hex('#FF69B4')(list.name)} ${chalk.gray('-')} ${list.description || 'No description'}`,
    value: list
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.gray('← Back'), value: null });

  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Select a list to view:',
      choices: choices,
      pageSize: 15
    }
  ]);

  if (selected) {
    await viewIndexedList(selected);
  }
}

// View awesome list details
async function viewList(list) {
  console.clear();
  console.log(purpleGold(`\n✨ ${list.name} ✨\n`));
  console.log(chalk.gray('━'.repeat(70)));
  console.log(chalk.hex('#DA22FF')('  Category:    ') + chalk.hex('#FFD700')(list.category || 'Uncategorized'));
  console.log(chalk.hex('#FF69B4')('  URL:         ') + chalk.cyan(list.url));
  console.log(chalk.hex('#9733EE')('  Description: ') + (list.description || chalk.gray('No description')));
  console.log(chalk.gray('━'.repeat(70)));
  console.log();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: chalk.hex('#DA22FF')('📥 Index this list'), value: 'index' },
        { name: chalk.hex('#FF69B4')('🌐 Open in browser'), value: 'browser' },
        { name: chalk.gray('← Back'), value: 'back' }
      ]
    }
  ]);

  if (action === 'index') {
    await indexSingleList(list);
  } else if (action === 'browser') {
    const { spawn } = require('child_process');
    spawn('xdg-open', [list.url], { detached: true, stdio: 'ignore' });
    await viewList(list);
  }
}

// View indexed list
async function viewIndexedList(list) {
  const repos = db.getRepositoriesByList(list.id);

  console.clear();
  console.log(purpleGold(`\n✨ ${list.name} ✨\n`));
  console.log(chalk.gray('━'.repeat(70)));
  console.log(chalk.hex('#FFD700')(`  ${repos.length} repositories`));
  console.log(chalk.gray('━'.repeat(70)));
  console.log();

  if (repos.length === 0) {
    console.log(chalk.yellow('  No repositories indexed\n'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    return;
  }

  const choices = repos.slice(0, 50).map(repo => ({
    name: `${chalk.hex('#FF69B4')(repo.name)} ${chalk.gray(`(⭐ ${repo.stars || 0})`)}`,
    value: repo
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.gray('← Back'), value: null });

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
    const search = require('./search');
    await search.viewRepository({ repository_id: selected.id });
    await viewIndexedList(list);
  }
}

// Index a single list
async function indexSingleList(list) {
  console.log(chalk.hex('#FFD700')('\n  Indexing list...\n'));
  // This would trigger the indexer for just this list
  console.log(chalk.gray('  Use "awesome index" for full indexing\n'));
  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
}

module.exports = {
  browse,
  browseFromGitHub,
  browseIndexed
};
