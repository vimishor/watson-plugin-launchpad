(function() {
  var TaskGroup, utils;

  utils = require('./utils');

  TaskGroup = require('taskgroup').TaskGroup;

  module.exports = function(db, watson) {
    return {

      /*
       * Insert stats in DB for given date
       *
       * @public
       * @param {Object} stats
       * @param {String} date
       */
      dbStatsInsert: function(stats, date) {
        return db.insert(stats, function(err, result) {
          if (err) {
            watson.log("Error saving launchpad stats in database.", "error");
            return;
          }
          return watson.log("Added daily stats for " + stats.date + ".");
        });
      },

      /*
       * Update stats in DB for given date
       *
       * @public
       * @param {Object} stats
       * @param {String} date
       */
      dbStatsUpdate: function(stats, date) {
        var me;
        me = this;
        return db.remove({
          date: stats.date
        }, {}, function(err, count) {
          if (err) {
            return watson.log(err, "error");
          } else {
            return me.dbStatsInsert(stats, date);
          }
        });
      },

      /*
       * Check if stats exists in DB for given date
       *
       * This also checks if issues array is identical with the one stored in DB.
       *
       * @public
       * @param {String} date - Format: DD.MM.YYYY
       * @param {Object} stats
       * @return {Bool}
       */
      dbStatsExists: function(date, stats, cb) {
        return db.findOne({
          date: date
        }, function(err, item) {
          if (!item) {
            return cb({}, null);
          }
          return cb(null, utils.arrayEqual(stats.issues, item.issues));
        });
      },

      /*
       * Get number of issues for an array of statuses
       *
       * @public
       * @param {String} project
       * @param {String} milestone
       * @param {Array} statuses
       * @param {Function} cb
       * @return {Array}
       */
      getStatusCount: function(project, milestone, statuses, cb) {
        var me, tasks;
        tasks = new TaskGroup("Fetch stats", {
          concurrency: 0
        });
        me = this;
        statuses.map(function(status) {
          return tasks.addTask(function(cb) {
            return me.reqStatusCount(project, milestone, status, function(err, data) {
              return cb(err, data);
            });
          });
        });
        tasks.done(function(err, results) {
          return cb(err, results);
        });
        return tasks.run();
      },

      /*
       * Get number of issues with a specific status
       *
       * @public
       * @param {String} project
       * @param {String} milestone
       * @param {String} status
       * @param {Function} cb
       * @return {number}
       */
      reqStatusCount: function(project, milestone, status, cb) {
        var params, url;
        url = "https://api.launchpad.net/1.0/" + project + "/+milestone/" + milestone;
        params = {
          'ws.op': 'searchTasks',
          'status': status
        };
        return watson.client.get(url, params, function(err, body) {
          if (err) {
            return watson.log(err, "error");
          }
          try {
            body = JSON.parse(body);
            body = {
              name: utils.slugify(status),
              count: body.total_size
            };
            return cb(null, body);
          } catch (_error) {
            err = _error;
            watson.log(err, "error");
            return cb(err, null);
          }
        });
      },

      /*
       * Used to sort issues alphabetically
       */
      sortIssues: function(a, b) {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      }
    };
  };

}).call(this);
