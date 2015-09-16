var require = patchRequire(require),
    utils = require('utils');

function People(casper) {
  this.casper = casper;
  this.baseUrl = 'http://www.douban.com/people/';
  this.groupUrl = 'http://www.douban.com/group/people/';
}

People.prototype.urlFor = function(peopleId, isGroup) {
  return utils.format('%s%s/', isGroup ? this.groupUrl : this.baseUrl, peopleId);
}

People.prototype.info = function(peopleId, callback) {
  var that = this;
  var url = this.urlFor(peopleId, true);
  this.casper
    .thenBypassIf(function() {
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url, function() {
      var info = {};
      ['joins', 'publish', 'reply', 'likes', 'recommendations'].forEach(function(x) {
        var css = utils.format('h2 a[href$="/%s"]', x);
        if (that.casper.exists(css)) {
          info[x] = parseInt(that.casper.fetchText(css));
        }
      });

      this.eachThen(Object.keys(info), function(response) {
          var key = response.data,
              val = info[key];
          if (val === 0) {
            info[key] = [];
          } else {
            this.thenOpen(url + key, function() {
              info[key] = this.evaluate(function() {
                var css = '.group-list .info a, table.olt td.title>a';
                return __utils__.findAll(css).map(function(x) {
                  return {
                    id: x.getAttribute('href').split('/').slice(-2)[0],
                    url: x.getAttribute('href'),
                    title: x.getAttribute('title'),
                  };
                });
              });
            });
          }
      }).then(function() {
        callback(info);
      });
    });
}

People.prototype.report = function(peopleId, reason) {
  var url = this.urlFor(peopleId);
  this.casper
    .thenBypassIf(function() {
      this.echo('report user: ' + peopleId, 'INFO_BAR');
      return this.getCurrentUrl() === url;
    }, 1)
    .thenOpen(url)
    .thenClick('#report-user')
    .waitForUrl(/audit_report/, function() {
       this.fill('#content form', {
          reason: reason,
       }); 
    }, function() {
      this.echo('report user timeout', 'ERROR');
      this.bypass(1);
    }, 5000)
    .then(function() {
      this
        .thenClick('#content form input[name="report_submit"]')
        .waitFor(function() {
          return ! this.exists('#content form');
        }, function() {
          this.echo('report user success', 'INFO');
        }, function() {
          this.echo('report user failed', 'ERROR');
        }, 5000);
    });
}

People.prototype.follow = function(peopleId) {
  var url = this.urlFor(peopleId);
  this.casper
    .thenBypassIf(function() {
      this.echo('follow people: ' + peopleId, 'INFO_BAR');
      return this.getCurrentUrl() === url;
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
    .thenClick('#follow-cancel')
    .waitForSelector('a.add_contact', function() {
      this.echo('unfollow people success', 'INFO');
    }, function() {
      this.echo('unfollow people failed', 'ERROR');
    }, 5000);
}

exports.create = function(casper) {
  return new People(casper);
}
