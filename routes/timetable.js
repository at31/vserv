var express = require('express');
var router = express.Router();
const querystring = require('querystring');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const trySession = require('./session');
const schedule = require('./schedule');

//
router.post('/start',(req, res)=>{
	// trySession('27FE072E3AD85CB8E0DED694C7D9E320').then((session)=>{
	trySession(req.body.sescookie).then((session)=>{
		console.log('SESSION',session);
		if(session){
			let pdoc={};
			let pdata=[];

			let JSESSIONID=req.body.sescookie;
			console.log('JSESSIONID', JSESSIONID);
			request({
				headers: {
					'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
					'Accept-Encoding': 'gzip, deflate, br',
					'Referer': 'https://www.vsopen.ru/app/add/start',
					'Cookie':JSESSIONID,
					'Connection': 'keep-alive'
				},
				uri: 'https://www.vsopen.ru/app/add/studentDiary',
				method: 'GET'
			}, function (err, __res, body) {
				console.log('error:', err);


				console.log('__res ', __res.headers);
				// console.log('===========================', body);

				var $ = cheerio.load(__res.body,{decodeEntities: false,ignoreWhitespace: true});

				pdoc.studentFIO=$('div.widget_header').children('h2').text().trim();
				pdoc.currentYear=$('div.content').children('div.current').text().trim();
				var pd = $('.b-diary__top-comment>div.fl').find('a').attr('onclick').split(', ');
				console.log('pd ', pd);
				pdoc.prevDateLink=pd[3].replace(');','');
				pdoc.studentID = pd[2];
				var nd = $('.b-diary__top-comment>div.fr').find('a').attr('onclick').split(', ');
				pdoc.nextDateLink=nd[3].replace(');','');
				console.log('nd ', pdoc.nextDateLink);

				var diary = $('.b-diary__day-group__item');
				diary.each((i, el)=>{
					let day = {};
					day.title = $(el).find('div.b-diary__day-date>span').text();
					console.log('--------------- '+ day.title + '-------------');

					day.data = [];
					var trs = $(el).find('table>tbody');
					trs.children().each((i,tr)=>{
						let d = {
							'id': i,
							'dayNumber' :clearHTML($(tr).children('.diary-day__number').text()),
							'dayLessons' :clearHTML($(tr).children('.diary-day__lessons').text()),
							'dayHW' :clearHTML($(tr).children('.diary-day__hw').text()),
							'dayFile' :clearHTML($(tr).children('.diary-day__file').html()),
							'dayRating' :clearHTML($(tr).children('.diary-day__rating').text()),
							'dayRatingTitle' :$(tr).children('.diary-day__rating').attr('title')?$(tr).children('.diary-day__rating').attr('title'):'',
							'dayRatingExam' :$(tr).children('td').hasClass('exam'),
							'dayComment' :clearHTML($(tr).children('.diary-day__comment').html()),
							'dayCommentTitle' :$(tr).children('.diary-day__comment').children('i').attr('title')?$(tr).children('.diary-day__comment').children('i').attr('title'):''
						};
						day.data.push(d);
					});
					pdata.push(day);
				});
				pdata = pdata.map((el,indx)=>{
					if(indx%2!==0)
					{
						el.indx=indx+10;
					}else if(indx%2===0){
						el.indx=indx;
					}
					return el;
				}).sort((a,b)=>{
					return a.indx-b.indx;
				});
				pdoc.pdata = pdata;
				pdoc.serverStatus = 'ok';
				pdoc.session = session;
				res.json(pdoc);
			}).pipe(fs.createWriteStream('a.html'));
		}else{
			res.json({'session':false, 'serverStatus':'ok'});
		}
	}).catch((e)=>{
		console.log('===================server-error================', e);
		res.json({
			'serverStatus': 'error',
			'error': e
		});
	});
});
//
router.post('/',(req,res)=>{
	// trySession('27FE072E3AD85CB8E0DED694C7D9E320').then((session)=>{
	trySession(req.body.sescookie).then((session)=>{
		console.log('SESSION',session);
		if(session){
			req.body.date = req.body.date.substring(1,req.body.date.length-1);
			req.body.userID = req.body.userID.substring(1,req.body.userID.length-1);
			console.log('req.body userID ====> ',req.body.userID);
			console.log('req.body  date ====> ',req.body.date);
			let pdoc={};
			let pdata=[];
			let _url = `https://www.vsopen.ru/app/wx0/studentDiary/view?person=${req.body.userID}&startDate=${req.body.date}`;
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
				var $ = cheerio.load(__res.body,{decodeEntities: false,ignoreWhitespace: true});
				pdoc.studentFIO=$('div.widget_header').children('h2').text().trim();
				pdoc.currentYear=$('div.content').children('div.current').text().trim();
				var pd = $('.b-diary__top-comment>div.fl').find('a').attr('onclick').split(', ');
				pdoc.prevDateLink=pd[3].replace(');','');
				pdoc.studentID = pd[2];
				var nd = $('.b-diary__top-comment>div.fr').find('a').attr('onclick').split(', ');
				pdoc.nextDateLink=nd[3].replace(');','');
				var diary = $('.b-diary__day-group__item');
				diary.each((i, el)=>{
					let day = {};
					day.title = $(el).find('div.b-diary__day-date>span').text();
					day.data = [];
					var trs = $(el).find('table>tbody');
					trs.children().each((i,tr)=>{
						let d = {
							'dayNumber' :clearHTML($(tr).children('.diary-day__number').text()),
							'dayLessons' :clearHTML($(tr).children('.diary-day__lessons').text()),
							'dayHW' :clearHTML($(tr).children('.diary-day__hw').text()),
							'dayFile' :clearHTML($(tr).children('.diary-day__file').html()),
							'dayRating' :clearHTML($(tr).children('.diary-day__rating').text()),
							'dayRatingTitle' :$(tr).children('.diary-day__rating').attr('title')?$(tr).children('.diary-day__rating').attr('title'):'',
							'dayRatingExam' :$(tr).children('td').hasClass('exam'),
							'dayComment' :clearHTML($(tr).children('.diary-day__comment').html()),
							'dayCommentTitle' :$(tr).children('.diary-day__comment').children('i').attr('title')?$(tr).children('.diary-day__comment').children('i').attr('title'):''
						};
						day.data.push(d);
					});
					pdata.push(day);
				});
				pdata = pdata.map((el,indx)=>{
					if(indx%2!==0)
					{
						el.indx=indx+10;
					}else if(indx%2===0){
						el.indx=indx;
					}
					return el;
				}).sort((a,b)=>{
					return a.indx-b.indx;
				});
				pdoc.pdata = pdata;
				pdoc.session = session;
				pdoc.serverStatus = 'ok';
				res.json(pdoc);
			}).pipe(fs.createWriteStream('z.html'));
		}else{
			res.json({'session':false, 'serverStatus':'ok'});
		}
	}).catch((e)=>{
		console.log('===================server-error================', e);
		res.json({
			'serverStatus': 'error',
			'error': e
		});
	});
});

