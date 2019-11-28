const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const MongoClient = require('mongodb').MongoClient;
var yahooFinance = require('yahoo-finance');
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
        var dbo = db.db(dbName);
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
        var dbo = db.db(dbName);
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
        var dbo = db.db(dbName);
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


app.get('/getStockData', function(req, res) {
    console.log(req.query.id);
    console.log(req.query.symbol);
    const symbol = req.query.symbol;
    const fromdate = req.query.fromdate;
    const todate = req.query.todate;
    yahooFinance.historical({
        symbol: symbol,
        from: fromdate,
        to: todate
            // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
    }, function(err, quotes) {
        //...
        return (res.json(quotes));

    });


});


app.get('/getCurrentPrice', function(req, res) {
    console.log(req.query.symbol);
    const symbol = req.query.symbol;

    // This replaces the deprecated snapshot() API
    yahooFinance.quote({
        symbol: symbol,
        modules: ['price'] // see the docs for the full list
    }, function(err, quotes) {
        // ...
        return (res.json(quotes));

    });

});


app.post('/buyStock', function(req, res) {
    const symbol = req.body.symbol;
    const qty = req.body.qty;
    const acct_no = req.body.acct_no;
    const rtr_no = req.body.rtr_no;
    const username = req.body.username;
    var totalPrice;
    var marketPrice;
    const bankArray1 = {
        "account_no": acct_no,
        "routing_no": rtr_no
    };

    yahooFinance.quote({
        symbol: symbol,
        modules: ['price'] // see the docs for the full list
    }, function(err, quotes) {
        var res1 = res;
        marketPrice = quotes.price.regularMarketPrice;
        totalPrice = parseInt(qty) * parseInt(marketPrice);
        console.log(totalPrice);
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db(dbName);

            //find accoutn details to update
            dbo.collection("accountDetails").findOne({ name: username }, function(err, db1) {
                if (err) {} else {
                    if (db1 != null) {
                        var newBankDetails = [];
                        for (var i = 0; i < db1.bankDetails.length; i++) {
                            if (bankArray1.account_no == db1.bankDetails[i].account_no && bankArray1.routing_no == db1.bankDetails[i].routing_no) {
                                if (parseInt(db1.bankDetails[i].amount) - parseInt(totalPrice) < 0) {
                                    db.close();
                                    return res.send("Amount Greater than account value");
                                } else {
                                    db1.bankDetails[i].amount = parseInt(db1.bankDetails[i].amount) - parseInt(totalPrice);
                                    console.log(db1.bankDetails[i].amount);
                                }
                                newBankDetails.push(db1.bankDetails[i]);
                            }
                        }
                        //update account detail after deducting funds
                        var myquery = { name: username };
                        var newvalues = { $set: { bankDetails: newBankDetails } };
                        dbo.collection("accountDetails").updateOne(myquery, newvalues, function(err, db2) {
                            if (err) throw err;
                            console.log("1 document updated");

                            //check if stock exists, if yet update
                            dbo.collection("stockProfile").findOne({ name: username, symbol: symbol }, function(err, db3) {
                                if (err) throw err;

                                console.log("1 account detail document updated");
                                //updating the qty if exists
                                if (db3 != null) {
                                    const finalQty = parseInt(qty) + parseInt(db3.qty);
                                    console.log(finalQty);
                                    var newStock = { $set: { qty: finalQty } };

                                    //Add stock to profile, if its first time buying
                                    var stockQuery = { name: username, symbol: symbol };
                                    dbo.collection("stockProfile").updateOne(stockQuery, newStock, function(err, db4) {
                                        console.log("1 stock document updated");
                                        return res.send('stock row updated');
                                    });
                                } else {
                                    dbo.collection("stockProfile").insertOne({ name: username, symbol: symbol, qty: qty }, function(err, db4) {
                                        if (err) throw err;
                                        console.log("1 document updated");
                                        //Add stock to profile
                                        res.send('new stock row created');
                                    });
                                }

                            });
                        });

                    } else {
                        return res.send("User does not have any account Details");
                    }
                }
            });

        });
    });


});


