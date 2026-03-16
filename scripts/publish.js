const { execSync } = require('child_process');

const currentBranch = execSync('git branch --show-current').toString().trim();

if (currentBranch !== 'main') {
  console.error(`❌ Errore: Sei sul branch "${currentBranch}"`);
  console.error('Puoi pubblicare solo dal branch "main"');
  process.exit(1);
}

console.log('✓ Branch corretto per la pubblicazione');

const { version } = require('../package.json');

console.log(`✓ Versione da pubblicare: ${version}`);

execSync('npm run build', { stdio: 'inherit' });

console.log('✓ Build completata con successo');

execSync('npm publish', { stdio: 'inherit' });

console.log('✓ Pacchetto pubblicato con successo');