var express = require('express');
var router = express.Router();
const querystring = require('querystring');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

// отрефакторить, одно и то же (((
router.post('/fr-diary', function(req, res, next) {
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
     pdoc.pdata = pdata;
     res.json(pdoc);
  }).pipe(fs.createWriteStream('z.html'));
});


router.post('/diary', function(req, res, next) {

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
    var nd = $('.b-diary__top-comment>div.fr').find('a').attr('onclick').split(', ')
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
     res.json(pdoc);
  }).pipe(fs.createWriteStream('a.html'));
});

/* GET home page. */
router.post('/', function(req, res, next) {

form.login=req.body.login;
form.password=req.body.password;
let url = req.body.url;
let pdoc={};
let pdata=[];

request({
    headers: {
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.vsopen.ru/app/add/start',
    'Cookie':'JSESSIONID=D9F306450F621DD5C80AB422630CC682;',
    'Connection': 'keep-alive'
    },
    uri: 'https://www.vsopen.ru/app/ajaxjson/session',
    method: 'GET'
  }, function (err, res, body) {
    console.log('error:', err);
    console.log('res ======= >>>> ', JSON.parse(res.body).session);


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


  	 res.json({});
  }).pipe(fs.createWriteStream('a.html'));
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
    'Cookie':JSESSIONID,
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
          $(td).addClass('headcol')
        }
    });
    });
    // let table = $('div.class-journal-grid').html();
    // table = table.replace('class="tbl-students mt10 standart-table-colored">','class="q-table cell-separator"')
    res.json({"htmldata": $(table).html()});
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
  _html = _html.replace('file icon-comment', 'fa file')
  return _html;
}
