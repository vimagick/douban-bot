var fs = require('fs');

exports.loadCookies = function (file) {
  var lines = fs.read(file).split('\n');
  for (var i=0; i<lines.length; i++) {
    var fields = lines[i].trim().split('\t');
    if (fields.length === 7) {
      phantom.addCookie({
        domain: fields[0],
        path: fields[2],
        secure: fields[3],
        name: fields[5],
        value: fields[6],
      });
    }
  }
}
