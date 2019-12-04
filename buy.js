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
var main = {
    buyStock: function(symbol, qty, acct_no, rtr_no, username) {
        return new Promise(function(resolve, reject) {
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
                                            //db.close();
                                            const buf = new Buffer(JSON.stringify({ response: "Amount Greater than account value" }), 'utf-8');
                                            resolve("Amount Greater than account value");
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
                                    dbo.collection("stockProfile").findOne({ username: username, symbol: symbol }, function(err, db3) {
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
                                                resolve("Successful");
                                            });
                                        } else {
                                            dbo.collection("stockProfile").insertOne({ name: username, symbol: symbol, qty: qty }, function(err, db4) {
                                                if (err) throw err;
                                                console.log("1 document updated");
                                                //Add stock to profile
                                                const buf = new Buffer(JSON.stringify({ response: "new stock row created" }), 'utf-8');
                                                resolve("Successful");
                                            });
                                        }

                                    });
                                });

                            } else {
                                const buf = new Buffer(JSON.stringify({ response: "User does not have any account Details" }), 'utf-8');
                                resolve("User does not have any account Details");

                            }
                        }
                    });

                });
            });
        });

    },
    sellStock: function() {

    }

};

module.exports = main;