const { DateTime, Info } = require("luxon");
const { parse, format } = require("date-fns");

console.log(DateTime.local().toFormat("yyyy年LL月dd日 HH:mm:ss"));

console.log(DateTime.fromISO("2017-05-15T08:30:00Z").toFormat("yyyy年LL月dd日 HH:mm:ss"));

console.log(Info.features().zones);

console.log(format(parse("2017-05-15T08:30:00Z"), "YYYY年MM月DD日 HH:mm:ss"));