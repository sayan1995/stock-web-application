const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
var yahooFinance = require('yahoo-finance');


const port = process.env.PORT || 3000;
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