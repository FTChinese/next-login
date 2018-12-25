const moment = require("moment");
// See https://momentjs.com/docs/#/displaying/ for moment format string
const LAYOUT = Object.freeze({
  ISO8601: "YYYY-MM-DDTHH:mm:ssZ",
  SQL_DATETIME: "YYYY-MM-DD HH:mm:ss",
  SQL_DATE: "YYYY-MM-DD",
  CST: "YYYY年MM月DD日 HH:mm:ss 北京时间(UTC+08:00)"
});

const OFFSET = Object.freeze({
  UTC: 0,
  BEIJING: 8,
})

class TimeFormatter {
  constructor({offset = 0, format = LAYOUT.ISO8601}={}) {
    this.offset = offset;
    this.format = format;
  }

  /**
   * @param {string} value - ISO8601 date string: 2018-11-11T16:00:00Z
   * @return {string}
   */
  fromISO8601(value) {
    const mmt = moment(value, LAYOUT.ISO8601);

    // As of version 2.13.0, when in UTC mode, the default format is governed by moment.defaultFormatUtc which is in the format YYYY-MM-DDTHH:mm:ss[Z]. This returns Z as the offset, instead of +00:00
    if (this.offset == 0) {
      return mmt.utc().format();
    }

    return mmt.utcOffset(this.offset).format(this.format);
  }

  /**
   * @param {moment} value 
   * @return {string}
   */
  fromMoment(value) {
    if (this.offset == 0) {
      return mmt.utc().format();
    }

    return value.utcOffset(this.offset).format(this.format);
  }
}

/**
 * Fromat any time into China Standard Time in UTC+08:00.
 */
exports.cstFormatter = new TimeFormatter({
  offset: OFFSET.BEIJING,
  format: LAYOUT.CST,
});

/**
 * Format any time into ISO8601 string in UTC.
 */
exports.iso8601Formatter = new TimeFormatter({
  offset: OFFSET.UTC,
  format: LAYOUT.ISO8601,
});

exports.dateFormatter = new TimeFormatter({
  offset: OFFSET.UTC,
  format: LAYOUT.SQL_DATE,
});

/**
 * @param {string} value
 */
exports.parseDateTime = function(value) {
  const len = value.length;

  switch (len) {
    case 10:
    case 19:
      return moment(value, LAYOUT.SQL_DATETIME.substr(0, len));

    default:
      throw new Error(`Cannot parse ${value} as a valid data time`);
  }
}

exports.LAYOUT = LAYOUT;