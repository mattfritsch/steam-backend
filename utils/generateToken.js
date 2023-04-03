const crypto = require('crypto');

const generateToken = crypto.randomBytes(64).toString('hex');
console.log(generateToken);