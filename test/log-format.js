const {format} = require('logform');

const formatter = format.json();

const info = formatter.transform({
  level: 'info',
  message: 'hello world'
}, {});

console.dir(info);

const simpleFormat = format.simple();

const simpleInfo = simpleFormat.transform({
  level: 'info',
  message: 'hello world',
  extra: 'Bonjour'
});

console.log(simpleInfo);

const timeFormat = format.timestamp();
const timeInfo = timeFormat.transform({
  level: 'info',
  message: 'hello world'
}, {alias: 'recordedAt'});
console.dir(timeInfo);

const splatFormat = format.splat();
const splatInfo = splatFormat.transform({
  level: 'info',
  message: 'The app is running on %o',
  splat: [{a: 1}]
});
console.log(splatInfo);

const labelFormat = format.label();
const labelInfo = labelFormat.transform({
  level: 'info',
  message: 'Hello world'
}, {label: 'model'});
console.log(labelInfo);

const alignedWithColorsAndTime = format.combine(
  format.colorize(),
  format.timestamp(),
  format.align(),
  format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

const colorInfo = alignedWithColorsAndTime.transform({
  level: 'info',
  message: 'Hello world'
});
console.dir(colorInfo);