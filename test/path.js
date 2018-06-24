const path = require('path');

console.log(path.resolve('/email/newsletter', '../'));

console.log(path.resolve('/email/confirmation/abc', '../../'));

console.log(path.resolve('/singup', '../email'));