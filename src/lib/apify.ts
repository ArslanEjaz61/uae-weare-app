import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token
export const apifyClient = new ApifyClient({
    token: process.env.APIFY_TOKEN || '',
});
