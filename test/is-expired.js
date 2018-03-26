const moment = require('moment');

console.log(moment());



const createdAt = moment.utc('2018-02-26T08:42:21Z');
console.log(createdAt);

const expiresAt = createdAt.add(2592000, 'seconds')
console.log(expiresAt);

console.log(expiresAt.isBefore(moment.utc(), 'seconds'));