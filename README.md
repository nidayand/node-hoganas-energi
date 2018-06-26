# node-hoganas-energi [![npm version](https://badge.fury.io/js/node-hoganas-energi.svg)](https://badge.fury.io/js/node-hoganas-energi)
## Install
```bash
npm install node-hognas-energi
```

## Methods
```javascript
/**
 * Retrieves a month report. If year and month are not passed
 * it will take the current month
 * @param {string}          username Username at Höganäs Energi
 * @param {string}          password Password at Höganäs Energi
 * @param {number/function} p1       Year of report (YYYY) or callback (gets current year and month)
 * @param {number}          p2       Month of report or empty (1-12)
 * @param {function}        p3       callback function or empty
 */
getMonth = function(username, password, p1, p2, p3)

/**
 * Get report for a specific day
 * @param {string}   username Username at Höganäs Energi
 * @param {string}   password Password at Höganäs Energi
 * @param {Date}     date     Date object for specific day
 * @param {function} callback callback function for result
 */
getDay = function(username, password, date, callback)

/**
 * Retreives the consumption from yesterday
 * @param {string}   username Username at Höganäs Energi
 * @param {string}   password Password at Höganäs Energi
 * @param {function} callback callback function
 */
getYesterday = function(username, password, callback)
```

## Example
```javascript
var nodeHoganasEnergi = require("node-hoganas-energi")
// uid = 123456, pwd = 101112
nodeHoganasEnergi.getYesterday('123456', '101112',function(m){
    console.log(m);
})
```
