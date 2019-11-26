const express = require('express')
const app = express()
const path = require('path');
const port = 3000
const mongo = require('mongodb');
const bodyParser = require('body-parser')

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://hosmani:sayan1995@ds149218.mlab.com:49218/heroku_1lfwt3kb" // "mongodb://localhost:27017/mydb";

/*enable cors*/
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const http = require('http');
const port = process.env.PORT || 3000

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Hello World</h1>');
});


/*MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    db.close();
});*/
//app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/getUserInformation', function(req, res) {
    console.log(req.query);
    res.send('User email Adress is: Sayan' + req.query.id);

});

app.post('/login', function(req, res) {
    console.log(req.body.username);
    const username = req.body.username;
    const pwd = req.body.password;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("stock");
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
        var dbo = db.db("stock");
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
        var dbo = db.db("stock");
        dbo.collection("login").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                console.log(db1);
                if (db1 != null) {
                    if (a1 == db1.securityQuestion[0].security1 && a2 == db1.securityQuestion[1].security2) {
                        return res.sendFile(path.join(__dirname + '/html/forgotPwd.html'));
                        //return res.send('true');
                    } else {
                        res.send("Incorrect Answers for the Question");
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
        var dbo = db.db("stock");
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
        var dbo = db.db("stock");
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

app.post('/saveBankAccount', function(req, res) {
    console.log('saving');
    console.log(req.body.username);

    const username = req.body.username;
    const bankArray = {
        "account_no": req.body.acct_no,
        "routing_no": req.body.rtr_no,
        "amount": 1000
    }
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("stock");
        dbo.collection("accountDetails").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                if (db1 != null) {
                    var myquery = { name: username };
                    console.log(db1);
                    //var newDetail = Object.assign(bankArray, db1.bankDetails);
                    var newBankDetails = [];
                    for (var i = 0; i < db1.bankDetails.length; i++) {
                        if (bankArray.account_no == db1.bankDetails[i].account_no && bankArray.routing_no == db1.bankDetails[i].routing_no) {
                            db.close();
                            return res.send("Account Already Added");
                        } else {
                            newBankDetails.push(db1.bankDetails[i]);
                        }

                    }
                    newBankDetails.push(bankArray);
                    console.log(newBankDetails);
                    var newvalues = { $set: { bankDetails: newBankDetails } };
                    dbo.collection("accountDetails").updateOne(myquery, newvalues, function(err, res) {
                        if (err) throw err;
                        console.log("1 document updated");
                        db.close();
                    });
                    return res.send("Account Added");
                } else {
                    dbo.collection("accountDetails").insertOne({ name: username, bankDetails: [bankArray] }, function(err, db1) {
                        if (err) {} else {
                            console.log(db1);
                            if (db1 != null) {
                                return res.send("1st Account Added");
                            } else {
                                return res.send("User does not exist");
                            }
                        }
                    });
                }
            }
        });

    });
});

app.post('/getBankAccounts', function(req, res) {
    console.log('getting accounts');
    console.log(req.body.username);

    const username = req.body.username;

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("stock");
        dbo.collection("accountDetails").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                if (db1 != null) {
                    return (res.json({ 'accountDetails': db1.bankDetails }));
                } else {
                    return res.send("User does not have any account Details");
                }
            }
        });

    });
});

app.post('/transferAmount', function(req, res) {
    console.log('transferring money');
    console.log(req.body);

    const username = req.body.username;
    const bankArray1 = {
        "account_no": req.body.acct_no_1,
        "routing_no": req.body.rtr_no_2,
        "amount": req.body.amount
    }
    const bankArray2 = {
        "account_no": req.body.acct_no_2,
        "routing_no": req.body.rtr_no_2,
    }
    console.log(bankArray1);
    console.log(bankArray2);
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("stock");
        dbo.collection("accountDetails").findOne({ name: username }, function(err, db1) {
            if (err) {} else {
                if (db1 != null) {
                    var myquery = { name: username };
                    console.log(db1);
                    var flag1 = false;
                    var flag2 = false;
                    //Payment Pull
                    var newBankDetails = [];
                    for (var i = 0; i < db1.bankDetails.length; i++) {
                        if (bankArray1.account_no == db1.bankDetails[i].account_no && bankArray1.routing_no == db1.bankDetails[i].routing_no) {
                            if (db1.bankDetails[i].amount - bankArray1.amount < 0) {
                                db.close();
                                return res.send("Amount Greater than account value");
                            } else {
                                flag1 = true;
                                db1.bankDetails[i].amount = db1.bankDetails[i].amount - bankArray1.amount;
                            }
                        }
                        newBankDetails.push(db1.bankDetails[i]);
                    }
                    if (flag1 == false) {
                        db.close();
                        return res.send('Either Invalid Account_no or Routing no for amount to be deducted');
                    }
                    //Payment Push
                    for (var i = 0; i < newBankDetails.length; i++) {
                        if (bankArray2.account_no == newBankDetails[i].account_no && bankArray2.routing_no == newBankDetails[i].routing_no) {
                            flag2 = true;
                            newBankDetails[i].amount = parseInt(db1.bankDetails[i].amount) + parseInt(bankArray1.amount);
                        }
                    }

                    if (flag2 == false) {
                        db.close();
                        return res.send('Either Invalid Account_no or Routing no for amount to be added to');
                    }
                    console.log(newBankDetails);
                    var newvalues = { $set: { bankDetails: newBankDetails } };
                    dbo.collection("accountDetails").updateOne(myquery, newvalues, function(err, res) {
                        if (err) throw err;
                        console.log("1 document updated");
                        db.close();
                    });
                    return res.send("Transfer Successful");
                } else {
                    return res.send("User does not have any account Details");
                }
            }
        });

    });
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

//app.listen(port, () => console.log(`Example app listening on port ${port}!`))