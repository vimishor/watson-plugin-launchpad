moment      = require('moment')
Datastore   = require('nedb')
utils       = require('./utils')

module.exports = (watson) ->

    enabled         = true
    name            = 'launchpad'
    version         = require("package.json").version

    open_statuses   = ["New", "Incomplete", "Confirmed", "Triaged", "In Progress"]
    closed_statuses = ["Fix Committed", "Fix Released"]
    db              = new Datastore("#{watson.getRootPath()}/db/#{name}_#{watson.project}_#{watson.milestone}.db")

    ###
    # Get stats
    ###
    watson.addTask 'stats', (complete) ->
        db.loadDatabase()
        
        today   = moment().format('DD.MM.YYYY')
        updater = require('./update')(db, watson)

        updater.getStatusCount watson.project, watson.milestone, open_statuses, (err, data) ->
            if err
                watson.log err, "error"
                return

            count_open_issues = count_closed_issues = 0
            issues = []

            data.map (item) ->
                count_open_issues += item[1].count
                issues.push(item[1])

            updater.getStatusCount watson.project, watson.milestone, closed_statuses, (err, closed) ->
                if err
                    watson.log err, "error"
                    return

                closed.map (item) ->
                    count_closed_issues += item[1].count
                    issues.push(item[1])

                issues = issues.sort(updater.sortIssues)

                Stats = {
                    date: today,
                    time: Math.round(new Date().getTime() / 1000),
                    issues: issues,
                    summary: {
                        issues_open:    count_open_issues,
                        issues_closed:  count_closed_issues
                    }
                }

                # @todo: update db
                updater.dbStatsExists today, Stats, (err, exists) ->
                    if err
                        # insert
                        updater.dbStatsInsert Stats, today
                    else
                        if exists is false
                            updater.dbStatsUpdate(Stats, today)
                        else
                            watson.log "Stats unchanged for #{today}"

    ###
    # Build
    ###
    watson.addTask 'build', (complete) ->
        console.log "build data from #{name} plugin"
        builder = require('./build')(db)

        db.loadDatabase()

        builder.getWeekData (err, data) ->
            complete(err, { name: 'launchpad', data: data } )

    return {
        enabled:    enabled,
        name:       name,
        version:    version,
        scripts:    "web/assets/js/launchpad.js"
        partial:    "web/launchpad.html"
    }
