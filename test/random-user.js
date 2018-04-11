const Chance = require('chance');

const chance = new Chance();

for (let i = 0; i < 10; i++) {
  console.log('Random email: %s', chance.email());
}