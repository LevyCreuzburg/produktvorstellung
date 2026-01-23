// Lokal: node make-hash.js AUTH_SECRET password
const crypto = require('crypto');
const secret = process.argv[2];
const password = process.argv[3];
if (!secret || !password) {
  console.log('Usage: node make-hash.js AUTH_SECRET password');
  process.exit(1);
}
const hash = crypto.createHash('sha256').update(password + secret, 'utf8').digest('hex');
console.log(hash);