router.post('/test',(req,res)=>{
	let session  = 'JSESSIONID=B8ABB45177BD701E6E23138A074E4296;';
	trySession(session)
	// trySession('JSESSIONID=zzz;')
		.then(schedule.getClassrooms)
		.then(schedule.getSceduleData)
		.then(schedule.closeSchedulingLesson)
		.then(startDiary)
		.then(schedule.closeSchedulingLesson)
		.then((val)=>{
			res.json(val);
		})
		.catch((e)=>{
			console.log('===================error================', e);
			res.json({
				'error': e
			});
		});
});

//start diary data function
let startDiary = function (ro) {
	let pdoc={};
	let pdata=[];

	return new Promise((resolve, reject)=>{
		request({
			headers: {
				'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
				'Accept-Encoding': 'gzip, deflate, br',
				'Referer': 'https://www.vsopen.ru/app/add/start',
				'Cookie':ro.sessionID,
				'Connection': 'keep-alive'
			},
			uri: 'https://www.vsopen.ru/app/add/studentDiary',
			method: 'GET'
		}, function (err, __res, body) {
			if(err){
				console.log('error:', err);
				reject({load_error: 'load diary start data error', error: err});
			}else{
				const $ = cheerio.load(__res.body,{decodeEntities: false,ignoreWhitespace: true});

				let wid = $('.studentDiary').attr('id');
				pdoc.studentFIO=$('#'+wid+">div.header").find($('div.widget_header')).find($('h2')).text().trim();
				pdoc.currentYear=$('#'+wid+">div.content").children('div.current').text().trim();
				var pd = $('#'+wid+">div.content").find($('.b-diary__top-comment>div.fl')).find('a').attr('onclick').split(', ');

				pdoc.prevDateLink=pd[3].replace(');','');
				pdoc.studentID = pd[2];

				var nd = $('#'+wid+">div.content").find($('.b-diary__top-comment>div.fr')).find('a').attr('onclick').split(', ');
				pdoc.nextDateLink=nd[3].replace(');','');

				var diary = $('#'+wid+">div.content").find($('.b-diary__day-group__item'));
				diary.each((i, el)=>{
					let day = {};
					day.title = $(el).find('div.b-diary__day-date>span').text();
					day.data = [];
					var trs = $(el).find('table>tbody');
					trs.children().each((i,tr)=>{
						let d = {
							'id': i,
							'dayNumber' :clearHTML($(tr).children('.diary-day__number').text()),
							'dayLessons' :clearHTML($(tr).children('.diary-day__lessons').text()),
							'dayHW' :clearHTML($(tr).children('.diary-day__hw').text()),
							'dayFile' :clearHTML($(tr).children('.diary-day__file').html()),
							'dayRating' :clearHTML($(tr).children('.diary-day__rating').text()),
							'dayRatingTitle' :$(tr).children('.diary-day__rating').attr('title')?$(tr).children('.diary-day__rating').attr('title'):'',
							'dayRatingExam' :$(tr).children('td').hasClass('exam'),
							'dayComment' :clearHTML($(tr).children('.diary-day__comment').html()),
							'dayCommentTitle' :$(tr).children('.diary-day__comment').children('i').attr('title')?$(tr).children('.diary-day__comment').children('i').attr('title'):''
						};
						day.data.push(d);
					});
					pdata.push(day);
				});
				pdata = pdata.map((el,indx)=>{
					if(indx%2!==0)
					{
						el.indx=indx+10;
					}else if(indx%2===0){
						el.indx=indx;
					}
					return el;
				}).sort((a,b)=>{
					return a.indx-b.indx;
				});
				pdoc.pdata = pdata;
				pdoc.wid = wid;

				pdoc.pdata.forEach((el, indx)=>{
					el.schedule = Object.assign({}, ro.data[indx]);
				});

				// pdoc.schedule = ro.data;
				pdoc.serverStatus = 'ok';
				pdoc.session = ro.sessionID;
				resolve(pdoc);
			}
		});
	});
};


