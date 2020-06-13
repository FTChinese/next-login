import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { SignUpForm, LinkingFormData, EmailForm } from "../models/form-data";
import { emailSchema, joiOptions, reduceJoiErrors, textLen, loginSchema, signUpSchema } from "./validator";
import { ValidationError } from "@hapi/joi";
import { accountService } from "../repository/account";
import { APIError, errMsg } from "../models/api-response";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { ControlType } from "../widget/widget";
import { TextInputElement } from "../widget/text-input";
import { Account, isAccountLinked, isAccountEqual } from "../models/account";
import { entranceMap, accountMap } from "../config/sitemap";
import { HeaderApp } from "../models/header";
import { localizeTier } from "../models/localization";
import { Link } from "../widget/link";
import { Credentials } from "../models/form-data";
import { isMemberExpired } from "../models/membership";
import { Card } from "../widget/card";

class LinkEmailPage {
  pageTitle: string; // Override global pageTitle.
  flash?: Flash;
  form: Form;
}

export class LinkEmailPageBuilder {
  flashMsg?: string;
  errors: Map<string, string> = new Map();
  formData?: EmailForm;

  async validate(data: EmailForm): Promise<boolean> {
    try {
      const result = await emailSchema.validateAsync(data, joiOptions);

      this.formData = result;
      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);

      return false;
    }
  }

  async exists(): Promise<{found: boolean, errored: boolean}> {
    if (!this.formData) {
      throw new Error("form data missing");
    }

    try {
      const ok = await accountService.emailExists(this.formData.email)

      return {
        found: ok,
        errored: false,
      };
    } catch (e) {
      const errResp = new APIError(e);
      if (errResp.unprocessable) {
        this.errors = errResp.controlErrs;
        return {
          found: false,
          errored: true,
        };
      }

      this.flashMsg = errResp.message;
      return {
        found: false,
        errored: true,
      };
    }
  }

  build(): LinkEmailPage {
    return {
      pageTitle: "绑定FT中文网账号",
      flash: this.flashMsg
        ? Flash.danger(this.flashMsg)
        : undefined,
      form: new Form({
        disabled: false,
        method: "post",
        action: "",
        controls: [
          new FormControl({
            label: {
              text: "登录邮箱"
            },
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "email",
              type: "email",
              name: "email",
              value: this.formData?.email,
              placeholder: "邮箱",
              maxlength: textLen.email.max,
              required: true,
            }),
            desc: "已在FT中文网注册的邮箱，如果尚未注册，将引导您注册账号",
            error: this.errors?.get("email"),
          })
        ],
        submitBtn: Button.
          primary().
          setName("检测邮箱").
          setDisableWith("正在检测").
          setBlock(),
      }),
    };
  }
}

class LinkLoginPage {
  pageTitle: string;
  flash?: Flash;
  form: Form;
  alternativeActions: Link[];
}

export class LinkLoginPageBuilder {
  flashMsg?: string;
  formData: Credentials = {
    email: "",
    password: "",
  };
  errors: Map<string, string> = new Map();

  constructor (email?: string) {
    if (email) {
      this.formData.email = email;
    }
  }

  async validate(c: Credentials): Promise<boolean> {
    try {
      const result = await loginSchema.validateAsync(
        c,
        joiOptions
      );

      this.formData = result;

      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);
      return false;
    }
  }

  async login(app: HeaderApp): Promise<Account | null> {
    if (!this.formData) {
      throw new Error("No form data submitted!");
    }
    try {
      const account = await accountService.authenticate(this.formData, app);

      return account;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.notFound) {
        this.flashMsg = errMsg.credentials.notFound;
        return null;
      }
  
      if (errResp.unprocessable) {
        this.errors = errResp.controlErrs;
        return null
      }

      this.flashMsg = errResp.message;

      return null;
    }
  }
  
  build(): LinkLoginPage {
    return {
      pageTitle: "绑定FT中文网账号",
      flash: this.flashMsg
        ? Flash.danger(this.flashMsg)
        : undefined,
      form: new Form({
        disabled: false,
        method: "post",
        action: "",
        controls: [
          new FormControl({
            label: {
              text: "账号已存在",
            },
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "email",
              type: "email",
              name: "credentials[email]",
              value: this.formData.email,
              maxlength: textLen.email.max,
              required: true,
              readonly: true,
            }),
            desc: "该邮箱已经注册了FT中文网账号，验证密码后可以合并账号",
            error: this.errors.get("email"),
          }),
          new FormControl({
            label: {
              text: "密码",
            },
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "password",
              type: "password",
              name: "credentials[password]",
              placeholder: "密码",
              maxlength: textLen.password.max,
              required: true,
            }),
            error: this.errors.get("password"),
          })
        ],
        submitBtn: Button.primary()
          .setBlock()
          .setName("验证")
          .setDisableWith("正在验证...")
      }),
      alternativeActions: [
        {
          text: "忘记密码?",
          href: entranceMap.passwordReset,
          external: true,
        }
      ],
    };
  }
}

