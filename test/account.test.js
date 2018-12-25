const { AccountValidator } = require("../lib/validate/account");
const Chance = require("chance");
const { format } = require("date-fns");
const { message } = require("../lib/validate/util");

test("validate password change", () => {
  const account = {
    oldPassword: "12345678",
    password: "12345678",
    confirmPassword: "12345678"
  };

  const { result, errors } = new AccountValidator(account)
    .validatePassword()
    .confirmPassword()
    .validateOldPassword()
    .end();

  console.log(result);
  console.log(errors);

  expect(errors).toBe(null);
});

test("validate mismatched confirmation password", () => {
  const account = {
    oldPassword: "12345678",
    password: "12345678",
    confirmPassword: "87654321"
  };

  const { result, errors } = new AccountValidator(account)
    .validatePassword()
    .confirmPassword()
    .validateOldPassword()
    .end();

  console.log(result);
  console.log(errors);

  expect(result).toBe(null);
});