
const API_BASE_LOCAL = 'http://localhost:3000';
const API_BASE_PROD = 'https://real-estate-raggnard.vercel.app';
let API_BASE = API_BASE_LOCAL; // Default to local, logic can switch based on env or failure

// UI Elements
const authStatus = document.getElementById('auth-status');
const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
const loginBtn = document.getElementById('login-btn');
const currentAddressEl = document.getElementById('current-address');
const destinationSelect = document.getElementById('destination-select');
const newDestName = document.getElementById('new-destination-name');
const newDestAddr = document.getElementById('new-destination-address');
const addDestBtn = document.getElementById('add-destination-btn');
const resultsArea = document.getElementById('results-area');
const commuteTimeEl = document.getElementById('commute-time');
const commuteDistEl = document.getElementById('commute-distance');

let currentPropertyAddress = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadDestinations();
});

// Check Authentication via Cookies
async function checkAuth() {
    // Try prod first, then local
    const isProd = await checkCookie(API_BASE_PROD);
    if (isProd) {
        API_BASE = API_BASE_PROD;
        await verifyAndShowUser();
        return;
    }

    const isLocal = await checkCookie(API_BASE_LOCAL);
    if (isLocal) {
        API_BASE = API_BASE_LOCAL;
        await verifyAndShowUser();
        return;
    }

    showLogin();
}

async function verifyAndShowUser() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/session`);
        const session = await res.json();

        if (session && session.user) {
            showMain(session.user);
        } else {
            showLogin();
        }
    } catch (e) {
        console.error('Failed to fetch session', e);
        showLogin();
    }
}

async function checkCookie(url) {
    try {
        const cookie = await chrome.cookies.get({ url: url, name: 'authjs.session-token' });
        const secureCookie = await chrome.cookies.get({ url: url, name: '__Secure-authjs.session-token' });
        return !!(cookie || secureCookie);
    } catch (e) {
        console.error('Cookie check failed', e);
        return false;
    }
}

const signOutBtn = document.getElementById('sign-out-btn');

function showLogin() {
    authStatus.textContent = 'Not Signed In';
    authStatus.className = 'text-xs text-red-500 font-medium';

    // Force visibility using style to ensure no class conflicts
    loginSection.style.display = 'block';
    mainSection.style.display = 'none';
    if (signOutBtn) signOutBtn.style.display = 'none';
}

function showMain(user) {
    const name = user.name || user.email || 'Connected';
    authStatus.textContent = name;
    authStatus.className = 'text-xs text-gray-700 font-semibold truncate max-w-[100px]';

    // Force visibility
    loginSection.style.display = 'none';
    mainSection.style.display = 'block';
    if (signOutBtn) signOutBtn.style.display = 'block';
}

// Login Handler
loginBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_BASE}/api/auth/signin` });
});

// Sign Out Handler
if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: `${API_BASE}/api/auth/signout` });
        showLogin();
    });
}

// Listen for messages from Content Script (Zillow/Realtor Address)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ADDRESS_DETECTED') {
        currentPropertyAddress = message.address;
        currentAddressEl.textContent = message.address;
        // Auto-calculate if destination is already selected
        if (destinationSelect.value) {
            calculateCommute();
        }
    }
});

// Destination Management
async function loadDestinations() {
    const data = await chrome.storage.sync.get('destinations');
    const destinations = data.destinations || [];
    updateDestinationDropdown(destinations);
}

function updateDestinationDropdown(destinations) {
    const currentValue = destinationSelect.value;
    destinationSelect.innerHTML = '<option value="">Select a destination...</option>';
    destinations.forEach(dest => {
        const opt = document.createElement('option');
        opt.value = dest.address;
        opt.textContent = `${dest.name}`;
        destinationSelect.appendChild(opt);
    });
    if (currentValue) destinationSelect.value = currentValue;
}

addDestBtn.addEventListener('click', async () => {
    const name = newDestName.value.trim();
    const address = newDestAddr.value.trim();
    if (!name || !address) return;

    try {
        const data = await chrome.storage.sync.get('destinations');
        const destinations = data.destinations || [];
        destinations.push({ name, address });

        await chrome.storage.sync.set({ destinations });
        updateDestinationDropdown(destinations);

        // Auto-select the new destination
        destinationSelect.value = address;
        calculateCommute();

        newDestName.value = '';
        newDestAddr.value = '';
    } catch (error) {
        console.error('Failed to save destination:', error);
        if (error.message.includes('invalidated')) {
            alert('Extension updated. Please close and reopen this side panel.');
        } else {
            alert('Failed to save destination. Storage might be full.');
        }
    }
});

// Calculate Logic
destinationSelect.addEventListener('change', calculateCommute);

async function calculateCommute() {
    const destination = destinationSelect.value;
    if (!destination || !currentPropertyAddress) return;

    resultsArea.classList.remove('hidden');
    resultsArea.classList.remove('bg-red-50', 'border-red-100');
    resultsArea.classList.add('bg-blue-50', 'border-blue-100');

    commuteTimeEl.textContent = 'Loading...';
    commuteTimeEl.className = 'text-lg font-bold text-blue-700';
    commuteDistEl.textContent = '';

    try {
        const params = new URLSearchParams({
            origin: currentPropertyAddress,
            destination: destination,
            mode: 'driving' // Default to driving, could be made configurable
        });

        const response = await fetch(`${API_BASE}/api/commute?${params.toString()}`);

        if (response.status === 401) {
            showLogin();
            return;
        }

        const data = await response.json();

        if (data.error) {
            showError(data.error);
            return;
        }

        commuteTimeEl.textContent = data.duration;
        commuteDistEl.textContent = `${data.distance} • ${data.mode}`;

    } catch (error) {
        console.error('Calculation failed details:', error);
        showError(`Network error: ${error.message}`);
    }
}

function showError(msg) {
    resultsArea.classList.remove('bg-blue-50', 'border-blue-100');
    resultsArea.classList.add('bg-red-50', 'border-red-100');
    commuteTimeEl.textContent = msg;
    commuteTimeEl.className = 'text-sm font-medium text-red-600';
    commuteDistEl.textContent = 'Failed';
}

// Request Initial Address Check (in case side panel opened after page load)
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_ADDRESS' });
    }
});