interface WxSignUpPage {
  pageTitle: string;
  flash?: Flash;
  form: Form
}

export class WxSignUpPageBuilder {
  flashMsg?: string;
  formData: SignUpForm = {
    email: "",
    password: "",
    confirmPassword: "",
  };
  errors: Map<string, string> = new Map();

  constructor(email?: string) {
    if (email) {
      this.formData.email = email
    }
  }

  async validate(data: SignUpForm): Promise<boolean> {
    try {
      const result = await signUpSchema.validateAsync(data, joiOptions);

      this.formData = result;

      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);
      return false;
    }
  }

  async create(unionId: string, app: HeaderApp): Promise<Account | null> {
    try {
      const account = await accountService.wxSignUp({
          email: this.formData.email,
          password: this.formData.password,
        },
        unionId,
        app
      );

      return account;
    } catch (e) {
      const errResp = new APIError(e);


      if (errResp.unprocessable) {
        this.errors = errResp.controlErrs;

        return null;
      }

      this.flashMsg = errResp.message;

      return null;
    }
  }
  
  build(): WxSignUpPage {

    return {
      pageTitle: "注册并绑定FT中文网账号",
      flash: this.flashMsg
        ? Flash.danger(this.flashMsg)
        : undefined,
      form: new Form({
        disabled: false,
        method: "post",
        action: "",
        controls: [
          new FormControl({
            label: {
              text: "邮箱未注册",
            },
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "email",
              type: "email",
              name: "credentials[email]",
              value: this.formData.email,
              maxlength: textLen.email.max,
              required: true,
              readonly: true,
            }),
            desc: "如果您正在尝试绑定已有账号，请确保输入的邮箱地址正确",
            error: this.errors.get("email"),
          }),
          new FormControl({
            label: {
              text: "密码",
            },
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "password",
              type: "password",
              name: "credentials[password]",
              placeholder: "密码",
              maxlength: textLen.password.max,
              required: true,
            }),
            desc: "至少8个字符。设置密码将为您使用该邮箱创建新的FT中文网账号，账号创建成功即与当前微信账号绑定",
            error: this.errors.get("password"),
          }),
          new FormControl({
            label: {
              text: "确认密码"
            },
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "confirmPassword",
              type: "password",
              name: "credentials[confirmPassword]",
              placeholder: "确认密码",
              maxlength: textLen.password.max,
              required: true,
            }),
            desc: "两次输入的密码需一致",
            error: this.errors.get("confirmPassword"),
          }),
        ],
        submitBtn: Button.primary()
          .setBlock()
          .setName("注册")
          .setDisableWith("正在注册...")
      }),
    };
  }
}

interface LinkingAccounts {
  ftc: Account;
  wx: Account;
}

/** template: link/merge.html */
interface MergePage {
  flash?: Flash; // Any error message
  pageTitle: string;
  heading: string;
  done?: Link; // Where to after linked successfully? If exists, cards, denyMerge and form should be empty.
  cards?: Card[]; // Show the two accounts
  denyMerge?: string; // Mutually exclusive against form field. Explains why the accounts cannot be linked.
  form?: Form; // Visible if accounts is allowed to link.
}

const errLinking: Record<string, string> = {
  userId_missing_field: "提交的数据缺少userId字段",
  account_link_taken: "两个欲绑定的账号必须尚未绑定任何其他账号",
  membership_link_taken: "两个账号所属的会员数据可能已经绑定到其他账号下",
  membership_both_valid: "两个关联账号均拥有尚未到期的会员，为保障您的利益，禁止绑定",
};

export class MergePageBuilder {
  flashMsg?: string;
  accounts?: LinkingAccounts;
  deny?: string;
  private targetId?: string;
  private errors: Map<string, string> = new Map();

  /**
   * 
   * @param showLinkResult - Used to buil ui after accounts linked.
   */
  constructor(
    readonly currentAccount: Account,
    readonly showLinkResult: boolean = false
  ) {}

