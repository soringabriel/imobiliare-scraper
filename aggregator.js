const path = require('path');
const dotenv = require('dotenv');
const Database = require("./database");
const { start } = require('repl');

dotenv.config({path: path.resolve(__dirname, '.env')});

const surface_ranges = {
    "0-29": { min: 0, max: 29 },
    "30-39": { min: 30, max: 39 },
    "40-49": { min: 40, max: 49 },
    "50-59": { min: 50, max: 59 },
    "60-69": { min: 60, max: 69 },
    "70-79": { min: 70, max: 79 },
    "80-89": { min: 80, max: 89 },
    "90-99": { min: 90, max: 99 },
    "100-129": { min: 100, max: 129 },
    "130-159": { min: 130, max: 159 },
    "160+": { min: 160, max: 99999 },
}

let db = new Database();
const startOfDay = new Date();
startOfDay.setUTCHours(0, 0, 0, 0);

(async () => {

    try { 
        let todaysData = await db.find({
            "timestamp": {
                $gt: startOfDay
            }
        })
        let aggregated = {
            timestamp: startOfDay,
            by_rooms: {},
            by_area: {},
            by_surface: {},
            by_surface_range: {
                "0-29": {sum: 0, num: 0},
                "30-39": {sum: 0, num: 0},
                "40-49": {sum: 0, num: 0},
                "50-59": {sum: 0, num: 0},
                "60-69": {sum: 0, num: 0},
                "70-79": {sum: 0, num: 0},
                "80-89": {sum: 0, num: 0},
                "90-99": {sum: 0, num: 0},
                "100-129": {sum: 0, num: 0},
                "130-159": {sum: 0, num: 0},
                "160+": {sum: 0, num: 0},
            },
            total: {sum: 0, num: 0}
        };
        for (let index in todaysData) {
            if (todaysData[index].camere) {
                if (aggregated["by_rooms"].hasOwnProperty(todaysData[index].camere + "_rooms")) {
                    aggregated["by_rooms"][todaysData[index].camere + "_rooms"]["sum"] += parseFloat(todaysData[index].price);
                    aggregated["by_rooms"][todaysData[index].camere + "_rooms"]["num"]++;
                } else {
                    aggregated["by_rooms"][todaysData[index].camere + "_rooms"] = {
                        sum: parseFloat(todaysData[index].price),
                        num: 1
                    };
                }
                if (aggregated["by_area"].hasOwnProperty(todaysData[index].zona + "_area")) {
                    aggregated["by_area"][todaysData[index].zona + "_area"]["sum"] += parseFloat(todaysData[index].price);
                    aggregated["by_area"][todaysData[index].zona + "_area"]["num"]++;
                } else {
                    aggregated["by_area"][todaysData[index].zona + "_area"] = {
                        sum: parseFloat(todaysData[index].price),
                        num: 1
                    };
                }
                if (aggregated["by_surface"].hasOwnProperty(todaysData[index].surface)) {
                    aggregated["by_surface"][todaysData[index].surface]["sum"] += parseFloat(todaysData[index].price);
                    aggregated["by_surface"][todaysData[index].surface]["num"]++;
                } else {
                    aggregated["by_surface"][todaysData[index].surface] = {
                        sum: parseFloat(todaysData[index].price),
                        num: 1
                    };
                }
                aggregated["total"]["sum"] += parseFloat(todaysData[index].price);
                aggregated["total"]["num"]++;
            }
        }
        for (let key in aggregated["by_rooms"]) {
            aggregated["by_rooms"][key]["avg"] = aggregated["by_rooms"][key]["sum"] / aggregated["by_rooms"][key]["num"];
        }
        for (let key in aggregated["by_area"]) {
            aggregated["by_area"][key]["avg"] = aggregated["by_area"][key]["sum"] / aggregated["by_area"][key]["num"];
        }
        for (let key in aggregated["by_surface"]) {
            aggregated["by_surface"][key]["avg"] = aggregated["by_surface"][key]["sum"] / aggregated["by_surface"][key]["num"];
            for (let keyRange in surface_ranges) {
                if (key >= surface_ranges[keyRange].min && key <= surface_ranges[keyRange].max) {
                    aggregated["by_surface_range"][keyRange].sum += aggregated["by_surface"][key]["sum"];
                    aggregated["by_surface_range"][keyRange].num += aggregated["by_surface"][key]["num"];
                }
            }
        }
        for (let key in aggregated["by_surface_range"]) {
            aggregated["by_surface_range"][key]["avg"] = aggregated["by_surface_range"][key]["sum"] / aggregated["by_surface_range"][key]["num"];
        }
        aggregated["total"]["avg"] = aggregated["total"]["sum"] / aggregated["total"]["num"];

        aggregated = Object.keys(aggregated)
                        .sort()
                        .reduce(function (acc, key) { 
                            acc[key] = aggregated[key];
                            return acc;
                        }, {});
        db.setCollection("aggregated");
        await db.insertMany([aggregated]);
        process.exit();
    } catch(e) { 
        console.log(e); 
    }
})();