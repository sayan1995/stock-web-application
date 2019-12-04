const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
var yahooFinance = require('yahoo-finance');
const compression = require('compression');
const zlib = require('zlib');
const https = require('https');
const fs = require('fs');
const querystring = require('querystring');
const jsonParser = bodyParser.json()

app.use(compression({
    filter: (req, res) => {
        var x = compression.filter(req, res);
        console.log('to-be-compressed', x, ' ', req.originalUrl);
        return x;
    }
}));

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

app.post('/getStockData', function(req, res) {
    console.log(req.query.symbol);
    var DATA
    const symbol = req.body.symbol;
    const fromdate = req.body.fromdate;
    const todate = req.body.todate;

    var myPromise = new Promise(function(resolve, reject) {

        const data = querystring.stringify({
            symbol: symbol,
            fromdate: fromdate,
            todate: todate
        });

        console.log(data);

        var options = {
            hostname: 'localhost',
            port: 3002,
            path: '/getStock?' + data,
            method: 'GET',
            ca: fs.readFileSync('./server2/ca-crt.pem'),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        var req = https.request(options, function(res) {

            res.on('data', function(data) {
                console.log(data);
                resolve(data);
            });
        });

        req.on('error', (e) => {
            console.error(e);
            reject(err);
        });

        req.end();
    }).then(function(data) {
        const final = data.toString();
        return res.send(data);
        // return res.send(data.toString());

    });



});


app.post('/getUserStockData', function(req, res) {
    const username = req.body.username;
    MongoClient.connect(url, function(err, db) {
        var dbo = db.db(dbName);
        dbo.collection("stockProfile").find({ name: username }).toArray(function(err, db1) {
            if (err) throw err;
            console.log("documents returned");
            console.log(db1);
            if (db1 != null) {
                db.close();
                const buf = new Buffer(JSON.stringify(db1), 'utf-8');
                zlib.gzip(buf, function(_, result) {
                    return res.send(result);
                });
            } else {
                db.close();
                const buf = new Buffer(JSON.stringify({ response: "no stocks" }), 'utf-8');
                zlib.gzip(buf, function(_, result) {
                    return res.send(result);
                });
            }
        });
    });

});


app.post('/getCurrentPrice', function(req, res) {
    console.log(req.query.symbol);
    const symbol = req.body.symbol;

    var myPromise = new Promise(function(resolve, reject) {

        const data = querystring.stringify({
            symbol: symbol
        });

        console.log(data);

        var options = {
            hostname: 'localhost',
            port: 3002,
            path: '/getPrice?' + data,
            method: 'GET',
            ca: fs.readFileSync('./server2/ca-crt.pem'),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        var req = https.request(options, function(res) {

            res.on('data', function(data) {
                console.log(data);
                resolve(data);
            });
        });

        req.on('error', (e) => {
            console.error(e);
            reject(err);
        });

        req.end();
    }).then(function(data) {
        const final = data.toString();
        return res.send(data);

        // return res.send(data.toString());

    });

});


app.post('/buyStock', jsonParser, function(req, res) {
    const symbol = req.body.symbol;
    const qty = req.body.qty;
    const acct_no = req.body.acct_no;
    const rtr_no = req.body.rtr_no;
    const username = req.body.username;
    res.json(req.body)
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
                        dbo.close();
                        const buf = new Buffer(JSON.stringify({ response: "Qty to sell is greater than owned quantity" }), 'utf-8');
                        zlib.gzip(buf, function(_, result) {
                            return res.send(result);
                        });
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
                                            const buf = new Buffer(JSON.stringify({ response: "User account Updated" }), 'utf-8');
                                            zlib.gzip(buf, function(_, result) {
                                                return res.send(result);
                                            });

                                            //check if stock exists, if yet update

                                        });

                                    } else {
                                        const buf = new Buffer(JSON.stringify({ response: "User does not have any account Details" }), 'utf-8');
                                        zlib.gzip(buf, function(_, result) {
                                            return res.send(result);
                                        });
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
                                            const buf = new Buffer(JSON.stringify({ response: "User account Updated" }), 'utf-8');
                                            zlib.gzip(buf, function(_, result) {
                                                return res.send(result);
                                            });

                                            //check if stock exists, if yet update

                                        });

                                    } else {
                                        const buf = new Buffer(JSON.stringify({ response: "User does not have any account Details" }), 'utf-8');
                                        zlib.gzip(buf, function(_, result) {
                                            return res.send(result);
                                        });

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
                        const buf = new Buffer(JSON.stringify({ response: "new stock row created" }), 'utf-8');
                        zlib.gzip(buf, function(_, result) {
                            return res.send(result);
                        });

                    });
                }

            });

        });
    });


});



module.exports = app;