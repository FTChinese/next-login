import {
    Response,
} from "superagent";
import {
    jsonMember,
    jsonObject,
    TypedJSON,
} from "typedjson";

export const apiInvalidMessages = new Map<string, string>([
    ["email_missing_field", "邮箱不能为空"],
    ["email_invalid", "不是有效的邮箱地址"],
    ["email_already_exists", "该邮箱已经注册FT中文网账号，请使用其他邮箱"],
    ["email_not_found", "该邮箱不存在，请检查您输入的邮箱是否正确"],
    ["email_token_not_found", "您使用了无效的邮箱验证链接"],
    ["password_missing_field", "密码不能为空"],
    ["password_invalid", "密码无效"],
    // ["password_token_invalid", "无法重置密码。您似乎使用了无效的重置密码链接，请重试"],
    ["password_forbidden", "当前密码错误"],
    ["passwords_mismatched", "两次输入的密码不符，请重新输入"],
    ["token_mising_field", "token不能为空"],
    ["token_invalid", "无效的token"],
    ["userName_missing_field", "用户名不能为空"],
    ["userName_invalid", "用户名无效"],
    ["userName_already_exists", "用户名已被占用，请使用其他用户名"],
    ["mobile_missing_field", "手机号码不能为空"],
    ["mobile_invalid", "手机号码无效"],
    ["server_unauthorized", "访问被拒绝，无权进行此操作"],
    ["userId_missing_field", "请求中缺少'userId'字段"],
    // Gift card error response.
    ["redeem_code_not_found", "没有找到该卡号，请确认您输入的礼品卡号有效、没有过期、未被激活"],
    ["redeem_code_missing_field", "兑换码缺失"],
    ["member_already_exists", "您已经是会员了"],
    ["anchor_missing_field", "会员账号解绑必须选择哪个账号保留会员信息"],
]);
// Define SuperAgent error response.
// Coulnd never figure out the messy API design of
// SuperAgent.
// Why those js-maniacs cannot define data types clearly and riggedly?
export interface SuperAgentError extends Error {
    status: number;
    response?: Response; // Network failures, timeouts, and other errors that produce no response will contain no err.status or err.response fields.
}

@jsonObject
class Unprocessable {
    @jsonMember
    field: string;

    @jsonMember
    code: string;

    private get key(): string {
        return `${this.field}_${this.code}`;
    }

    get text(): string {
        const msg = apiInvalidMessages.get(this.key);
        if (msg) {
            return msg;
        }

        return "";
    }

    toMap(): Map<string, string> {
        return new Map([
            [this.field, this.text],
        ]);
    }
}

@jsonObject
export class APIError {
    @jsonMember
    message: string;
    
    @jsonMember
    error?: Unprocessable; // Fields for validation failure.
    
    constructor(msg?: string) {
        if (msg) {
            this.message = msg;
        }
    }
}

const errSerializer = new TypedJSON(APIError);

export function parseApiError(e: SuperAgentError): APIError {
    // If this is not a superagent error.
    // Type checking does not work with those
    // typical js libraries. You must do this.
    if (!e.response) {
        return new APIError(e.message);
    }

    return errSerializer.parse(e.response.text) || new APIError("Sorry, an unknown error occurred.");
}
