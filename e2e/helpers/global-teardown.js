const { execSync } = require('child_process');

module.exports = async function globalTeardown() {
  // Release the fixture server port in case a worker crashed without cleanup
  try { execSync('fuser -k 3000/tcp 2>/dev/null', { stdio: 'ignore' }); } catch {}
};
