var yahooFinance = require('yahoo-finance');

yahooFinance.historical({
    symbol: 'AAPL',
    from: '2014-01-01',
    to: '2019-12-31',
    // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
}, function(err, quotes) {
    //...
    //console.log(quotes);
});

// This replaces the deprecated snapshot() API
yahooFinance.quote({
    symbol: 'AAPL',
    modules: ['price', 'summaryDetail'] // see the docs for the full list
}, function(err, quotes) {
    // ...
    console.log(quotes);
});