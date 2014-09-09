$(document).ready(function() {


buildStatsChart = function (event) {
    var stats = event.message.launchpad;

    // Internationalization
    Highcharts.setOptions({
        lang: {
            drillUpText: '◁ Back to {series.id}'
        }
    });

    var options = {

        chart: {
            height: 340,
            events: {
                drilldown: function (event) {
                    this.setTitle({ text: 'Issues breakdown on '+ event.point.name });
                },
                drillup: function (event) {
                    this.setTitle({ text: options.title.text });
                }
            }
        },
        
        title: {
            text: 'freya-beta2 issues in the last 7 days'
        },

        credits: {
            enabled: false
        },

        yAxis: {
            min: 0,
            title: {
                text: 'Total issues'
            },
            stackLabels: {
                enabled: false
            }
        },

        xAxis: {
            categories: stats.categories
        },
        
        drilldown: {
            series: stats.drilldown
        },
        
        legend: {
            align: 'right',
            x: -70,
            verticalAlign: 'top',
            y: 20,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },
        
        plotOptions: {
            series: {
                shadow: false
            },
            pie: {
                size: '80%'
            },
            column: {
                colorByPoint: false,
                stacking: 'normal'
            }
        },
        colors: [
            'orange',
            'gray',
            'lightgreen',
            '#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce', '#492970', '#f28f43', '#77a1e5', '#c42525', '#a6c96a'
        ],
        
        series: [{
            type: 'column',
            id: 'Overview',
            name: 'Open',
            data: stats.open,
            dataLabels: {
                enabled: true,
                color: 'red',
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif',
                }
            }
        }, {
            type: 'column',
            name: 'Closed',
            data: stats.close
        }, {
            type: 'spline',
            name: 'Remaining',
            data: stats.remaining,
            marker: {
                lineWidth: 2,
                lineColor: Highcharts.getOptions().colors[2],
                fillColor: 'white'
            }
        }]
    };

    // Column chart
    options.chart.renderTo = 'issues';
    options.chart.type = 'column';
    var chart1 = new Highcharts.Chart(options);

    $('#reach-zero').html(stats.reach_zero);
};

$(document).on('data.ready', buildStatsChart);

});
