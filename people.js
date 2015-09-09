var require = patchRequire(require),
    utils = require('utils');

function People(casper) {
  this.casper = casper;
  this.baseUrl = 'http://www.douban.com/people/';
}

People.prototype.urlFor = function(peopleId) {
  return utils.format('%s%s/', this.baseUrl, peopleId);
}

People.prototype.info = function(peopleId, callback) {
  var url = this.urlFor(peopleId);
  this.casper
    .thenBypassIf(function() {
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url, function() {
      callback({});
    });
}

People.prototype.follow = function(peopleId) {
  var url = this.urlFor(peopleId);
  this.casper
    .thenBypassIf(function() {
      this.echo('follow people: ' + peopleId, 'INFO_BAR');
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url)
    .thenBypassUnless(function() {
      return this.exists('a.add_contact');
    }, 1)
    .thenClick('a.add_contact')
    .waitWhileSelector('a.add_contact', function() {
      this.echo('follow people success', 'INFO');
    }, function() {
      this.echo('follow people failed', 'ERROR');
    }, 5000);
}

People.prototype.unfollow = function(peopleId) {

  var that = this;

  var url = this.urlFor(peopleId);

  this.casper
    .thenBypassIf(function() {
      this.echo('unfollow people: ' + peopleId, 'INFO_BAR');
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url)
    .thenBypassIf(function() {
      return this.exists('a.add_contact');
    }, 1)
    .thenClick('#follow-cancel', function() {
      this.capture('x.png');
    })
    .waitForSelector('a.add_contact', function() {
      this.echo('unfollow people success', 'INFO');
    }, function() {
      this.echo('unfollow people failed', 'ERROR');
    }, 5000);
}

exports.create = function(casper) {
  return new People(casper);
}