let getDiaryByDate = function(req, res, JSESSIONID){
	req.body.date = req.body.date.substring(1,req.body.date.length-1);
	req.body.userID = req.body.userID.substring(1,req.body.userID.length-1);
	let pdoc={};
	let pdata=[];
	let _url = `https://www.vsopen.ru/app/wx0/studentDiary/view?person=${req.body.userID}&startDate=${req.body.date}`;
	// let JSESSIONID=req.body.sescookie;

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
		var $ = cheerio.load(__res.body,{decodeEntities: false,ignoreWhitespace: true});
		pdoc.studentFIO=$('div.widget_header').children('h2').text().trim();
		pdoc.currentYear=$('div.content').children('div.current').text().trim();
		var pd = $('.b-diary__top-comment>div.fl').find('a').attr('onclick').split(', ');
		pdoc.prevDateLink=pd[3].replace(');','');
		pdoc.studentID = pd[2];
		var nd = $('.b-diary__top-comment>div.fr').find('a').attr('onclick').split(', ');
		pdoc.nextDateLink=nd[3].replace(');','');
		var diary = $('.b-diary__day-group__item');
		diary.each((i, el)=>{
			let day = {};
			day.title = $(el).find('div.b-diary__day-date>span').text();
			day.data = [];
			var trs = $(el).find('table>tbody');
			trs.children().each((i,tr)=>{
				let d = {
					'dayNumber' :clearHTML($(tr).children('.diary-day__number').text()),
					'dayLessons' :clearHTML($(tr).children('.diary-day__lessons').text()),
					'dayHW' :clearHTML($(tr).children('.diary-day__hw').text()),
					'dayFile' :clearHTML($(tr).children('.diary-day__file').html()),
					'dayRating' :clearHTML($(tr).children('.diary-day__rating').text()),
					'dayRatingTitle' :$(tr).children('.diary-day__rating').attr('title')?$(tr).children('.diary-day__rating').attr('title'):'',
					'dayRatingExam' :$(tr).children('td').hasClass('exam'),
					'dayComment' :clearHTML($(tr).children('.diary-day__comment').html()),
					'dayCommentTitle' :$(tr).children('.diary-day__comment').children('i').attr('title')?$(tr).children('.diary-day__comment').children('i').attr('title'):''
				};
				day.data.push(d);
			});
			pdata.push(day);
		});
		pdata = pdata.map((el,indx)=>{
			if(indx%2!==0)
			{
				el.indx=indx+10;
			}else if(indx%2===0){
				el.indx=indx;
			}
			return el;
		}).sort((a,b)=>{
			return a.indx-b.indx;
		});
		pdoc.pdata = pdata;
		// pdoc.session = session;
		pdoc.serverStatus = 'ok';
		res.json(pdoc);
	}).pipe(fs.createWriteStream('z.html'));
};

function clearHTML(_html){
	_html = _html.replace('\n','').trim().replace('icon-comment','fa fa-comments-o');
	_html = _html.replace('file icon-comment', 'fa file');
	return _html;
}
function sessionError(val){
	this.value = val;
}
module.exports = router;
