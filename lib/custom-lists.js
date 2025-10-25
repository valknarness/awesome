const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { purpleGold, goldPink, sectionHeader } = require('./banner');
const { getDb } = require('./database');

// Manage custom lists
async function manage() {
  console.clear();
  sectionHeader('MY CUSTOM LISTS', '📝');

  const db = getDb();
  const lists = db.prepare('SELECT * FROM custom_lists ORDER BY updated_at DESC').all();

  if (lists.length === 0) {
    console.log(chalk.yellow('  No custom lists yet. Create your first awesome list!\n'));
  } else {
    console.log(chalk.hex('#FFD700')(`  ${lists.length} custom lists\n`));

    lists.forEach((list, idx) => {
      const items = db.prepare('SELECT COUNT(*) as count FROM custom_list_items WHERE custom_list_id = ?').get(list.id);
      console.log(`  ${chalk.gray((idx + 1) + '.')} ${list.icon} ${chalk.hex('#FF69B4')(list.title)} ${chalk.gray(`(${items.count} items)`)}`);
      if (list.description) {
        console.log(`     ${chalk.gray(list.description)}`);
      }
    });
    console.log();
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: chalk.hex('#DA22FF')('➕ Create new list'), value: 'create' },
        ...(lists.length > 0 ? [
          { name: chalk.hex('#FF69B4')('📋 View/Edit list'), value: 'view' },
          { name: chalk.hex('#FFD700')('💾 Export list'), value: 'export' }
        ] : []),
        { name: chalk.gray('← Back'), value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'create':
      await createList();
      await manage();
      break;

    case 'view':
      const { selectedList } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedList',
          message: 'Select a list:',
          choices: lists.map(list => ({
            name: `${list.icon} ${list.title}`,
            value: list
          }))
        }
      ]);
      await viewList(selectedList);
      await manage();
      break;

    case 'export':
      const { listToExport } = await inquirer.prompt([
        {
          type: 'list',
          name: 'listToExport',
          message: 'Select a list to export:',
          choices: lists.map(list => ({
            name: `${list.icon} ${list.title}`,
            value: list
          }))
        }
      ]);
      await exportList(listToExport);
      await manage();
      break;

    case 'back':
      break;
  }
}

// Create new custom list
async function createList() {
  const { title, description, author, icon, badgeStyle, badgeColor } = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'List title:',
      validate: input => input.trim() ? true : 'Title is required'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: ''
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name:',
      default: os.userInfo().username
    },
    {
      type: 'input',
      name: 'icon',
      message: 'Icon (emoji):',
      default: '📚'
    },
    {
      type: 'list',
      name: 'badgeStyle',
      message: 'Badge style:',
      choices: [
        { name: 'Flat', value: 'flat' },
        { name: 'Flat Square', value: 'flat-square' },
        { name: 'Plastic', value: 'plastic' },
        { name: 'For the Badge', value: 'for-the-badge' }
      ],
      default: 'flat'
    },
    {
      type: 'list',
      name: 'badgeColor',
      message: 'Badge color:',
      choices: [
        { name: 'Purple', value: 'blueviolet' },
        { name: 'Pink', value: 'ff69b4' },
        { name: 'Gold', value: 'FFD700' },
        { name: 'Blue', value: 'informational' },
        { name: 'Green', value: 'success' }
      ],
      default: 'blueviolet'
    }
  ]);

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO custom_lists (title, description, author, icon, badge_style, badge_color)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(title, description, author, icon, badgeStyle, badgeColor);
  console.log(chalk.green('\n  ✓ Custom list created!\n'));
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// View/edit custom list
async function viewList(list) {
  const db = getDb();
  const items = db.prepare(`
    SELECT cli.*, r.name, r.url, r.description, r.stars
    FROM custom_list_items cli
    JOIN repositories r ON r.id = cli.repository_id
    WHERE cli.custom_list_id = ?
    ORDER BY cli.order_index, cli.added_at
  `).all(list.id);

  console.clear();
  console.log(purpleGold(`\n${list.icon} ${list.title}\n`));
  console.log(chalk.gray('━'.repeat(70)));
  if (list.description) console.log(chalk.gray(list.description));
  if (list.author) console.log(chalk.gray(`By ${list.author}`));
  console.log(chalk.gray('━'.repeat(70)));
  console.log(chalk.hex('#FFD700')(`\n  ${items.length} items\n`));

  if (items.length > 0) {
    items.forEach((item, idx) => {
      console.log(`  ${chalk.gray((idx + 1) + '.')} ${chalk.hex('#FF69B4')(item.name)} ${chalk.gray(`(⭐ ${item.stars || 0})`)}`);
      if (item.notes) {
        console.log(`     ${chalk.gray(item.notes)}`);
      }
    });
    console.log();
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: chalk.hex('#DA22FF')('➕ Add item'), value: 'add' },
        ...(items.length > 0 ? [{ name: chalk.hex('#FF69B4')('🗑️  Remove item'), value: 'remove' }] : []),
        { name: chalk.hex('#FFD700')('💾 Export'), value: 'export' },
        { name: chalk.hex('#9733EE')('🗑️  Delete list'), value: 'delete' },
        { name: chalk.gray('← Back'), value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'add':
      await addToList(list.id);
      await viewList(list);
      break;

    case 'remove':
      const { itemToRemove } = await inquirer.prompt([
        {
          type: 'list',
          name: 'itemToRemove',
          message: 'Select item to remove:',
          choices: items.map(item => ({
            name: item.name,
            value: item
          }))
        }
      ]);

      const removeStmt = db.prepare('DELETE FROM custom_list_items WHERE id = ?');
      removeStmt.run(itemToRemove.id);
      console.log(chalk.green('\n  ✓ Item removed\n'));
      await new Promise(resolve => setTimeout(resolve, 1000));
      await viewList(list);
      break;

    case 'export':
      await exportList(list);
      await viewList(list);
      break;

    case 'delete':
      const { confirmDelete } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDelete',
          message: 'Delete this list?',
          default: false
        }
      ]);

      if (confirmDelete) {
        const deleteStmt = db.prepare('DELETE FROM custom_lists WHERE id = ?');
        deleteStmt.run(list.id);
        console.log(chalk.green('\n  ✓ List deleted\n'));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      break;

    case 'back':
      break;
  }
}

