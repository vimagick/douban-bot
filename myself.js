var require = patchRequire(require),
    utils = require('utils');

function Myself(casper) {
  this.casper = casper;
  this.groupUrl = 'http://www.douban.com/group/';
}

Myself.prototype.group = function() {
  var that = this;
  this.casper
    .thenOpen(this.groupUrl, function() {this.echo('list', 'INFO');})
    .thenClick('#g-reguler-groups .more a')
    .waitForUrl(/joins$/)
    .thenEvaluate(function() {
      __utils__.findAll('.group-list .info a').forEach(function(x) {
        __utils__.echo(x.getAttribute('title'));
      });
    });
}

exports.create = function(casper) {
  return new Myself(casper);
}
