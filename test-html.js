const fs = require('fs');

async function testHTML() {
    const cookiesArray = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
    const cookieStr = cookiesArray.map(c => `${c.name}=${c.value}`).join('; ');

    const url = 'https://www.instagram.com/explore/tags/dubai/';
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cookie': cookieStr
        }
    });

    console.log("Status: " + res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
    
    // Look for x-ig-app-id or some sharedData
    const hasSharedData = html.includes('_sharedData');
    const hasAdditionalData = html.includes('__additionalDataLoaded');
    const hasXigAppId = html.includes('x-ig-app-id');
    const hasPolaris = html.includes('Polaris');
    
    console.log("hasSharedData:", hasSharedData);
    console.log("hasAdditionalData:", hasAdditionalData);
    console.log("hasXigAppId:", hasXigAppId);
    console.log("hasPolaris:", hasPolaris);

    // Save html to file for inspection
    fs.writeFileSync('test-html.html', html);
    console.log("Saved to test-html.html");
}

testHTML();
