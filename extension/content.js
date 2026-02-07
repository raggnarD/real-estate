
// Basic Address Extractors
function getZillowAddress() {
    // Zillow typically puts address in h1 or specific meta tags
    const h1 = document.querySelector('h1');
    if (h1) return h1.textContent.trim();

    // Fallback to meta tag
    const meta = document.querySelector('meta[property="og:title"]');
    if (meta) return meta.content.split('|')[0].trim();

    return null;
}

function getRealtorAddress() {
    // Realtor.com extraction logic
    const h1 = document.querySelector('h1');
    if (h1) return h1.textContent.trim();

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
        // Often "Address, City, State..."
        const content = meta.content;
        return content.split('real estate data')[0].trim();
    }
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
        // Send to Extension Runtime (Side Panel)
        chrome.runtime.sendMessage({
            type: 'ADDRESS_DETECTED',
            address: address
        }).catch(() => {
            // Ignore error if side panel is closed
        });
    }
}

// Run on load
detectAddress();

// Run on URL change (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(detectAddress, 2000); // Wait for dynamic content
    }
}).observe(document, { subtree: true, childList: true });

// Listen for manual requests from Side Panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_ADDRESS') {
        detectAddress();
    }
});
