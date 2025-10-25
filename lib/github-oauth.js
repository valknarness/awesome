const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { spawn } = require('child_process');
const { purpleGold, goldPink } = require('./banner');
const db = require('./db-operations');

// GitHub OAuth App credentials (you'll need to register the app)
// For now, using public client credentials pattern
const CLIENT_ID = 'Iv1.b507a08c87ecfe98'; // Example - you should register your own app

// Initiate OAuth device flow
async function authenticateWithGitHub() {
  console.clear();
  console.log(purpleGold('\n🔐 GITHUB AUTHENTICATION 🔐\n'));
  console.log(chalk.gray('Using GitHub OAuth Device Flow for secure authentication\n'));

  try {
    // Step 1: Request device and user codes
    console.log(chalk.hex('#FFD700')('  Step 1: Requesting authorization codes...\n'));

    const deviceResponse = await axios.post(
      'https://github.com/login/device/code',
      {
        client_id: CLIENT_ID,
        scope: 'public_repo'
      },
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const {
      device_code,
      user_code,
      verification_uri,
      expires_in,
      interval
    } = deviceResponse.data;

    // Step 2: Display user code and open browser
    console.log(chalk.hex('#DA22FF')('  Step 2: Complete authorization in your browser\n'));
    console.log(chalk.gray('━'.repeat(70)));
    console.log();
    console.log(chalk.hex('#FF69B4')('  Visit: ') + chalk.cyan(verification_uri));
    console.log(chalk.hex('#FFD700')('  Enter code: ') + chalk.bold.hex('#FFD700')(user_code));
    console.log();
    console.log(chalk.gray('━'.repeat(70)));
    console.log();

    const { openBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openBrowser',
        message: 'Open browser automatically?',
        default: true
      }
    ]);

    if (openBrowser) {
      spawn('xdg-open', [verification_uri], { detached: true, stdio: 'ignore' });
      console.log(chalk.green('\n  ✓ Browser opened!\n'));
    }

    console.log(chalk.hex('#9733EE')('  Waiting for authorization...'));
    console.log(chalk.gray(`  (Code expires in ${Math.floor(expires_in / 60)} minutes)\n`));

    // Step 3: Poll for access token
    const token = await pollForAccessToken(device_code, interval, expires_in);

    if (token) {
      // Save token
      db.setSetting('githubToken', token);
      db.setSetting('githubAuthMethod', 'oauth');

      console.log();
      console.log(goldPink('  ✨ Successfully authenticated! ✨\n'));
      console.log(chalk.green('  ✓ Your rate limit is now 5,000 requests/hour!\n'));

      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    }

    return false;

  } catch (error) {
    console.error(chalk.red('\n  ✗ Authentication failed:'), error.message);
    console.log();

    // Offer fallback to manual token
    const { fallback } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'fallback',
        message: 'Use manual token instead?',
        default: true
      }
    ]);

    if (fallback) {
      return await manualTokenInput();
    }

    return false;
  }
}

// Poll GitHub for access token
async function pollForAccessToken(deviceCode, interval, expiresIn) {
  const startTime = Date.now();
  const pollInterval = interval * 1000;

  while (Date.now() - startTime < expiresIn * 1000) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    try {
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: CLIENT_ID,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        },
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const { access_token, error } = response.data;

      if (access_token) {
        return access_token;
      }

      if (error === 'authorization_pending') {
        // Still waiting for user
        process.stdout.write(chalk.gray('.'));
        continue;
      }

      if (error === 'slow_down') {
        // GitHub asked us to slow down
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      if (error === 'expired_token') {
        console.log(chalk.red('\n  ✗ Code expired. Please try again.'));
        return null;
      }

      if (error === 'access_denied') {
        console.log(chalk.yellow('\n  ⚠️  Authorization denied by user.'));
        return null;
      }

    } catch (error) {
      // Continue polling on network errors
      continue;
    }
  }

  console.log(chalk.red('\n  ✗ Timeout waiting for authorization.'));
  return null;
}

// Fallback: Manual token input
async function manualTokenInput() {
  console.log();
  console.log(chalk.hex('#FFD700')('📝 Manual Token Setup\n'));
  console.log(chalk.gray('  1. Go to: https://github.com/settings/tokens'));
  console.log(chalk.gray('  2. Generate new token (classic)'));
  console.log(chalk.gray('  3. Select scope: public_repo'));
  console.log(chalk.gray('  4. Copy and paste the token below\n'));

  const { token, openUrl } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'openUrl',
      message: 'Open GitHub tokens page?',
      default: true
    },
    {
      type: 'password',
      name: 'token',
      message: 'Paste your token:',
      mask: '*',
      validate: input => {
        if (!input.trim()) {
          return 'Token is required';
        }
        if (!input.startsWith('ghp_') && !input.startsWith('github_pat_')) {
          return 'Invalid token format';
        }
        return true;
      }
    }
  ]);

  if (openUrl) {
    spawn('xdg-open', ['https://github.com/settings/tokens'], { detached: true, stdio: 'ignore' });
  }

  if (token && token.trim()) {
    db.setSetting('githubToken', token.trim());
    db.setSetting('githubAuthMethod', 'manual');
    console.log(chalk.green('\n  ✓ Token saved!\n'));
    return true;
  }

  return false;
}

// Check authentication status
function isAuthenticated() {
  const token = db.getSetting('githubToken', null);
  return token && token !== 'null';
}

// Get authentication method
function getAuthMethod() {
  return db.getSetting('githubAuthMethod', 'none');
}

// Revoke/logout
async function logout() {
  const method = getAuthMethod();

  console.log();
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Remove ${method === 'oauth' ? 'OAuth' : 'manually added'} token?`,
      default: false
    }
  ]);

  if (confirm) {
    db.setSetting('githubToken', 'null');
    db.setSetting('githubAuthMethod', 'none');
    console.log(chalk.green('\n  ✓ Token removed. Rate limit back to 60/hour.\n'));

    if (method === 'oauth') {
      console.log(chalk.gray('  Note: Token is revoked locally. For complete security,'));
      console.log(chalk.gray('  revoke at: https://github.com/settings/applications\n'));
    }
  }
}

module.exports = {
  authenticateWithGitHub,
  manualTokenInput,
  isAuthenticated,
  getAuthMethod,
  logout
};