  async fetchAccountToLink(targetId: string): Promise<boolean> {
    this.targetId = targetId;
    try {
      switch (this.currentAccount.loginMethod) {
        case "email": {
          const wxAccount = await accountService.fetchWxAccount(targetId);
          
          this.accounts =  {
            ftc: this.currentAccount,
            wx: wxAccount,
          };

          return true;
        }
  
        case "wechat": {
          const ftcAccount = await accountService.fetchFtcAccount(targetId);

          this.accounts =  {
            ftc: ftcAccount,
            wx: this.currentAccount,
          };

          return true;
        }
  
        default: {
          this.flashMsg = "无法确定当前账号的类型";
          return false;
        }
      }
    } catch (e) {
      const errResp = new APIError(e);
      if (errResp.notFound) {
        this.flashMsg = "未找到合并目标账号";
        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }

  isMergeAllowed(): boolean {
    if (!this.accounts) {
      this.flashMsg = "合并账号数据缺失";
      return false
    }
    const { ftc, wx } = this.accounts;
    if (isAccountEqual(ftc, wx)) {
      this.deny = `两个账号已经绑定，无需操作。如果您未看到绑定后的账号信息，请点击"账号安全"刷新。`;

      return false;
    }

    if (isAccountLinked(ftc)) {
      this.deny = `账号 ${ftc.email} 已经绑定了其他微信账号。一个FT中文网账号只能绑定一个微信账号。`;

      return false;
    }

    if (isAccountLinked(wx)) {
      this.deny = `微信账号 ${wx.wechat.nickname} 已经绑定了其他FT中文网账号。一个FT中文网账号只能绑定一个微信账号。`;

      return false;
    }

    if (
      !isMemberExpired(ftc.membership) &&
      !isMemberExpired(wx.membership)
    ) {
      this.deny = `您的微信账号和FT中文网的账号均购买了会员服务，两个会员均未到期。合并账号会删除其中一个账号的会员信息。为保障您的权益，暂不支持绑定两个会员未过期的账号。您可以寻求客服帮助。`;

      return false;
    }

    return true;
  }

  validate(form: LinkingFormData): boolean {
    if (!form.targetId) {
      return false;
    }

    const targetId = form.targetId.trim();
    if (!targetId) {
      return false;
    }

    this.targetId = targetId;
    return true;
  }

  async merge(): Promise<boolean> {
    if (!this.targetId) {
      throw new Error("No target id to link provided!")
    }
    try {
      const ok = await accountService.link(this.currentAccount, this.targetId);

      return ok;
    } catch (e) {
      // 204 if alread linked.
      // 422:
      // field: ftcId, code: missing_field;
      // field: link, code: already_exists;
      // field: account, code: link_aready_taken
      // field: membership, code: link_already_taken
      // fieldd: memberships, code: none_expired
      // 404 Not Found if one of the account is not found from DB.
      const errResp = new APIError(e);
      if (errResp.unprocessable) {
        const key = `${errResp.unprocessable.field}.${errResp.unprocessable.code}`;

        this.flashMsg = errLinking[key];
        return false;
      }
      this.flashMsg = errResp.message;
      return false;
    }
  }

  build(): MergePage {
    const p: MergePage = {
      pageTitle: "绑定账号",
      heading: "",
    };

    if (this.showLinkResult) {
      p.done = {
        text: "返回",
        href: accountMap.base,
      };
      p.heading = "账号关联成功"
      return p;
    }

    p.flash = this.flashMsg
      ? Flash.danger(this.flashMsg)
      : undefined;

    if (this.accounts) {
      const { ftc, wx } = this.accounts;
      p.cards = [
        {
          header: "FT中文网账号",
          list: [
            {
              primary: "邮箱",
              secondary: ftc.email,
            },
            {
              primary: "会员类型",
              secondary: ftc.membership.tier
                ? localizeTier(ftc.membership.tier)
                : "-",
            },
            {
              primary: "会员期限",
              secondary: ftc.membership.expireDate || "-",
            },
          ],
        },
        {
          header: "微信账号",
          list: [
            {
              primary: "昵称",
              secondary: wx.wechat.nickname || "-",
            },
            {
              primary: "会员类型",
              secondary: wx.membership.tier
                ? localizeTier(wx.membership.tier)
                : "-",
            },
            {
              primary: "会员期限",
              secondary: wx.membership.expireDate || "-",
            },
          ],
        }
      ];
    }

    if (this.deny) {
      p.denyMerge = this.deny
    } else {
      p.form = new Form({
        disabled: false,
        method: "post",
        action: "",
        controls: [
          new FormControl({
            controlType: ControlType.Text,
            field: new TextInputElement({
              id: "targetId",
              name: "targetId",
              type: "hidden",
              value: this.targetId,
            }),
          }),
        ],
        submitBtn: Button
          .primary()
          .setName("开始")
          .setDisableWith("合并账号...")
          .setBlock(),
      });
    }

    return p;
  }
}
