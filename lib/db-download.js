const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const { purpleGold, pinkPurple, goldPink, sectionHeader } = require('./banner');

const DB_DIR = path.join(os.homedir(), '.awesome');
const DB_FILE = path.join(DB_DIR, 'awesome.db');

// Check if GitHub CLI is installed
function checkGhCli() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check if authenticated with GitHub CLI
function checkGhAuth() {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Get repository from git remote
function getRepository() {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(\.git)?$/);
    if (match) {
      return match[1];
    }
  } catch {
    // Not a git repository or no remote
  }
  return null;
}

// Fetch workflow runs
async function fetchWorkflowRuns(repo, limit = 10) {
  try {
    const output = execSync(
      `gh api -H "Accept: application/vnd.github+json" "/repos/${repo}/actions/workflows/build-database.yml/runs?per_page=${limit}&status=success"`,
      { encoding: 'utf-8' }
    );
    const data = JSON.parse(output);
    return data.workflow_runs || [];
  } catch (error) {
    throw new Error(`Failed to fetch workflow runs: ${error.message}`);
  }
}

// Fetch artifacts for a run
async function fetchArtifacts(repo, runId) {
  try {
    const output = execSync(
      `gh api -H "Accept: application/vnd.github+json" "/repos/${repo}/actions/runs/${runId}/artifacts"`,
      { encoding: 'utf-8' }
    );
    const data = JSON.parse(output);
    return data.artifacts || [];
  } catch (error) {
    throw new Error(`Failed to fetch artifacts: ${error.message}`);
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format size
function formatSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

// List available databases
async function listDatabases(repo) {
  const spinner = ora(chalk.hex('#DA22FF')('Fetching available databases...')).start();

  try {
    const runs = await fetchWorkflowRuns(repo, 10);

    if (runs.length === 0) {
      spinner.fail(chalk.red('No database builds found'));
      return null;
    }

    // Fetch artifacts for each run
    const runsWithArtifacts = [];
    for (const run of runs) {
      const artifacts = await fetchArtifacts(repo, run.id);
      const dbArtifact = artifacts.find(a => a.name.startsWith('awesome-database'));

      if (dbArtifact) {
        runsWithArtifacts.push({
          runId: run.id,
          createdAt: run.created_at,
          sha: run.head_sha.substring(0, 7),
          artifact: dbArtifact
        });
      }
    }

    spinner.succeed(chalk.green(`Found ${runsWithArtifacts.length} available databases`));

    if (runsWithArtifacts.length === 0) {
      return null;
    }

    return runsWithArtifacts;
  } catch (error) {
    spinner.fail(chalk.red(error.message));
    return null;
  }
}

// Download and install database
async function downloadDatabase(repo, runId, artifactName) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'awesome-db-'));

  try {
    // Download artifact
    const spinner = ora(chalk.hex('#FF69B4')('Downloading database...')).start();

    const downloadProcess = spawn('gh', ['run', 'download', runId, '-R', repo, '-D', tempDir], {
      stdio: 'pipe'
    });

    await new Promise((resolve, reject) => {
      downloadProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Download failed with code ${code}`));
        }
      });
      downloadProcess.on('error', reject);
    });

    spinner.succeed(chalk.green('Downloaded successfully'));

    // Find database file
    const files = fs.readdirSync(tempDir, { recursive: true, withFileTypes: true });
    const dbFile = files.find(f => f.isFile() && f.name.endsWith('.db'));

    if (!dbFile) {
      throw new Error('Database file not found in artifact');
    }

    const dbPath = path.join(dbFile.path || tempDir, dbFile.name);

    // Backup existing database
    if (fs.existsSync(DB_FILE)) {
      const backupFile = `${DB_FILE}.backup.${Date.now()}`;
      console.log(chalk.yellow(`\n⚠️  Backing up existing database to:`));
      console.log(chalk.gray(`   ${backupFile}`));
      fs.copyFileSync(DB_FILE, backupFile);
    }

    // Create directory if needed
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // Copy database
    fs.copyFileSync(dbPath, DB_FILE);

    const size = fs.statSync(DB_FILE).size;
    console.log(chalk.green(`\n✓ Database installed successfully!`));
    console.log(chalk.gray(`  Location: ${DB_FILE}`));
    console.log(chalk.gray(`  Size: ${formatSize(size)}`));

    // Show metadata if available
    const metadataFile = files.find(f => f.isFile() && f.name === 'metadata.json');
    if (metadataFile) {
      const metadataPath = path.join(metadataFile.path || tempDir, metadataFile.name);
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      console.log(chalk.hex('#FFD700')('\n📊 Build Information:'));
      console.log(chalk.gray(`  Build Date: ${metadata.build_date}`));
      console.log(chalk.gray(`  Total Lists: ${metadata.total_lists}`));
      console.log(chalk.gray(`  Total Repos: ${metadata.total_repos}`));
      console.log(chalk.gray(`  Total READMEs: ${metadata.total_readmes}`));
      console.log(chalk.gray(`  Index Mode: ${metadata.index_mode}`));
    }
  } finally {
    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Main function
async function manage() {
  console.clear();
  sectionHeader('DATABASE DOWNLOADER', '💾');

  // Check prerequisites
  if (!checkGhCli()) {
    console.log(chalk.red('✗ GitHub CLI (gh) is not installed\n'));
    console.log(chalk.gray('Install from: https://cli.github.com/\n'));
    console.log(chalk.gray('Quick install:'));
    console.log(chalk.gray('  • macOS:   brew install gh'));
    console.log(chalk.gray('  • Ubuntu:  sudo apt install gh'));
    console.log(chalk.gray('  • Windows: winget install GitHub.cli\n'));
    return;
  }

  if (!checkGhAuth()) {
    console.log(chalk.yellow('⚠️  Not authenticated with GitHub CLI\n'));

    const { authenticate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'authenticate',
        message: 'Authenticate now?',
        default: true
      }
    ]);

    if (!authenticate) {
      console.log(chalk.gray('\nCancelled'));
      return;
    }

    try {
      execSync('gh auth login', { stdio: 'inherit' });
    } catch {
      console.log(chalk.red('\n✗ Authentication failed'));
      return;
    }

    console.log(chalk.green('\n✓ Authenticated successfully\n'));
  }

  // Get repository
  let repo = getRepository();

  if (!repo) {
    const { inputRepo } = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputRepo',
        message: purpleGold('Enter GitHub repository (owner/repo):'),
        validate: (input) => {
          if (!input.match(/^[^/]+\/[^/]+$/)) {
            return 'Please enter in format: owner/repo';
          }
          return true;
        }
      }
    ]);
    repo = inputRepo;
  } else {
    console.log(purpleGold(`Repository: ${repo}\n`));
  }

  // List databases
  const databases = await listDatabases(repo);

  if (!databases || databases.length === 0) {
    console.log(chalk.yellow('\n⚠️  No databases available for download'));
    console.log(chalk.gray('   Database builds are created by GitHub Actions'));
    console.log(chalk.gray('   Check the Actions tab in your repository\n'));
    return;
  }

  // Show table
  console.log(chalk.hex('#DA22FF')('\nAvailable Databases:\n'));

  const Table = require('cli-table3');
  const table = new Table({
    head: [
      chalk.hex('#DA22FF')('#'),
      chalk.hex('#DA22FF')('Build Date'),
      chalk.hex('#DA22FF')('Commit'),
      chalk.hex('#DA22FF')('Size')
    ],
    colWidths: [5, 25, 12, 12],
    style: {
      head: [],
      border: ['gray']
    }
  });

  databases.forEach((db, idx) => {
    table.push([
      chalk.gray(idx + 1),
      chalk.hex('#FF69B4')(formatDate(db.createdAt)),
      chalk.hex('#FFD700')(db.sha),
      chalk.hex('#9733EE')(formatSize(db.artifact.size_in_bytes))
    ]);
  });

  console.log(table.toString());

  // Select database
  const choices = [
    ...databases.map((db, idx) => ({
      name: `${idx + 1}. ${formatDate(db.createdAt)} (${db.sha}) - ${formatSize(db.artifact.size_in_bytes)}`,
      value: idx
    })),
    new inquirer.Separator(),
    { name: chalk.gray('← Cancel'), value: -1 }
  ];

  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: 'Select a database to download:',
      choices: choices,
      pageSize: 12
    }
  ]);

  if (selection === -1) {
    console.log(chalk.gray('\nCancelled'));
    return;
  }

  const selectedDb = databases[selection];

  // Confirm download
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Download database from ${formatDate(selectedDb.createdAt)}?`,
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.gray('\nCancelled'));
    return;
  }

  // Download and install
  await downloadDatabase(repo, selectedDb.runId, selectedDb.artifact.name);

  console.log(chalk.hex('#FFD700')('\n🎉 Ready to use!'));
  console.log(chalk.gray('   Run: ./awesome\n'));
}

module.exports = {
  manage
};
