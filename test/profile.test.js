const { ProfileValidator } = require("../lib/validate/profile");
const Chance = require("chance");
const { format } = require("date-fns");
const { message } = require("../lib/validate/util");

const chance = new Chance();
const dateFormat = "YYYY-MM-DD";

test("validate profile", () => {
  const profile = {
    givenName: chance.first(),
    familyName: chance.last(),
    gender: chance.character({"pool": "FM"}),
    birthday: format(chance.birthday(), dateFormat),
  };

  const { result, errors } = new ProfileValidator(profile)
    .givenName()
    .familyName()
    .gender()
    .birthday()
    .end();

  expect(errors).toBeNull();
  expect(result).toHaveProperty("givenName");
  expect(result).toHaveProperty("familyName");
  expect(result).toHaveProperty("gender");
  expect(result).toHaveProperty("birthday");
});

test("profile with empty fields", () => {
  const profile = {
    givenName: "",
    familyName: "",
    gender: "",
    birthday: "",
  };

  const { result, errors } = new ProfileValidator(profile)
    .givenName()
    .familyName()
    .gender()
    .birthday()
    .end();

  expect(errors).toBeNull();
  expect(result).toHaveProperty("givenName", null);
  expect(result).toHaveProperty("familyName", null);
  expect(result).toHaveProperty("gender");
  expect(result).toHaveProperty("birthday");
});

test("exceeding max length", () => {
  const profile = {
    givenName: chance.string({ length: 60 }),
    familyName: chance.string( { length: 60 }),
  }

  const { result, errors } = new ProfileValidator(profile)
    .givenName()
    .familyName()
    .end();

  expect(result).toBeNull();
  expect(errors).toHaveProperty("givenName", message.givenNameMax);
  expect(errors).toHaveProperty("familyName", message.familyNameMax);
});
