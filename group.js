var require = patchRequire(require),
    utils = require('utils');

function Group(casper) {
  this.casper = casper;
  this.baseUrl = 'http://www.douban.com/group/';
}

Group.prototype.urlFor = function(groupId) {
  return utils.format('%s%s/', this.baseUrl, groupId);
}

Group.prototype.info = function(groupId, callback) {
  var info = {};
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
          if (! x.querySelector('td.title')) {
            return;
          }
          var id = x.querySelector('td.title>a').getAttribute('href').split('/').slice(-2)[0];
          var top = x.querySelector('td.title>span.pl') ? true : false;
          var title = x.querySelector('td.title>a').innerText;
          var uid = x.querySelector('td[nowrap]>a').getAttribute('href').split('/').slice(-2)[0];
          var uname = x.querySelector('td[nowrap]>a').innerText;
          var reply = parseInt('0' + x.querySelector('td:nth-child(3)').innerText);
          var date = x.querySelector('td.time').innerText;
          if (date.indexOf(':') !== -1) {
            date = new Date().getUTCFullYear() + '-' + date;
          }
          return {
            id: id,
            top: top,
            title: title,
            uid: uid,
            uname: uname,
            reply: reply,
            date: date,
          };
        }).filter(function(x) {if (x) return x;});
      });

      info = utils.mergeObjects(info, {
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
    })
    .thenOpen(url + 'discussion', function() {
      var pages = parseInt(this.fetchText('.paginator>a:last-of-type'));
      info = utils.mergeObjects(info, {
        pages: pages
      });
    })
    .then(function() {
      callback(info);
    });
}

Group.prototype.listTopics = function(groupId, page, callback) {
  var url = utils.format('%sdiscussion?start=%d', this.urlFor(groupId), (page-1)*25);
  this.casper
    .thenOpen(url)
    .then(function() {
      var topics = this.evaluate(function() {
        return __utils__.findAll('#content tr:nth-child(n+2)').map(function(x) {
          if (! x.querySelector('td.title')) {
            return;
          }
          var id = x.querySelector('td.title>a').getAttribute('href').split('/').slice(-2)[0];
          var top = x.querySelector('td.title>span.pl') ? true : false;
          var title = x.querySelector('td.title>a').innerText;
          var uid = x.querySelector('td[nowrap]>a').getAttribute('href').split('/').slice(-2)[0];
          var uname = x.querySelector('td[nowrap]>a').innerText;
          var reply = parseInt('0' + x.querySelector('td:nth-child(3)').innerText);
          var date = x.querySelector('td.time').innerText;
          if (date.indexOf(':') !== -1) {
            date = new Date().getUTCFullYear() + '-' + date;
          }
          return {
            id: id,
            top: top,
            title: title,
            uid: uid,
            uname: name,
            reply: reply,
            date: date,
          };
        }).filter(function(x) {if (x) return x;});
      });
      callback(topics);
    });
}

Group.prototype.newTopic = function(groupId, title, content) {
  var url = this.urlFor(groupId);
  this.casper
    .thenOpen(url + 'new_topic', function() {
      this.echo('post topic', 'INFO');
      this.fill('form.group-form', {
        rev_title: title,
        rev_text: content,
      });
    })
    .thenClick('#post-btn')
    .thenBypassIf(function() {
      var flag = this.exists('#captcha_image');
      if (flag) {
        var img = this.getElementAttribute('#captcha_image', 'src');
        this.echo('blocked: ' + img, 'ERROR');
      }
      return flag;
    }, 1)
    .waitFor(function() {
      return this.getCurrentUrl() === url;
    }, function() {
      this.echo('post topic success', 'INFO');
    }, function() {
      this.echo('post topic success', 'ERROR');
    }, 5000);
}

Group.prototype.newLink = function(groupId, title, url, content, tags) {
  var url = this.urlFor(groupId);
  this.casper
    .thenOpen(url + 'new_link', function() {
      this.echo('post link', 'INFO');
      this.fill('form#link-form', {
        title: title,
        url: url,
        rec_words: content,
        author_tags_clone: tags,
      });
    })
    .thenClick('#post-btn')
    .thenBypassIf(function() {
      var flag = this.exists('#captcha_image');
      if (flag) {
        var img = this.getElementAttribute('#captcha_image', 'src');
        this.echo('blocked: ' + img, 'ERROR');
      }
      return flag;
    }, 1)
    .waitFor(function() {
      return this.getCurrentUrl() === url;
    }, function() {
      this.echo('post link success', 'INFO');
    }, function() {
      this.echo('post link success', 'ERROR');
    }, 5000);
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
