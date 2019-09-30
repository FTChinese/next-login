const prefix = "";

export const entranceMap = {
    signup:         `${prefix}/signup`,
    passwordReset:  `${prefix}/password-reset`,
    login:          `${prefix}/login`,
    wxLogin:        `${prefix}/login/wechat`,
    authorize:      `${prefix}/oauth2/authorize`,
    logout:         `${prefix}/logout`,
};

export const profileMap = {
    base:         `${prefix}/profile`,
    displayName:    `${prefix}/profile/display-name`,
    mobile:         `${prefix}/profile/mobile`,
    personal:       `${prefix}/profile/info`,
    address:        `${prefix}/profile/address`,
};

export const accountMap = {
    base:               `${prefix}/account`,
    email:              `${prefix}/account/email`,
    password:           `${prefix}/account/password`,
    requestVerification: `${prefix}/account/request-verification`,
    linkEmail:      `${prefix}/account/link/email`,
    linkFtcLogin:   `${prefix}/account/link/login`,
    linkMerging:    `${prefix}/account/link/merge`,
    linkSignUp:         `${prefix}/account/link/signup`,
    unlinkWx:       `${prefix}/account/unlink`,
};

export const subsMap = {
    base:           `${prefix}/subscription`,
    test:           `${prefix}/subscription/test`,
    renewal:        `${prefix}/subscription/renew`,
    // payment: function(tier, cycle) {
    //     return `${prefix}/subscription/pay/${tier}/${cycle}`;
    // },
    alipayDone:     `${prefix}/subscription/done/ali`,
    wxpayDone:      `${prefix}/subscription/done/wx`,
    redeem:         `${prefix}/subscription/redeem`,
    aliReturnUrl: `http://next.ftchinese.com/user/subscription/done/ali`,
}

export const starredMap = {
    base: `${prefix}/starred`,
}
