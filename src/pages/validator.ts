import {
    object,
    string,
    ref,
    ValidationErrorItem,
    ValidationOptions,
    ValidationError,
} from "@hapi/joi"

export function buildJoiErrors(details: ValidationErrorItem[]): object {
    const errors: {[index: string]: string} = {};
    
    for (const item of details) {
        const key = item.path.join("_");
        errors[key] = item.message;
    }

    return errors;
}

export function reduceJoiErrors(e: ValidationError): Map<string, string> {
  const o: Map<string, string> = new Map();

  for (const item of e.details) {
    const key = item.path.join("_");
    o.set(key, item.message);
  }

  return o;
}

export interface IFormState<T> {
    values?: T;
    errors?: T;
}

export const joiOptions: ValidationOptions = {
    abortEarly: false,
    messages: {
      'any.custom': '{{#label}} failed custom validation because {{#error.message}}',
      'any.default': '{{#label}} threw an error when running default method',
      'any.failover': '{{#label}} threw an error when running failover method',
      'any.invalid': '{{#label}} contains an invalid value',
      'any.only': '{{#label}} must be {if(#valids.length == 1, "", "one of ")}{{#valids}}',
      'any.ref': '{{#label}} {{#arg}} references "{{#ref}}" which {{#reason}}',
      'any.required': '{{#label}} 为必填项',
      'any.unknown': '{{#label}} 不能存在',
      'boolean.base': '{{#label}} 必须是布尔值',
      'string.alphanum': '{{#label}} 只能包含字母数字',
      'string.base': '{{#label}} 必须是字符串',
      'string.base64': '{{#label}} 必须是有效的base64字符串',
      'string.creditCard': '{{#label}} 必须是信用卡号',
      'string.dataUri': '{{#label}} 必须是有效的dataUri字符串',
      'string.domain': '{{#label}} 必须是有效的域名',
      'string.email': '{{#label}} 必须是有效的邮箱地址',
      'string.empty': '{{#label}} 不能为空',
      'string.guid': '{{#label}} 必须是有效的GUID',
      'string.hex': '{{#label}} 必须是有效的16进制字符串',
      'string.hexAlign': '{{#label}} hex decoded representation must be byte aligned',
      'string.hostname': '{{#label}} 不许是有效的主机名',
      'string.ip': '{{#label}} 必须是带有{{#cidr}} CIDR的有效IP地址',
      'string.ipVersion': '{{#label}} must be a valid ip address of one of the following versions {{#version}} with a {{#cidr}} CIDR',
      'string.isoDate': '{{#label}} 必须是ISO时间格式',
      'string.isoDuration': '{{#label}} must be a valid ISO 8601 duration',
      'string.length': '{{#label}} 必须等于 {{#limit}} 个字符',
      'string.lowercase': '{{#label}} 只能包含小写字母',
      'string.max': '{{#label}} 长度不能超过 {{#limit}} 个字符',
      'string.min': '{{#label}} 不能少于 {{#limit}} 个字符',
      'string.normalize': '{{#label}} must be unicode normalized in the {{#form}} form',
      'string.token': '{{#label}} must only contain alpha-numeric and underscore characters',
      'string.pattern.base': '{{#label}} with value "{[.]}" fails to match the required pattern: {{#regex}}',
      'string.pattern.name': '{{#label}} with value "{[.]}" fails to match the {{#name}} pattern',
      'string.pattern.invert.base': '{{#label}} with value "{[.]}" matches the inverted pattern: {{#regex}}',
      'string.pattern.invert.name': '{{#label}} with value "{[.]}" matches the inverted {{#name}} pattern',
      'string.trim': '{{#label}} must not have leading or trailing whitespace',
      'string.uri': '{{#label}} must be a valid uri',
      'string.uriCustomScheme': '{{#label}} must be a valid uri with a scheme matching the {{#scheme}} pattern',
      'string.uriRelativeOnly': '{{#label}} must be a valid relative uri',
      'string.uppercase': '{{#label}} must only contain uppercase characters',
      'number.base': '{{#label}} 必须是数字',
      'number.greater': '{{#label}} 必须大于 {{#limit}}',
      'number.infinity': '{{#label}} cannot be infinity',
      'number.integer': '{{#label}} must be an integer',
      'number.less': '{{#label}} 必须小于 {{#limit}}',
      'number.max': '{{#label}} 不能大于 {{#limit}}',
      'number.min': '{{#label}} must 不能小于 {{#limit}}',
      'number.multiple': '{{#label}} must be a multiple of {{#multiple}}',
      'number.negative': '{{#label}} 必须是负数',
      'number.port': '{{#label}} 必须是有效的端口',
      'number.positive': '{{#label}} 必须是正数',
      'number.precision': '{{#label}} must have no more than {{#limit}} decimal places',
      'number.unsafe': '{{#label}} must be a safe number',
      'date.base': '{{#label}} must be a valid date',
      'date.format': '{{#label}} must be in {msg("date.format." + #format) || #format} format',
      'date.greater': '{{#label}} must be greater than "{{#limit}}"',
      'date.less': '{{#label}} must be less than "{{#limit}}"',
      'date.max': '{{#label}} must be less than or equal to "{{#limit}}"',
      'date.min': '{{#label}} must be larger than or equal to "{{#limit}}"',

      // Messages used in date.format

      'date.format.iso': 'ISO 8601 date',
      'date.format.javascript': 'timestamp or number of milliseconds',
      'date.format.unix': 'timestamp or number of seconds'
    }
}

