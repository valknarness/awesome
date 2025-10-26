const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const db = require('./db-operations');

// Rate limiting
const RATE_LIMIT_DELAY = 100;
let lastRequestTime = 0;
let rateLimitWarningShown = false;

// Get GitHub token from settings
function getGitHubToken() {
  return db.getSetting('githubToken', null);
}

// Rate-limited request with better handling
async function rateLimitedRequest(url, options = {}) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();

  const token = getGitHubToken();
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'awesome-cli',
    ...options.headers
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    return await axios.get(url, {
      timeout: 10000,
      headers,
      ...options
    });
  } catch (error) {
    if (error.response?.status === 403) {
      const remaining = error.response.headers['x-ratelimit-remaining'];
      const resetTime = parseInt(error.response.headers['x-ratelimit-reset']) * 1000;
      const waitTime = Math.max(0, resetTime - Date.now());
      const waitMinutes = Math.ceil(waitTime / 60000);

      if (remaining === '0' || remaining === 0) {
        console.log();
        console.log(chalk.red('⚠️  GitHub API Rate Limit Exceeded!'));
        console.log(chalk.yellow(`   Wait time: ${waitMinutes} minutes`));

        if (!token && !rateLimitWarningShown) {
          console.log();
          console.log(chalk.hex('#FFD700')('💡 TIP: Add a GitHub Personal Access Token to increase limit from 60/hour to 5000/hour!'));
          console.log(chalk.gray('   1. Go to: https://github.com/settings/tokens'));
          console.log(chalk.gray('   2. Generate new token (classic) with "public_repo" scope'));
          console.log(chalk.gray('   3. Run: awesome settings → Add GitHub token'));
          rateLimitWarningShown = true;
        }

        console.log();

        // In CI mode, automatically wait instead of prompting
        const isCI = process.env.CI === 'true';
        let action = 'wait';

        if (!isCI) {
          // Ask user what to do
          const response = await inquirer.prompt([
            {
              type: 'list',
              name: 'action',
              message: 'What would you like to do?',
              choices: [
                { name: `Wait ${waitMinutes} minutes and continue`, value: 'wait' },
                { name: 'Skip remaining items and continue with what we have', value: 'skip' },
                { name: 'Abort indexing', value: 'abort' }
              ]
            }
          ]);
          action = response.action;
        } else {
          console.log(chalk.cyan('🤖 CI mode detected: automatically waiting...'));
        }

        if (action === 'abort') {
          throw new Error('Indexing aborted by user');
        } else if (action === 'skip') {
          throw new Error('SKIP_RATE_LIMIT'); // Special error to skip
        } else {
          // Wait with countdown
          console.log(chalk.gray(`\nWaiting ${waitMinutes} minutes...`));
          await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
          return rateLimitedRequest(url, options);
        }
      }
    }
    throw error;
  }
}

// Extract owner and repo from GitHub URL
function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

// Get repository information
async function getRepoInfo(repoUrl) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return null;

  try {
    const response = await rateLimitedRequest(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`
    );

    return {
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      stars: response.data.stargazers_count,
      forks: response.data.forks_count,
      watchers: response.data.watchers_count,
      language: response.data.language,
      topics: response.data.topics || [],
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      pushedAt: response.data.pushed_at,
      homepage: response.data.homepage,
      license: response.data.license?.name
    };
  } catch (error) {
    // Silently skip 404s (deleted/moved repos) - don't clutter output
    if (error.response?.status === 404) {
      return null;
    }
    // Only log non-404 errors
    console.error(chalk.red(`Failed to fetch ${parsed.owner}/${parsed.repo}:`), error.message);
    return null;
  }
}

// Get README content
async function getReadme(repoUrl) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return null;

  // Try different README URLs
  const urls = [
    `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/main/README.md`,
    `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/master/README.md`,
    `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/main/readme.md`,
    `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/master/readme.md`,
    `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/main/Readme.md`,
    `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/master/Readme.md`
  ];

  for (const url of urls) {
    try {
      const response = await rateLimitedRequest(url);
      if (response.data) {
        return {
          content: response.data,
          url: url
        };
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

// Get commits information
async function getLatestCommit(repoUrl) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return null;

  try {
    const response = await rateLimitedRequest(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=1`
    );

    if (response.data && response.data.length > 0) {
      const commit = response.data[0];
      return {
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date
      };
    }
  } catch (error) {
    return null;
  }

  return null;
}

// Get list of awesome lists from main awesome repo
async function getAwesomeListsIndex() {
  try {
    const response = await rateLimitedRequest(
      'https://raw.githubusercontent.com/sindresorhus/awesome/main/readme.md'
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch awesome lists index: ' + error.message);
  }
}

module.exports = {
  getRepoInfo,
  getReadme,
  getLatestCommit,
  getAwesomeListsIndex,
  parseGitHubUrl,
  rateLimitedRequest
};
