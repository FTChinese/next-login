const Joi = require("@hapi/joi");

const joiOptions = {
  abortEarly: false,
  language: {
    any: {
      unknown: '!!不允许输入该值',
      invalid: '!!包含无效的值',
      empty: '!!不能为空',
      required: '!!必填项',
      allowOnly: '!!只能输入 {{valids}}',
      default: 'threw an error when running default method'
    },
    boolean: {
      base: '!!必须是布尔值'
    },
    number: {
      base: '!!必须是数字',
      unsafe: 'must be a safe number',
      min: '!!必须大于等于 {{limit}}',
      max: '!!必须小于等于 {{limit}}',
      less: '!!必须小于 {{limit}}',
      greater: '!!必须大于 {{limit}}',
      integer: '!!必须是整数',
      negative: '!!只能是负数',
      positive: '!!只能是正数',
      precision: '!!小数不能超过 {{limit}} 位',
      ref: 'references "{{ref}}" which is not a number',
      multiple: 'must be a multiple of {{multiple}}',
      port: '!!必须是有效的端口'
    },
    string: {
      base: '!!必须是字符串',
      min: "!!不得少于{{limit}}个字符",
      max: "!!不得超过{{limit}}个字符",
      length: '!!长度不能超过 {{limit}}',
      alphanum: '!!只能包含字母数字',
      token: '!!只能包含字母、数字或下划线',
      regex: {
        base: 'with value "{{!value}}" fails to match the required pattern: {{pattern}}',
        name: 'with value "{{!value}}" fails to match the {{name}} pattern',
        invert: {
            base: 'with value "{{!value}}" matches the inverted pattern: {{pattern}}',
            name: 'with value "{{!value}}" matches the inverted {{name}} pattern'
        }
      },
      email: '!!必须是有效的邮箱地址',
      uri: '!!必须是有效的URI',
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
      lowercase: '!!只能包含小写字母',
      uppercase: '!!只能包含大写字母',
      trim: '!!开头结尾不能有空格',
      creditCard: 'must be a credit card',
      ref: 'references "{{ref}}" which is not a number',
      ip: 'must be a valid ip address with a {{cidr}} CIDR',
      ipVersion: 'must be a valid ip address of one of the following versions {{version}} with a {{cidr}} CIDR'
    },
  }
}

/**
 * @param {ValidationErrorItem[]} details
 * @return {[key: string]: string}
 */
function transformJoiErr(details) {
  const errors = {};

  for (const err of details) {
    errors[err.path.join("_")] = err.message;
  }

  return errors;
}

exports.validateEmail = function(email) {
  const { value, error } = Joi.validate(
    { email }, 
    Joi.object().keys({
      email: Joi.string().trim().email().required(), 
    }),
    joiOptions
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    }
  }

  return {
    value,
    errors: null,
  };
};

const login = Joi.object().keys({
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().required(),
});

/**
 * @param {ICredentials} input
 */
exports.validateLogin = function(input) {
  const { value, error } = Joi.validate(
    input,
    login,
    joiOptions
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    }
  }

  return {
    value,
    errors: null,
  }
};

const signUp = Joi.object().keys({
  email: Joi.string().trim().email().max(64).required(),
  password: Joi.string().trim().min(8).max(64).required(),
});

/**
 * @param {ICredentials} input
 */
exports.validateSignUp = function(input) {
  const { value, error } = Joi.validate(
    input,
    signUp,
    joiOptions
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    }
  }

  return {
    value,
    errors: null,
  }
};

const passwordReset = Joi.object().keys({
  password: Joi.string().trim().min(8).max(64).required(),
  confirmPassword: Joi.string().trim().min(8).max(64).required(),
});

/**
 * @param {IPasswordReset}
 */
exports.validatePasswordReset = function(input) {
  const { value, error } = Joi.validate(
    input,
    passwordReset,
    joiOptions,
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    }
  }

  return {
    value,
    errors: null,
  }
};

const displayName = Joi.object().keys({
  userName: Joi.string().trim().max(64).required(),
});

exports.validateUserName = function(userName) {
  const { value, error } = Joi.validate(
    { userName },
    displayName,
    joiOptions,
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    }
  }

  return {
    value,
    errors: null,
  }
};

const mobileSchema = Joi.object().keys({
  mobile: Joi.string().trim().max(11).required(),
});

exports.validateMobile = function(mobile) {
  const { value, error } = Joi.validate(
    { mobile },
    mobileSchema,
    joiOptions,
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    }
  }

  return {
    value,
    errors: null,
  }
};

// empty('') takes space value as undefined, and default(null) turns undefined to null.
const profile = Joi.object().keys({
  familyName: Joi.string().trim().empty('').max(64).default(null),
  givenName: Joi.string().trim().empty('').max(64).default(null),
  gender: Joi.string().empty('').valid(["M", "F"]).default(null),
  birthday: Joi.string().empty('').max(10).default(null),
});

exports.validateProfile = function(input) {
  const { value, error } = Joi.validate(
    input,
    profile,
    joiOptions,
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    }
  }

  return {
    value,
    errors: null,
  }
};

const address = Joi.object().keys({
  country: Joi.string().trim().empty('').max(64).default(null),
  province: Joi.string().trim().empty('').max(64).default(null),
  city: Joi.string().trim().empty('').max(64).default(null),
  district: Joi.string().trim().empty('').max(64).default(null),
  street: Joi.string().trim().empty('').max(128).default(null),
  postcode: Joi.string().trim().empty('').max(16).default(null),
});

exports.validateAddress = function(input) {
  const { value, error } = Joi.validate(
    input,
    address,
    joiOptions,
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    }
  }

  return {
    value,
    errors: null,
  }
}

const passwordUpdate = Joi.object().keys({
  oldPassword: Joi.string().trim().required(),
  password: Joi.string().trim().min(8).max(64).required(),
  confirmPassword: Joi.string().trim().min(8).max(64).required(),
});

exports.validatePasswordUpdate = function(input) {
  const { value, error } = Joi.validate(
    input,
    passwordUpdate,
    joiOptions,
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    };
  }

  return {
    value,
    errors: null,
  };
};

exports.oauthApprove = function(input) {
  return Joi.validate(
    input,
    Joi.object().keys({
      approve: Joi.boolean().required(),
    }),
    joiOptions,
  );
}

/**
 * @param {string} code
 * @return {{value: {code: string}, errors: {code: string} }}
 */
exports.validateGiftCode = function(code) {
  const { value, error } = Joi.validate(
    {code},
    Joi.object().keys({
      code: Joi.string().trim().replace(/\s*/g, '').alphanum().uppercase().required(),
    }),
    joiOptions,
  );

  if (error) {
    return {
      value,
      errors: transformJoiErr(error.details),
    };
  }

  return {
    value,
    errors: null,
  };
}

exports.invalidMessage = {
  "staleEmail": "如果你要更改邮箱，请勿使用当前邮箱",
  "passwordsNotEqual": "两次输入的新密码必须相同",
  "dateInvalid": "请按照YYYY-MM-DD格式填写日期",
}
