const path = require('path');
const dotenv = require('dotenv');
const Database = require("./database");
const { start } = require('repl');

dotenv.config({path: path.resolve(__dirname, '.env')});

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