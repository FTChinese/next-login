/**
 * @description Pagination
 * @param {number} perPage - The max number of items per page.
 * Caller should add a property `listSize` to `ctx.state.paging`, 
 * which is the length of dat a fetched, 
 * so that nunjucks know whether to show the Next button.
 */
exports.paging = function paging(perPage = 20) {
    return async (ctx, next) => {
        /**
         * @type {number}
         */
        let page = ctx.request.query.page;
        page = Number.parseInt(page, 10);

        if (!page) {
            page = 1;
        }

        // `page` and `per_page` are used as url query parameters.
        ctx.state.paging = {
            page,
            per_page: perPage,
        };

        await next();
    };
};