export const textLen = {
  email: {
    max: 32,
  },
  password: {
    max: 32,
    min: 8
  },
  userName: {
    max: 32,
  },
  mobile: {
    max: 11,
  },
  familyName: {
    max: 32,
  },
  givenName: {
    max: 32,
  },
  birthday: {
    max: 10,
  },
  country: {
    max: 32,
  },
  province: {
    max: 32,
  },
  city: {
    max: 32,
  },
  district: {
    max: 32,
  },
  street: {
    max: 64,
  },
  postcode: {
    max: 16,
  },
};

const email = string().trim().email().required().messages({
  'string.email': '请输入有效的邮箱地址',
  'any.required': '邮箱为必填项'
});

const password = string()
  .trim()
  .min(textLen.password.min)
  .max(textLen.password.max)
  .required()
  .messages({
    'string.min': '不能少于8个字符',
    'string.max': '不能超过64个字符'
  });

export const emailSchema = object().keys({
    email,
});

/**
 * @description Validate password reseting.
 * This can also be extended to validate updating password.
 */
export const passwordsSchema = object().keys({
    password,
    // valid() ensures this field is eqaual to password.
    confirmPassword: password.valid(ref("password")),
});

export const loginSchema = emailSchema.keys({
    // To be compatible with legacy password.
    password: string().trim().required(),
});

export const signUpSchema = passwordsSchema.keys({
    email,
});

export const passwordUpdatingSchema = passwordsSchema.keys({
    // Legacy password.
    oldPassword: string().trim().required(),
});

export const userNameSchema = object().keys({
    userName: string().trim().max(textLen.userName.max).required(),
});

export const mobileSchema = object().keys({
    mobile: string().trim().max(textLen.mobile.max).required(),
});

export const profileSchema = object().keys({
    familyName: string().trim().empty('').max(textLen.familyName.max).default(null),
    givenName: string().trim().empty('').max(textLen.givenName.max).default(null),
    gender: string().empty('').valid("M", "F").default(null),
    birthday: string().empty('').max(textLen.birthday.max).default(null),
});

export const addressSchema = object().keys({
    country: string().trim().empty('').max(textLen.country.max).default(null),
    province: string().trim().empty('').max(textLen.province.max).default(null),
    city: string().trim().empty('').max(textLen.city.max).default(null),
    district: string().trim().empty('').max(textLen.district.max).default(null),
    street: string().trim().empty('').max(textLen.street.max).default(null),
    postcode: string().trim().empty('').max(textLen.postcode.max).default(null),
});



