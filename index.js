const express = require('express');
const loginRoutes = require('./login');
const zlib = require('zlib');
const accountRoutes = require('./account');
const stocks = require('./stock');
const https = require('https');
const fs = require('fs');
const compression = require('compression');
const port = process.env.PORT || 3000;
const app = express();


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


/*enable routes*/
app.use('/user', loginRoutes);
app.use('/account', accountRoutes);
app.use('/stock', stocks);

/*enable cors*/


/*ssl/tls conf*/
const sslOptions = {
    key: fs.readFileSync('./server1/key.pem'),
    cert: fs.readFileSync('./server1/cert.pem'),
    passphrase: 'Sayan'
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