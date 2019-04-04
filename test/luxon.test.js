const { DateTime } = require("luxon");

test("diff", () => {
  const expireTime = DateTime.fromISO("2019-05-01");
  const now = DateTime.local();

  console.log(now.toISO());
  console.log(expireTime.diff(now, "days").toObject());

  // Use this one to get an int
  console.log(now.startOf("day").toISO())
  console.log(expireTime.diff(now.startOf("day"), "days").toObject());

  // This one usually returns a float.
  console.log(now.endOf("day").toISO());
  console.log(expireTime.diff(now.endOf("day"), "days").toObject());
});

test("start", () => {
  const now = DateTime.local();

  console.log(now.startOf("day").toISO());
});
