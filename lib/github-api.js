const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const db = require('./db-operations');

// Rate limiting
const RATE_LIMIT_DELAY = 100;
let lastRequestTime = 0;
let rateLimitWarningShown = false;
let lastRateLimitRecoveryTime = 0; // Track when we last recovered from rate limit

// Get GitHub token from settings
function getGitHubToken() {
  return db.getSetting('githubToken', null);
}

// Check rate limit status proactively
async function checkRateLimit() {
  const token = getGitHubToken();
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'awesome-cli'
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await axios.get('https://api.github.com/rate_limit', {
      timeout: 5000,
      headers
    });

    const core = response.data.resources.core;
    return {
      limit: core.limit,
      remaining: core.remaining,
      reset: core.reset * 1000,
      used: core.used
    };
  } catch (error) {
    // If we can't check rate limit, continue anyway
    return null;
  }
}

// Wait for rate limit to reset using polling
async function waitForRateLimitReset(targetResetTime) {
  const POLL_INTERVAL = 60000; // 60 seconds
  // In CI: use moderate threshold to balance efficiency and timeout constraints
  // Locally: use high threshold for better user experience (fewer interruptions)
  const MIN_REMAINING_TO_CONTINUE = process.env.CI === 'true' ? 1000 : 4500;
  const MAX_POLLS = 120; // Max 120 polls = 2 hours

  const estimatedWaitMinutes = Math.ceil(Math.max(0, targetResetTime - Date.now()) / 60000);

  console.log(chalk.cyan('\n🔄 Starting rate limit polling (checks every 60s)...'));
  console.log(chalk.gray(`   Estimated wait time: ~${estimatedWaitMinutes} minutes`));

  let pollCount = 0;

  while (true) {
    pollCount++;

    // Safety check: prevent infinite polling
    if (pollCount > MAX_POLLS) {
      console.log(chalk.red(`\n✗ Exceeded maximum poll count (${MAX_POLLS}). Rate limit may not be resetting properly.`));
      console.log(chalk.yellow('   This could indicate an issue with the GitHub token or API.'));
      throw new Error('Rate limit polling timeout');
    }

    // Wait before polling (except first time)
    if (pollCount > 1) {
      console.log(chalk.gray(`   Waiting 60 seconds before next check...`));
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    } else {
      // First poll: wait a short time to avoid immediate re-check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Check current rate limit status
    console.log(chalk.cyan(`   Poll #${pollCount}: Checking rate limit status...`));

    const status = await checkRateLimit();

    if (!status) {
      console.log(chalk.yellow('   ⚠️  Could not check rate limit, waiting 60s and retrying...'));
      continue;
    }

    const now = Date.now();
    const timeUntilReset = Math.max(0, status.reset - now);
    const minutesUntilReset = Math.ceil(timeUntilReset / 60000);

    console.log(chalk.gray(`   Limit: ${status.limit}/hour | Remaining: ${status.remaining} | Reset in: ${minutesUntilReset}m`));

    // Check if we have enough requests to continue
    if (status.remaining >= MIN_REMAINING_TO_CONTINUE) {
      console.log(chalk.green(`\n✓ Rate limit reset! ${status.remaining}/${status.limit} requests available.`));
      console.log(chalk.green(`   Resuming indexing...`));
      lastRateLimitRecoveryTime = Date.now(); // Mark recovery time
      return;
    }

    // Still waiting for threshold
    if (status.remaining === 0) {
      console.log(chalk.yellow(`   Still rate limited (0 remaining). Waiting for reset...`));
    } else {
      console.log(chalk.yellow(`   Only ${status.remaining}/${status.limit} available (need ${MIN_REMAINING_TO_CONTINUE}+). Will check again in 60s.`));
    }
  }
}

// Direct fetch for raw.githubusercontent.com (does NOT count against API rate limit)
async function fetchRawContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'awesome-cli'
      }
    });
    return response;
  } catch (error) {
    // Return null for 404s (file not found), throw for other errors
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
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
    const response = await axios.get(url, {
      timeout: 10000,
      headers,
      ...options
    });

    // Log successful requests after rate limit recovery (check if we recently polled)
    const isCI = process.env.CI === 'true';
    if (isCI && Math.random() < 0.01) { // 1% of requests in CI
      console.log(chalk.gray(`   ✓ Request successful`));
    }

    return response;
  } catch (error) {
    if (error.response?.status === 403) {
      const remaining = error.response.headers['x-ratelimit-remaining'];
      const resetTime = parseInt(error.response.headers['x-ratelimit-reset']) * 1000;
      const waitTime = Math.max(0, resetTime - Date.now());
      const waitMinutes = Math.ceil(waitTime / 60000);

      if (remaining === '0' || remaining === 0) {
        const rateLimit = error.response.headers['x-ratelimit-limit'];
        const resetDate = new Date(resetTime).toISOString();

        console.log();
        console.log(chalk.red('⚠️  GitHub API Rate Limit Exceeded!'));
        console.log(chalk.yellow(`   Rate limit: ${rateLimit} requests/hour`));
        console.log(chalk.yellow(`   Reset at: ${resetDate}`));
        console.log(chalk.yellow(`   Wait time: ${waitMinutes} minutes`));
        console.log(chalk.gray(`   Token status: ${token ? 'USING TOKEN ✓' : 'NO TOKEN ✗'}`));

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
          // Use polling approach instead of blind waiting
          await waitForRateLimitReset(resetTime);
          console.log(chalk.gray(`   → Retrying failed request: ${url.substring(0, 80)}...`));
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
      const response = await fetchRawContent(url);
      if (response && response.data) {
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
    const response = await fetchRawContent(
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
  rateLimitedRequest,
  fetchRawContent,
  getRateLimitStatus: checkRateLimit
};
