(function() {
  var utils;

  utils = require('./utils');

  module.exports = function(db) {
    return {
      reachZeroIssues: function(stats) {
        var daily_avg, first, issues_closed, last, reach_zero;
        last = stats[0], first = stats[stats.length - 1];
        issues_closed = last.summary.issues_closed - first.summary.issues_closed;
        daily_avg = issues_closed / stats.length;
        reach_zero = Math.round(last.summary.issues_open / daily_avg);
        return Math.round(first.summary.issues_open / daily_avg);
      },
      normalizeIssues: function(issues) {
        var arr, item, _i, _len;
        arr = [];
        for (_i = 0, _len = issues.length; _i < _len; _i++) {
          item = issues[_i];
          arr.push([utils.unSlugify(item.name), item.count]);
        }
        return arr;
      },
      getWeekData: function(callback) {
        var me;
        me = this;
        return db.count({}, function(err, count) {
          if (err) {
            watson.log(err, "error");
            return callback(err, null);
          }
          if (!(count > 0)) {
            watson.log("No entries to process", "error");
            return callback(null, {});
          }
          return db.find({}).sort({
            time: -1
          }).skip(0).limit(7).exec(function(err, docs) {
            var data, item, _i, _len, _ref;
            if (err) {
              watson.log(err, "error");
              return callback(err, null);
            }
            data = {
              open: [],
              close: [],
              remaining: [],
              categories: [],
              drilldown: [],
              reach_zero: me.reachZeroIssues(docs)
            };
            _ref = docs.reverse();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              item = _ref[_i];
              data.open.push({
                name: item.date,
                y: item.summary.issues_open,
                drilldown: item.date
              });
              data.close.push({
                name: item.date,
                y: item.summary.issues_closed,
                drilldown: item.date
              });
              data.remaining.push(item.summary.issues_open);
              data.categories.push(item.date);
              data.drilldown.push({
                type: 'pie',
                id: item.date,
                name: item.date,
                data: me.normalizeIssues(item.issues)
              });
            }
            return callback(null, data);
          });
        });
      }
    };
  };

}).call(this);
