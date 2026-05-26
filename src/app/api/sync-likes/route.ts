import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Tracking posts from the 2026 campaign up to May 30
const EID_START = new Date('2026-01-01T00:00:00Z');
const EID_END = new Date('2026-05-30T23:59:59Z');

// Blocked accounts - brand's own account
const BLOCKED_ACCOUNTS = ['uae.weare', 'uaeweare'];

// User requested ONLY #MyEidinUAE
const HASHTAGS = [
    "MyEidinUAE",
    "myeidinuae",
    "MyEIDInUAE",
    "MYEIDINUAE"
];

// Helper to get cookies string, CSRF token, and User-Agent
function getCookiesData() {
    let cookieStr = '';
    let csrf = '';
    let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'; // Default fallback

    try {
        const cookiesPath = path.join(process.cwd(), 'cookies.json');
        if (fs.existsSync(cookiesPath)) {
            const cookiesData = fs.readFileSync(cookiesPath, 'utf8');
            const cookiesArray = JSON.parse(cookiesData);
            cookieStr = cookiesArray.map((c: any) => `${c.name}=${c.value}`).join('; ');
            csrf = cookiesArray.find((c: any) => c.name === 'csrftoken')?.value || '';
        }
    } catch (e) {
        console.log("Could not read cookies.json", e);
    }

    try {
        const uaPath = path.join(process.cwd(), 'userAgent.txt');
        if (fs.existsSync(uaPath)) {
            const uaData = fs.readFileSync(uaPath, 'utf8').trim();
            if (uaData) {
                userAgent = uaData;
            }
        }
    } catch (e) {
        console.log("Could not read userAgent.txt", e);
    }

    return { cookieStr, csrf, userAgent };
}

// Recursively find all media objects in Instagram's JSON response
function findMediaObjects(obj: any, results: any[] = []): any[] {
    if (!obj || typeof obj !== 'object') return results;

    if (obj.media && typeof obj.media === 'object' && (obj.media.id || obj.media.pk)) {
        results.push(obj.media);
    } else if (obj.id && obj.pk && obj.code && obj.user) {
        results.push(obj);
    } else {
        for (const key of Object.keys(obj)) {
            findMediaObjects(obj[key], results);
        }
    }
    return results;
}

// Scrape Instagram hashtag page directly using cookies and the modern API endpoint
async function scrapeHashtag(tag: string): Promise<any[]> {
    try {
        const { cookieStr, csrf, userAgent } = getCookiesData();
        const appId = '936619743392459'; // Instagram Web App ID
        const url = `https://www.instagram.com/api/v1/tags/web_info/?tag_name=${tag}`;
        
        console.log(`Scraping API for hashtag #${tag}...`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'X-IG-App-ID': appId,
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrf,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                ...(cookieStr ? { 'Cookie': cookieStr } : {})
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            console.log(`Hashtag #${tag}: HTTP ${response.status}`);
            return [];
        }

        const data = await response.ok ? await response.json() : null;
        if (!data) return [];
        
        const mediaObjects = findMediaObjects(data);
        
        const posts = mediaObjects.map((media: any) => {
            const captionText = media.caption?.text || '';
            const displayUrl = media.image_versions2?.candidates?.[0]?.url || '';
            const username = media.user?.username || `user_${media.user?.pk || media.user?.id || ''}`;
            return {
                id: media.id || media.pk,
                shortcode: media.code,
                ownerUsername: username,
                ownerId: media.user?.pk || media.user?.id || '',
                url: `https://www.instagram.com/p/${media.code}/`,
                displayUrl: displayUrl,
                likesCount: media.like_count || 0,
                commentsCount: media.comment_count || 0,
                caption: captionText,
                timestamp: media.taken_at ? new Date(media.taken_at * 1000) : null,
                isVideo: media.media_type === 2,
            };
        });

        console.log(`Hashtag #${tag}: found ${posts.length} posts`);
        return posts;
    } catch (err: any) {
        console.log(`Hashtag #${tag} scrape failed: ${err.message}`);
        return [];
    }
}

