var require = patchRequire(require),
    utils = require('utils');

function Myself(casper) {
  this.casper = casper;
  this.selfUrl = 'http://www.douban.com/mine/';
  this.id = 'vimagick';
}

Myself.prototype.info = function(callback) {
  this.casper.thenOpen(this.selfUrl, function() {
    var id = this.getElementAttribute('#db-usr-profile .pic a', 'href').split('/').slice(-2)[0],
        name = this.getElementAttribute('#db-usr-profile .pic img', 'alt');
    callback({
      id: id,
      name: name,
    });
  });
}

exports.create = function(casper) {
  return new Myself(casper);
}
