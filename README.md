## Table of Content

* [How wechat OAuth 2.0 access token is designed](#wechat)
* [Site Map](#sitemap)
* [Sending Emails](#emails)

To run the test you have to have those fields set in you environment variable (and a running SQL database with actually data populated). Refer to `sql-schema` repo on GitLab. 

```
export OAUTH_ENDPOINT_TOKEN='http://localhost:9001/token'
export N_LOGIN_CLIENT_ID='<random-string>'
export N_LOGIN_CLIENT_SECRET='<random-string>'

export N_TEST_UUID='<uuid>'
export N_TEST_TOKEN='<random-string>'
```

To run this app locally, you must:
1. Populate MySQL with OAuth 2.0 data; see `sql-schema/oauth`
2. Populate MySQL with some example user data. You can run `TestCreateUser` function in `next-api/usermodel/account_test.go` to generate random demo data.
2. Compile and launch `oauth-provider` app;
3. Compile and launch `next-api` app;
4. Install and run Redis.

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
access_token BINARY(66),
refresh_token BINARY(66),
openid BINARY(15),
unionid BINARY(15),
UNIQUE INDEX (unionid)
```

But be careful wechat might change the lenght any time. So it might be better to store as varchar if you don't mind taking up larger disk space.

## Sitemap

### User Signup
* GET /user/signup
* POST /user/signup
* GET /user/signup/verify/:token
* POST /user/signup/check-username
* POST /user/signup/check-email

### Reset password
* GET /user/password/reset
* POST /user/password/reset
* GET /user/password/reset/:code
* POST /user/password/reset/:code

### Login
* GET /user/login
* POST /user/login
* GET /user/login/wechat
* POST /user/login/wechat/callback
* GET /user/login/weibo

* GET /user/logout

### Profile

The following requires authentication.

* /user/profile
* /user/profile/account
* /user/profile/email
* /user/profile/password
* /user/profile/notification
* /user/profile/membership
* /user/profile/address

## Emails

NOTE: Currently sending email to user is embedded in this app powered by [`node-mailer`](https://github.com/nodemailer/nodemailer). To accommodate future requirements and, more importantly, for easy scaling, it's better to set up a dedicated email service (exposing a restful API?) to centrally handle various email-related operations.

Send emails to user:

* Initial signup. Requries user to verify the email address. The email should expire in a few days. A user could only use basic funtionalities of the site before email verified. For example, accept user memebership only after email is correct.
* Purchased memebership. Tells user its rights and privileges, membership duration, etc..
* Prior to membership expiration. Notify user to renew subscription, othwewise membership will be discontinued.
* Password reset. If user forgot password, send reset password email which should expire in a short period, say, 3 hours.
* Daily newsletter as we already did. Remember, Newsletter should only be sent after email is verified!