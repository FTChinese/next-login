import { Flash } from "../widget/flash";
import { Link } from "../widget/link";
import { accountMap } from "../config/sitemap";
import { Form } from "../widget/form";
import { Button } from "../widget/button";
import { FormControl } from "../widget/form-control";
import { RadioInputElement } from "../widget/radio-input";
import { ControlType } from "../widget/widget";
import { AccountKind } from "../models/enums";
import { Account } from "../models/account";
import { localizeTier } from "../models/localization";
import { accountService } from "../repository/account";
import { APIError } from "../models/api-response";
import { UnlinkFormData } from "../models/form-data";
import { isMember } from "../models/membership";
import { Card } from "../widget/card";

interface UnlinkPage {
  flash?: Flash;
  pageTitle: string;
  done?: Link; // show success message. Excludes card, formHeader and form fields.
  card?: Card;
  formHeader? : string;
  form?: Form;
}

export class UnlinkPageBuilder {
  flashMsg?: string;
  anchor?: AccountKind; // Not exist if no membership.
  errors: Map<string, string> = new Map();
  private isMemberEmailOnly: boolean = false;
  private hasMember: boolean;
  
  constructor(
    readonly account: Account,
    readonly unlinked: boolean = false
  ) {
    this.hasMember = isMember(account.membership);

    this.isMemberEmailOnly = (account.membership.payMethod !== "alipay") && (account.membership.payMethod !== "wechat");

    if (this.isMemberEmailOnly) {
      this.anchor = "ftc";
    }
  }

  // Validate anchor for membership.
  validate(formData: UnlinkFormData): boolean {
    // If user has no membership, no anchor to keep it.
    if (!this.hasMember) {
      this.anchor = undefined;
      return true;
    }

    if (!formData.anchor) {
      this.errors.set("anchor", "请选择会员信息保留在哪个账号下")
      return false;
    }

    // If membership should only be kept on email account.
    if (this.isMemberEmailOnly) {
      if (formData.anchor !== "ftc") {
        this.errors.set("anchor", "通过苹果内购、Stripe或B2B建立的会员只能保留在邮箱账号")
        return false;
      }

      this.anchor = "ftc";
      return true;
    }

    this.anchor = formData.anchor;
    return true;
  }

  async unlink(): Promise<boolean> {
    
    try {
      const ok = await accountService.unlink(this.account, this.anchor);

      return ok;
    } catch (e) {
      const errResp = new APIError(e);

      this.flashMsg = errResp.message;
      return false;
    }
  }

  build(): UnlinkPage {
    const p: UnlinkPage = {
      flash: this.flashMsg ? Flash.danger(this.flashMsg) : undefined,
      pageTitle: "解除账号绑定",
    };

    if (this.unlinked) {
      p.done = {
        text: "账号已解除绑定",
        href: accountMap.base,
      }
      return p;
    }

    p.card = {
      list: [
        {
          primary: "FT账号",
          secondary: this.account.email,
        },
        {
          primary: "微信账号",
          secondary: this.account.wechat.nickname,
        },
      ],
    };

    if (this.account.membership.tier && this.account.membership.expireDate ) {
      p.card.list?.concat([
        {
          primary: "会员类型",
          secondary: localizeTier(this.account.membership.tier),
        },
        {
          primary: "会员期限",
          secondary: this.account.membership.expireDate,
        },
      ]);
    }

    p.form = new Form({
      disabled: false,
      method: "post",
      action: "",
      // Only show form controls if use has membership.
      controls: this.hasMember ? [
        new FormControl({
          label: {
            text: "FT账号",
            suffix: true
          },
          controlType: ControlType.Radio,
          field: new RadioInputElement({
            id: "anchorFtc",
            name: "anchor",
            value: "ftc",
            checked: this.anchor === "ftc"
          }),
          extraWrapperClass: "mb-3",
        }),
        new FormControl({
          label: {
            text: "微信账号",
            suffix: true
          },
          controlType: ControlType.Radio,
          field: new RadioInputElement({
            disabled: this.isMemberEmailOnly, // For payment method apple, stripe, b2b the membership is always kept on email account.
            id: "anchorWechat",
            name: "anchor",
            value: "wechat",
            checked: this.anchor === "wechat"
          }),
          extraWrapperClass: "mb-3",
          error: this.errors.get("anchor"),
        }),
      ] : [],
      submitBtn: Button
        .primary()
        .setName("解除绑定")
        .setDisableWith("正在解绑...")
        .setBlock(),
    });

    return p;
  }
}
