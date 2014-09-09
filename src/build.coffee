utils = require('./utils')

module.exports = (db) ->

    reachZeroIssues: (stats) ->
        [last, ..., first] = stats
        
        # Issues closed in the last 7 days
        issues_closed = last.summary.issues_closed - first.summary.issues_closed

        # Closed issues average per day in last 7 days
        daily_avg = issues_closed/stats.length # .length aka days

        # Estimate when we could close all remaining opened issues
        reach_zero = Math.round last.summary.issues_open / daily_avg

        # Estimate when we could close all remaining opened issues
        return Math.round first.summary.issues_open / daily_avg

    normalizeIssues: (issues) ->
        arr = []
        for item in issues
            arr.push([utils.unSlugify(item.name), item.count])

        return arr

    getWeekData: (callback) ->
        me = @
        db.count {}, (err, count) ->
            if err
                watson.log err, "error"
                return callback(err, null)

            unless count > 0
                watson.log "No entries to process", "error"
                return callback(null, {})

            # get last 7 days of data (asc)
            db.find({}).sort({ time: -1 }).skip(0).limit(7).exec (err, docs) ->
                if err
                    watson.log err, "error"
                    return callback(err, null)

                data = {
                    open: [],
                    close: [],
                    remaining: [],
                    categories: [],
                    drilldown: [],
                    reach_zero: me.reachZeroIssues docs
                }

                for item in docs.reverse()
                    data.open.push({ name: item.date, y: item.summary.issues_open, drilldown: item.date })
                    data.close.push({ name: item.date, y: item.summary.issues_closed, drilldown: item.date })
                    data.remaining.push(item.summary.issues_open)
                    data.categories.push(item.date)
                    data.drilldown.push({
                        type:   'pie',
                        id:     item.date,
                        name:   item.date,
                        data:   me.normalizeIssues(item.issues)
                    })

                return callback(null, data)