// Add repository to custom list
async function addToList(customListId) {
  const dbOps = require('./db-operations');
  const bookmarks = dbOps.getBookmarks();

  if (bookmarks.length === 0) {
    console.log(chalk.yellow('\n  No bookmarks to add. Bookmark some repositories first!\n'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter...' }]);
    return;
  }

  const { selectedRepo } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedRepo',
      message: 'Select a repository:',
      choices: bookmarks.map(bookmark => ({
        name: `${bookmark.name} ${chalk.gray(`(⭐ ${bookmark.stars || 0})`)}`,
        value: bookmark
      })),
      pageSize: 15
    }
  ]);

  const { notes } = await inquirer.prompt([
    {
      type: 'input',
      name: 'notes',
      message: 'Notes (optional):',
      default: ''
    }
  ]);

  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO custom_list_items (custom_list_id, repository_id, notes)
    VALUES (?, ?, ?)
  `);

  stmt.run(customListId, selectedRepo.repository_id, notes);
  console.log(chalk.green('\n  ✓ Added to list!\n'));
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Export custom list
async function exportList(list) {
  const { format } = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: 'Export format:',
      choices: [
        { name: 'Markdown (.md)', value: 'markdown' },
        { name: 'JSON (.json)', value: 'json' },
        { name: chalk.gray('PDF (not yet implemented)'), value: 'pdf', disabled: true },
        { name: chalk.gray('EPUB (not yet implemented)'), value: 'epub', disabled: true }
      ]
    }
  ]);

  const db = getDb();
  const items = db.prepare(`
    SELECT cli.*, r.name, r.url, r.description, r.stars, r.language
    FROM custom_list_items cli
    JOIN repositories r ON r.id = cli.repository_id
    WHERE cli.custom_list_id = ?
    ORDER BY cli.order_index, cli.added_at
  `).all(list.id);

  const defaultPath = path.join(os.homedir(), 'Downloads', `${list.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${format === 'markdown' ? 'md' : format}`);

  const { outputPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'outputPath',
      message: 'Output path:',
      default: defaultPath
    }
  ]);

  if (format === 'markdown') {
    await exportMarkdown(list, items, outputPath);
  } else if (format === 'json') {
    await exportJSON(list, items, outputPath);
  }

  console.log(chalk.green(`\n  ✓ Exported to: ${outputPath}\n`));
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Export as Markdown
async function exportMarkdown(list, items, outputPath) {
  const badgeUrl = `https://img.shields.io/badge/awesome-list-${list.badge_color}?style=${list.badge_style}`;

  let content = `# ${list.icon} ${list.title}\n\n`;
  content += `![Awesome](${badgeUrl})\n\n`;

  if (list.description) {
    content += `> ${list.description}\n\n`;
  }

  if (list.author) {
    content += `**Author:** ${list.author}\n\n`;
  }

  content += `## Contents\n\n`;

  items.forEach(item => {
    content += `### [${item.name}](${item.url})`;
    if (item.stars) {
      content += ` ![Stars](https://img.shields.io/badge/⭐-${item.stars}-yellow)`;
    }
    if (item.language) {
      content += ` ![Language](https://img.shields.io/badge/lang-${item.language}-blue)`;
    }
    content += `\n\n`;

    if (item.description) {
      content += `${item.description}\n\n`;
    }

    if (item.notes) {
      content += `*${item.notes}*\n\n`;
    }
  });

  content += `\n---\n\n`;
  content += `*Generated with [Awesome CLI](https://github.com/yourusername/awesome) 💜*\n`;

  fs.writeFileSync(outputPath, content, 'utf8');
}

// Export as JSON
async function exportJSON(list, items, outputPath) {
  const data = {
    title: list.title,
    description: list.description,
    author: list.author,
    icon: list.icon,
    createdAt: list.created_at,
    updatedAt: list.updated_at,
    items: items.map(item => ({
      name: item.name,
      url: item.url,
      description: item.description,
      stars: item.stars,
      language: item.language,
      notes: item.notes
    }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  manage,
  createList,
  viewList,
  addToList,
  exportList
};
