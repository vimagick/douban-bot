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
      this.echo('post comment: ' + topicId, 'INFO_BAR');
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url)
    .thenBypassIf(function() {
      this.echo('like topic: ' + topicId, 'INFO_BAR');
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

Topic.prototype.comment = function(topicId, content) {
  var url = this.urlFor(topicId);
  this.casper
    .thenBypassIf(function() {
      this.echo('post comment: ' + topicId, 'INFO_BAR');
      return this.getCurrentUrl() == url;
    }, 1)
    .thenOpen(url)
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

exports.create = function(casper) {
  return new Topic(casper);
}
