import { CheerioCrawler, Dataset } from 'crawlee';
import { getSignService } from './sign';

/**
* Douyin Signer - checks if URI needs signature and generates a_bogus parameter
*/
class DouyinSigner {
    /**
    * APIs that require signature (based on Python code)
    */
    private static SIGNED_URIS = [
        '/aweme/v1/web/aweme/detail/',
        '/aweme/v1/web/music/aweme/',
        '/aweme/v1/web/user/follower/list/',
    ];

    /**
    * Check if URI needs signature
    */
    static needsSignature(uri: string): boolean {
        return this.SIGNED_URIS.some(signedUri => uri.includes(signedUri));
    }

    /**
    * Generate and add signature for requests that need it
    */
    static async signRequest(crawlingContext: any, gotOptions: any) {
        const { request } = crawlingContext;

        // Extract URI path
        const urlObj = new URL(request.url);
        const uri = urlObj.pathname;

        // Check if signature is needed
        if (!DouyinSigner.needsSignature(uri)) {
            return; // No signature needed, return directly
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
    }
}

// Create sign hook
const douyinSignHook = DouyinSigner.signRequest.bind(DouyinSigner);

const crawler = new CheerioCrawler({
    // Add preNavigationHooks to intercept requests and add signature
    preNavigationHooks: [douyinSignHook],

    async requestHandler({ request, $, enqueueLinks, log }) {
        const title = $('title').text();
        log.info(`Title of ${request.loadedUrl} is '${title}'`);

        await Dataset.pushData({ title, url: request.loadedUrl });

        await enqueueLinks();
    },

    maxRequestsPerCrawl: 50,
});

// await crawler.run(['https://crawlee.dev']);
