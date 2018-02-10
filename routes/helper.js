const express = require('express');
const router = express.Router();
const trySession = require('./session');
const MongoClient = require('mongodb').MongoClient;
const test = require('assert');
const mongodb = require('mongodb');
const moment = require('moment');
moment().format();
moment.locale('ru');

const GphApiClient = require('giphy-js-sdk-core');
const client = GphApiClient('f4m2bZ3A7ec9acqcPlPTFREn3HSaSS8a');

const url = 'mongodb://localhost:27017';
const dbName = 'tbot';

router.post('/', (req, res)=>{
	console.log(req.body.doc);
	MongoClient.connect(url, function (err, client) {
		const db = client.db(dbName);
		db.collection('diaryinfo').insertOne(req.body.doc).then((num)=>{
			console.log(num);
			res.json({'error': false});
		});
	});
});

router.get('/gif/:query', (req,res)=>{
	let offset = Math.floor(Math.random()*10);
	client.search('gifs', {'q': req.params.query, 'offset': offset})
		.then((response) => {
			response.data.forEach((gifObject) => {
				console.log(gifObject.bitly_url, 'offset', offset);
				res.setHeader('Last-Modified', (new Date()).toUTCString());
				res.json(gifObject);
			});
		})
		.catch((err) => {

		});

});

module.exports = router;
