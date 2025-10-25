const simpleGit = require('simple-git');
const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const { purpleGold, goldPink } = require('./banner');

// Clone repository
async function cloneRepository(repoUrl, targetDir) {
  console.clear();
  console.log(goldPink('\n📥 CLONE REPOSITORY 📥\n'));

  // Parse repo name from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (!match) {
    console.log(chalk.red('  Invalid GitHub URL\n'));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter...' }]);
    return;
  }

  const [, owner, repo] = match;
  const repoName = repo.replace(/\.git$/, '');

  // Determine target directory
  let directory = targetDir;
  if (!directory) {
    const { dir } = await inquirer.prompt([
      {
        type: 'input',
        name: 'dir',
        message: 'Clone to directory:',
        default: path.join(os.homedir(), 'Projects', repoName)
      }
    ]);
    directory = dir;
  }

  console.log(chalk.hex('#DA22FF')(`\n  Repository: ${owner}/${repoName}`));
  console.log(chalk.hex('#FF69B4')(`  Target:     ${directory}\n`));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Start cloning?',
      default: true
    }
  ]);

  if (!confirm) return;

  console.log(chalk.hex('#FFD700')('\n  Cloning repository...\n'));

  try {
    const git = simpleGit();
    await git.clone(repoUrl, directory, ['--progress']);

    console.log(chalk.green(`\n  ✓ Successfully cloned to ${directory}\n`));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: chalk.hex('#DA22FF')('📂 Open in file manager'), value: 'open' },
          { name: chalk.hex('#FF69B4')('📋 Copy path to clipboard'), value: 'copy' },
          { name: chalk.gray('← Back'), value: 'back' }
        ]
      }
    ]);

    if (action === 'open') {
      const { spawn } = require('child_process');
      spawn('xdg-open', [directory], { detached: true, stdio: 'ignore' });
    } else if (action === 'copy') {
      try {
        const { spawn } = require('child_process');
        const proc = spawn('xclip', ['-selection', 'clipboard']);
        proc.stdin.write(directory);
        proc.stdin.end();
        console.log(chalk.green('\n  ✓ Path copied to clipboard!\n'));
      } catch (error) {
        console.log(chalk.yellow('\n  Install xclip to use clipboard feature\n'));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error(chalk.red('\n  ✗ Clone failed:'), error.message, '\n');
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter...' }]);
  }
}

module.exports = {
  cloneRepository
};
