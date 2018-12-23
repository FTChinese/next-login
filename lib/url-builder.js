const qs = require('querystring');
const {URL} = require('url');
const _ = require('lodash');

class UrlBuilder {
  constructor(base='') {
    if (!_.isString(base) || base === '') {
      throw new TypeError('Base url must be a string');
    }
    this._base = base;
    this._params = {};
    this._hash = '';
  }

  query(obj={}) {
    Object.assign(this._params, obj);
    return this;
  }

  hash(str='') {
    this._hash = str;
    return this;
  }

  toString() {
    const newUrl = new URL(this._base);
    if (!_.isEmpty(this._params)) {
      newUrl.search = qs.stringify(this._params);
    }

    if (!_.isEmpty(this._hash)) {
      newUrl.hash = encodeURIComponent(this._hash);
    }

    return newUrl.toString();
  }
}

module.exports = UrlBuilder;
