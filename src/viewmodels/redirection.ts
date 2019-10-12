export type KeyUpdated = "saved" | "email_changed" | "letter_sent" | "password_saved";

const updatedMsg: Record<KeyUpdated, string> = {
    saved: "保存成功！",
    email_changed: "邮箱已更新，验证邮件已经发送到您的新邮箱，请及时验证",
    letter_sent: "验证邮件已发送",
    password_saved: "密码修改成功"
}

export function getMsgUpdated(key: KeyUpdated): string {
    return updatedMsg[key];
};

export type KeyPwReset = "invalid_token" | "letter_sent" | "pw_reset";

const pwResetMsg: Record<KeyPwReset, string> = {
    invalid_token: "无法重置密码。您似乎使用了无效的重置密码链接，请重试",
    letter_sent: "请检查您的邮件，点击邮件中的“重置密码”按钮修改您的密码。如果几分钟内没有看到邮件，请检查是否被放进了垃圾邮件列表。",
    pw_reset: "密码已更新",
};

export function getMsgReset(key: KeyPwReset): string {
    return pwResetMsg[key];
}
