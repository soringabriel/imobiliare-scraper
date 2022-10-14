const path = require('path');
const dotenv = require('dotenv');
const Database = require("./database");
dotenv.config({path: path.resolve(__dirname, '.env')})

const {plot} = require('nodeplotlib');

let db = new Database('aggregated');

function plotGroupedData(title, fulldata, keys, mainKey) {
    let data = [];
    for (let index in keys) {
        let key = keys[index];
        data.push({
            x: fulldata.map((x) => { return x.timestamp; }),
            y: fulldata.map((x) => { return x[mainKey][key] ? x[mainKey][key].avg : -1; }),
            type: 'bar',
            name: `${key}`
        })
    }
    var layout = {
        title: title,
    };
    plot(data, layout);
}

function plotMainData(title, fulldata, key) {
    let data = [];
    data.push({
        x: fulldata.map((x) => { return x.timestamp; }),
        y: fulldata.map((x) => { return x[key].avg; }),
        type: 'line',
        name: `${title}`
    })
    var layout = {
        title: title,
    };
    plot(data, layout);
}

(async () => {
    let fulldata = await db.find()

    plotGroupedData("Avg Price By Surface Range", fulldata, Object.keys(fulldata[0].by_surface_range), "by_surface_range");
    plotGroupedData("Avg Price By Rooms No.", fulldata, Object.keys(fulldata[0].by_rooms), "by_rooms");
    plotGroupedData("Avg Price By Area", fulldata, Object.keys(fulldata[0].by_area), "by_area");
    plotMainData("Avg Price Per Total", fulldata, "total");

})();