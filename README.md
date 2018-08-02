## Table of Content

* [Site Map](#sitemap)
* [Wechat OAuth 2.0 access token](#wechat)
* [Sending Emails](#emails)

To run the test you have to have those fields set in you environment variable (and a running SQL database with actually data populated). Refer to `sql-schema` repo on GitLab. 

## Load test
```
vegeta attack -targets=targets.txt -rate=100 -duration=60s > results.bin
vegeta report -inputs=results.bin -reporter=plot > plot.html
```
## Sitemap

### Signup
* GET `/signup`
* POST `/signup`
* POST `/signup/check-username`
* POST `/signup/check-email`

### Subscribe

* GET `/plan`

### Reset password
* GET `/password-reset` Ask user to enter email
* POST `/password-reset` User entered email
* GET `/password-reset/:token` User clicked reset link.
* POST `/password-reset/:token`  User submitted new password

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
* GET `/email/confirm-verification/:token` Verify email
* GET `/account`
* POST `/account/password`
* POST `/account/name`
* POST `/account/mobile`
* GET `/membership`
* GET `/address`

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

## Emails

* Initial signup. Requries user to verify the email address. The email should expire in a few days. A user could only use basic funtionalities of the site before email verified. For example, accept user memebership only after email is correct.
* Purchased memebership. Tells user its rights and privileges, membership duration, etc..
* Prior to membership expiration. Notify user to renew subscription, othwewise membership will be discontinued.
* Password reset. If user forgot password, send reset password email which should expire in a short period, say, 3 hours.
* Daily newsletter as we already did. Remember, Newsletter should only be sent after email is verified!