const path = require('path');
const queue = require('queue');
const dotenv = require('dotenv');
const cheerio = require("cheerio");
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

puppeteer.use(StealthPlugin())
puppeteer.use(AdblockerPlugin())
dotenv.config({path: path.resolve(__dirname, '.env')})

let scrapingBatchTime= new Date();
let scrapingQueue = queue({ concurrency: process.env.PAGE_SCRAPE_CONCURRENCY });

function getAllAttributes(node) {
	return node.attributes || Object.keys(node.attribs).map(
	    name => ({ name, value: node.attribs[name] })
	);
};

function extractData(content) {
    let pagePlaces = [];
    let $ = cheerio.load(content);

    $(process.env.PLACES_SELECTOR).each(function(i, elm) {
        let pagePlace = {};
        let attributes = getAllAttributes($(this).get(0));
        for (let index in attributes) {
            let attribute = attributes[index];
            if (attribute.name && attribute.name.startsWith("data-")) {
                pagePlace[attribute.name.replace("data-", "")] = attribute.value; 
            }
        }
        pagePlaces.push(pagePlace);
    });

    return pagePlaces;
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
    for (let pageNo = 1; pageNo < 334; pageNo++) {
        scrapingQueue.push(
            async function () {
                let page = await browser.newPage();
                let response = await page.goto(process.env.URL_BASE + "?pagina=" + pageNo, {
                    waitUntil: 'networkidle0',
                });
                let content = await page.content();
                extractData(content);
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
})();