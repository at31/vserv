var express = require('express');
var router = express.Router();
const querystring = require('querystring');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

let JSESSIONID='';
var form = {
	login: 'Timonovs2008',
	password: 'nTimonovs19',
	submit: '%D0%92%D0%BE%D0%B9%D1%82%D0%B8'
};

router.post('/', function(req,res){
	form.login=req.body.login;
	form.password=req.body.password;
	var formData = querystring.stringify(form);
	var contentLength = formData.length;
	request({
		headers: {
			'Content-Length': contentLength,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		uri: 'https://www.vsopen.ru/app/login',
		body: formData,
		method: 'POST'
	}, function (err, _res, body) {
		console.log('error:', err);
		let jresponse={status:'', cookie:''};
		if(_res.headers['location']==='https://www.vsopen.ru/app/login&fail')
		{
			jresponse.status = 'login-fail';
		}else if(_res.headers['location']==='https://www.vsopen.ru/app/add/start'){
			jresponse.status = 'login-success';
			jresponse.cookie = _res.headers['set-cookie'][0].split(' ')[0];//.replace(';','');
		}
		res.json(jresponse);
	});
});

module.exports = router;
