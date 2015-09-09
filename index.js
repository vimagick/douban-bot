require('cookies').loadCookies('cookies.txt');

var casper = require('casper').create({
  logLevel: 'info',
  verbose: true,
});

var utils = require('utils'),
    myself = require('./myself').create(casper),
    group = require('./group').create(casper),
    topic = require('./topic').create(casper);

casper.start();

group.join('scrapy');

group.info('scrapy', function(info) {
  utils.dump(info);
  casper.eachThen(info.related_groups, function(response) {
    var gid = response.data;
    group.join(gid);
  });
  casper.eachThen(info.latest_topics, function(response) {
    var tid = response.data.id;
    var txt = utils.format('到此一游 @ %s', new Date().toUTCString());
    topic.like(tid);
    topic.comment(tid, txt);
  });
});

group.quit('scrapy');

casper.run();
