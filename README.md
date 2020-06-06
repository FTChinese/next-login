# Front-end Tools

Mutliple sets of bundling tools are included, with each using different context.

`npm run ...` is mainly used to automatically build typescript to vanillia js by continuous integration.

## Button State for Forms

Add attribute `data-disable-with="<Loading...>"` to the `<button>` element inside a form. When the form is submitted, the text of the button will be replaced by the value of `data-disable-with` and the button is disabled.

# Sitemap

## Login
* GET `/login` Show login page.
* POST `/login` Accept credentials.
* GET `/login/wechat` Start wechat OAuth.
* GET `/login/wechat/callback?code=xxx&state=xxx` Wechat OAuth 2 redirect to here.

## Logout

* GET `/logout`

## Signup

* GET `/signup` Show sign up page.
* POST `/signup` Accept credentials.

## Verify email

* `GET /verify/email/:token` Email verification link.

## Forgot password

* `GET /password-reset` Ask user to enter email
* `POST /password-reset` Use the email user entered to create a letter.
* `GET /password-reset/:token` Verify password reset link and show reset password page.
* `POST /password-reset/:token`  User submitted new password

## FTC OAuth2

A single sign-in workflow for FTC web apps run under different domains.

* GET `/oauth2/authorize?response_type=code&client_id=xxx&redirect_uri=xxx&state=xxx` Show OAuth2 authorization page, or redirect user to login if not logged in yet.
* POST `/oauth2/authorize?response_type=code&client_id=xxx&redirect_uri=xxx&state=xxx` Issue OAuth2 code and redirect user back to the `redirect_uri`.

## Profile

* GET `/profile` Show user profile.
* GET `/profile/display-name` Show form to modify display name. Wechat-only users are denied of access
* POST `/profile/display-name` Modify display name
* GET `/profile/mobile` Show form to modify mobile. Deny wechat-only user.
* POST `/profile/mobile` Modify mobile.
* GET `/profile/info` Show form to modify real name, gender, birthday.
* POST `/profile/info` Modify real name, gender, birthday.
* GET `/profile/address` Show form to modify address.
* POST `/profile/address` Modify address.

## Account

* GET `/account` User account overview.
* GET `/account/email` Show form to modify email
* POST `/account/email` Modify email.
* GET `/account/password` Show form to modify password.
* POST `/account/password` Modify password.
* POST `/account/request-verification` Send a verfication letter to user's current email.

* GET `/account/bind/email` Ask wechat logged in user to bind an email account.
* POST `/account/bind/email` Check the whether email wechat-user entered already exists
* GET `/account/bind/login` Show login if the email wechat-user entered already exists in the previously step.
* POST `/account/bind/login` Email login. Redirect user to `/account/bind/merge`.
* GET `/account/bind/merge` Show the accounts to be merged. Use could comed from `/account/bind/login` or `/login/wechat/callback`, depending on the current login method.
* POST `/account/bind/merge` Merge accounts.

## Subscription

* GET `/subscription` Show paywall if user is not a member yet, or show membership status otherwise.
* GET `/subscription/renew` Show renewal page if user is a member.
* GET `/subscription/orders` Show user's subscription orders.
* GET `/subscription/pay/:tier/:cycle` Let user select a payment method.
* POST `/subscription/pay/:tier/:cycle` Start payment.
* GET `/subscription/done/ali` Alipay returns here.
* GET `/subscription/done/wx` Query wxpay result.
* GET `/subscription/redeem` Show a input box to enter gift card code.
* POST `/subscription/redeem` Redeem a gift card.

## Starred Articles

* GET `/starred` Show a list of user starred articles.
* POST `/starred/:id/delete` Unstar an article.

## Version

* GET `/__version` Show current version.

# Error Message

Error message on UI is mostly used to show validation errors, and API error response. Since API errors are not created for reading by humans, client should convert them into human readable text.

To show errors on UI, pass an `errors` object to template. For validations errors, the `errors` object should contain fields named after the errored field's `name` attributes. For example, in the Singup page, the name attribute for email is `account[email]`, the error field for this input box should be `email` if this input field is invalid.

