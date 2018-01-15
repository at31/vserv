var express = require('express');
var router = express.Router();
const querystring = require('querystring');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

router.post('/t', function(req, res){
	request({
		headers: {
			'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
			'Accept-Encoding': 'gzip, deflate, br',
			'Referer': 'https://www.vsopen.ru/app/add/start',
			'Cookie':'JSESSIONID=F8670BF40FA5BFE90519F949DF70EDAF;',
			'Connection': 'keep-alive'
		},
		uri: 'https://www.vsopen.ru/app/ajaxjson/wx0/schedulingLesson/loadByClass?date=16.01.2018&template=111948',
		method: 'GET'
	}, function (err, __res, body) {
    let jdata = JSON.parse(__res.body);
    let dates = jdata.dates.map((d)=>{ return d});
    dates.forEach((el)=>{
      el.lessons = jdata.tables.filter((lssn)=>{return  lssn.dayNumber===el.weekday});
      el.lessons.forEach((lssn)=>{
        let arr = jdata.info.filter((inf)=>{return inf.call===lssn.id});
        if(!!arr[0]){
          lssn.info = arr[0];
          console.log('lssn.id', lssn.id);
          lssn.teacher = jdata.teachers[lssn.info.groupcourse];
        }else if(!arr[0]){
          lssn.info = 'empty'
        }
      });
    });
		res.json(dates);
	});
});

// session https://www.vsopen.ru/app/ajaxjson/session?_=1513433729040
/* GET home page. */
router.get('/fake', function(req, res, next) {

	let pdoc={};
	let pdata=[];

	request({
		headers: {
			'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
			'Accept-Encoding': 'gzip, deflate, br',
			'Referer': 'https://www.vsopen.ru/app/add/start',
			'Cookie':'JSESSIONID',
			'Connection': 'keep-alive'
		},
		uri: 'http://localhost:3000/table.html',
		method: 'GET'
	}, function (err, __res, body) {
		console.log('error:', err); // Print the error if one occurred
		var $ = cheerio.load(__res.body,{decodeEntities: false,ignoreWhitespace: true});
		let table = $('div.class-journal-grid');
		$(table).find('table').addClass('q-table');
		$(table).find('table').addClass('cell-separator');
		let tr = $(table).find('tr');
		$(tr).each((i,_tr)=>{
			$(_tr).children().each((i,td)=>{
				if(i===0 || i===1){
					$(td).addClass('headcol');
				}
			});
		});
		// let table = $('div.class-journal-grid').html();
		// table = table.replace('class="tbl-students mt10 standart-table-colored">','class="q-table cell-separator"')
		res.json({'htmldata': $(table).html()});
	}); // .pipe(fs.createWriteStream('table.html'));
});

module.exports = router;

/*
request('https://www.vsopen.ru', function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log('statusCode:', response && response.headers);

});
*/
function clearHTML(_html){
	_html = _html.replace('\n','').trim().replace('icon-comment','fa fa-comments-o');
	_html = _html.replace('file icon-comment', 'fa file');
	return _html;
}
