const request = require('superagent');
const Router = require('koa-router');
const debug = require('debug')('user:order');

const render = require('../../util/render');
const { nextApi } = require("../../lib/endpoints");
const sitemap = require("../../lib/sitemap");
const { isAPIError, buildApiError } = require("../../lib/response");

const router = new Router();

module.exports = router.routes();