const querystring = require('querystring');
const request = require('request');
const mongoHelper = require('./mongoHelper');

const session = function(s, ro){
	console.log(s);
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
			if(JSON.parse(res.body).session){
				let _ro = {...ro, sessionID:s, result:true, error: false};
	/*
				let ro = {
					sessionID: s,
					result: true,
					ro: ro,
					error: false
				};
	*/
				resolve(_ro);
			}else{				
				reject({type: 'session', val:false});
			}
		});
	});
};

function sessionError(val){
	this.value = val;
}

module.exports = session;
