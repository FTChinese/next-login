const test = require('ava');
const {gatherAPIErrors} = require('../utils/http-errors');

const errMsg = {
  message: 'Create user faild',
  errors: [
    {
      resource: 'User.Create',
      field: 'email',
      code: 'already_exists'
    }
  ]
}

test('gather', async t => {
  const result = gatherAPIErrors(errMsg);

  console.log(result);

  t.truthy(result);
});
