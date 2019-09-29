import "reflect-metadata";
import {
    accountSerializer,
} from "../src/models/reader";

const wxAccount = `{
	"id": "",
	"unionId": "tvSxA7L6cgl8nwkrScm_yRzZoVTy",
	"stripeId": null,
	"userName": null,
	"email": "",
	"isVerified": false,
	"avatarUrl": null,
	"isVip": false,
	"loginMethod": "wechat",
	"wechat": {
		"nickname": "quam",
		"avatarUrl": "http://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTIibCfVIicoNXZ15Af6nWkXwq5QgFcrNdkEKMHT7P1oJVI6McLT2qFia2ialF4FSMnm33yS0eAq7MK1cA/132"
	},
	"membership": {
		"id": null,
		"tier": null,
		"cycle": null,
		"expireDate": null,
		"payMethod": null,
		"autoRenew": false,
		"status": null,
		"vip": false
	}
}`;

test("wx-account", () => {
    const account = accountSerializer.parse(wxAccount)!;

    console.log(`Is ftc only: ${account.isFtcOnly()}`);
    console.log(`Is verified: ${account.isVerified}`);

    expect(account.getDisplayName()).toBe("quam");
    expect(account.isWxOnly()).toBeTruthy();
    expect(account.isFtcOnly()).toBeFalsy();
    expect(account.isVerified).toBeFalsy();
    expect(account.isLinked()).toBeFalsy();
    expect(account.nagVerifyEmail()).toBeFalsy();
});