In cases where an error occurred not related to any form validation, an error message should be shown on a top banner. The `errors` object passed to template should contain a `message` field describing the reason of the error. This could be used as a generic error container.

```ts
interface ErrorMessage {
    message?: string;
    [index: string]: string;
}
```

# Wechat

Currently (as of April 12, 2018), OAuth 2.0 data returned by wechat are base64url encoded cryptographic random bytes.

* `code` is 24 bytes, which is 32 chars after base64url-encoded (24 * 8 / 6).
* `access_token` and `refresh_token` are 66 bytes, which is 88 chars after base64url-encoded (66 * 8 / 6 = 88).
* `openid` and `unionid` are 15 bytes, which is 20 chars after base64url-encoded (15 * 8 / 6 = 20)

You can reverse them into binary and save in database as binary type.

Note: *base64url* is slightly different from *base64*. You can refer to [The Base16, Base32, and Base64 Data Encodings](https://tools.ietf.org/html/rfc4648). Here's a summary of the difference:

Some characters in base64 are replaced in base64url with URL and filename safe alphabet:

Position | base64 | base64url
-------- | ------ | --------
62 | `+` | `-`
63 | `/` | `_`
(pad) | `=` | removed

To get the binary data in Node.js:

```js
const str = 'your-token-string';
// 1. Turn to base 64 encoding:
const base64Str = (str + '==='.slice((str.length + 3) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
// 2. Base 64 string to buffer:
cosnt buf = Buffer.from(base64Str, 'base64');
```

In Golang, standard libary actually provides variables to manipulate base64 and base64url encoding and decoding. Base64 equivalent is `StdEncoding` and base64url is `RawURLEncoding`.

MySQL schema:

```sql
access_token VARBINARY(66),
refresh_token VARBINARY(66),
openid VARBINARY(15),
unionid VARBINARY(15),
UNIQUE INDEX (unionid)
```

But be careful wechat might change the lenght any time. So it might be better to store as varchar if you don't mind taking up larger disk space.

# Alipay

Alipay studpid design: Its so-called api only accepts HTML form!

Its SDK build an HTML form and automatically submit it and  then redirect to Alipay website.

```html
<form action="https://openapi.alipay.com/gateway.do?method=alipay.trade.page.pay&app_id=2018053060263354&charset=utf-8&version=1.0&sign_type=RSA2&timestamp=2019-03-28%2011%3A41%3A38&notify_url=http%3A%2F%2Fwww.ftacademy.cn%2Fapi%2Fsandbox%2Fcallback%2Falipay&sign=kHoLkQHZMQ1TC4LNcptrjx73G05QMZihGuw9iic3Me7CUCIQNsdkGBISiordNtodO2yJRGLbeKYoG5w7ELyiZFshj%2FjY1d4vfCYpFtpGa2DMYs1vP4aO425SLpBKG4OYsDVYTpXY%2FRUzvAcB83HILbXvTtVCsx6cPzskkYmRRplV7W6KOCm5XbNixKB76QuJooRHkqgPxpo%2F%2BchjcSEfb96twutnE1pzPu%2FjpkeU3ES3ARt2j%2FjXhj9Z3%2FmfistAnMzqNfRMDQfKrtLpTX%2BEk%2BgeqIQZur3ah0wCAuGWNVqkIgGN9ef9682RYrzVlMKcFBlW3ewfDoF5LLEP4Ae5IA%3D%3D" method="post" name="alipaySDKSubmit1553744498693" id="alipaySDKSubmit1553744498693">
    <input type="hidden" name="alipay_sdk" value="alipay-sdk-nodejs-3.0.4" />
    <input 
        type="hidden" 
        name="biz_content" 
        value="{&quot;out_trade_no&quot;:&quot;FT5d616b25d44352464b258a1849d2a3730f12a51a3b04df548cb82d62b2ab3dae&quot;,&quot;product_code&quot;:&quot;FAST_INSTANT_TRADE_PAY&quot;,&quot;total_amount&quot;:&quot;0.0.1&quot;,&quot;subject&quot;:&quot;会员测试&quot;}" />   
</form>      
<script>
    document.forms["alipaySDKSubmit1553744498693"].submit();
</script>
```
