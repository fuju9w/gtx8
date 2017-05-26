var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url ='mongodb://<endpoint>:<password>@<endpoint>.documents.azure.com:10250/<database>?ssl=true';



var findDriver = function (db, callback) {
    var cursor = db.collection('taxipool').find(
        { 
            "service.breaking": "false", "driver.gender": "M", 
            "driver.employee_id":  { $exists: true, $ne: "" } 
        },
        { "driver.citizen_id": 1, "driver.firstname.en": 1, "driver.lastname.en": 1, 
          "gps.loc.coordinates.0": 1, "gps.loc.coordinates.1": 1, _id: 0 
        }
    );


    db.taxipool.find()


    cursor.each(function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            console.dir(doc);
        } else {
            callback();
        }
    });
};

MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    findDriver(db, function () {
        db.close();
    });
});