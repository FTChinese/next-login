const test = require('ava');
const {gatherAPIErrors} = require('../util/http-errors');

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

