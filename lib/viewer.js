const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { purpleGold, goldPink } = require('./banner');

// Configure marked for terminal
marked.setOptions({
  renderer: new TerminalRenderer({
    heading: chalk.hex('#DA22FF').bold,
    strong: chalk.hex('#FF69B4').bold,
    em: chalk.hex('#FFD700').italic,
    codespan: chalk.hex('#9733EE'),
    code: chalk.gray,
    link: chalk.cyan.underline,
    list: chalk.hex('#FF69B4')
  })
});

// View README with pagination
async function viewReadme(repo, readme, startLine = 0) {
  const LINES_PER_PAGE = 40;
  const lines = readme.raw_content.split('\n');
  const totalPages = Math.ceil(lines.length / LINES_PER_PAGE);
  const currentPage = Math.floor(startLine / LINES_PER_PAGE) + 1;

  console.clear();

  // Header
  console.log(purpleGold(`\n📖 ${repo.name} - README\n`));
  console.log(chalk.gray('━'.repeat(70)));
  console.log(chalk.hex('#FFD700')(`  Page ${currentPage} of ${totalPages}`) + chalk.gray(` | Lines ${startLine + 1}-${Math.min(startLine + LINES_PER_PAGE, lines.length)} of ${lines.length}`));
  console.log(chalk.gray('━'.repeat(70)));
  console.log();

  // Get page content
  const pageLines = lines.slice(startLine, startLine + LINES_PER_PAGE);
  const pageContent = pageLines.join('\n');

  // Render markdown
  try {
    const rendered = marked.parse(pageContent);
    console.log(rendered);
  } catch (error) {
    // Fallback to plain text if rendering fails
    console.log(pageContent);
  }

  console.log();
  console.log(chalk.gray('━'.repeat(70)));

  // Navigation menu
  const choices = [];

  if (startLine + LINES_PER_PAGE < lines.length) {
    choices.push({ name: chalk.hex('#DA22FF')('→ Next page'), value: 'next' });
  }

  if (startLine > 0) {
    choices.push({ name: chalk.hex('#FF69B4')('← Previous page'), value: 'prev' });
  }

  choices.push({ name: chalk.hex('#FFD700')('⬆ Jump to top'), value: 'top' });
  choices.push({ name: chalk.hex('#9733EE')('📋 Copy URL to clipboard'), value: 'copy' });
  choices.push({ name: chalk.hex('#DA22FF')('🌐 Open in browser'), value: 'browser' });
  choices.push({ name: chalk.hex('#FF69B4')('✍️  Add annotation'), value: 'annotate' });
  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.gray('← Back'), value: 'back' });

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Navigate:',
      choices: choices,
      pageSize: 10
    }
  ]);

  switch (action) {
    case 'next':
      await viewReadme(repo, readme, startLine + LINES_PER_PAGE);
      break;

    case 'prev':
      await viewReadme(repo, readme, Math.max(0, startLine - LINES_PER_PAGE));
      break;

    case 'top':
      await viewReadme(repo, readme, 0);
      break;

    case 'copy':
      // Copy URL (requires xclip or similar)
      try {
        const { spawn } = require('child_process');
        const proc = spawn('xclip', ['-selection', 'clipboard']);
        proc.stdin.write(repo.url);
        proc.stdin.end();
        console.log(chalk.green('\n  ✓ URL copied to clipboard!\n'));
      } catch (error) {
        console.log(chalk.yellow('\n  Install xclip to use clipboard feature\n'));
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      await viewReadme(repo, readme, startLine);
      break;

    case 'browser':
      const { spawn } = require('child_process');
      spawn('xdg-open', [repo.url], { detached: true, stdio: 'ignore' });
      await viewReadme(repo, readme, startLine);
      break;

    case 'annotate':
      await addAnnotation(repo, readme, startLine);
      await viewReadme(repo, readme, startLine);
      break;

    case 'back':
      // Return to previous screen
      break;
  }
}

// Add annotation
async function addAnnotation(repo, readme, currentLine) {
  const { annotationType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'annotationType',
      message: 'Annotation type:',
      choices: [
        { name: 'Document annotation (whole README)', value: 'document' },
        { name: 'Line annotation (specific line)', value: 'line' },
        { name: 'Cancel', value: 'cancel' }
      ]
    }
  ]);

  if (annotationType === 'cancel') return;

  let lineNumber = null;

  if (annotationType === 'line') {
    const { line } = await inquirer.prompt([
      {
        type: 'number',
        name: 'line',
        message: 'Line number:',
        default: currentLine + 1,
        validate: (input) => {
          const lines = readme.raw_content.split('\n');
          if (input < 1 || input > lines.length) {
            return `Line must be between 1 and ${lines.length}`;
          }
          return true;
        }
      }
    ]);
    lineNumber = line;
  }

  const { content } = await inquirer.prompt([
    {
      type: 'input',
      name: 'content',
      message: 'Annotation:',
      validate: (input) => input.trim() ? true : 'Annotation cannot be empty'
    }
  ]);

  // Save annotation
  const dbInstance = require('./database').getDb();
  const stmt = dbInstance.prepare(`
    INSERT INTO annotations (repository_id, line_number, content)
    VALUES (?, ?, ?)
  `);
  stmt.run(repo.id, lineNumber, content);

  console.log(chalk.green('\n  ✓ Annotation added!\n'));
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// View annotations for a repository
async function viewAnnotations(repoId) {
  const dbInstance = require('./database').getDb();
  const annotations = dbInstance.prepare(`
    SELECT * FROM annotations
    WHERE repository_id = ?
    ORDER BY line_number ASC, created_at DESC
  `).all(repoId);

  if (annotations.length === 0) {
    console.log(chalk.yellow('\n  No annotations found\n'));
    return;
  }

  console.log(goldPink(`\n✍️  Annotations (${annotations.length})\n`));
  console.log(chalk.gray('━'.repeat(70)));

  annotations.forEach((ann, idx) => {
    console.log();
    console.log(chalk.hex('#DA22FF')(`  ${idx + 1}. `) +
      (ann.line_number ? chalk.hex('#FFD700')(`Line ${ann.line_number}`) : chalk.hex('#FF69B4')('Document')));
    console.log(chalk.gray(`     ${ann.content}`));
    console.log(chalk.gray(`     ${new Date(ann.created_at).toLocaleString()}`));
  });

  console.log();
  console.log(chalk.gray('━'.repeat(70)));
  console.log();
}

module.exports = {
  viewReadme,
  viewAnnotations,
  addAnnotation
};
