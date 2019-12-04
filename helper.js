const zlib = require('zlib');

const utility = {
    compress: function(data) {
        var buf = new Buffer(JSON.stringify(data), 'utf-8');
        zlib.gzip(buf, function(_, result) {
            console.log(result);
            return result;
        });
    }
}


module.exports = utility;