app.post('/sellStock', function(req, res) {
    const symbol = req.body.symbol;
    const qty = req.body.qty;
    const acct_no = req.body.acct_no;
    const rtr_no = req.body.rtr_no;
    const username = req.body.username;
    var totalPrice;
    var marketPrice;
    const bankArray1 = {
        "account_no": acct_no,
        "routing_no": rtr_no
    };

    yahooFinance.quote({
        symbol: symbol,
        modules: ['price'] // see the docs for the full list
    }, function(err, quotes) {
        console.log(quotes);
        var res1 = res;
        marketPrice = quotes.price.regularMarketPrice;
        console.log(qty);
        console.log(marketPrice);
        totalPrice = parseInt(qty) * parseInt(marketPrice);
        console.log('tp');
        console.log(totalPrice);
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db(dbName);

            dbo.collection("stockProfile").findOne({ name: username, symbol: symbol }, function(err, db3) {
                if (err) throw err;

                console.log("1 account detail document updated");
                //updating the qty if exists
                if (db3 != null) {
                    const finalQty = parseInt(db3.qty) - parseInt(qty);
                    console.log('fq' + finalQty);
                    var newStock = { $set: { qty: finalQty } };
                    var stockQuery = { name: username, symbol: symbol };

                    if (finalQty < 0) {
                        res.send('Qty to sell is greater than owned quantity');
                        dbo.close();
                    } else if (finalQty == 0) {
                        dbo.collection("stockProfile").deleteOne(stockQuery, function(err, db4) {
                            console.log("1 stock document updated");
                            dbo.collection("accountDetails").findOne({ name: username }, function(err, db1) {
                                if (err) {} else {
                                    if (db1 != null) {
                                        var newBankDetails = [];
                                        for (var i = 0; i < db1.bankDetails.length; i++) {
                                            if (bankArray1.account_no == db1.bankDetails[i].account_no && bankArray1.routing_no == db1.bankDetails[i].routing_no) {
                                                db1.bankDetails[i].amount = parseInt(db1.bankDetails[i].amount) + parseInt(totalPrice);
                                                console.log(db1.bankDetails[i].amount);
                                                newBankDetails.push(db1.bankDetails[i]);
                                            }
                                        }
                                        //update account detail after deducting funds
                                        var myquery = { name: username };
                                        var newvalues = { $set: { bankDetails: newBankDetails } };
                                        dbo.collection("accountDetails").updateOne(myquery, newvalues, function(err, db2) {
                                            if (err) throw err;
                                            console.log("1 document updated");
                                            res.send("User account Updated");
                                            //check if stock exists, if yet update

                                        });

                                    } else {
                                        return res.send("User does not have any account Details");
                                    }
                                }
                            });
                        });
                    } else {
                        //Add stock to profile, if its first time buying

                        dbo.collection("stockProfile").updateOne(stockQuery, newStock, function(err, db4) {
                            console.log("1 stock document updated");
                            //find accoutn details to update
                            dbo.collection("accountDetails").findOne({ name: username }, function(err, db1) {
                                if (err) {} else {
                                    if (db1 != null) {
                                        var newBankDetails = [];
                                        for (var i = 0; i < db1.bankDetails.length; i++) {
                                            if (bankArray1.account_no == db1.bankDetails[i].account_no && bankArray1.routing_no == db1.bankDetails[i].routing_no) {
                                                db1.bankDetails[i].amount = parseInt(db1.bankDetails[i].amount) + parseInt(totalPrice);
                                                console.log(db1.bankDetails[i].amount);
                                                newBankDetails.push(db1.bankDetails[i]);
                                            }
                                        }
                                        //update account detail after deducting funds
                                        var myquery = { name: username };
                                        var newvalues = { $set: { bankDetails: newBankDetails } };
                                        dbo.collection("accountDetails").updateOne(myquery, newvalues, function(err, db2) {
                                            if (err) throw err;
                                            console.log("1 document updated");
                                            res.send("User account Updated");
                                            //check if stock exists, if yet update

                                        });

                                    } else {
                                        return res.send("User does not have any account Details");
                                    }
                                }
                            });
                        });
                    }

                } else {
                    dbo.collection("stockProfile").insertOne({ name: username, symbol: symbol, qty: qty }, function(err, db4) {
                        if (err) throw err;
                        console.log("1 document updated");
                        //Add stock to profile
                        res.send('new stock row created');
                    });
                }

            });

        });
    });


});





module.exports = app;