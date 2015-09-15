require('cookies').loadCookies('cookies.txt');

var casper = require('casper').create({
  logLevel: 'info',
  verbose: true,
  pageSettings: {
      loadImages: false,
      loadPlugins: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36',
  },
});

var utils = require('utils'),
    myself = require('./myself').create(casper),
    people = require('./people').create(casper),
    group = require('./group').create(casper),
    topic = require('./topic').create(casper);

casper.start();

/*
myself.info(function(x) {
  people.info(x.id, function(info) {
    utils.dump(info);
    info.publish.forEach(function(y) {
      topic.info(y.id, function(z) {
        utils.dump(z);
        topic.edit(y.id, '↑ [置顶] 全自动化(发帖/评论/回复)', y.content);
      });
    });
  });
});
*/

casper.thenOpen('http://www.youku.com/', function() {
  var videos = this.getElementsAttribute('#m_205805 .v-link a', 'href').slice(0, 5);
  var titles = this.getElementsAttribute('#m_205805 .v-link a', 'title').slice(0, 5);

  utils.dump(titles);

  group.join('SNSJZJ');

  topic.info('79471561', function(info) {
    var content = '⇒⇒⇒ 优酷最新视频 (' + Date() + ') ⇐⇐⇐';
    var comment = utils.format('到此一游 @ %s', new Date().toUTCString());
    topic.edit('79471561', info.title, content, videos);

    if (info.comments.length > 0) {
      var last = info.comments.slice(-1)[0];
      topic.comment('79471561', comment, last.id);
      topic.removeComment('79471561', last.id);
    } else {
      topic.comment('79471561', comment);
    }
  });

  group.quit('SNSJZJ');
});

casper.run();
