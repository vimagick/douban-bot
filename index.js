require('cookies').loadCookies('cookies.txt');

var casper = require('casper').create({
  logLevel: 'info',
  verbose: true,
});

var utils = require('utils'),
    myself = require('./myself').create(casper),
    people = require('./people').create(casper),
    group = require('./group').create(casper),
    topic = require('./topic').create(casper);

casper.start();

group.join('python');

topic.info('79535070', function(info) {
  var content = info.content + '\n' + new Date().toUTCString();
  var comment = utils.format('到此一游 @ %s', new Date().toUTCString());

  topic.edit('79535070', info.title, content);

  if (info.comments.length > 0) {
    var last = info.comments.slice(-1)[0];
    topic.comment('79535070', comment, last.id);
  } else {
    topic.comment('79535070', comment);
  }
});

group.quit('python');

casper.run();
