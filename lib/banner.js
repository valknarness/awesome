const chalk = require('chalk');
const gradient = require('gradient-string');
const figlet = require('figlet');

// Theme colors
const purpleGold = gradient(['#DA22FF', '#9733EE', '#FFD700']);
const pinkPurple = gradient(['#FF1493', '#DA22FF', '#9733EE']);
const goldPink = gradient(['#FFD700', '#FF69B4', '#FF1493']);

// Awesome ASCII logo inspired by the official logo
const awesomeLogo = `
    ▄████████  ▄█     █▄     ▄████████    ▄████████  ▄██████▄    ▄▄▄▄███▄▄▄▄      ▄████████
   ███    ███ ███     ███   ███    ███   ███    ███ ███    ███ ▄██▀▀▀███▀▀▀██▄   ███    ███
   ███    ███ ███     ███   ███    █▀    ███    █▀  ███    ███ ███   ███   ███   ███    █▀
   ███    ███ ███     ███  ▄███▄▄▄       ███        ███    ███ ███   ███   ███  ▄███▄▄▄
 ▀███████████ ███     ███ ▀▀███▀▀▀     ▀███████████ ███    ███ ███   ███   ███ ▀▀███▀▀▀
   ███    ███ ███     ███   ███    █▄           ███ ███    ███ ███   ███   ███   ███    █▄
   ███    ███ ███ ▄█▄ ███   ███    ███    ▄█    ███ ███    ███ ███   ███   ███   ███    ███
   ███    █▀   ▀███▀███▀    ██████████  ▄████████▀   ▀██████▀   ▀█   ███   █▀    ██████████
`;

// Simplified awesome logo for smaller terminals
const simpleAwesomeLogo = `
    ╔═╗╦ ╦╔═╗╔═╗╔═╗╔╦╗╔═╗
    ╠═╣║║║║╣ ╚═╗║ ║║║║║╣
    ╩ ╩╚╩╝╚═╝╚═╝╚═╝╩ ╩╚═╝
`;

// Display the banner
function showBanner(simple = false) {
  console.clear();

  if (simple) {
    console.log(purpleGold(simpleAwesomeLogo));
  } else {
    console.log(purpleGold(awesomeLogo));
  }

  console.log(pinkPurple('    A curated list explorer for the curious mind\n'));
  console.log(chalk.gray('    ━'.repeat(40)));
  console.log();
}

// Show a figlet banner with custom text
function showFigletBanner(text, font = 'Standard') {
  return new Promise((resolve, reject) => {
    figlet.text(text, { font }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(purpleGold(data));
      resolve();
    });
  });
}

// Display section header
function sectionHeader(title, icon = '') {
  console.log();
  console.log(purpleGold(`${icon} ${title} ${icon}`));
  console.log(chalk.gray('━'.repeat(title.length + (icon ? 6 : 2))));
  console.log();
}

// Display animated loading banner
async function showLoadingBanner(message = 'Loading...') {
  console.log();
  console.log(goldPink(`    ✨ ${message} ✨`));
  console.log();
}

// Display success banner
function showSuccessBanner(message) {
  console.log();
  console.log(chalk.green(`    ✓ ${message}`));
  console.log();
}

// Display error banner
function showErrorBanner(message) {
  console.log();
  console.log(chalk.red(`    ✗ ${message}`));
  console.log();
}

// Export functions and colors
module.exports = {
  showBanner,
  showFigletBanner,
  sectionHeader,
  showLoadingBanner,
  showSuccessBanner,
  showErrorBanner,
  purpleGold,
  pinkPurple,
  goldPink
};
