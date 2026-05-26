const puppeteer = require('puppeteer');
const fs = require('fs');

async function testScrape() {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    await page.setCookie(...cookies);
    
    console.log("Navigating to hashtag...");
    const response = await page.goto('https://www.instagram.com/explore/tags/dubai/?__a=1&__d=dis', { waitUntil: 'networkidle2' });
    
    console.log("Status:", response.status());
    const text = await page.evaluate(() => document.body.innerText);
    console.log("Length:", text.length);
    console.log("Snippet:", text.substring(0, 200));
    
    await browser.close();
}

testScrape();
