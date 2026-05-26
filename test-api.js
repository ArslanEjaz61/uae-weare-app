const fs = require('fs');

async function testApi() {
    const cookiesArray = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
    const cookieStr = cookiesArray.map(c => `${c.name}=${c.value}`).join('; ');
    const csrf = cookiesArray.find(c => c.name === 'csrftoken')?.value;
    const appId = '936619743392459'; // Instagram Web App ID

    const username = 'uaeweare';
    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;
    console.log("Fetching profile: " + url);
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'X-IG-App-ID': appId,
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrf || '',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Cookie': cookieStr
        }
    });

    console.log("Status: " + res.status);
    const data = await res.json();
    console.log("User ID for uaeweare:", data.graphql?.user?.id || data.data?.user?.id || data.logging_page_id);
}

testApi();





