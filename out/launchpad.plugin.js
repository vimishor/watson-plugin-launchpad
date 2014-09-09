(function() {
  var Datastore, moment, utils;

  moment = require('moment');

  Datastore = require('nedb');

  utils = require('./utils');

  module.exports = function(watson) {
    var closed_statuses, db, enabled, name, open_statuses, version;
    enabled = true;
    name = 'launchpad';
    version = require("package.json").version;
    open_statuses = ["New", "Incomplete", "Confirmed", "Triaged", "In Progress"];
    closed_statuses = ["Fix Committed", "Fix Released"];
    db = new Datastore("" + (watson.getRootPath()) + "/db/" + name + "_" + watson.project + "_" + watson.milestone + ".db");

    /*
     * Get stats
     */
    watson.addTask('stats', function(complete) {
      var today, updater;
      db.loadDatabase();
      today = moment().format('DD.MM.YYYY');
      updater = require('./update')(db, watson);
      return updater.getStatusCount(watson.project, watson.milestone, open_statuses, function(err, data) {
        var count_closed_issues, count_open_issues, issues;
        if (err) {
          watson.log(err, "error");
          return;
        }
        count_open_issues = count_closed_issues = 0;
        issues = [];
        data.map(function(item) {
          count_open_issues += item[1].count;
          return issues.push(item[1]);
        });
        return updater.getStatusCount(watson.project, watson.milestone, closed_statuses, function(err, closed) {
          var Stats;
          if (err) {
            watson.log(err, "error");
            return;
          }
          closed.map(function(item) {
            count_closed_issues += item[1].count;
            return issues.push(item[1]);
          });
          issues = issues.sort(updater.sortIssues);
          Stats = {
            date: today,
            time: Math.round(new Date().getTime() / 1000),
            issues: issues,
            summary: {
              issues_open: count_open_issues,
              issues_closed: count_closed_issues
            }
          };
          return updater.dbStatsExists(today, Stats, function(err, exists) {
            if (err) {
              return updater.dbStatsInsert(Stats, today);
            } else {
              if (exists === false) {
                return updater.dbStatsUpdate(Stats, today);
              } else {
                return watson.log("Stats unchanged for " + today);
              }
            }
          });
        });
      });
    });

    /*
     * Build
     */
    watson.addTask('build', function(complete) {
      var builder;
      console.log("build data from " + name + " plugin");
      builder = require('./build')(db);
      db.loadDatabase();
      return builder.getWeekData(function(err, data) {
        return complete(err, {
          name: 'launchpad',
          data: data
        });
      });
    });
    return {
      enabled: enabled,
      name: name,
      version: version,
      scripts: "web/assets/js/launchpad.js",
      partial: "web/launchpad.html"
    };
  };

}).call(this);
