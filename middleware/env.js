const isProduction = process.env.NODE_ENV === 'production';
const debug = require("debug")('user:env');
const pkg = require("../package.json");

const matrix = [
	{
		"title": "支持",
		"items": [
			{
				"text": "关于我们",
				"href": "http://www.ftchinese.com/m/corp/aboutus.html"
			},
			{
				"text": "职业机会",
				"href": "http://www.ftchinese.com/jobs/?from=ft"
			},
			{
				"text": "问题回馈",
				"href": "http://www.ftchinese.com/m/corp/faq.html"
			},
			{
				"text": "联系方式",
				"href": "http://www.ftchinese.com/m/corp/contact.html"
			}
		]
	},
	{
		"title": "法律事务",
		"items": [

			{
				"text": "服务条款",
				"href": "http://www.ftchinese.com/m/corp/service.html"
			},
			{
				"text": "版权声明",
				"href": "http://www.ftchinese.com/m/corp/copyright.html"
			}
		]
	},
	{
		"title": "服务",
		"items": [
			{
				"text": "广告业务",
				"href": "http://www.ftchinese.com/m/corp/sales.html"
			},
			{
				"text": "会议活动",
				"href": "http://www.ftchinese.com/m/events/event.html"
			},
			{
				"text": "会员信息中心",
				"href": "http://www.ftchinese.com/m/marketing/home.html"
			},
			{
				"text": "最新动态",
				"href": "http://www.ftchinese.com/m/marketing/ftc.html"
			},
			{
				"text": "合作伙伴",
				"href": "http://www.ftchinese.com/m/corp/partner.html"
			}
		]
	},
	{
		"title": "关注我们",
		"items": [
			{
				"text": "微信",
				"href": "http://www.ftchinese.com/m/corp/follow.html"
			},
			{
				"text": "微博",
				"href": "http://weibo.com/ftchinese"
			},
			{
				"text": "Linkedin",
				"href": "https://www.linkedin.com/company/4865254?trk=hp-feed-company-name"
			},
			{
				"text": "Facebook",
				"href": "https://www.facebook.com/financialtimeschinese"
			},
			{
				"text": "Twitter",
				"href": "https://twitter.com/FTChinese"
			}
		]
	},
	{
		"title": "FT产品",
		"items": [
			
			{
				"text":"FT研究院",
				"href": "http://www.ftchinese.com/m/marketing/intelligence.html"
			},
			{
				"text":"FT商学院",
				"href": "http://www.ftchinese.com/channel/mba.html"
			},
			{
				"text":"FT电子书",
				"href": "http://www.ftchinese.com/m/marketing/ebook.html"
			},
			{
				"text":"数据新闻",
				"href": "http://www.ftchinese.com/channel/datanews.html"
			},
			{
				"text": "FT英文版",
				"href": "https://www.ft.com/"
			}
		]
	}
];

module.exports = function() {
  return async (ctx, next) => {
    
    ctx.state.env = {
      isProduction,
      /**
       * @todo Use timezone +08:00 since server time is probably not using China Standard Time. 
       * This problems might merge on the first day of each year: At 00:00 of 1 January, China already entered a new year while this page is still showing last year due to UTC lagging 8 hours behind.
       */
      year: new Date().getFullYear(),
			footer: matrix,
			version: pkg.version,
    };

    await next();
  }
}