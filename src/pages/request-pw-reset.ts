import { DataBuilder } from "./data-builder";
import { EmailData } from "../models/reader";
import { joiOptions, emailSchema } from "./validator";
import { ValidationError } from "@hapi/joi";
import { IHeaderApp } from "../models/header";
import { accountService } from "../repository/account";
import { APIError } from "../repository/api-response";
import { Flash } from "../widget/flash";
import { Form } from "../widget/form";
import { TextInputElement } from "../widget/text-input";
import { ControlType } from "../widget/widget";
import { FormControl } from "../widget/form-control";
import { Button } from "../widget/button";
import { Link } from "../widget/link";
import { entranceMap } from "../config/sitemap";

const msgEmailNotFound: string = "该邮箱不存在，请检查您输入的邮箱是否正确";

export class EmailBuilder extends DataBuilder<EmailData>{

  constructor(data: EmailData) {
    super(data);
  }

  async validate(): Promise<boolean> {
    try {
      const result = await emailSchema.validateAsync(this.data, joiOptions);

      Object.assign(this.data, result);

      return true;
    } catch (e) {
      this.reduceJoiErrors(e as ValidationError);

      return false;
    }
  }

  async requestLetter(app: IHeaderApp): Promise<boolean> {

    try {
      const ok = await accountService.requestPwResetLetter(this.data, app)

      return ok;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.notFound) {
        this.flashMsg = msgEmailNotFound;
        return false;
      }

      if (errResp.unprocessable) {
        this.errors = errResp.unprocessable.toMap();
        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }

  static default(): EmailBuilder {
    return new EmailBuilder({
      email: "",
    });
  }

  static invalidResetToken(): EmailBuilder {
    const b = EmailBuilder.default();
    b.flashMsg = "无法重置密码。您似乎使用了无效的重置密码链接，请重试";
    return b;
  }
}

// Describes the UI structure after an action is done.
interface DoneAction {
  message: string;
  link: Link
}

export type KeyDone = "invalid_token" | "letter_sent" | "pw_reset";

export class RequestPwResetPage {
  flash?: Flash | undefined; // Only exists when API returns a non-validation error.
  done?: DoneAction; // This descibes what the UI should look like after a redirection. It is mutually exclusive with form.
  form?: Form;

  constructor(e?: EmailBuilder) {
    if (!e) {
      return;
    }
    if (e.flashMsg) {
      this.flash = Flash.danger(e.flashMsg);
    }

    this.buildForm(e);
  }

  private buildForm(e: EmailBuilder) {
    this.form = new Form({
      disabled: false,
      method: "post",
      action: "",
      controls: [
        new FormControl({
          controlType: ControlType.Text,
          field: new TextInputElement({
            id: "email",
            type: "email",
            name: "email",
            value: e.data.email,
            placeholder: "登录FT中文网所用的邮箱",
            required: true,
            maxlength: 32,
          }),
          desc: "请输入您的电子邮箱，我们会向该邮箱发送邮件，帮您重置密码",
          error: e.errors.get("email"),
        })
      ],
      submitBtn: Button.primary()
        .setBlock()
        .setName("发送邮件")
        .setDisableWith("正在发送..."),
    });
  }

  static afterRedirect(key: KeyDone) {
    const page = new RequestPwResetPage();
    switch (key) {
      case "letter_sent":
        page.done = {
          message: "请检查您的邮件，点击邮件中的“重置密码”按钮修改您的密码。如果几分钟内没有看到邮件，请检查是否被放进了垃圾邮件列表。",
          link: {
            text: "返回",
            href: entranceMap.login,
          }
        };
        return page;

      // If token is invalid, redirect back to ask reader to enter email again,
      // show an error message in the banner flash.
      case "invalid_token":
        return new RequestPwResetPage(EmailBuilder.invalidResetToken())

      case "pw_reset":
        page.done = {
          message: "密码已更新",
          link: {
            text: "登录",
            href: entranceMap.login,
          }
        };
        return page;
    }
  }
}