// Alternative: scrape via Instagram's web page HTML (fallback)
async function scrapeHashtagFromHTML(tag: string): Promise<any[]> {
    try {
        const { cookieStr, userAgent } = getCookiesData();
        
        const url = `https://www.instagram.com/explore/tags/${tag}/`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                ...(cookieStr ? { 'Cookie': cookieStr } : {})
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) return [];

        const html = await response.text();
        
        // Try to extract JSON data from the HTML page
        const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});\s*<\/script>/);
        if (sharedDataMatch) {
            const sharedData = JSON.parse(sharedDataMatch[1]);
            const hashtagData = sharedData?.entry_data?.TagPage?.[0]?.graphql?.hashtag;
            if (hashtagData) {
                const edges = hashtagData.edge_hashtag_to_media?.edges || [];
                return edges.map((edge: any) => {
                    const node = edge.node;
                    const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
                    return {
                        id: node.id,
                        shortcode: node.shortcode,
                        ownerUsername: node.owner?.username || '',
                        ownerId: node.owner?.id || '',
                        url: `https://www.instagram.com/p/${node.shortcode}/`,
                        displayUrl: node.display_url || node.thumbnail_src || '',
                        likesCount: node.edge_media_preview_like?.count || 0,
                        commentsCount: node.edge_media_to_comment?.count || 0,
                        caption: caption,
                        timestamp: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000) : null,
                        isVideo: node.is_video || false,
                    };
                });
            }
        }

        // Try __additionalData pattern
        const additionalDataMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/);
        if (additionalDataMatch) {
            const data = JSON.parse(additionalDataMatch[1]);
            const edges = data?.graphql?.hashtag?.edge_hashtag_to_media?.edges || [];
            return edges.map((edge: any) => {
                const node = edge.node;
                const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
                return {
                    id: node.id,
                    shortcode: node.shortcode,
                    ownerUsername: node.owner?.username || '',
                    ownerId: node.owner?.id || '',
                    url: `https://www.instagram.com/p/${node.shortcode}/`,
                    displayUrl: node.display_url || node.thumbnail_src || '',
                    likesCount: node.edge_media_preview_like?.count || 0,
                    commentsCount: node.edge_media_to_comment?.count || 0,
                    caption: caption,
                    timestamp: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000) : null,
                    isVideo: node.is_video || false,
                };
            });
        }

        return [];
    } catch (err: any) {
        console.log(`HTML scrape #${tag} failed: ${err.message}`);
        return [];
    }
}

// Scrape Instagram tagged posts (usertags) feed directly using cookies
async function scrapeUsertags(userId: string): Promise<any[]> {
    try {
        const { cookieStr, csrf, userAgent } = getCookiesData();
        const appId = '936619743392459'; // Instagram Web App ID
        const url = `https://www.instagram.com/api/v1/usertags/${userId}/feed/`;
        
        console.log(`Scraping usertags feed for user ID ${userId}...`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'X-IG-App-ID': appId,
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': csrf,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                ...(cookieStr ? { 'Cookie': cookieStr } : {})
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            console.log(`Usertags ID ${userId}: HTTP ${response.status}`);
            return [];
        }

        const data = await response.ok ? await response.json() : null;
        if (!data) return [];

        const mediaObjects = findMediaObjects(data);
        
        const posts = mediaObjects.map((media: any) => {
            const captionText = media.caption?.text || '';
            
            // FILTER: Make sure the post contains #MyEidInUAE (case insensitive)
            const hasTargetHashtag = captionText.toLowerCase().includes('myeidinuae');
            if (!hasTargetHashtag) {
                return null;
            }

            const displayUrl = media.image_versions2?.candidates?.[0]?.url || '';
            const username = media.user?.username || `user_${media.user?.pk || media.user?.id || ''}`;
            return {
                id: media.id || media.pk,
                shortcode: media.code,
                ownerUsername: username,
                ownerId: media.user?.pk || media.user?.id || '',
                url: `https://www.instagram.com/p/${media.code}/`,
                displayUrl: displayUrl,
                likesCount: media.like_count || 0,
                commentsCount: media.comment_count || 0,
                caption: captionText,
                timestamp: media.taken_at ? new Date(media.taken_at * 1000) : null,
                isVideo: media.media_type === 2,
            };
        }).filter(Boolean);

        console.log(`Usertags ID ${userId}: found ${posts.length} matching posts`);
        return posts;
    } catch (err: any) {
        console.log(`Usertags ID ${userId} scrape failed: ${err.message}`);
        return [];
    }
}

