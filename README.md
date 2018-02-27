To run the test you have to have those fields set in you environment variable (and a running SQL database with actually data populated).

```
export OAUTH_ENDPOINT_TOKEN='http://localhost:9001/token'
export N_LOGIN_CLIENT_ID='<random-string>'
export N_LOGIN_CLIENT_SECRET='<random-string>'

export N_TEST_UUID='<uuid>'
export N_TEST_TOKEN='<random-string>'
```