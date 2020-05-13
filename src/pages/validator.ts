import {
    object,
    string,
    ref,
    ValidationErrorItem,
    ValidationOptions,
    ValidationError,
} from "@hapi/joi"
import { 
    Credentials 
} from "../models/reader";

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
      'any.required': '{{#label}} is required',
      'any.unknown': '{{#label}} is not allowed',
      'boolean.base': '{{#label}} must be a boolean',
      'string.alphanum': '{{#label}} must only contain alpha-numeric characters',
      'string.base': '{{#label}} must be a string',
      'string.base64': '{{#label}} must be a valid base64 string',
      'string.creditCard': '{{#label}} must be a credit card',
      'string.dataUri': '{{#label}} must be a valid dataUri string',
      'string.domain': '{{#label}} must contain a valid domain name',
      'string.email': '{{#label}} must be a valid email',
      'string.empty': '{{#label}} is not allowed to be empty',
      'string.guid': '{{#label}} must be a valid GUID',
      'string.hex': '{{#label}} must only contain hexadecimal characters',
      'string.hexAlign': '{{#label}} hex decoded representation must be byte aligned',
      'string.hostname': '{{#label}} must be a valid hostname',
      'string.ip': '{{#label}} must be a valid ip address with a {{#cidr}} CIDR',
      'string.ipVersion': '{{#label}} must be a valid ip address of one of the following versions {{#version}} with a {{#cidr}} CIDR',
      'string.isoDate': '{{#label}} must be in iso format',
      'string.isoDuration': '{{#label}} must be a valid ISO 8601 duration',
      'string.length': '{{#label}} length must be {{#limit}} characters long',
      'string.lowercase': '{{#label}} must only contain lowercase characters',
      'string.max': '{{#label}} length must be less than or equal to {{#limit}} characters long',
      'string.min': '{{#label}} length must be at least {{#limit}} characters long',
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
      'number.base': '{{#label}} must be a number',
      'number.greater': '{{#label}} must be greater than {{#limit}}',
      'number.infinity': '{{#label}} cannot be infinity',
      'number.integer': '{{#label}} must be an integer',
      'number.less': '{{#label}} must be less than {{#limit}}',
      'number.max': '{{#label}} must be less than or equal to {{#limit}}',
      'number.min': '{{#label}} must be larger than or equal to {{#limit}}',
      'number.multiple': '{{#label}} must be a multiple of {{#multiple}}',
      'number.negative': '{{#label}} must be a negative number',
      'number.port': '{{#label}} must be a valid port',
      'number.positive': '{{#label}} must be a positive number',
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

const email = string().trim().email().required().messages({
  'string.email': '请输入有效的邮箱地址',
  'any.required': '邮箱为必填项'
});
const password = string().trim().min(8).max(64).required().messages({
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

export interface ISignUpFormData extends Credentials {
    confirmPassword: string;
}

export const passwordUpdatingSchema = passwordsSchema.keys({
    // Legacy password.
    oldPassword: string().trim().required().message('请填写当前密码'),
});

export const userNameSchema = object().keys({
    userName: string().trim().max(64).required(),
});

export const mobileSchema = object().keys({
    mobile: string().trim().max(11).required(),
});

export const profileSchema = object().keys({
    familyName: string().trim().empty('').max(64).default(null),
    givenName: string().trim().empty('').max(64).default(null),
    gender: string().empty('').valid(["M", "F"]).default(null),
    birthday: string().empty('').max(10).default(null),
});

export const addressSchema = object().keys({
    country: string().trim().empty('').max(64).default(null),
    province: string().trim().empty('').max(64).default(null),
    city: string().trim().empty('').max(64).default(null),
    district: string().trim().empty('').max(64).default(null),
    street: string().trim().empty('').max(128).default(null),
    postcode: string().trim().empty('').max(16).default(null),
});



