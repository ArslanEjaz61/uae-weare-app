import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { password, cookiesText, userAgent } = await request.json();

        // Check password
        const adminPassword = process.env.ADMIN_PASSWORD || 'uaeweare2026';
        if (password !== adminPassword) {
            return NextResponse.json({ success: false, error: 'Incorrect password!' }, { status: 401 });
        }

        if (!cookiesText || !cookiesText.trim()) {
            return NextResponse.json({ success: false, error: 'Cookies content is empty!' }, { status: 400 });
        }

        let parsedCookies: any[] = [];

        // Check if it is JSON array
        const trimmed = cookiesText.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                parsedCookies = JSON.parse(trimmed);
            } catch (err) {
                return NextResponse.json({ success: false, error: 'Invalid JSON format!' }, { status: 400 });
            }
        } else {
            // Treat as raw Cookie header: "name1=value1; name2=value2"
            try {
                const parts = trimmed.split(';');
                for (const part of parts) {
                    if (!part.includes('=')) continue;
                    const idx = part.indexOf('=');
                    const name = part.substring(0, idx).trim();
                    const value = part.substring(idx + 1).trim();
                    if (name) {
                        parsedCookies.push({ name, value });
                    }
                }
            } catch (err) {
                return NextResponse.json({ success: false, error: 'Failed to parse raw cookie string!' }, { status: 400 });
            }
        }

        if (parsedCookies.length === 0) {
            return NextResponse.json({ success: false, error: 'No cookies parsed from input!' }, { status: 400 });
        }

        // Verify key cookies
        const hasSession = parsedCookies.some(c => c.name === 'sessionid');
        const hasCsrf = parsedCookies.some(c => c.name === 'csrftoken');

        // Save to cookies.json
        const cookiesPath = path.join(process.cwd(), 'cookies.json');
        fs.writeFileSync(cookiesPath, JSON.stringify(parsedCookies, null, 2));

        if (userAgent) {
            const uaPath = path.join(process.cwd(), 'userAgent.txt');
            fs.writeFileSync(uaPath, userAgent.trim());
        }

        return NextResponse.json({ 
            success: true, 
            message: `Cookies updated successfully! Parsed ${parsedCookies.length} cookies. Session ID: ${hasSession ? 'Found' : 'Not Found'}, CSRF Token: ${hasCsrf ? 'Found' : 'Not Found'}` 
        });

    } catch (error: any) {
        console.error("Admin update cookies error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
