const Joi = require("@hapi/joi");
const faker = require("faker");
const {
  validateProfile,
  validateAddress,
} = require("../server/schema");

test("joi", () => {
  const schema = Joi.object().keys({
    // `label` is inserted in error message: '"用户名" 不得少于3个字符'
    username: Joi.string().alphanum().min(3).max(30).required().label("用户名"),
    // .error(errors => {
    //   console.log(errors);
      // return errors.map(err => {
      //   switch (err.type) {
      //     case "string.min":
      //       err.message = "不得少于{{limit}}个字符";
      //       err.template = "{{limit}}"
      //       return err;

      //     case "string.max":
      //       err.message = "不得超过{{limit}}个字符";
      //       return err;

      //     default:
      //       return err;
      //   }
      // });
    // }),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3, 30}$/),
    access_token: [Joi.string(), Joi.number()],
    birthyear: Joi.number().integer().min(1900).max(2013),
    email: Joi.string().email({ minDomainAtom: 2})
  }).with("username", "birthyear").without("password", "access_token");

  // See https://github.com/hapijs/joi/blob/v15.0.0/lib/language.js for default error messages.
  const { error, value } = Joi.validate(
    { username: "ab", birthyear: 2014 }, 
    schema, 
    {abortEarly: false, language: {
      any: {
          unknown: '!!不允许输入该值',
          invalid: '!!包含无效的值',
          empty: '!!不能为空',
          required: '!!必填项',
          allowOnly: '只能输入 {{valids}}',
          default: 'threw an error when running default method'
      },
      boolean: {
        base: '必须是布尔值'
      },
      number: {
        base: '必须是数字',
        unsafe: 'must be a safe number',
        min: '必须大于等于 {{limit}}',
        max: '必须小于等于 {{limit}}',
        less: '必须小于 {{limit}}',
        greater: '必须大于 {{limit}}',
        integer: '必须是整数',
        negative: '只能是负数',
        positive: '只能是正数',
        precision: '小数不能超过 {{limit}} 位',
        ref: 'references "{{ref}}" which is not a number',
        multiple: 'must be a multiple of {{multiple}}',
        port: '必须是有效的端口'
      },
      string: {
        // If the error message is preceded by `!!`, label will not be inserted.
        base: '!!必须是字符串',
        min: "!!不得少于{{limit}}个字符",
        max: "!!不得超过{{limit}}个字符",
        length: '长度不能超过 {{limit}}',
        alphanum: '只能包含字母数字',
        token: '只能包含字母、数字或下划线',
        email: '必须是有效的邮箱地址',
        uri: '必须是有效的URI',
        uriRelativeOnly: 'must be a valid relative uri',
        uriCustomScheme: 'must be a valid uri with a scheme matching the {{scheme}} pattern',
        isoDate: 'must be a valid ISO 8601 date',
        guid: 'must be a valid GUID',
        hex: 'must only contain hexadecimal characters',
        hexAlign: 'hex decoded representation must be byte aligned',
        base64: 'must be a valid base64 string',
        dataUri: 'must be a valid dataUri string',
        hostname: 'must be a valid hostname',
        normalize: 'must be unicode normalized in the {{form}} form',
        lowercase: '只能包含小写字母',
        uppercase: '只能包含大写字母',
        trim: '开头结尾不能有空格',
        creditCard: 'must be a credit card',
        ref: 'references "{{ref}}" which is not a number',
        ip: 'must be a valid ip address with a {{cidr}} CIDR',
        ipVersion: 'must be a valid ip address of one of the following versions {{version}} with a {{cidr}} CIDR'
      }
    }
  });

  console.dir(error, {depth: null});
  console.log(value);

  // message: '"用户名" 不得少于3个字符'
  // path: [ 'username' ]
  // type: 'string.min'
  // context is used to render error messages.
  // context.limit: 3,
  // context.value: 'ab',
  // context.encoding: undefined,
  // context.key: 'username',
  // context.label: '用户名'
  const errors = {};
  for (const err of error.details) {
    errors[err.path.join("_")] = err.message;
  }

  console.log(errors);
});

test("profile", () => {
  const profile = {
    familyName: "",
    givenName: "",
    gender: "G",
    birthday: "",
  }

  const { value, errors } = validateProfile(profile);

  console.log(value);
  console.log(errors);
});

test("address", () => {
  const address = {
    country: "",
    province: "",
    city: "",
    district: "",
    street: "",
    postcode: "",
  };

  const { value, errors } = validateAddress(address);

  console.log(value);
  console.log(errors);
});