async function syncData() {
    const uniqueMap = new Map<string, any>();

    // 1. Scrape each hashtag
    for (const tag of HASHTAGS) {
        // Try API endpoint first
        let posts = await scrapeHashtag(tag);
        
        // If API fails, try HTML scraping
        if (posts.length === 0) {
            posts = await scrapeHashtagFromHTML(tag);
        }

        for (const post of posts) {
            if (post.id && !uniqueMap.has(post.id)) {
                uniqueMap.set(post.id, post);
            }
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 2. Scrape usertags for uae.weare (ID: 28008476499) to get missing posts
    try {
        const taggedPosts = await scrapeUsertags('28008476499');
        for (const post of taggedPosts) {
            if (post && post.id && !uniqueMap.has(post.id)) {
                uniqueMap.set(post.id, post);
            }
        }
    } catch (e) {
        console.log("Failed to scrape usertags", e);
    }

    console.log(`Total unique posts found: ${uniqueMap.size}`);

    let newCount = 0;
    let updateCount = 0;
    let skippedOld = 0;
    let skippedBlocked = 0;

    for (const item of uniqueMap.values()) {
        if (!item.id || !item.url) continue;

        // Need to get username - some responses only have owner ID
        const username = item.ownerUsername || `user_${item.ownerId}`;

        // Filter: skip brand's own account posts
        if (BLOCKED_ACCOUNTS.includes(username.toLowerCase())) {
            skippedBlocked++;
            continue;
        }

        // Filter: only keep posts from tracking period
        const postDate = item.timestamp;
        if (postDate && (postDate < EID_START || postDate > EID_END)) {
            skippedOld++;
            continue;
        }

        const existingPost = await prisma.post.findUnique({
            where: { instagramId: item.id }
        });

        if (existingPost) {
            await prisma.post.update({
                where: { instagramId: item.id },
                data: {
                    likesCount: item.likesCount || 0,
                    lastUpdated: new Date()
                }
            });
            updateCount++;
        } else {
            await prisma.post.create({
                data: {
                    instagramId: item.id,
                    username: username,
                    postUrl: item.url,
                    likesCount: item.likesCount || 0,
                    thumbnailUrl: item.displayUrl || null,
                    publishedAt: postDate || new Date(),
                }
            });
            newCount++;
        }
    }

    return { newCount, updateCount, skippedOld, skippedBlocked, totalScraped: uniqueMap.size };
}

// GET - manual sync
export async function GET() {
    try {
        const result = await syncData();
        return NextResponse.json({
            success: true,
            message: `Synced! New: ${result.newCount}, Updated: ${result.updateCount}, Skipped old: ${result.skippedOld}, Blocked: ${result.skippedBlocked}, Total: ${result.totalScraped}`
        });
    } catch (error: any) {
        console.error("Sync error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - for auto-sync
export async function POST() {
    try {
        const result = await syncData();
        return NextResponse.json({
            success: true,
            message: `Auto-synced! New: ${result.newCount}, Updated: ${result.updateCount}, Blocked: ${result.skippedBlocked}`,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Auto-sync error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
