const Tokens = require('csrf');

const tokens = new Tokens();

const secret = tokens.secretSync();
console.log('Secret: %s', secret);

const token = tokens.create(secret);
console.log('Token: %s', token);

const verified = tokens.verify(secret, token);
console.log('Verified: %s', verified);