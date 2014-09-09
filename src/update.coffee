utils = require('./utils')
{TaskGroup} = require('taskgroup')

module.exports = (db, watson) ->

    ###
    # Insert stats in DB for given date
    #
    # @public
    # @param {Object} stats
    # @param {String} date
    ###
    dbStatsInsert: (stats, date) ->
        db.insert stats, (err, result) ->
            if err
                watson.log "Error saving launchpad stats in database.", "error"
                return

            watson.log "Added daily stats for #{stats.date}."

    ###
    # Update stats in DB for given date
    #
    # @public
    # @param {Object} stats
    # @param {String} date
    ###
    dbStatsUpdate: (stats, date) ->
        me = @
        db.remove { date: stats.date }, {}, (err, count) ->
            if err
                watson.log err, "error"
            else
                me.dbStatsInsert stats, date

    ###
    # Check if stats exists in DB for given date
    #
    # This also checks if issues array is identical with the one stored in DB.
    #
    # @public
    # @param {String} date - Format: DD.MM.YYYY
    # @param {Object} stats
    # @return {Bool}
    ###
    dbStatsExists: (date, stats, cb) ->
        db.findOne {date: date}, (err, item) ->
            if not item
                return cb({}, null)

            # false = need to update
            # true  = do nothing
            return cb(null, utils.arrayEqual(stats.issues, item.issues))

    ###
    # Get number of issues for an array of statuses
    #
    # @public
    # @param {String} project
    # @param {String} milestone
    # @param {Array} statuses
    # @param {Function} cb
    # @return {Array}
    ###
    getStatusCount: (project, milestone, statuses, cb) ->
        tasks   = new TaskGroup "Fetch stats", concurrency:0
        me      = @

        statuses.map (status) ->
            tasks.addTask (cb) ->
                me.reqStatusCount project, milestone, status, (err, data) ->
                    cb(err, data)


        tasks.done (err, results) ->
            cb(err, results)

        tasks.run()

    ###
    # Get number of issues with a specific status
    #
    # @public
    # @param {String} project
    # @param {String} milestone
    # @param {String} status
    # @param {Function} cb
    # @return {number}
    ###
    reqStatusCount: (project, milestone, status, cb) ->
        url     = "https://api.launchpad.net/1.0/#{project}/+milestone/#{milestone}"
        params  = {
            'ws.op': 'searchTasks'
            'status': status
        }

        watson.client.get url, params, (err, body) ->
            if err
                return watson.log err, "error"

            try
                body = JSON.parse body
                body = {
                    name: utils.slugify(status)
                    count: body.total_size
                }

                cb(null, body)
            catch err
                watson.log err, "error"
                cb(err, null)

    ###
    # Used to sort issues alphabetically
    ###
    sortIssues: (a, b) ->
        if a.name < b.name
            return -1

        if a.name > b.name
            return 1

        return 0
