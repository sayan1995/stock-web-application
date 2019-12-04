const express = require('express');
const zlib = require('zlib');
const https = require('https');
const compression = require('compression');
const port = process.env.PORT || 3002;
const app = express();
const fs = require('fs');
var yahooFinance = require('yahoo-finance');


app.use(compression({
    filter: (req, res) => {
        var x = compression.filter(req, res);
        console.log('to-be-compressed', x, ' ', req.originalUrl);
        return x;
    }
}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Content-Encoding', 'gzip');
    res.header('Content-Type', 'application/json');
    next();

});

app.get('/p', function(req, res) {
    console.log('hi')
});

/*enable routes*/

app.get('/getStock', function(req, res) {
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
        const buf = new Buffer(JSON.stringify(quotes), 'utf-8');
        zlib.gzip(buf, function(_, result) {
            return res.send(result);
        });
        //return (res.json(quotes));

    });


});


app.get('/getPrice', function(req, res) {
    console.log(req.query.symbol);
    const symbol = req.query.symbol;

    // This replaces the deprecated snapshot() API
    yahooFinance.quote({
        symbol: symbol,
        modules: ['price'] // see the docs for the full list
    }, function(err, quotes) {
        // ...
        const buf = new Buffer(JSON.stringify(quotes), 'utf-8');
        zlib.gzip(buf, function(_, result) {
            return res.send(result);
        });

    });

});


/*enable cors*/


/*ssl/tls conf*/
const sslOptions = {
    key: fs.readFileSync('./server2/server-key.pem'),
    cert: fs.readFileSync('./server2/server-crt.pem'),
    ca: fs.readFileSync('./server2/ca-crt.pem'),
};

https.createServer(sslOptions, app).listen(port, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});



//app.listen(port, () => console.log(`Example app listening on port ${port}!`))

/*MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    db.close();
});*/
//app.use(express.json())