const express = require('express');
const router = express.Router();
const trySession = require('./session');
const MongoClient = require('mongodb').MongoClient;
const test = require('assert');
const mongodb = require('mongodb');
const moment = require('moment');
moment().format();
moment.locale('ru');

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

module.exports = router;
