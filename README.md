## Sitemap

### Signup
* GET `/signup`
* POST `/signup`
* POST `/signup/check-username`
* POST `/signup/check-email`

### Subscribe

* GET `/plan`

### Verify email
* `GET /verify/email/:token`

### Reset password
* `GET /password-reset` Ask user to enter email
* `POST /password-reset` User entered email
* `GET /password-reset/:token` User clicked reset link.
* `POST /password-reset/:token`  User submitted new password

### Login
* GET `/login`
* POST `/login`
* GET `/login/wechat`
* POST `/login/wechat/callback`
* GET `/login/weibo`
* GET `/logout`

### Settings

The following requires authentication.

* GET `/profile` Basic profile
* GET `/email` Email related data
* POST `/email` Update email
* POST `/email/newletter`
* POST `/email/request-verification` Resend verification letter
<!-- * GET `/email/confirm-verification/:token` Verify email -->
* GET `/account`
* POST `/account/password`
* POST `/account/name`
* POST `/account/mobile`
* GET `/membership`
* GET `/address`

## Error Message

Error message on UI is mostly used to show validation errors, and API error response. Since API errors are not created for reading by humans, client should convert them into human readable text.

To show errors on UI, pass an `errors` object to template. For validations errors, the `errors` object should contain fields named after the errored field's `name` attributes. For example, in the Singup page, the name attribute for email is `account[email]`, the error field for this input box should be `email` if this input field is invalid.

In cases where an error occurred not related to any form validation, an error message should be shown on a top banner. The `errors` object passed to template should contain a `message` field describing the reason of the error. This could be used as a generic error container.

Described in TypeScript:
```ts
interface ErrorMessage {
    message?: string;
    [index: string]: string;
}
```

If a form's GET and POST urls are the same one, you can attach the `errors` field to `ctx.state` and convert API error response into an `errors` object using the `buildApiError` function.

In case a form's GET and POST urls are different, you should redirect back to the GET url after POST is processed to keep URLs idempotent (See [Idempotence](https://en.wikipedia.org/wiki/Idempotence)). When redirecting, attache the `errors` object to `ctx.session`. For API error response, you can attach the response body directly to `ctx.session` and delay converting the response to `errors` object after redirected, and use the `apiErr` field instead of `errors` field:

```ts
interface Session {
    errors?: ErrorMessage;
    apiErr?: {
        message: string;
        field: string;
        code: string;
    }
}
```
## Wechat

We use hex encoding of random bytes as state code, just for easy recognition since wechat uses base64url encoding.

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

## Alipay

Alipay studip design: Its so-called api only accepts HTML form!

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
