const { DateTime, Info } = require("luxon");

console.log(DateTime.local().toFormat("yyyy年LL月dd日 HH:mm:ss"));

console.log(DateTime.fromISO("2017-05-15T08:30:00Z").setZone("Asia/Shanghai").toFormat("yyyy年LL月dd日 HH:mm:ss"));

console.log(Info.features().zones);