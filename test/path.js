const path = require('path');

console.log(path.resolve('/email/newsletter', '../'));

console.log(path.resolve('/email/confirmation/abc', '../../'));

console.log(path.resolve('/singup', '../email'));

const mypath = '/user/email';


function primaryDir(p) {
  const parsed = p.split(path.sep);

  return parsed[1] ? parsed[1] : null;
}

console.log(primaryDir(mypath));