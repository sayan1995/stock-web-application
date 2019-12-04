const express = require('express');
const app = express.Router();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const zlib = require('zlib');

var url = '';
var dbName = '';

if (port == 3000) {
    url = "mongodb://localhost:27017/mydb";
    dbName = "stock";
} else {
    url = "mongodb://hosmani:sayan1995@ds149218.mlab.com:49218/heroku_1lfwt3kb";
    dbName = "heroku_1lfwt3kb";
}

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/login', function(req, res) {
    console.log(req.body);
    const username = req.body.username;
    const pwd = req.body.password;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbName);
        dbo.collection("login").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                console.log(db1);
                if (db1 != null) {
                    if (pwd == db1.password) {
                        const buf = new Buffer(JSON.stringify(db1), 'utf-8');
                        zlib.gzip(buf, function(_, result) {
                            return res.send(db1);
                        });
                    } else {
                        const buf = new Buffer(JSON.stringify({ response: "Incorrect Password" }), 'utf-8');
                        zlib.gzip(buf, function(_, result) {
                            return res.send(result);
                        });
                    }
                } else {
                    const buf = new Buffer(JSON.stringify({ response: "not found" }), 'utf-8');
                    zlib.gzip(buf, function(_, result) {
                        return res.send(result);
                    });
                }
            }
        });

    });
});

app.get('/forgotPwd', function(req, res) {
    const username = req.query.username;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbName);
        dbo.collection("login").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                console.log(db1);
                if (db1 != null) {
                    delete db1.securityQuestion[0].security1;
                    delete db1.securityQuestion[1].security2;
                    const buf = new Buffer(JSON.stringify({ 'response': db1.securityQuestion }), 'utf-8');
                    zlib.gzip(buf, function(_, result) {
                        return res.send(result);
                    });
                } else {
                    const buf = new Buffer(JSON.stringify({ response: "not found" }), 'utf-8');
                    zlib.gzip(buf, function(_, result) {
                        return res.send(result);
                    });
                }
            }
        });

    });
});

app.post('/getUserProfile', function(req, res) {
    const username = req.body.username;
    console.log(username);
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbName);
        dbo.collection("login").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                console.log(db1);
                if (db1 != null) {
                    delete db1.password;
                    dbo.collection("accountDetails").findOne({ name: username }, function(err, db2) {
                        if (err) {} else {
                            if (db2 != null) {
                                db1['accountDetails'] = db2.bankDetails;
                                const buf = new Buffer(JSON.stringify(db1), 'utf-8');
                                zlib.gzip(buf, function(_, result) {
                                    return res.send(result);
                                });
                            } else {
                                db1['accountDetails'] = []
                                const buf = new Buffer(JSON.stringify(db1), 'utf-8');
                                zlib.gzip(buf, function(_, result) {
                                    return res.send(result);
                                });
                            }
                        }
                    });
                } else {
                    const buf = new Buffer(JSON.stringify({ response: "not found" }), 'utf-8');
                    zlib.gzip(buf, function(_, result) {
                        return res.send(result);
                    });
                }
            }
        });

    });
});

app.post('/updateProfile', function(req, res) {
    console.log('update');
    console.log(req.body.username);

    const username = req.body.username;
    const email = req.body.email;
    const address = req.body.address;
    const state = req.body.state;
    const pin = req.body.pin;
    const city = req.body.city;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbName);
        dbo.collection("login").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                console.log(db1);
                if (db1 != null) {
                    var myquery = { name: username };
                    var newvalues = { $set: { email: email, address: address, state: state, pin: pin, city: city } };
                    dbo.collection("login").updateOne(myquery, newvalues, function(err, db2) {
                        if (err) throw err;
                        console.log("1 document updated");
                        db.close();
                        const buf = new Buffer(JSON.stringify({ response: "Updated" }), 'utf-8');
                        zlib.gzip(buf, function(_, result) {
                            return res.send(result);
                        });

                    });
                } else {
                    const buf = new Buffer(JSON.stringify({ response: "not found" }), 'utf-8');
                    zlib.gzip(buf, function(_, result) {
                        return res.send(result);
                    });
                }
            }
        });

    });
});



app.post('/checkQuestion', function(req, res) {
    console.log('ssssss');
    console.log(req.body.username);

    const username = req.body.username;
    const a1 = req.body.a1;
    const a2 = req.body.a2;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbName);
        dbo.collection("login").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                console.log(db1);
                if (db1 != null) {
                    if (a1 == db1.securityQuestion[0].security1 && a2 == db1.securityQuestion[1].security2) {
                        const buf = new Buffer(JSON.stringify({ response: "true" }), 'utf-8');
                        zlib.gzip(buf, function(_, result) {
                            return res.send(result);
                        });
                    } else {
                        const buf = new Buffer(JSON.stringify({ response: "false" }), 'utf-8');
                        zlib.gzip(buf, function(_, result) {
                            return res.send(result);
                        });
                    }
                } else {
                    const buf = new Buffer(JSON.stringify({ response: "not found" }), 'utf-8');
                    zlib.gzip(buf, function(_, result) {
                        return res.send(result);
                    });
                }
            }
        });

    });
});

app.post('/updatePwd', function(req, res) {
    console.log('ssssss');
    console.log(req.body.username);

    const username = req.body.username;
    const pwd = req.body.password;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbName);
        dbo.collection("login").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                console.log(db1);
                if (db1 != null) {
                    var myquery = { name: username };
                    var newvalues = { $set: { password: pwd } };
                    dbo.collection("login").updateOne(myquery, newvalues, function(err, db1) {
                        if (err) throw err;
                        console.log("1 document updated");
                        db.close();
                        const buf = new Buffer(JSON.stringify({ response: "Password Updated" }), 'utf-8');
                        zlib.gzip(buf, function(_, result) {
                            return res.send(result);
                        });
                    });
                } else {
                    const buf = new Buffer(JSON.stringify({ response: "not found" }), 'utf-8');
                    zlib.gzip(buf, function(_, result) {
                        return res.send(result);
                    });
                }
            }
        });

    });
});

app.post('/register', function(req, res) {
    var temp = '';
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const address = req.body.address;
    const q1 = req.body.securityQuestion1;
    const a1 = req.body.security1;
    const q2 = req.body.securityQuestion2;
    const a2 = req.body.security2;
    const date = new Date();
    var flag = false;
    console.log(req.body);
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbName);
        app.use(express.json())
        var myobj = { name: username, password: password, address: address, email: email, date: date, city: '', state: '', pin: '', 'securityQuestion': [{ 'question1': q1, 'security1': a1 }, { 'question2': q2, 'security2': a2 }] };
        dbo.collection("login").findOne({ name: username }, function(err, dres) {
            if (err) {
                const buf = new Buffer(JSON.stringify({ response: "404 Not Found" }), 'utf-8');
                zlib.gzip(buf, function(_, result) {
                    return res.send(result);
                });

            } else {
                console.log(dres);
                if (dres != null) {
                    flag = true;
                    const buf = new Buffer(JSON.stringify({ response: "User already exists" }), 'utf-8');
                    zlib.gzip(buf, function(_, result) {
                        return res.send(result);
                    });
                }
                dbo.collection("login").insertOne(myobj, function(err, dres) {
                    temp = "User Created";
                    if (err) {
                        db.close();
                    } else {
                        console.log("User created: 1 document inserted");
                        const buf = new Buffer(JSON.stringify({ response: "User created" }), 'utf-8');
                        db.close();
                        zlib.gzip(buf, function(_, result) {
                            return res.send(result);
                        });
                    }

                });
            }

        });

    });

});

module.exports = app;