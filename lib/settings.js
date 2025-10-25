const inquirer = require('inquirer');
const chalk = require('chalk');
const { purpleGold, sectionHeader } = require('./banner');
const db = require('./db-operations');

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'purple-gold',
  pageSize: 15,
  rateLimitDelay: 100,
  autoOpenBrowser: false,
  defaultBadgeStyle: 'flat',
  defaultBadgeColor: 'blueviolet',
  githubToken: null
};

// Manage settings
async function manage() {
  console.clear();
  sectionHeader('SETTINGS', '⚙️');

  // Load current settings
  const currentSettings = {};
  Object.keys(DEFAULT_SETTINGS).forEach(key => {
    currentSettings[key] = db.getSetting(key, DEFAULT_SETTINGS[key]);
  });

  console.log(chalk.hex('#DA22FF')('  Current Settings:\n'));
  console.log(chalk.gray('━'.repeat(70)));
  Object.entries(currentSettings).forEach(([key, value]) => {
    let displayValue = value;
    // Mask GitHub token
    if (key === 'githubToken' && value && value !== 'null') {
      displayValue = '***' + value.slice(-4);
    }
    console.log(`  ${chalk.hex('#FF69B4')(key.padEnd(20))} ${chalk.hex('#FFD700')(displayValue || chalk.gray('not set'))}`);
  });
  console.log(chalk.gray('━'.repeat(70)));
  console.log();

  const oauth = require('./github-oauth');
  const isAuthenticated = oauth.isAuthenticated();
  const authMethod = oauth.getAuthMethod();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {
          name: isAuthenticated
            ? chalk.hex('#DA22FF')(`🔐 GitHub Auth (${authMethod === 'oauth' ? 'OAuth' : 'Manual'}) - Logout`)
            : chalk.hex('#DA22FF')('🔐 GitHub Authentication (5000 req/hour!)'),
          value: 'auth'
        },
        { name: chalk.hex('#FF69B4')('✏️  Edit settings'), value: 'edit' },
        { name: chalk.hex('#FFD700')('🔄 Reset to defaults'), value: 'reset' },
        { name: chalk.hex('#9733EE')('📊 Database info'), value: 'info' },
        { name: chalk.gray('← Back'), value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'auth':
      if (isAuthenticated) {
        await oauth.logout();
      } else {
        const { method } = await inquirer.prompt([
          {
            type: 'list',
            name: 'method',
            message: 'Choose authentication method:',
            choices: [
              { name: chalk.hex('#DA22FF')('🚀 OAuth (Recommended - Easy & Secure)'), value: 'oauth' },
              { name: chalk.hex('#FF69B4')('📝 Manual Token (Traditional)'), value: 'manual' }
            ]
          }
        ]);

        if (method === 'oauth') {
          await oauth.authenticateWithGitHub();
        } else {
          await oauth.manualTokenInput();
        }
      }
      await manage();
      break;

    case 'edit':
      await editSettings(currentSettings);
      await manage();
      break;

    case 'reset':
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Reset all settings to defaults?',
          default: false
        }
      ]);

      if (confirm) {
        Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
          db.setSetting(key, value);
        });
        console.log(chalk.green('\n  ✓ Settings reset to defaults\n'));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      await manage();
      break;

    case 'info':
      await showDatabaseInfo();
      await manage();
      break;

    case 'back':
      break;
  }
}

// Edit settings
async function editSettings(currentSettings) {
  console.log();
  console.log(chalk.gray('  Use "GitHub Authentication" option for rate limit increase'));
  console.log();

  const { pageSize, rateLimitDelay, autoOpenBrowser, defaultBadgeStyle, defaultBadgeColor } = await inquirer.prompt([
    {
      type: 'number',
      name: 'pageSize',
      message: 'Page size (items per page):',
      default: parseInt(currentSettings.pageSize),
      validate: input => input > 0 && input <= 50 ? true : 'Must be between 1 and 50'
    },
    {
      type: 'number',
      name: 'rateLimitDelay',
      message: 'Rate limit delay (ms):',
      default: parseInt(currentSettings.rateLimitDelay),
      validate: input => input >= 0 && input <= 5000 ? true : 'Must be between 0 and 5000'
    },
    {
      type: 'confirm',
      name: 'autoOpenBrowser',
      message: 'Auto-open browser for links?',
      default: currentSettings.autoOpenBrowser === 'true'
    },
    {
      type: 'list',
      name: 'defaultBadgeStyle',
      message: 'Default badge style:',
      choices: ['flat', 'flat-square', 'plastic', 'for-the-badge'],
      default: currentSettings.defaultBadgeStyle
    },
    {
      type: 'list',
      name: 'defaultBadgeColor',
      message: 'Default badge color:',
      choices: ['blueviolet', 'ff69b4', 'FFD700', 'informational', 'success'],
      default: currentSettings.defaultBadgeColor
    }
  ]);

  db.setSetting('pageSize', pageSize.toString());
  db.setSetting('rateLimitDelay', rateLimitDelay.toString());
  db.setSetting('autoOpenBrowser', autoOpenBrowser.toString());
  db.setSetting('defaultBadgeStyle', defaultBadgeStyle);
  db.setSetting('defaultBadgeColor', defaultBadgeColor);

  console.log(chalk.green('\n  ✓ Settings saved!\n'));
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Show database information
async function showDatabaseInfo() {
  const fs = require('fs');
  const { DB_PATH } = require('./database');

  console.clear();
  sectionHeader('DATABASE INFO', '💾');

  try {
    const stats = fs.statSync(DB_PATH);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(chalk.hex('#DA22FF')('  Location: ') + chalk.gray(DB_PATH));
    console.log(chalk.hex('#FF69B4')('  Size:     ') + chalk.hex('#FFD700')(`${sizeInMB} MB`));
    console.log(chalk.hex('#9733EE')('  Modified: ') + chalk.gray(stats.mtime.toLocaleString()));
    console.log();
  } catch (error) {
    console.log(chalk.yellow('  Database not found or inaccessible\n'));
  }

  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...'
    }
  ]);
}

module.exports = {
  manage,
  editSettings,
  DEFAULT_SETTINGS
};
