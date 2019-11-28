const express = require('express');
const app = express();
const http = require('http');
const loginRoutes = require('./login');
const accountRoutes = require('./account');
const stocks = require('./stock');

const port = process.env.PORT || 3000;

/*enable cors*/
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/*enable routes*/
app.use('/user', loginRoutes);
app.use('/account', accountRoutes);
app.use('/stock', stocks);

app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});


const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Hello World</h1>');
});

//app.listen(port, () => console.log(`Example app listening on port ${port}!`))

/*MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    db.close();
});*/
//app.use(express.json())