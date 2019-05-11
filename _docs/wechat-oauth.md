## Sequence

```mermaid
sequenceDiagram
    participant N as NextAPI
    participant U as NextUser
    participant W as WechatServer
    participant S as SubscriptionAPI
    U->>W: Redirect for an OAuth code 
    W->>S: Redirect with code
    S->>U: Redirect with code
    U->>S: POST code to subs-api to get userinfo
    S->>W: GET access token
    W->>S: Returns access token
    S->>W: GET userinfo with access token
    W->>S: Returns userinfo
    S->>U: Save userinfo and returns a session id
    U->>N: GET user account with session id
    N->>U: Return user wechat account
```

## Flow

```mermaid
graph TB
start["/login/wechat<br/>+ctx.session.state"]-->wechat["GET https://open.weixin.qq.com/connect/qrconnect?<br/>appid=xxx<br/>redirect_uri=xxx&<br/>response_type=xxx&<br/>scope=xxx&state=xxx"]

wechat-->transfer["GET {subs-api}/wx/oauth/callback?<br/>code=xxx&state=xxx"]

transfer-->callback["/login/wechat/callback?<br/>code=xxx&state=xxx<br/>"]

callback-->login["POST {subs-api}/wx/oauth/login"]

login-->account["GET {next-api}/wx/account<br/>-ctx.session.state"]

account-->loggedin{"Is already logged in?"}

loggedin-->|Yes|bind("Redirect /account/bind/merge<br/>+ctx.session.uid")

loggedin-->|No|fta{"Is ctx.session.oauth found?"}

fta-->|Yes|authorize("Redirect /oauth2/authorize?<br/>response_type=code&<br/>client_id=xxxx&<br/>redirect_uri=xxx&<br/>state=xxx<br/>-ctx.session.oauth")

fta-->|No|profile("/profile")
```

Parameters to request for oauth code:

* `appid`
* `redirect_uri`: `http://www.ftacademy.cn/api/sandbox/wx/oauth/callback` or `http://www.ftacademy.cn/api/v1/wx/oauth/callback`
* `response_type=code`
* `scope=snsapi_login`
* `state` Random string
