import { HttpCrawler, Dataset } from 'crawlee';
import { getSignService } from './sign';

/**
 * Request label types for different Douyin task types
 * Based on Python backend: aweme, post, favorite, collection, music, hashtag, mix, search, following, follower
 */
export enum DouyinRequestLabel {
    AWEME = 'aweme',           // Single video detail
    POST = 'post',               // User posts
    FAVORITE = 'favorite',       // User favorites
    COLLECTION = 'collection',   // User collections
    MUSIC = 'music',             // Music videos
    HASHTAG = 'hashtag',       // Hashtag videos
    MIX = 'mix',                 // Collection/Mix videos
    SEARCH = 'search',           // Search results (NO signature needed)
    FOLLOWING = 'following',     // Following list
    FOLLOWER = 'follower',       // Follower list
}

/**
 * APIs that require signature (based on Python code)
 * - /aweme/v1/web/aweme/detail/ (single video)
 * - /aweme/v1/web/music/aweme/ (music videos)
 * - /aweme/v1/web/user/follower/list/ (follower list)
 */
const SIGNED_URIS = [
    '/aweme/v1/web/aweme/detail/',
    '/aweme/v1/web/music/aweme/',
    '/aweme/v1/web/user/follower/list/',
];

// Use HttpCrawler to handle JSON responses
const crawler = new HttpCrawler({
    // sign request
    preNavigationHooks: [
        async (crawlingContext: any, gotOptions: any) => {
            const { request } = crawlingContext;

            // Extract URI path
            const urlObj = new URL(request.url);
            const uri = urlObj.pathname;

            // Method 1: Check if URI endpoint needs signature (based on Python logic)
            // Method 2: Check if request label is SEARCH to skip signature
            const label = request.userData.label;

            // Search requests don't need signature (based on Python code analysis)
            if (label === DouyinRequestLabel.SEARCH) {
                return; // Skip signature for search requests
            }

            // For other requests, check if endpoint requires signature
            const needsSign = SIGNED_URIS.some(signedUri => uri.includes(signedUri));
            if (!needsSign) {
                return; // Endpoint doesn't need signature
            }

            // Determine signature type: detail or reply
            // Based on original code, use sign_reply if contains 'reply', otherwise use sign_detail
            const signType = uri.includes('reply') ? 'reply' : 'detail';

            // Extract query parameters
            const searchParams = new URLSearchParams(urlObj.search);
            const queryArray: string[] = [];
            searchParams.forEach((value, key) => {
                queryArray.push(`${key}=${encodeURIComponent(value)}`);
            });
            const query = queryArray.join('&');

            // Get User-Agent
            const userAgent = gotOptions.headers?.['User-Agent'] || gotOptions.headers?.['user-agent'] || '';

            // Use sign service to generate signature
            const signService = getSignService();
            const signature = signService.sign(query, userAgent, signType);

            // Add signature to request parameters
            // Update searchParams
            if (!gotOptions.searchParams) {
                gotOptions.searchParams = {};
            }
            gotOptions.searchParams.a_bogus = signature;
        }],
    additionalMimeTypes: ["application/json"],

    // RequestHandler receives body (string or Buffer) and contentType
    async requestHandler({ request, body, contentType, log }) {
        log.info(`Processed ${request.url}`);

        // Parse JSON if content type is application/json
        let data = body;
        if (contentType.type === 'application/json') {
            data = typeof body === 'string' ? JSON.parse(body) : JSON.parse(body.toString());
        }

        // Directly push data to dataset
        await Dataset.pushData({
            url: request.url,
            label: request.userData.label,
            data: data,
        });
    },

    maxRequestsPerCrawl: 50,
});

// Example usage with different task types:
// 
// // Search request (no signature needed)
// await crawler.run([{
//     url: 'https://www.douyin.com/aweme/v1/web/search/item/',
//     userData: { label: DouyinRequestLabel.SEARCH }
// }]);
//
// // Video detail request (signature needed)
// await crawler.run([{
//     url: 'https://www.douyin.com/aweme/v1/web/aweme/detail/',
//     userData: { label: DouyinRequestLabel.AWEME }
// }]);
//
// // Follower list request (signature needed)
// await crawler.run([{
//     url: 'https://www.douyin.com/aweme/v1/web/user/follower/list/',
//     userData: { label: DouyinRequestLabel.FOLLOWER }
// }]);