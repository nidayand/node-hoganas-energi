'use strict';

var cheerio = require('cheerio')
var tabletojson = require('tabletojson');
var request = require('request')


class henergi {

    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    login() {
        this.jar = request.jar();
        var self = this;
        self.request = request.defaults({
            jar: self.jar
        });

        var p_static = new Promise((resolve, reject) => {
            self.request('http://elforbrukning.hoganas.se/default.asp', (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
        var p_login = new Promise((resolve, reject) => {
            self.request.post('http://elforbrukning.hoganas.se/login.asp', {
                form: {
                    User: self.username,
                    Passord: self.password,
                    login: 'Logga in'
                }
            }, (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });

        return p_static.then((ok) => {
            return p_login
        }).then((ok) => {
            return new Promise((resolve, reject) => {
                if (ok.indexOf('login.asp') > -1) {
                    reject("Incorrect login");
                } else {
                    resolve("Logged in!");
                }
            })
        });
    }

    getSerie() {
        return new Promise((resolve, reject) => {
            this.request('http://elforbrukning.hoganas.se/startside.asp', (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    //Save serie
                    const $ = cheerio.load(body);
                    this.serie = $(':input')[0].attribs.value;
                    resolve(body);
                }
            });
        });
    }


    getReport(year, month) {
        return new Promise((resolve, reject) => {
            this.request(henergi.getReportUrl(this.serie, year, month), (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    //Convert to JSON
                    const converted = tabletojson.convert(body)[0];
                    resolve(converted);
                }
            });
        })
    }

    static getReportUrl(serie, year, month) {
        return 'http://elforbrukning.hoganas.se/rapport.asp?serier=' + serie + '&visning=0&aar=' + year + '&maaned=' + month + '&maanedstand=6&action=%A0K%F6r%A0%3E%3E';
    }

    static cleanReport(year, month, report) {
        //Find total
        var total = 0;
        for (var i = 0; i < report.length; i++) {
            if (report[i][0].indexOf('Total Energi') != -1) {
                total = parseFloat(report[i][1].replace(",", "."))
            }
        }

        //Get days
        var _t = [];
        for (var i = 0; i < report.length; i++) {
            if (report[i][0].match(/\d+\./) && report[i][25] !== '')
                _t.push(report[i]);
        }

        /*
            Restructure
            {
            day: [
                {
                    hour: [1.15, 0.59, ...],
                    total: 25,38
                },
            ],
            total: 237.29
            }
        */
        var _d = [];
        for (var i = 0; i < _t.length; i++) {
            var _h = [];
            for (var j = 1; j < 25; j++) {
                var val = parseFloat(_t[i][j].replace(",", "."));
                _h.push(isNaN(val) ? 0 : val);
            }
            var val = parseFloat(_t[i][25].replace(",", "."));
            _d.push({
                hour: _h,
                total: isNaN(val) ? 0 : val
            });
        }

        return {
            year: year,
            month: month,
            total: total,
            day: _d
        };
    }

}


/**
 * Retrieves a month report. If year and month are not passed
 * it will take the current month
 * @param {string}          username Username at Höganäs Energi
 * @param {string}          password Password at Höganäs Energi
 * @param {number/function} p1       Year of report or callback
 * @param {number}          p2       Month of report or empty
 * @param {function}        p3       callback function or empty
 */
var getReport = function (username, password, p1, p2, p3) {
    // check if year/month is passed
    var vcallback, vyear, vmonth;
    if (typeof p1 == 'function') {
        vcallback = p1;
        //Get current year and month
        vmonth = new Date().getMonth() + 1;
        vyear = new Date().getFullYear();
    } else if (typeof p2 == 'function') {
        vcallback = p1;
        vyear = p2;
        //Get current month
        vmonth = new Date().getMonth() + 1;
    } else {
        vcallback = p3;
        vyear = p1;
        vmonth = p2;
    }
    var _r = new henergi(username, password);

    _r.login()
        .then((ok) => _r.getSerie())
        .then((ok) => _r.getReport(vyear, vmonth))
        .then((ok) => {
            vcallback(henergi.cleanReport(vyear, vmonth, ok));
        }, (err) => {
            vcallback(err);
        });
}

/**
 * Get report for a specific day
 * @param {string}   username Username at Höganäs Energi
 * @param {string}   password Password at Höganäs Energi
 * @param {Date}     date     Date object for specific day
 * @param {function} callback callback function for result
 */
var getDay = function (username, password, date, callback) {
    var year, month, day;
    month = date.getMonth() + 1;
    year = date.getFullYear();
    day = date.getDate();

    getReport(username, password, year, month, function (val) {
        val.hour = val.day[day - 1].hour;
        val.total = val.day[day - 1].total;
        val.day = day;
        callback(val);
    });
}

/**
 * Retreives the consumption from yesterday
 * @param {string}   username Username at Höganäs Energi
 * @param {string}   password Password at Höganäs Energi
 * @param {function} callback callback function
 */
var getYesterday = function (username, password, callback) {
    var d;
    d = new Date();
    d.setDate(d.getDate() - 1); //Subtract one day

    getDay(username, password, d, function (val) {
        callback(val);
    });
}

module.exports = {
    getDay: getDay,
    getYesterday: getYesterday,
    getMonth: getReport
}
