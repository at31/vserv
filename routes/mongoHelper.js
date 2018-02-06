const MongoClient = require('mongodb').MongoClient;
const test = require('assert');
const moment = require('moment');
moment().format();
moment.locale('ru');

const url = 'mongodb://localhost:27017';
const dbName = 'tbot';

let saveDocMongoDB = function(ro) {
	let doc = {studentID: ro.studentID, pdata: ro.pdata};
	return new Promise((resolve, reject)=>{
		MongoClient.connect(url, function (err, client) {
			if(err===null){
				const db = client.db(dbName);
				db.collection('diaryinfo').insertOne(doc, (err, r)=>{
					if(err===null){
						resolve(ro);
					}else{
						reject({save_in_mongo_error: err});
					}
				});
			}else{
				reject({mongo_connect_error: err});
				console.log('mongo_connect_error ', err);
			}
		});
	});
};

let deleteDocMongoDB = function(ro) {
	let doc = {studentID: ro.studentID};
	return new Promise((resolve, reject)=>{
		MongoClient.connect(url, function (err, client) {
			if(err===null){
				const db = client.db(dbName);
				db.collection('diaryinfo').deleteOne(doc, (err, r)=>{
					if(err===null){
						resolve(ro);
					}else{
						reject({save_in_mongo_error: err});
					}
				});
			}else{
				reject({mongo_connect_error: err});
				console.log('mongo_connect_error ', err);
			}
		});
	});
};

module.exports.saveDocMongoDB = saveDocMongoDB;
module.exports.deleteDocMongoDB = deleteDocMongoDB;
