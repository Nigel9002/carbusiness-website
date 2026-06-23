#!/usr/bin/env node
const crypto = require('crypto');

function exitWithError(msg, code = 2) {
  console.error('ERROR:', msg);
  process.exit(code);
}

const privateKey = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim();
if (!privateKey) exitWithError('Missing IMAGEKIT_PRIVATE_KEY environment variable.');
if (privateKey.includes('*')) exitWithError('IMAGEKIT_PRIVATE_KEY looks masked (contains *). Use full key.');

const token = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex');
const expire = Math.floor(Date.now() / 1000) + 10 * 60;
const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');

console.log(JSON.stringify({ ok: true, token, expire, signature }, null, 2));
process.exit(0);
