import { joiOptions, emailSchema, reduceJoiErrors } from "./validator";
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
import { FormPage } from "./form-page";
import { EmailData } from "../models/form-data";

// Describes the UI structure after an action is done.
interface DoneAction {
  message: string;
  link: Link
}

export type KeyDone = "invalid_token" | "letter_sent" | "pw_reset";

const msgEmailNotFound: string = "该邮箱不存在，请检查您输入的邮箱是否正确";
const msgInvalidToken: string = "无法重置密码。您似乎使用了无效的重置密码链接，请重试";

export type RequestPwResetPage = FormPage & {
  done?: DoneAction; // This descibes what the UI should look like after a redirection. It is mutually exclusive with form.
}

export class EmailBuilder {

  errors: Map<string, string> = new Map(); // Hold validator error for each form field. Key is field's name attribute.
  flashMsg?: string; // Hold message for API non-422 error.
  formData: EmailData = {
    email: ''
  };

  constructor(readonly sourceUrl: string) {}

  async validate(data: EmailData): Promise<boolean> {
    try {
      const result = await emailSchema.validateAsync(data, joiOptions);

      this.formData = result;

      return true;
    } catch (e) {
      this.errors = reduceJoiErrors(e as ValidationError);

      return false;
    }
  }

  async requestLetter(app: IHeaderApp): Promise<boolean> {

    try {
      const ok = await accountService.requestPwResetLetter({
        sourceUrl: this.sourceUrl,
        ...this.formData
      }, app)

      return ok;
    } catch (e) {
      const errResp = new APIError(e);

      if (errResp.notFound) {
        this.flashMsg = msgEmailNotFound;
        return false;
      }

      if (errResp.unprocessable) {
        this.errors = errResp.controlErrs;
        return false;
      }

      this.flashMsg = errResp.message;
      return false;
    }
  }

  build(key?: KeyDone): RequestPwResetPage {
    let done: DoneAction | undefined = undefined;

    switch (key) {
      case "letter_sent":
        done = {
          message: "请检查您的邮件，点击邮件中的“重置密码”按钮修改您的密码。如果几分钟内没有看到邮件，请检查是否被放进了垃圾邮件列表。",
          link: {
            text: "返回",
            href: entranceMap.login,
          }
        };

      // If token is invalid, redirect back to ask reader to enter email again,
      // show an error message in the banner flash.
      case "invalid_token":
        this.flashMsg = msgInvalidToken;

      case "pw_reset":
        done = {
          message: "密码已更新",
          link: {
            text: "登录",
            href: entranceMap.login,
          }
        };
    }

    return {
      heading: "找回密码",
      flash: this.flashMsg ? Flash.danger(this.flashMsg) : undefined,
      done,
      form: new Form({
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
              value: this.formData.email,
              placeholder: "登录FT中文网所用的邮箱",
              required: true,
              maxlength: 32,
            }),
            desc: "请输入您的电子邮箱，我们会向该邮箱发送邮件，帮您重置密码",
            error: this.errors.get("email"),
          })
        ],
        submitBtn: Button.primary()
          .setBlock()
          .setName("发送邮件")
          .setDisableWith("正在发送..."),
      })
    }
  }
}


