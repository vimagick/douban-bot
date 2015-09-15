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

var _ = require('./underscore'),
    utils = require('utils'),
    myself = require('./myself').create(casper),
    people = require('./people').create(casper),
    group = require('./group').create(casper),
    topic = require('./topic').create(casper);

casper.start();

group.join('python');

group.info('python', function(gInfo) {
  var max = _.max(gInfo.latest_topics, function(x) {return x.reply;});
  if (max<10) {
    casper.echo('done', 'GREEN_BAR');
    return;
  }
  group.listTopics('python', gInfo.pages, function(topics) {
    var target = _.min(topics, function(x) {return x.reply;});
    topic.info(target.id, function(tInfo) {
      var txt = utils.format('@%s: %s', tInfo.uname, tInfo.title);
      utils.dump(tInfo);
      topic.comment(tInfo.id, txt);
    });
  });
});

group.quit('python');

casper.run();
