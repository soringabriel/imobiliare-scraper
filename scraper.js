const path = require('path');
const queue = require('queue');
const dotenv = require('dotenv');
const cheerio = require("cheerio");
const Database = require("./database");
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

puppeteer.use(StealthPlugin())
puppeteer.use(AdblockerPlugin())
dotenv.config({path: path.resolve(__dirname, '.env')})

const numberData = ['imovzt', 'camere', 'price', 'surface'];
const maxRetries = 3;

let places = [];
let db = new Database();
let scrapingBatchTime= new Date();
let scrapingQueue = queue({ concurrency: process.env.PAGE_SCRAPE_CONCURRENCY });

function getAllAttributes(node) {
	return node.attributes || Object.keys(node.attribs).map(
	    name => ({ name, value: node.attribs[name] })
	);
};

async function extractData(content, pageNo) {
    let $ = cheerio.load(content);

    $(process.env.PLACES_SELECTOR).each(function(i, elm) {
        let pagePlace = {
            timestamp: scrapingBatchTime
        };
        let attributes = getAllAttributes($(this).get(0));
        for (let index in attributes) {
            let attribute = attributes[index];
            if (attribute.name && attribute.name.startsWith("data-")) {
                pagePlace[attribute.name.replace("data-", "")] = attribute.value; 
                if (numberData.indexOf(attribute.name.replace("data-", "")) >= 0 && attribute.value != null) {
                    pagePlace[attribute.name.replace("data-", "")] = parseFloat(attribute.value); 
                }
            }
            if (attribute.name && attribute.name == "id") {
                pagePlace.link = "https://www.imobiliare.ro/" + attribute.value;
                pagePlace.id = attribute.value;
            }
        }
        if (pagePlace.hasOwnProperty("link") && pagePlace.hasOwnProperty("price")) {
            pagePlace.unique_id = i + "-" + pageNo + "-" + Math.floor(scrapingBatchTime / 1000)
            places.push(pagePlace);
        }
    });
}

async function getMaxPages(browser, retries = 0) {
    if (retries >= maxRetries) {
        return 0;
    }
    let page = await browser.newPage();
    try {
        await page.goto(process.env.URL_BASE, {
            waitUntil: 'networkidle0',
        });
        let content = await page.content();
        let $ = cheerio.load(content);
        let maxPages = $(process.env.LAST_PAGE_SELECTOR).map((i, x) => $(x).attr('data-pagina')).toArray()[0];
        page.close();
        return maxPages;
    } catch (e) {
        retries++;
        page.close();
        return getMaxPages(browser, retries);
    }
}

(async () => {
    let browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox',
            '--disable-dev-sh-usage',
        ]
    });
    let maxPages = await getMaxPages(browser);
    for (let pageNo = 1; pageNo < maxPages; pageNo++) {
        scrapingQueue.push(
            async function () {
                let retries = 0;
                let retry = true;
                while (retry && retries < maxRetries) {
                    let page = await browser.newPage();
                    try {
                        await page.goto(process.env.URL_BASE + "?pagina=" + pageNo, {
                            waitUntil: 'networkidle0',
                        });
                        let content = await page.content();
                        await extractData(content, pageNo);
                        retry = false;
                    } catch (e) {
                        retries++;
                    }
                    page.close();
                }
            }.bind(this)
        )
    }
    await new Promise((resolve, reject) => {
        scrapingQueue.start(function (err) {
            if (err) {
                console.log("Error: " + err);
            }
            resolve(true);
        })
    });

    try { await db.insertMany(places, {ordered: false}); } catch(e) { console.log(e); }
    process.exit();
})();