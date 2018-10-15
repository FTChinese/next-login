/**
 * @type {Account} account
 * @returns {UserSession}
 */
exports.accountToSess = function(account) {
  return {
    id: account.id,
    name: account.userName,
    avatar: account.avatar,
    vip: account.isVip,
    vrf: account.isVerified,
    mbr: {
      tier: account.membership.tier,
      start: account.membership.startAt,
      exp: account.membership.expireAt,
    }
  };
};

/**
 * @type {UserSession}
 * @returns {Account}
 */
exports.sessToAccount = function(sess) {
  return {
    id: sess.id,
    userName: sess.name,
    avatar: sess.avatar,
    isVip: sess.vip,
    isVerified: sess.vrf,
    membership: {
      tier: sess.mbr.tier,
      startAt: sess.mbr.start,
      expireAt: sess.mbr.exp,
    }
  };
};