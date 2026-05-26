const fs = require('fs');

async function test() {
    const cookiesArray = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
    const cookieStr = cookiesArray.map(c => `${c.name}=${c.value}`).join('; ');
    const csrf = cookiesArray.find(c => c.name === 'csrftoken')?.value;

    const url = 'https://www.instagram.com/explore/tags/dubai/?__a=1&__d=dis';
    console.log("Fetching: " + url);
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'X-IG-App-ID': '936619743392459',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf || '',
            'Cookie': cookieStr
        }
    });

    console.log("Status: " + res.status);
    const text = await res.text();
    console.log("Body length: " + text.length);
    console.log("Snippet: " + text.substring(0, 200));
}

test();
