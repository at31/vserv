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

var formData = querystring.stringify(form);
var contentLength = formData.length;


router.post('/', function(req, res, next) {


	let pdoc={};
	let pdata=[];
	let _url = 'https://www.vsopen.ru/app/add/schedulingLesson';
	let JSESSIONID=req.body.sescookie;

	request({
		headers: {
			'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 
			'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
			'Accept-Encoding': 'gzip, deflate, br',
			'Referer': 'https://www.vsopen.ru/',
			'Cookie':JSESSIONID,
			'Connection': 'keep-alive'
		},
		uri: _url,
		method: 'GET'
	}, function (err, __res, body) {
		console.log('error:', err);
		var pdoc = [];
		var $ = cheerio.load(__res.body,{decodeEntities: false,ignoreWhitespace: true});

		$('select.roomselect option').each((indx, op)=>{
			console.log($(op).attr('value'));
			let o={};
			o[$(op).attr('value')] = $(op).text().trim();
			pdoc.push(o);
		});
		/*
    let opgr = $('select.roomselect').find('optgroup');
    console.log(opgr.children());
    opgr.children().each(op=>{
      console.log(op);
      var name = $(op).attr('value');
      var val = $(op).text();
      pdoc.push({name:val})
    });
    */
		res.json(pdoc);
	}).pipe(fs.createWriteStream('ClassRooms.html'));
});

function clearHTML(_html){
	_html = _html.replace('\n','').trim().replace('icon-comment','fa fa-comments-o');
	_html = _html.replace('file icon-comment', 'fa file');
	return _html;
}


module.exports = router;