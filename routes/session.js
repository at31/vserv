const querystring = require('querystring');
const request = require('request');

const session = function(s){
		return new Promise((resolve, reject)=>{
		request({
		    headers: {
		    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		    'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
		    'Accept-Encoding': 'gzip, deflate, br',
		    'Referer': 'https://www.vsopen.ru/app/add/start',
		    'Cookie':`${s}`,
		    'Connection': 'keep-alive'
		    },
		    uri: 'https://www.vsopen.ru/app/ajaxjson/session',
		    method: 'GET'
		  }, function (err, res, body) {
		    console.log('error:', err);
		    console.log('session ======= >>>> ', JSON.parse(res.body).session);
				resolve(JSON.parse(res.body).session);
	  });
	});
}

module.exports = session;
