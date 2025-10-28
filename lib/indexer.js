const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { nanospinner } = require('nanospinner');
const cliProgress = require('cli-progress');
const { purpleGold, pinkPurple, goldPink, sectionHeader } = require('./banner');
const github = require('./github-api');
const db = require('./db-operations');

// Parse markdown to extract links
function parseMarkdownLinks(markdown) {
  const lines = markdown.split('\n');
  const links = [];
  let currentCategory = null;

  for (const line of lines) {
    // Category headers (## Category Name)
    const categoryMatch = line.match(/^##\s+(.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // List items: - [Name](url) - Description
    const linkMatch = line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s+-\s+(.+))?/);
    if (linkMatch) {
      const [, name, url, description] = linkMatch;

      // Only GitHub URLs
      if (url.includes('github.com')) {
        links.push({
          name: name.trim(),
          url: url.trim(),
          description: description ? description.trim() : '',
          category: currentCategory
        });
      }
    }
  }

  return links;
}

// Extract text content from markdown
function extractTextContent(markdown) {
  let text = markdown;

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]+`/g, '');

  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Remove markdown headers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove horizontal rules
  text = text.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '');

  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

// Check if URL is an awesome list (not a regular project)
function isAwesomeList(url, name, description) {
  const lowerName = name.toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  const urlLower = url.toLowerCase();

  return (
    lowerName.includes('awesome') ||
    lowerDesc.includes('curated list') ||
    lowerDesc.includes('awesome list') ||
    urlLower.includes('/awesome-')
  );
}

// Build the complete index
async function buildIndex(force = false, mode = null) {
  console.clear();
  console.log(purpleGold('\n🚀 AWESOME INDEX BUILDER 🚀\n'));

  // Check if running in CI/non-interactive mode
  const isNonInteractive = process.env.CI === 'true' || mode !== null;

  if (force) {
    if (isNonInteractive) {
      // Clear index data without confirmation in CI
      console.log(chalk.gray('\nClearing existing index...'));
      const dbInstance = require('./database').getDb();
      dbInstance.exec('DELETE FROM readmes');
      dbInstance.exec('DELETE FROM repositories');
      dbInstance.exec('DELETE FROM awesome_lists');
      console.log(chalk.green('✓ Index cleared\n'));
    } else {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.yellow('⚠️  Force rebuild will clear all indexed data (bookmarks will be preserved). Continue?'),
          default: false
        }
      ]);

      if (!confirm) return;

      // Clear index data (keep bookmarks)
      console.log(chalk.gray('\nClearing existing index...'));
      const dbInstance = require('./database').getDb();
      dbInstance.exec('DELETE FROM readmes');
      dbInstance.exec('DELETE FROM repositories');
      dbInstance.exec('DELETE FROM awesome_lists');
      console.log(chalk.green('✓ Index cleared\n'));
    }
  }

  // Fetch main awesome list
  const spinner = ora(chalk.hex('#DA22FF')('Fetching the awesome list of awesome lists...')).start();

  let mainReadme;
  try {
    mainReadme = await github.getAwesomeListsIndex();
    spinner.succeed(chalk.green('✓ Fetched main awesome index!'));
  } catch (error) {
    spinner.fail(chalk.red('✗ Failed to fetch main index'));
    console.error(chalk.red(error.message));
    throw error; // Throw instead of return so CI fails properly
  }

  // Parse links from main index
  console.log(chalk.hex('#FF69B4')('\n📝 Parsing awesome lists...'));
  const awesomeLists = parseMarkdownLinks(mainReadme);
  console.log(chalk.green(`✓ Found ${awesomeLists.length} awesome lists!\n`));

  let indexChoice = mode;

  // Ask user what to index (only if interactive)
  if (!isNonInteractive) {
    const result = await inquirer.prompt([
      {
        type: 'list',
        name: 'indexChoice',
        message: 'What would you like to index?',
        choices: [
          { name: '🎯 Index everything (recommended for first run)', value: 'full' },
          { name: '📋 Index lists only (metadata, no READMEs)', value: 'lists' },
          { name: '🎲 Index a random sample (10 lists)', value: 'sample' },
          { name: '🔍 Select specific categories', value: 'select' },
          { name: '← Back', value: 'cancel' }
        ]
      }
    ]);
    indexChoice = result.indexChoice;
  }

  if (indexChoice === 'cancel') return;

  // Default to 'full' if no mode specified
  if (!indexChoice) indexChoice = 'full';

  console.log(chalk.cyan(`Index mode: ${indexChoice}\n`));

  let listsToIndex = awesomeLists;

  if (indexChoice === 'sample') {
    listsToIndex = awesomeLists.sort(() => 0.5 - Math.random()).slice(0, 10);
  } else if (indexChoice === 'select') {
    if (isNonInteractive) {
      console.log(chalk.yellow('Select mode not available in non-interactive mode, using full'));
      indexChoice = 'full';
    } else {
      const categories = [...new Set(awesomeLists.map(l => l.category).filter(Boolean))];
      const { selectedCategories } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedCategories',
          message: 'Select categories to index:',
          choices: categories,
          pageSize: 15
        }
      ]);

      if (selectedCategories.length === 0) {
        console.log(chalk.yellow('No categories selected'));
        return;
      }

      listsToIndex = awesomeLists.filter(l => selectedCategories.includes(l.category));
    }
  }

  // Check rate limit status before starting
  try {
    const rateLimitInfo = await github.getRateLimitStatus();
    if (rateLimitInfo) {
      console.log(chalk.cyan('📊 GitHub API Rate Limit Status:'));
      console.log(chalk.gray(`   Limit: ${rateLimitInfo.limit} requests/hour`));
      console.log(chalk.gray(`   Remaining: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}`));
      console.log(chalk.gray(`   Used: ${rateLimitInfo.used}`));
      console.log(chalk.gray(`   Resets at: ${new Date(rateLimitInfo.reset).toISOString()}`));
      console.log();

      if (rateLimitInfo.limit === 60) {
        console.log(chalk.yellow('⚠️  WARNING: Using unauthenticated rate limit (60/hour)'));
        console.log(chalk.yellow('   This will likely not be enough to complete indexing'));
        console.log();
      }
    }
  } catch (error) {
    console.log(chalk.gray('Could not check rate limit status, continuing...'));
  }

  console.log(pinkPurple(`\n✨ Starting index of ${listsToIndex.length} awesome lists ✨\n`));

  // Progress bars
  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: ' {bar} | {percentage}% | {value}/{total} | {name}'
  }, cliProgress.Presets.shades_classic);

  const listBar = multibar.create(listsToIndex.length, 0, { name: 'Lists' });
  const repoBar = multibar.create(100, 0, { name: 'Repos' });

  let totalRepos = 0;
  let indexedRepos = 0;
  let indexedReadmes = 0;
  let skipped404s = 0;

  // Index each awesome list
  for (let i = 0; i < listsToIndex.length; i++) {
    const list = listsToIndex[i];
    listBar.update(i + 1, { name: `Lists: ${list.name.substring(0, 30)}` });

    try {
      // Add list to database
      const listId = db.addAwesomeList(list.name, list.url, list.description, list.category, 1, null);

      // Fetch list README
      const readme = await github.getReadme(list.url);
      if (!readme) continue;

      // Parse repositories from the list
      const repos = parseMarkdownLinks(readme.content);
      totalRepos += repos.length;
      repoBar.setTotal(totalRepos);

      // Index repositories
      for (const repo of repos) {
        try {
          // Check if repo already exists (incremental indexing)
          const existingRepo = db.getRepositoryByUrl(repo.url);

          // Get repo info from GitHub
          const repoInfo = await github.getRepoInfo(repo.url);

          if (repoInfo) {
            const repoId = db.addRepository(listId, repoInfo.name, repo.url, repo.description || repoInfo.description, repoInfo);
            indexedRepos++;

            // Determine if we need to fetch README
            let shouldFetchReadme = false;
            if (indexChoice === 'full' || indexChoice === 'sample') {
              if (!existingRepo) {
                // New repo - fetch README
                shouldFetchReadme = true;
              } else if (existingRepo.last_commit !== repoInfo.pushedAt) {
                // Repo updated since last index - fetch README
                shouldFetchReadme = true;
              }
              // else: repo unchanged, skip README fetch
            }

            if (shouldFetchReadme) {
              const repoReadme = await github.getReadme(repo.url);
              if (repoReadme) {
                const textContent = extractTextContent(repoReadme.content);
                db.addReadme(repoId, textContent, repoReadme.content);
                indexedReadmes++;
              }
            }
          } else {
            // Repo returned null (likely 404 - deleted/moved)
            skipped404s++;
          }

          repoBar.update(indexedRepos, { name: `Repos: ${repo.name.substring(0, 30)}` });
        } catch (error) {
          // Handle rate limit skip
          if (error.message === 'SKIP_RATE_LIMIT') {
            console.log(chalk.yellow('\n⚠️  Skipping remaining items due to rate limit...'));
            break; // Exit repo loop
          }
          // Skip failed repos
          continue;
        }
      }
    } catch (error) {
      // Skip failed lists
      continue;
    }
  }

  multibar.stop();

  // Summary
  console.log(goldPink('\n\n✨ INDEX BUILD COMPLETE! ✨\n'));
  console.log(chalk.hex('#DA22FF')('📊 Summary:'));
  console.log(chalk.gray('━'.repeat(50)));
  console.log(chalk.hex('#FF69B4')(`  Awesome Lists: ${chalk.bold(listsToIndex.length)}`));
  console.log(chalk.hex('#FFD700')(`  Repositories:  ${chalk.bold(indexedRepos)}`));
  console.log(chalk.hex('#DA22FF')(`  READMEs:       ${chalk.bold(indexedReadmes)}`));
  if (skipped404s > 0) {
    console.log(chalk.hex('#9733EE')(`  Skipped (404): ${chalk.bold(skipped404s)} ${chalk.gray('(deleted/moved repos)')}`));
  }
  console.log(chalk.gray('━'.repeat(50)));
  console.log();

  const stats = db.getStats();
  console.log(chalk.hex('#FF69B4')('🗄️  Total in Database:'));
  console.log(chalk.gray(`   Lists: ${stats.awesomeLists} | Repos: ${stats.repositories} | READMEs: ${stats.readmes}`));
  console.log();

  console.log(chalk.green('✓ You can now search and explore! Try:\n'));
  console.log(chalk.gray('  • awesome search "your query"'));
  console.log(chalk.gray('  • awesome shell'));
  console.log(chalk.gray('  • awesome browse\n'));
}

module.exports = {
  buildIndex,
  parseMarkdownLinks,
  extractTextContent,
  isAwesomeList
};
