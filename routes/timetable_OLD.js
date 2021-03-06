var express = require('express');
var router = express.Router();
const querystring = require('querystring');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const trySession = require('./session');
const schedule = require('./schedule');
const moment = require('moment');
moment().format();
moment.locale('ru');
//
router.post('/start',(req, res)=>{
	// trySession('27FE072E3AD85CB8E0DED694C7D9E320').then((session)=>{
	trySession(req.body.sescookie).then((session)=>{

		if(session){
			let pdoc={};
			let pdata=[];

			let JSESSIONID=req.body.sescookie;

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
		if(session){
			req.body.date = req.body.date.substring(1,req.body.date.length-1);
			req.body.userID = req.body.userID.substring(1,req.body.userID.length-1);
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
	let session  = req.body.sescookie;  //'JSESSIONID=E1B107C32177A69EA7FFF0F02C29E9A1;';
	trySession(session,'')
	// trySession('JSESSIONID=zzz;')
		.then(schedule.getClassrooms)
		.then(schedule.getSceduleData)
		.then(schedule.closeSchedulingLesson)
		.then(startDiary)
		//.then(schedule.closeSchedulingLesson)
		.then((val)=>{
			res.json(val);
		})
		.catch((e)=>{
			console.log('===================error================', e);
			res.json({
				'error_body': e, 'error': true
			});
		});
});

var _url = '';
router.post('/test2', (req, res)=>{
	let session  = req.body.sescookie;  //'JSESSIONID=E1B107C32177A69EA7FFF0F02C29E9A1;';
	trySession(session,'')
		.then(startDiaryN)
		.then(getDiaryInitData)
		.then(getDiaryJSON)
		.then(schedule.closeSchedulingLesson)
		.then((val)=>{
			res.json(val);
		})
		.catch((e)=>{
			console.log('===================error================', e);
			res.json({
				'error_body': e, 'error': true
			});
		});
});
router.post('/test2date', (req, res)=>{
	let session  = req.body.sescookie;  //'JSESSIONID=E1B107C32177A69EA7FFF0F02C29E9A1;';
	let ro = {date: req.body.date, studentID: req.body.studentID, eduYearId:req.body.eduYearId};
	trySession(session, ro)
		.then(getDiaryJSON)
		.then(schedule.closeSchedulingLesson)
		.then((val)=>{
			res.json(val);
		})
		.catch((e)=>{
			console.log('===================error================', e);
			res.json({
				'error_body': e, 'error': true
			});
		});
});

router.post('/test1',(req,res)=>{
	let session  = req.body.sescookie;  //'JSESSIONID=E1B107C32177A69EA7FFF0F02C29E9A1;';
	req.body.date = req.body.date.substring(1,req.body.date.length-1);
	req.body.userID = req.body.userID.substring(1,req.body.userID.length-1);
	_url = `https://www.vsopen.ru/app/${req.body.wd}/studentDiary/view?person=${req.body.userID}&startDate=${req.body.date}`;

	trySession(session, _url)
	// trySession('JSESSIONID=zzz;')
		.then(schedule.getClassrooms)
		.then(schedule.getSceduleData)
		.then(schedule.closeSchedulingLesson)
		.then(getDiaryByDate)
		//.then(schedule.closeSchedulingLesson)
		.then((val)=>{
			res.json(val);
		})
		.catch((e)=>{
			console.log('===================error================', e);
			res.json({
				'error_body': e, 'error': true
			});
		});
});


//start diary data function
let startDiaryN = function (ro) {

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
				ro.body = __res.body;
				resolve(ro);
			}
		});
	});
};


//start diary data function
let startDiary = function (ro) {

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

				resolve(parseDiaryHTML(__res, ro));
			}
		});
	});
};

let getDiaryByDate = function (ro) {
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
			uri: ro.url,
			method: 'GET'
		}, function (err, __res, body) {
			if(err){
				console.log('error:', err);
				reject({load_error: 'load diary_by_date data error', error: err});
			}else{

				resolve(parseDiaryHTML(__res, ro));
			}
		});
	});
};

