const readline = require('readline');
const fs = require('fs');
const { execSync } = require('child_process');

const SEMVER = /^\d+\.\d+\.\d+$/;

function updateJsonVersion(filePath, version) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  data.version = version;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('New version (X.Y.Z): ', (version) => {
  rl.close();

  if (!SEMVER.test(version)) {
    console.error(`Error: "${version}" is not a valid version. Use X.Y.Z format.`);
    process.exit(1);
  }

  updateJsonVersion('manifest.json', version);
  updateJsonVersion('package.json', version);
  console.log(`Updated manifest.json and package.json to ${version}`);

  console.log('Running addons-linter...');
  execSync('yarn lint', { stdio: 'inherit' });

  execSync('git add manifest.json package.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${version}"`, { stdio: 'inherit' });
  execSync(`git tag v${version}`, { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
  execSync(`git push origin v${version}`, { stdio: 'inherit' });

  execSync(`gh release create v${version} dist/4chanmediadownloader-${version}.zip --title "v${version}" --generate-notes`, { stdio: 'inherit' });

  console.log(`Released v${version}`);
});
