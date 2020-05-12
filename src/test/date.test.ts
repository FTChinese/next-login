import { differenceInCalendarDays, parseISO, isBefore, isSameDay, isAfter } from 'date-fns';

const expireDate = '2021-05-20';

const expiresOn = parseISO(expireDate);

console.log(expiresOn);

console.log(differenceInCalendarDays(expiresOn, new Date()));

console.log(isBefore(parseISO('2020-05-12'), new Date()));

console.log(isSameDay(parseISO('2020-05-12'), new Date()));

console.log(isAfter(parseISO('2020-05-12'), new Date()));
