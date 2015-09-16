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
  _.chain(gInfo.latest_topics)
   .filter(function(x) {return x.reply > 100;})
   .each(function(x) {
      topic.info(x.id, function(tInfo) {
        if (tInfo.likes > 20) {
          people.report(tInfo.uid);
          topic.report(tInfo.id);
          _.chain(tInfo.comments)
           .sample(10)
           .each(function(y) {
             topic.reportComment(tInfo.id, y.id);
           });
        }
      })
   });

  var t = _.chain(gInfo.latest_topics)
           .filter(function(x) {return ! x.top;})
           .max(function(x) {return x.reply;})
           .value();
  if (t.reply < 5) {
    casper.echo('done: ' + t.reply, 'GREEN_BAR');
    return;
  }
  group.listTopics('python', gInfo.pages, function(topics) {
    var target = _.min(topics, function(x) {return x.reply;});
    topic.info(target.id, function(tInfo) {
      var txt = utils.format('@%s: %s', tInfo.uname, tInfo.title);
      topic.comment(tInfo.id, txt);
    });
  });
});

group.quit('python');

casper.run();
