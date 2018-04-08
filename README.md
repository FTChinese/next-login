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