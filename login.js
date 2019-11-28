const express = require('express');
const app = express.Router();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
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
                        return res.json(db1);
                    } else {
                        res.send("Incorrect Password");
                    }
                } else {
                    res.send("not found");
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
                    return (res.json({ 'response': db1.securityQuestion }));
                } else {
                    res.send("not found");
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
                        //return res.sendFile(path.join(__dirname + '/html/forgotPwd.html'));
                        return res.send('true');
                    } else {
                        res.send('false');
                    }
                } else {
                    res.send("not found");
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
                    dbo.collection("login").updateOne(myquery, newvalues, function(err, res) {
                        if (err) throw err;
                        console.log("1 document updated");
                        db.close();
                    });
                    return res.send("Password Updated");
                } else {
                    res.send("not found");
                }
            }
        });

    });
});

app.post('/register', function(req, res) {
    //res.send('Got a POST request for registering');
    var temp = '';
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const address = req.body.address;
    const q1 = req.body.securityQuestion1;
    const a1 = req.body.security1;
    const q2 = req.body.securityQuestion2;
    const a2 = req.body.security2;
    var flag = false;
    console.log(req.body);
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbName);
        app.use(express.json())
        var myobj = { name: username, password: password, address: address, email: email, 'securityQuestion': [{ 'question1': q1, 'security1': a1 }, { 'question2': q2, 'security2': a2 }] };
        dbo.collection("login").findOne({ name: username }, function(err, dres) {
            if (err) {
                return res.end("404 Not Found");
            } else {
                console.log(dres);
                if (dres != null) {
                    temp = "User Already Exists";
                    flag = true;
                    console.log(temp);
                    res.send("User already exists");
                    return;
                }
                dbo.collection("login").insertOne(myobj, function(err, dres) {
                    temp = "User Created";
                    if (err) {
                        db.close();
                    } else {
                        console.log("User created: 1 document inserted");
                        res.send("User created");
                        db.close();

                    }

                });
            }

        });

    });

    console.log(flag);


});

module.exports = app;