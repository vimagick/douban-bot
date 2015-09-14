var require = patchRequire(require),
    utils = require('utils');

function Topic(casper) {
  this.casper = casper;
  this.baseUrl = 'http://www.douban.com/group/topic/';
}

Topic.prototype.urlFor = function(topicId) {
  return utils.format('%s%s/', this.baseUrl, topicId);
}

Topic.prototype.like = function(topicId) {
  var url = this.urlFor(topicId);
  this.casper
    .thenBypassIf(function() {
      this.echo('like topic: ' + topicId, 'INFO_BAR');
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url)
    .thenBypassIf(function() {
      return this.exists('a.fav-cancel');
    }, 1)
    .thenClick('a.fav-add')
    .waitForSelector('a.fav-cancel', function() {
      this.echo('like topic success', 'INFO');
    }, function() {
      this.echo('like topic failed', 'ERROR');
    }, 5000);
}

Topic.prototype.unlike = function(topicId) {
}

Topic.prototype.remove = function(topicId) {
  var url = this.urlFor(topicId);
  this.casper
    .thenBypassIf(function() {
      this.echo('remove topic: ' + topicId, 'INFO_BAR');
      return this.getCurrentUrl() === url;
    }, 1)
    .thenOpen(url)
    .thenBypassUnless(function() {
      var flag = this.exists('div.topic-opt a[href*="remove"]');
      if (! flag) {
        this.echo('cannot remove topic', 'ERROR');
      }
      return flag;
    }, 1)
    .then(function() {
      this.thenClick('div.topic-opt a[href*="/remove"]')
        .waitFor(function() {
          return this.getCurrentUrl().indexOf('/topic/') === -1;
        }, function() {
          this.echo('remove topic success', 'INFO'); 
        }, function() {
          this.echo('remove topic failed', 'INFO'); 
        });
    });
}

Topic.prototype.edit = function(topicId, title, content, videos) {
  var url = this.urlFor(topicId);
  this.casper
    .thenBypassIf(function() {
      this.echo('edit topic: ' + topicId, 'INFO_BAR');
      return this.getCurrentUrl() === url;
    }, 1)
    .thenOpen(url)
    .thenBypassUnless(function() {
      var flag = this.exists('div.topic-opt a[href*="/edit"]');
      if (! flag) {
        this.echo('cannot edit topic', 'ERROR');
      }
      return flag;
    }, 1)
    .then(function() {
      this
        .thenClick('div.topic-opt a[href*="/edit"]', function() {
          this.fill('form.group-form', {
            rev_title: title,
            rev_text: content,
          });
        })
        .thenBypassIf(function() {
          return videos === undefined || videos.length === 0;
        }, 1)
        .then(function() {
          this.echo('add videos', 'INFO');
          this.eachThen(videos, function(response) {
            var url = response.data;
            this.evaluate(function(url) {
                __utils__.echo(url);
                addVideo();
                $('.add-video-panel .video-url').val(url);
                $('.add-video-panel form').submit();
            }, url);
            this.wait(1000);
          });
        })
        .thenClick('input[name="rev_submit"]')
        .waitFor(function() {
          return this.getCurrentUrl() === url;
        }, function() {
          this.echo('edit topic success', 'INFO');
        }, function() {
          this.echo('edit topic success', 'ERROR');
        }, 5000);
    });
}

Topic.prototype.comment = function(topicId, content, commentId) {
  var url = this.urlFor(topicId);

  if (commentId !== undefined) {
    url += utils.format('?cid=%s#last', commentId);
  }

  this.casper
    .thenBypassIf(function() {
      this.echo('post comment: ' + topicId, 'INFO_BAR');
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url, function() {
      if (url.indexOf('#last') !== -1) {
        return true;
      }
      var flag1 = this.exists('ul#comments ~ div.paginator'),
          flag2 = this.exists('form[name="comment_form"]');
      if (flag1 && !flag2) {
        var lastPageUrl = this.getElementAttribute('ul#comments ~ div.paginator>a:last-of-type', 'href');
        this.open(lastPageUrl);
      }
    })
    .thenBypassIf(function() {
      var blocked  = this.exists('#captcha_image');
      if (blocked) {
        var img = this.getElementAttribute('#captcha_image', 'src');
        this.echo('blocked: ' + img, 'ERROR');
      }
      return blocked;
    }, 1)
    .then(function() {
      this.fill('form[name="comment_form"]', {
        rv_comment: content
      });
      this
        .thenClick('input[name="submit_btn"]')
        .waitForUrl(/post=ok/, function() {
          this.echo('post comment success', 'INFO');
        }, function() {
          this.echo('post comment failed', 'ERROR');    
        }, 5000);
    });
}

Topic.prototype.info = function(topicId, callback) {
  var url = this.urlFor(topicId);
  this.casper
    .thenBypassIf(function() {
      this.echo('topic info: ' + topicId, 'INFO_BAR');
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url, function() {
      var group = this.getElementAttribute('.group-item .title>a', 'href').split('/').slice(-2)[0];
      var title = this.getElementInfo('#content>h1').text.trim();
      var author = this.getElementAttribute('#content h3 .from a', 'href').split('/').slice(-2)[0];
      var date = this.fetchText('#content h3 .color-green');
      var content = this.fetchText('#content .topic-doc .topic-content').trim();
      var comments = this.evaluate(function() {
        return __utils__.findAll('ul#comments>li').map(function(x) {
          var id = x.getAttribute('id'),
              content = x.querySelector('.reply-doc>p').innerText,
              author = x.querySelector('h4>a').getAttribute('href').split('/').slice(-2)[0],
              date = x.querySelector('h4>span.pubtime').innerText;
          return {
            id: id,
            author: author,
            date: date,
            content: content,
          };
        });
      });
      callback({
        id: topicId,
        author: author,
        date: date,
        title: title,
        content: content,
        comments: comments,
        group: group,
      });
    });
}

exports.create = function(casper) {
  return new Topic(casper);
}
