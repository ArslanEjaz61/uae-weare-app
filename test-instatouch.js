const instatouch = require('instatouch');
const fs = require('fs');

async function test() {
    const cookiesArray = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
    const sessionCookie = cookiesArray.find(c => c.name === 'sessionid');
    
    if (!sessionCookie) {
        console.log("No sessionid found in cookies.json");
        return;
    }

    // instatouch accepts the raw value of the sessionid cookie
    const sessionId = `sessionid=${sessionCookie.value}`;
    console.log("Using session ID:", sessionId);

    try {
        const options = {
            count: 20,
            session: sessionId,
        };
        
        console.log("Fetching hashtag #dubai...");
        const result = await instatouch.hashtag('dubai', options);
        console.log("Success! Found posts:", result.collector.length);
        if (result.collector.length > 0) {
            console.log("Sample post ID:", result.collector[0].id);
        }
    } catch (error) {
        console.error("Error scraping with instatouch:", error);
    }
}

test();
