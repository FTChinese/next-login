To run the test you have to have those fields set in you environment variable (and a running SQL database with actually data populated).

```
export OAUTH_ENDPOINT_TOKEN='http://localhost:9001/token'
export N_LOGIN_CLIENT_ID='<random-string>'
export N_LOGIN_CLIENT_SECRET='<random-string>'

export N_TEST_UUID='<uuid>'
export N_TEST_TOKEN='<random-string>'
```

To run this app locally, you must:
1. Populate MySQL with OAuth 2.0 data;
2. Compile and launch oauth-provider app;
3. Compile and launch next-api app;
4. Install and run Redis.

## Wechat

We use hex encoding of random bytes as state code, just for easy recognition since wechat uses base64 encoding.

Currently (as of April 12, 2018), OAuth 2.0 data returned by wechat are base64url encoded cryptographic random bytes.

* `code` is 24 bytes, which is 32 chars after base64url-encoded (24 * 8 / 6).
* `access_token` and `refresh_token` are 66 bytes, which is 88 chars after base64url-encoded (66 * 8 / 6 = 88).
* `openid` and `unionid` are 15 bytes, which is 20 chars after base64url-encoded (15 * 8 / 6 = 20)

You can reverse them into binary and save in database as binary type.

Note: not base64 decode. They are slightly different. You can refer to [The Base16, Base32, and Base64 Data Encodings](https://tools.ietf.org/html/rfc4648). Here's a summary of the difference:

Characters in base 64
```
62 +
63 -
pad =
```

are replaced in base 64 encoding with URL and filename safe alphabet with:
```
62 -
63 _
```
and padding sign `=` are removed.

To get the binary data:
```js
const str = 'your-token-string';
// 1. Turn to base 64 encoding:
const base64Str = (str + '==='.slice((str.length + 3) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
// 2. Base 64 string to buffer:
cosnt buf = Buffer.from(base64Str, 'base64');
```

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

### Users
* GET /users/password/reset
* POST /users/password/reset
* GET /users/password/reset/:code
* POST /users/password/reset/:code
* GET /users/email/verification/:code

### User
* GET /user/signup
* POST /user/signup
* GET /user/login
* POST /user/login
* GET /user/login/weixin
* GET /user/logout

### Profile
* /user/profile
* /user/profile/account
* /user/profile/email
* /user/profile/password
* /user/profile/notification
* /user/profile/membership
* /user/profile/address