const querystring = require('querystring');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const trySession = require('./session');

let JSESSIONID='';
var form = {
	login: 'Timonovs2008',
	password: 'nTimonovs19',
	submit: '%D0%92%D0%BE%D0%B9%D1%82%D0%B8'
};

var formData = querystring.stringify(form);
var contentLength = formData.length;

// get a class rooms list
let getClassrooms = function(ro){
	let sessionID = ro.sessionID;
	let _url = 'https://www.vsopen.ru/app/add/schedulingLesson';

	return new Promise((resolve, reject) =>{
		request({
			headers: {
				'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
				'Accept-Encoding': 'gzip, deflate, br',
				'Referer': 'https://www.vsopen.ru/',
				'Cookie':sessionID,
				'Connection': 'keep-alive'
			},
			uri: _url,
			method: 'GET'
		}, function (err, __res, body) {
			console.log('err ', !!err);
			if(!!err){
				console.log('error:', err);
				reject({load_error: err});
			}else {
				// var pdoc = [];
				var pdoc = {};
				var $ = cheerio.load(__res.body,{decodeEntities: false,ignoreWhitespace: true});

				$('select.roomselect option').each((indx, op)=>{
					/*
					let o={};
					o[$(op).attr('value')] = $(op).text().trim();
					pdoc.push(o);
					*/
					pdoc[$(op).attr('value')] = $(op).text().trim();
				});
				let wid = $('.schedulingLesson').attr('id');
				let date = $('#' + wid + '_calendar').val();
				let template = $('#' + wid + '_template').val();
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
				console.log({sessionID: sessionID, data: pdoc, wid: wid, date: date, template: template});
				resolve({sessionID: sessionID, data: pdoc, wid: wid, date: date, template: template, url: ro.url, error: false});
			}
		});
	});
};

let getSceduleData = function(ro){
	let sessionID = ro.sessionID;
	let classroms = ro.data;
	console.log('url ===>>> ',`https://www.vsopen.ru/app/ajaxjson/${ro.wid}/schedulingLesson/loadByClass?date=${ro.date}&template=${ro.template}`);
	return new Promise((resolve,reject)=>{
		request({
			headers: {
				'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
				'Accept-Encoding': 'gzip, deflate, br',
				'Referer': 'https://www.vsopen.ru/app/add/start',
				'Cookie': sessionID,
				'Connection': 'keep-alive'
			},
			uri: `https://www.vsopen.ru/app/ajaxjson/${ro.wid}/schedulingLesson/loadByClass?date=${ro.date}&template=${ro.template}`,
			method: 'GET'
		}, function (err, __res, body) {
			if(err){
				reject({load_error: err});
				console.log('load_error ', err);
			}else{
				let jdata = JSON.parse(__res.body);
				let dates = jdata.dates.map((d)=>{ return d;});
				dates.forEach((el, indx)=>{
					el.lessons = jdata.tables.filter((lssn)=>{return  lssn.dayNumber===indx;});
					el.lessons.forEach((lssn)=>{
						let arr = jdata.info.filter((inf)=>{return inf.call===lssn.id;});
						if(arr[0]){
							lssn.info = arr[0];
							lssn.info.classroom = ro.data[lssn.info.room];
							lssn.teacher = jdata.teachers[lssn.info.groupcourse];
						}else if(!arr[0]){
							lssn.info = 'empty';
						}
					});
				});
				resolve({sessionID: ro.sessionID, data: dates, wid: ro.wid, url: ro.url, error: false});
			}
		});
	});
};

let closeSchedulingLesson = function(ro) {
	console.log('ro.wid ', ro.wid);
	console.log('wid url ', `https://www.vsopen.ru/app/ajaxjson/remove/${ro.wid}`);
	return new Promise((resolve,reject)=>{
		request({
			headers: {
				'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
				'Accept-Encoding': 'gzip, deflate, br',
				'Referer': 'https://www.vsopen.ru/app/add/start',
				'Cookie': ro.sessionID,
				'Connection': 'keep-alive'
			},
			uri: `https://www.vsopen.ru/app/ajaxjson/remove/${ro.wid}`,
			method: 'GET'
		}, function (err, __res, body) {
			if(err){
				reject({load_error: err});
				console.log('load_error ', err);
			}else{
				delete ro.wid;
				resolve(ro);
			}
		});
	});
};

module.exports.getClassrooms = getClassrooms;
module.exports.getSceduleData = getSceduleData;
module.exports.closeSchedulingLesson = closeSchedulingLesson;

function clearHTML(_html){
	_html = _html.replace('\n','').trim().replace('icon-comment','fa fa-comments-o');
	_html = _html.replace('file icon-comment', 'fa file');
	return _html;
}