function getDiaryInitData(ro){
	return new Promise((resolve, reject)=>{

		/*
        DIARY.init({
            baseUrl: 'api/1',
            prefix: 'wx1',
            widget: 'studentDiary',
            date: 1517513815257,
            eduYearId: 1171835,
            personId: 1111111
        });
    парсим нечто такое, можно сложный regexp без вереницы const,
		но нет гарантии что это неизменный объект...
		*/
		const rgxpwx = /prefix: '([a-z0-9]+)'/i;
		const rgxpperson = /personId: (\d+)/i;
		const rgxpbaseUrl = /baseUrl: '([/a-z0-9]+)'/i;
		const rgxpdate = /date: (\d+)/i;
		const rgxpeduYearId = /eduYearId: (\d+)/i;
		const rgxpwidget = /widget: '([a-zA-Z0-9]+)'/i;
		const $ = cheerio.load(ro.body, {decodeEntities: false, ignoreWhitespace: true});

		let htmlstr = $('script').filter((i, el)=>{
			let r = false;
			if($(el).attr('type')==='text/javascript' && $(el).attr('src')===undefined){
				if($(el).html().includes('DIARY.init')){
					r = true;
				}
			}
			return r;
		}).html();
		const _ro = Object.assign({}, ro);
		_ro.wid= htmlstr.match(rgxpwx)[1];
		_ro.studentID = htmlstr.match(rgxpperson)[1];
		_ro.baseUrl = htmlstr.match(rgxpbaseUrl)[1];
		//а фиг его знает зачем мне это
		_ro.date = htmlstr.match(rgxpdate)[1];
		//это нужно для запроса
		_ro.eduYearId = htmlstr.match(rgxpeduYearId)[1];
		// ?
		_ro.widget = htmlstr.match(rgxpwidget)[1];
		_ro.studentFIO=$('#'+_ro.wid+'>div.header').find($('div.widget_header')).find($('h2')).text().trim();
		_ro.currentYear=$('#'+_ro.wid+'>div.content').children('div.current').text().trim();
		resolve(_ro);
	});
}

function getDiaryJSON(ro){
	const mdate = moment.unix(ro.date/1000);
	const startDate = mdate.startOf('week').toDate().getTime();
	// const stopDate = mdate.endOf('week').subtract(1, 'days').toDate().getTime();
	const stopDate = mdate.endOf('week').toDate().getTime();
	const url = `https://www.vsopen.ru/app/api/1/persons/${ro.studentID}/lessons?startDate=${startDate}&stopDate=${stopDate}&eduYearId=${ro.eduYearId}`;
	// ro = {...ro, mdate, startDate, stopDate}
	ro.prevDateLink = startDate-86400;
	ro.nextDateLink = stopDate+86400+86400;
	return new Promise((resolve,reject)=>{
		request({
			headers: {
				'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
				'Accept-Encoding': 'gzip, deflate, br',
				'Referer': 'https://www.vsopen.ru/app/add/start',
				'Cookie':ro.sessionID,
				'Connection': 'keep-alive'
			},
			uri: url,
			method: 'GET'
		}, function (err, __res, body) {
			if(err){
				console.log('error:', err);
				reject({load_error: 'load json diary start data error', error: err});
			}else{
				let result = [];
				let oresbody = JSON.parse(__res.body);
				var set = new Set(oresbody.entities.map((el,i)=>{
					return new Date(new Date(el.startDate).getFullYear(),
						(new Date(el.startDate).getMonth()),
						new Date(el.startDate).getDate()).getTime();
				}));
				set.forEach((el)=>{
					let nextUnixDay = el+86400000;
					let dayName = moment.unix(el/1000).format('dddd (DD.MM.YYYY)');
					dayName = dayName[0].toUpperCase() + dayName.slice(1);
					result.push({
						title: dayName,
						data: oresbody.entities.filter(lesson=>{return  (lesson.startDate>el && lesson.startDate<nextUnixDay); }) });
				});
				const _ro = Object.assign({}, ro);
				_ro.pdata = result;
				/*
				_ro.pdata.forEach((el, indx)=>{
					el.schedule = Object.assign({}, ro.data[indx]);
				});
				*/
				_ro.serverStatus = 'ok';
				_ro.session = ro.sessionID;
				_ro.error = false;
				delete _ro.body;
				delete _ro.data;
				resolve(_ro);
			}
		});

	});
}

function parseDiaryHTML(__res, ro){
	let pdoc={};
	let pdata=[];

	const $ = cheerio.load(__res.body,{decodeEntities: false,ignoreWhitespace: true});

	let js = $('script');
	js.each((i, el)=>{
		const regexp = /personId: (\d+)/i;

		if($(el).attr('type')==='text/javascript' && $(el).attr('src')===undefined){
			let htmlstr = $(el).html();
			let ma = htmlstr.match(regexp);
		}

	});

	let wid = $('.studentDiary').attr('id');
	pdoc.studentFIO=$('#'+wid+'>div.header').find($('div.widget_header')).find($('h2')).text().trim();
	pdoc.currentYear=$('#'+wid+'>div.content').children('div.current').text().trim();
	// var pd = $('#'+wid+'>div.content').find($('.b-diary__top-comment>div.fl')).find('a').attr('onclick').split(', ');

	// pdoc.prevDateLink=pd[3].replace(');','');
	pdoc.studentID = 1256986; // pd[2];

	// var nd = $('#'+wid+'>div.content').find($('.b-diary__top-comment>div.fr')).find('a').attr('onclick').split(', ');
	// pdoc.nextDateLink=nd[3].replace(');','');

	var diary = $('#'+wid+'>div.content').find($('.b-diary__day-group__item'));
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
	pdoc.error = false;

	return pdoc;
}

function clearHTML(_html){
	_html = _html.replace('\n','').trim().replace('icon-comment','fa fa-comments-o');
	_html = _html.replace('file icon-comment', 'fa file');
	return _html;
}

function sessionError(val){
	this.value = val;
}


module.exports = router;
