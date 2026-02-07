
// Basic Address Extractors
function getZillowAddress() {
    console.log('[RushRoost] Checking Zillow address...');

    // 1. Try specific test IDs (most reliable)
    const line1 = document.querySelector('[data-testid="address-line-1"]');
    const line2 = document.querySelector('[data-testid="address-line-2"]');
    if (line1 && line2) return `${line1.textContent.trim()}, ${line2.textContent.trim()}`;
    if (line1) return line1.textContent.trim();

    // 2. Try all H1s (Zillow often has multiple, we want the one with a comma)
    const h1s = document.querySelectorAll('h1');
    for (const h1 of h1s) {
        const text = h1.textContent.trim();
        // Addresses usually have a comma and some length
        if (text.length > 10 && text.includes(',')) {
            return text;
        }
    }

    // 3. Fallback to specific container (observed in some Zillow versions)
    const chip = document.querySelector('[data-testid="home-details-chip-container"]');
    if (chip) {
        const chipH1 = chip.querySelector('h1');
        if (chipH1) return chipH1.textContent.trim();
    }

    // 4. Fallback to meta tag
    const meta = document.querySelector('meta[property="og:title"]');
    if (meta && meta.content) {
        const title = meta.content.split('|')[0].trim();
        if (title.length > 5 && title.includes(',')) return title;
    }

    return null;
}

function getRealtorAddress() {
    console.log('[RushRoost] Checking Realtor.com address...');
    // 1. Try address section
    const addr = document.querySelector('[data-testid="address-section"]');
    if (addr) return addr.textContent.trim().replace(/\s+/g, ' ');

    // 2. Try h1 with ZIP code pattern (most reliable)
    const h1s = document.querySelectorAll('h1');
    for (const h1 of h1s) {
        const text = h1.textContent.trim();
        if (text.length > 10 && text.includes(',') && /\d{5}/.test(text)) {
            console.log('[RushRoost] Found address in h1:', text);
            return text;
        }
    }


    // 3. Try meta og:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) {
        const title = ogTitle.content.split('|')[0].trim();
        if (title.length > 5 && title.includes(',')) {
            console.log('[RushRoost] Found address in og:title:', title);
            return title;
        }
    }

    // 4. Fallback to meta description
    const meta = document.querySelector('meta[name="description"]');
    if (meta && meta.content) {
        const content = meta.content;
        const addressMatch = content.split('real estate data')[0].trim();
        if (addressMatch.length > 5 && addressMatch.includes(',')) {
            console.log('[RushRoost] Found address in meta description:', addressMatch);
            return addressMatch;
        }
    }

    console.log('[RushRoost] No Realtor.com address found');
    return null;
}

function detectAddress() {
    const host = window.location.hostname;
    let address = null;

    if (host.includes('zillow.com')) {
        address = getZillowAddress();
    } else if (host.includes('realtor.com')) {
        address = getRealtorAddress();
    }

    if (address) {
        console.log('[RushRoost] Address detected:', address);
        chrome.runtime.sendMessage({
            type: 'ADDRESS_DETECTED',
            address: address
        }).catch(() => {
            // Ignore if sidepanel closed
        });
        return true; // Found address
    }

    console.log('[RushRoost] No address found yet...');
    return false; // Did not find address
}

// Initial detection with retries (important for SPAs)
let detectionAttempts = 0;
const MAX_ATTEMPTS = 10;

function pollForAddress() {
    if (detectAddress()) {
        console.log('[RushRoost] Address detection successful');
        return;
    }

    detectionAttempts++;
    if (detectionAttempts < MAX_ATTEMPTS) {
        console.log(`[RushRoost] Retrying address detection (Attempt ${detectionAttempts + 1}/${MAX_ATTEMPTS})...`);
        setTimeout(pollForAddress, 2000);
    }
}

// Start polling on load
if (document.readyState === 'complete') {
    pollForAddress();
} else {
    window.addEventListener('load', pollForAddress);
}

// Observe for URL changes (SPA navigations)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        detectionAttempts = 0; // Reset attempts for new page
        console.log('[RushRoost] URL changed, starting polling...');
        setTimeout(pollForAddress, 1000);
    }
}).observe(document, { subtree: true, childList: true });

// Listen for manual requests from Side Panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_ADDRESS') {
        console.log('[RushRoost] Manual address request received');
        pollForAddress();
    }
});
