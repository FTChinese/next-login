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


