var express = require('express');
var router = express.Router();
const querystring = require('querystring');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const trySession = require('./session');

router.post('/',(req,res)=>{
	// trySession('27FE072E3AD85CB8E0DED694C7D9E320').then((session)=>{
	trySession(req.body.sescookie).then((session)=>{
		console.log("SESSION",session);
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
						console.log('headers', __res.headers);
						var $ = cheerio.load(__res.body,{decodeEntities: false,ignoreWhitespace: true});
						pdoc.studentFIO=$('div.widget_header').children('h2').text().trim();
						pdoc.currentYear=$('div.content').children('div.current').text().trim();
						var pd = $('.b-diary__top-comment>div.fl').find('a').attr('onclick').split(', ');
						console.log('pd ', pd);
						pdoc.prevDateLink=pd[3].replace(');','');
						pdoc.studentID = pd[2];
						var nd = $('.b-diary__top-comment>div.fr').find('a').attr('onclick').split(', ')
						pdoc.nextDateLink=nd[3].replace(');','');
						var diary = $('.b-diary__day-group__item');
						diary.each((i, el)=>{
							let day = {};
							day.title = $(el).find('div.b-diary__day-date>span').text();
							console.log('--------------- '+ day.title + '-------------');

							day.data = [];
							var trs = $(el).find('table>tbody');
							trs.children().each((i,tr)=>{
								let d = {
									'dayNumber' :clearHTML($(tr).children('.diary-day__number').text()),
									'dayLessons' :clearHTML($(tr).children('.diary-day__lessons').text()),
									'dayHW' :clearHTML($(tr).children('.diary-day__hw').text()),
									'dayFile' :clearHTML($(tr).children('.diary-day__file').html()),
									'dayRating' :clearHTML($(tr).children('.diary-day__rating').text()),
									'dayRatingTitle' :!!$(tr).children('.diary-day__rating').attr('title')?$(tr).children('.diary-day__rating').attr('title'):'',
									'dayRatingExam' :$(tr).children('td').hasClass('exam'),
									'dayComment' :clearHTML($(tr).children('.diary-day__comment').html()),
									'dayCommentTitle' :$(tr).children('.diary-day__comment').children('i').attr('title')?$(tr).children('.diary-day__comment').children('i').attr('title'):''
								}
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
						res.json(pdoc);
					}).pipe(fs.createWriteStream('z.html'));
		 }else{
			 		pdoc.session = false;
			 		res.json(pdoc);
		 }
	}).catch((e)=>{
		console.log('===================server-error================', e);
		res.json({
			"server-status": "error",
			"error": e
		});
	});
});

function clearHTML(_html){
  _html = _html.replace('\n','').trim().replace('icon-comment','fa fa-comments-o');
  _html = _html.replace('file icon-comment', 'fa file')
  return _html;
}

module.exports = router;
