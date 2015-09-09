var require = patchRequire(require),
    utils = require('utils');

function Group(casper) {
  this.casper = casper;
  this.baseUrl = 'http://www.douban.com/group/';
}

Group.prototype.urlFor = function(groupId) {
  return utils.format('%s%s/', this.baseUrl, groupId);
}

Group.prototype.list = function(groupId, callback) {
  var url = this.urlFor(groupId);
  this.casper
    .thenBypassIf(function() {
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url, function() {
      var topics = this.getElementsAttribute('#group-topics td.title a', 'href').map(function(url) {
        return url.split('/').slice(-2)[0];
      });
      callback(topics);
    });
}

Group.prototype.info = function(groupId, callback) {
  var url = this.urlFor(groupId);
  this.casper
    .thenBypassIf(function() {
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url, function() {
      var name = this.fetchText('#group-info>h1').trim();
      var owner = this.getElementAttribute('.group-board>p>a', 'href').split('/').slice(-2)[0];
      var date = /\d{4}-\d{2}-\d{2}/.exec(this.fetchText('.group-board>p'))[0];
      var intro = this.getHTML('.group-intro').trim();
      var tags = this.getElementsInfo('.group-tags>a').map(function(x) {return x.text;});
      var count = parseInt(/\d+/.exec(this.fetchText('.side-nav a[href$="members"]'))[0]);
      var new_members = this.getElementsAttribute('.member-list .name>a', 'href').map(function(url) {
        return url.split('/').slice(-2)[0];
      });
      var related_groups = this.getElementsAttribute('.group-list .title>a', 'href').map(function(url) {
        return url.split('/').slice(-2)[0];
      });
      var active_topics = this.getElementsAttribute('#group-topics td.title>a', 'href').map(function(url) {
        return url.split('/').slice(-2)[0];
      });
      var active_members = this.getElementsAttribute('#group-topics td[nowrap]>a', 'href').map(function(url) {
        return url.split('/').slice(-2)[0];
      });

      var latest_topics = this.evaluate(function() {
        return __utils__.findAll('#group-topics tr:nth-child(n+2)').map(function(x) {
          var id = x.querySelector('td.title>a').getAttribute('href').split('/').slice(-2)[0];
          var title = x.querySelector('td.title>a').innerHTML;
          var author = x.querySelector('td[nowrap]>a').getAttribute('href').split('/').slice(-2)[0];
          var reply = parseInt(x.querySelector('td:nth-child(3)').innerHTML);
          var date = x.querySelector('td.time').innerHTML;
          if (date.indexOf(':') !== -1) {
            date = new Date().getUTCFullYear() + '-' + date;
          }
          return {
            id: id,
            title: title,
            author: author,
            reply: reply,
            date: date,
          };
        });
      });

      callback({
        name: name,
        owner: owner,
        date: date,
        intro: intro,
        tags: tags,
        count: count,
        new_members: new_members,
        related_groups: related_groups,
        latest_topics: latest_topics,
      });
    });
}

Group.prototype.join = function(groupId) {
  this.casper
    .thenOpen(this.urlFor(groupId))
    .thenBypassIf(function() {
      this.echo('join group: ' + groupId, 'INFO_BAR');
      return this.exists('div.group-misc>a.a_confirm_link');
    }, 1)
    .thenClick('div.group-misc>a.bn-join-group')
    .waitForSelector('div.group-misc>a.a_confirm_link', function() {
      this.echo('join group success', 'INFO');
    }, function() {
      this.echo('join group failed', 'ERROR');
    }, 5000);
}

Group.prototype.quit = function(groupId) {
  this.casper
    .thenOpen(this.urlFor(groupId))
    .thenBypassUnless(function() {
      this.echo('quit group: ' + groupId, 'INFO_BAR');
      return this.exists('div.group-misc>a.a_confirm_link');
    }, 1)
    .thenClick('div.group-misc>a.a_confirm_link')
    .waitWhileSelector('div.group-misc>a.a_confirm_link', function() {
      this.echo('quit group success', 'INFO');
    }, function() {
      this.echo('quit group failed', 'ERROR');
    }, 5000);
}

exports.create = function(casper) {
  return new Group(casper);
}