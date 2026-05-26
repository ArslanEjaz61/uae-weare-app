const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // List of common Windows browser paths
    const browserPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];

    let executablePath = null;
    for (const path of browserPaths) {
        if (fs.existsSync(path)) {
            executablePath = path;
            break;
        }
    }

    if (!executablePath) {
        console.error("Could not find Chrome or Edge on your system!");
        process.exit(1);
    }

    console.log(`Launching browser from: ${executablePath}`);
    const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: executablePath,
        defaultViewport: null 
    });
    const page = await browser.newPage();
    
    console.log("Opening Instagram...");
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
    
    console.log("\n=======================================================");
    console.log("PLEASE LOG IN TO INSTAGRAM IN THE OPENED BROWSER WINDOW");
    console.log("=======================================================\n");
    console.log("Waiting for you to log in... (Browser will close automatically when done)");
    
    let loggedIn = false;
    while (!loggedIn) {
        try {
            const cookies = await page.cookies();
            const sessionid = cookies.find(c => c.name === 'sessionid');
            if (sessionid) {
                fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
                console.log("\n✅ Login detected! Cookies saved successfully to cookies.json!");
                loggedIn = true;
            } else {
                await new Promise(r => setTimeout(r, 2000)); // check every 2 seconds
            }
        } catch (e) {
            console.log("\nBrowser was closed before login could be completed.");
            break;
        }
    }
    
    try {
        await browser.close();
    } catch(e) {}
})();
