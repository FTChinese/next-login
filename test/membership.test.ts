const Membership = require("../model/member");

test("membership", () => {
  const member = new Membership({
    tier: "standard",
    cycle: "year",
    expireDate: "2019-07-01"
  });

  expect(member.tier).toBe("standard");
  expect(member.cycle).toBe("year");
  expect(member.expireDate).toBe("2019-07-01");

  expect(member.isMember()).toBeTruthy();

  console.log(member.remainingDays());
});
