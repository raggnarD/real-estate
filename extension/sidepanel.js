const API_BASE = 'https://real-estate-five-tawny.vercel.app';

// UI Elements
// connectionStatus removed as we are always cloud or disconnected
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

const commuteModeIcon = document.getElementById('commute-mode-icon');
const commuteModeText = document.getElementById('commute-mode-text');

// New UI Elements for Destination Management
const destSelectContainer = document.getElementById('destination-select-container');
const toggleNewDestBtn = document.getElementById('toggle-new-dest-btn');
const newDestForm = document.getElementById('new-dest-form');
const cancelNewDestBtn = document.getElementById('cancel-new-dest-btn');

// New UI Elements for Modes
const modeBtns = document.querySelectorAll('.mode-btn');
const transitOptions = document.getElementById('transit-options');
const legWalk = document.getElementById('leg-walk');
const legDrive = document.getElementById('leg-drive');
const nearestStopInfo = document.getElementById('nearest-stop-info');
const nearestStopName = document.getElementById('nearest-stop-name');
const arrivalTimeInput = document.getElementById('arrival-time-input');
const transitLegsSection = document.getElementById('transit-legs');
const leg1TimeEl = document.getElementById('leg1-time');
const leg2TimeEl = document.getElementById('leg2-time');
const leg2LabelEl = document.getElementById('leg2-label');
const calculateBtn = document.getElementById('calculate-btn');
const selectStationBtn = document.getElementById('select-station-btn');
const stationSelector = document.getElementById('station-selector');
const stationList = document.getElementById('station-list');
const loadMoreStationsBtn = document.getElementById('load-more-stations-btn');
const stationMap = document.getElementById('station-map');
const viewMapBtn = document.getElementById('view-map-btn');
const viewLeg1MapBtn = document.getElementById('view-leg1-map-btn');
const viewLeg2MapBtn = document.getElementById('view-leg2-map-btn');

// Sign Out Modal
const signOutModal = document.getElementById('sign-out-modal');
const cancelSignOutBtn = document.getElementById('cancel-sign-out-btn');
const confirmSignOutBtn = document.getElementById('confirm-sign-out-btn');

let currentPropertyAddress = null;
let currentMode = 'driving';
let currentLegMode = 'walking';
let nearestStop = null;
let transitStops = [];
let transitStopsOffset = 0;
let hasMoreStops = false;
let currentPropertyLocation = null;
let googleMapsApiKey = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const prefs = await chrome.storage.sync.get(['mode', 'legMode']);
    if (prefs.mode) setMode(prefs.mode);
    if (prefs.legMode) setLegMode(prefs.legMode);

    await checkAuth();
    await loadDestinations();
    validateInputs();
});

// Mode Selection Handlers
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.id.replace('mode-', '');
        setMode(mode);
        validateInputs();
    });
});

function validateInputs() {
    let isValid = true;

    // 1. Basic requirements
    if (!currentPropertyAddress || !destinationSelect.value || !currentMode) {
        isValid = false;
    }

    // 2. Transit requirements
    if (currentMode === 'bus' || currentMode === 'train') {
        if (!currentLegMode || !nearestStop) {
            isValid = false;
        }
    }

    calculateBtn.disabled = !isValid;
}

function setMode(mode) {
    currentMode = mode;
    modeBtns.forEach(btn => {
        if (btn.id === `mode-${mode}`) {
            btn.classList.add('active-mode');
        } else {
            btn.classList.remove('active-mode');
        }
    });

    if (mode === 'bus' || mode === 'train') {
        transitOptions.classList.remove('hidden');
        updateNearestStop();
    } else {
        transitOptions.classList.add('hidden');
    }

    chrome.storage.sync.set({ mode });
}

legWalk.addEventListener('click', () => {
    setLegMode('walking');
    validateInputs();
});

legDrive.addEventListener('click', () => {
    setLegMode('driving');
    validateInputs();
});

function setLegMode(leg) {
    currentLegMode = leg;
    if (leg === 'walking') {
        legWalk.classList.add('active-leg');
        legDrive.classList.remove('active-leg');
    } else {
        legWalk.classList.remove('active-leg');
        legDrive.classList.add('active-leg');
    }
    chrome.storage.sync.set({ legMode: leg });
}

async function updateNearestStop() {
    if (!currentPropertyAddress || (currentMode !== 'bus' && currentMode !== 'train')) {
        nearestStopInfo.classList.add('hidden');
        return;
    }

    nearestStopInfo.classList.remove('hidden');
    nearestStopName.textContent = 'Searching...';

    try {
        // First get geocode for currentPropertyAddress to get lat/lng
        const geoRes = await fetch(`${API_BASE}/api/geocode?address=${encodeURIComponent(currentPropertyAddress)}`);
        const geoData = await geoRes.json();

        if (geoData.location) {
            currentPropertyLocation = geoData.location;

            // Fetch initial 3 stops
            await fetchTransitStops(0, 3);

            if (transitStops.length > 0) {
                nearestStop = transitStops[0];
                nearestStopName.textContent = `${nearestStop.name} (${nearestStop.distance})`;
            } else {
                nearestStop = null;
                nearestStopName.textContent = 'No stops found nearby';
            }
        }
        validateInputs();
    } catch (e) {
        console.error('Failed to fetch nearest stop', e);
        nearestStopName.textContent = 'Error finding stops';
    }
}

// Fetch transit stops with pagination
async function fetchTransitStops(offset = 0, limit = 3) {
    if (!currentPropertyLocation) return;

    try {
        const params = new URLSearchParams({
            lat: currentPropertyLocation.lat,
            lng: currentPropertyLocation.lng,
            type: currentMode,
            offset: offset.toString(),
            limit: limit.toString()
        });

        const stopRes = await fetch(`${API_BASE}/api/transit-stops?${params.toString()}`);
        const stopData = await stopRes.json();

        if (stopData.stops && stopData.stops.length > 0) {
            if (offset === 0) {
                transitStops = stopData.stops;
            } else {
                transitStops = [...transitStops, ...stopData.stops];
            }
            transitStopsOffset = offset;
            hasMoreStops = stopData.hasMore || false;
            return { stops: stopData.stops, hasMore: stopData.hasMore || false };
        } else {
            if (offset === 0) {
                transitStops = [];
            }
            hasMoreStops = false;
            return { stops: [], hasMore: false };
        }
    } catch (error) {
        console.error('Error fetching transit stops:', error);
        if (offset === 0) {
            transitStops = [];
        }
        hasMoreStops = false;
        return { stops: [], hasMore: false };
    }
}

// Render station list
function renderStationList() {
    stationList.innerHTML = '';

    transitStops.forEach((stop, index) => {
        const card = document.createElement('div');
        card.className = 'station-card';
        if (nearestStop && stop.placeId === nearestStop.placeId) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <p class="station-name">${stop.name}</p>
            <p class="station-distance">${stop.distance} away</p>
        `;

        card.addEventListener('click', () => {
            nearestStop = stop;
            nearestStopName.textContent = `${stop.name} (${stop.distance})`;
            renderStationList();
            updateStationMap(stop);
            validateInputs();
        });

        stationList.appendChild(card);
    });

    // Show/hide load more button
    if (hasMoreStops) {
        loadMoreStationsBtn.classList.remove('hidden');
    } else {
        loadMoreStationsBtn.classList.add('hidden');
    }
}

// Update station map
async function updateStationMap(stop) {
    if (!googleMapsApiKey) {
        try {
            const res = await fetch(`${API_BASE}/api/shared-key/get`);
            const data = await res.json();
            if (data.apiKey) {
                googleMapsApiKey = data.apiKey;
            }
        } catch (e) {
            console.error('Failed to fetch API key:', e);
        }
    }

    if (!googleMapsApiKey || !currentPropertyLocation || !stop) {
        stationMap.classList.add('hidden');
        return;
    }

    // Build Google Maps Directions embed URL
    const origin = `${currentPropertyLocation.lat},${currentPropertyLocation.lng}`;
    const destination = `${stop.location.lat},${stop.location.lng}`;
    const mode = currentLegMode === 'walking' ? 'walking' : 'driving';

    const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${googleMapsApiKey}&origin=${origin}&destination=${destination}&mode=${mode}`;

    stationMap.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
    stationMap.classList.remove('hidden');
}

// Toggle station selector
selectStationBtn.addEventListener('click', () => {
    const isHidden = stationSelector.classList.contains('hidden');

    if (isHidden) {
        stationSelector.classList.remove('hidden');
        renderStationList();
        if (nearestStop) {
            updateStationMap(nearestStop);
        }
    } else {
        stationSelector.classList.add('hidden');
    }
});

// Load more stations
loadMoreStationsBtn.addEventListener('click', async () => {
    loadMoreStationsBtn.textContent = 'Loading...';
    loadMoreStationsBtn.disabled = true;

    await fetchTransitStops(transitStopsOffset + 3, 3);
    renderStationList();

    loadMoreStationsBtn.textContent = 'Load More →';
    loadMoreStationsBtn.disabled = false;
});

// Check Authentication via Cookies
async function checkAuth() {
    try {
        const isAuth = await checkCookie(API_BASE);
        if (isAuth) {
            // Verify session
            if (await verifyAndShowUser()) {
                return;
            }
        }
    } catch (e) {
        console.error('checkAuth failed:', e);
    }

    // Fallback: If no cookie or verification failed, show login
    showLogin();
}

// updateConnectionStatus removed as it's no longer needed

async function verifyAndShowUser() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/session`);
        if (!res.ok) throw new Error('Session fetch failed');

        const session = await res.json();

        if (session && session.user) {
            showMain(session.user);
            return true; // Success
        } else {
            showLogin();
            return false; // Valid response but no user
        }
    } catch (e) {
        console.log('Failed to verify session (server might be offline)', e);
        showLogin();
        return false; // Network/Server error
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

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedCheckAuth = debounce(() => {
    console.log('[RushRoost] Debounced checkAuth running...');
    checkAuth();
}, 1000);

// Cookie Change Listener
chrome.cookies.onChanged.addListener((changeInfo) => {
    if (changeInfo.cookie.name === 'authjs.session-token' ||
        changeInfo.cookie.name === '__Secure-authjs.session-token') {
        debouncedCheckAuth();
    }
});

let isLoginVisible = false;

function showLogin() {
    if (isLoginVisible) return;
    isLoginVisible = true;
    isMainVisible = false;

    authStatus.textContent = 'Not Connected';
    authStatus.style.color = '#ef4444';

    loginSection.classList.remove('hidden');
    mainSection.classList.add('hidden');
    resultsArea.classList.add('hidden'); // Ensure results are cleared
    calculateBtn.classList.add('hidden');
    if (signOutBtn) signOutBtn.classList.add('hidden');
}

let isMainVisible = false;
let lastUserEmail = '';

function showMain(user) {
    const userEmail = user.email || '';
    if (isMainVisible && lastUserEmail === userEmail) return;

    isMainVisible = true;
    isLoginVisible = false;
    lastUserEmail = userEmail;

    const name = user.name || user.email || 'Connected';
    authStatus.textContent = name;
    authStatus.style.color = 'var(--gray-700)';

    loginSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
    calculateBtn.classList.remove('hidden');
    if (signOutBtn) signOutBtn.classList.remove('hidden');
}

// Login Handler
loginBtn.addEventListener('click', () => {
    // Open sign-in page in a popup window for a cleaner experience
    // Added version param to bust cache
    const callbackUrl = encodeURIComponent(`${API_BASE}/extension/auth-success?v=3`);
    const authUrl = `${API_BASE}/api/auth/signin?callbackUrl=${callbackUrl}`;

    // Calculate center positioning
    const width = 500;
    const height = 600;
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);

    chrome.windows.create({
        url: authUrl,
        type: 'popup',
        width: width,
        height: height,
        left: left,
        top: top
    }, (window) => {
        // Monitor the popup for success URL to auto-close it
        if (window) {
            const tabId = window.tabs && window.tabs.length > 0 ? window.tabs[0].id : null;
            const listener = (tid, changeInfo, tab) => {
                // Check strictly if we are on the success page (not just if URL contains the string)
                if (tab.windowId === window.id && tab.url && tab.url.startsWith(`${API_BASE}/extension/auth-success`)) {
                    // Success detected! Close the window.
                    chrome.windows.remove(window.id);
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);

            // Cleanup listener if window is closed manually
            chrome.windows.onRemoved.addListener((windowId) => {
                if (windowId === window.id) {
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });
        }
    });
});

// Sign Out Handler
if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        signOutModal.classList.remove('hidden');
    });
}

// Modal Handlers
cancelSignOutBtn.addEventListener('click', () => {
    signOutModal.classList.add('hidden');
});

confirmSignOutBtn.addEventListener('click', async () => {
    // Clear cookies for both prod and local (just in case) to log out from extension
    try {
        await chrome.cookies.remove({ url: API_BASE, name: 'authjs.session-token' });
        await chrome.cookies.remove({ url: API_BASE, name: '__Secure-authjs.session-token' });

        // Also try to help clear server session if possible, but mostly rely on client-side clear
        // We do typically need to hit the signout endpoint to clear server-side HttpOnly cookies if they exist
        // But preventing a tab open is priority. 
        // Let's rely on cookie clearing for now. If user revisits site, they might still be logged in there, 
        // but extension will be logged out.

        signOutModal.classList.add('hidden');
        showLogin();

    } catch (e) {
        console.error('Sign out failed', e);
        showLogin();
    }
});

// Listen for messages from Content Script (Zillow/Realtor Address)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ADDRESS_DETECTED') {
        currentPropertyAddress = message.address;
        currentAddressEl.textContent = message.address;

        if (currentMode === 'bus' || currentMode === 'train') {
            updateNearestStop();
        } else {
            validateInputs();
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

    if (destinations.length > 0) {
        destSelectContainer.classList.remove('hidden');
        newDestForm.classList.add('hidden');
    } else {
        destSelectContainer.classList.add('hidden');
        newDestForm.classList.remove('hidden');
    }

    if (currentValue) destinationSelect.value = currentValue;
    validateInputs();
}

// Toggle New Destination Form
toggleNewDestBtn.addEventListener('click', () => {
    newDestForm.classList.remove('hidden');
    newDestName.focus();
});

cancelNewDestBtn.addEventListener('click', async () => {
    const data = await chrome.storage.sync.get('destinations');
    const destinations = data.destinations || [];
    if (destinations.length > 0) {
        newDestForm.classList.add('hidden');
    }
});

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
        validateInputs();

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
destinationSelect.addEventListener('change', validateInputs);
calculateBtn.addEventListener('click', calculateCommute);

async function calculateCommute() {
    const destination = destinationSelect.value;
    if (!destination || !currentPropertyAddress) return;

    resultsArea.classList.remove('hidden');
    resultsArea.style.backgroundColor = 'var(--primary)';

    commuteTimeEl.textContent = '...';
    commuteDistEl.textContent = 'Calculating';
    commuteModeText.textContent = '';

    try {
        const queryParams = {
            origin: currentPropertyAddress,
            destination: destination,
            mode: currentMode
        };

        if (currentMode === 'bus' || currentMode === 'train') {
            if (!nearestStop) {
                await updateNearestStop();
            }
            if (nearestStop) {
                queryParams.mode = 'transit';
                queryParams.transitStop = nearestStop.placeId;
                queryParams.leg1Mode = currentLegMode;
                queryParams.transitType = currentMode;
            }
        }

        // Add arrival time if specified
        if (arrivalTimeInput.value) {
            const today = new Date();
            const [hours, minutes] = arrivalTimeInput.value.split(':');
            today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            queryParams.arrivalTime = Math.floor(today.getTime() / 1000).toString();
        }

        const params = new URLSearchParams(queryParams);
        const response = await fetch(`${API_BASE}/api/commute?${params.toString()}`);

        if (response.status === 401) {
            showLogin();
            return;
        }

        const data = await response.json();

        if (data.error) {
            console.warn('[RushRoost] Commute error from API:', data.error);
            showError(data.error);
            return;
        }

        // Handle multi-leg transit response (has total, leg1, leg2)
        if (data.total) {
            commuteTimeEl.textContent = data.total.duration;
            commuteDistEl.textContent = data.total.distance;
            commuteModeText.textContent = 'Transit';

            // Show transit legs breakdown
            transitLegsSection.classList.remove('hidden');
            leg1TimeEl.textContent = data.leg1.duration;
            leg2TimeEl.textContent = data.leg2.duration;

            // Update leg 1 icon based on leg1Mode
            const leg1Icon = currentLegMode === 'walking' ? '🚶' : '🚗';
            const leg1Label = document.querySelector('#transit-legs .leg-item:first-child .leg-label');
            leg1Label.innerHTML = `${leg1Icon} To Station`;

            // Update leg 2 icon based on transit type
            const leg2Icon = data.transitType === 'bus' ? '🚌' : '🚆';
            leg2LabelEl.innerHTML = `${leg2Icon} Transit`;

            // Hide main View on Map button for transit
            viewMapBtn.classList.add('hidden');
        } else {
            // Handle standard single-leg response
            commuteTimeEl.textContent = data.duration;
            commuteDistEl.textContent = data.distance;
            commuteModeText.textContent = data.mode;

            // Hide transit legs breakdown
            transitLegsSection.classList.add('hidden');

            // Show main View on Map button for non-transit
            viewMapBtn.classList.remove('hidden');
        }

        // Update icon based on mode
        if (data.mode === 'transit') {
            commuteModeIcon.textContent = data.transitType === 'bus' ? '🚌' : '🚆';
        } else if (data.mode === 'walking') {
            commuteModeIcon.textContent = '🚶';
        } else if (data.mode === 'bicycling') {
            commuteModeIcon.textContent = '🚲';
        } else {
            commuteModeIcon.textContent = '🚗';
        }

    } catch (error) {
        console.error('Calculation failed details:', error);
        showError(`Network error: ${error.message}`);
    }
}

// View on Map button handler
viewMapBtn.addEventListener('click', () => {
    const destination = destinationSelect.value;

    if (!currentPropertyAddress || !destination) {
        console.warn('[RushRoost] Missing addresses for map view');
        return;
    }

    let mapsUrl = '';

    // Multi-leg transit route (property -> station -> destination)
    if ((currentMode === 'bus' || currentMode === 'train') && nearestStop) {
        const origin = encodeURIComponent(currentPropertyAddress);
        const waypoint = encodeURIComponent(nearestStop.address || nearestStop.name);
        const dest = encodeURIComponent(destination);

        // Google Maps URL with waypoint
        mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${waypoint}&travelmode=transit`;
    } else {
        // Single-leg route (property -> destination)
        const origin = encodeURIComponent(currentPropertyAddress);
        const dest = encodeURIComponent(destination);

        // Determine travel mode for Google Maps
        let travelMode = 'driving';
        if (currentMode === 'walking') travelMode = 'walking';
        else if (currentMode === 'bicycling') travelMode = 'bicycling';

        mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${travelMode}`;
    }

    // Open in new tab
    chrome.tabs.create({ url: mapsUrl });
});

// View Leg 1 on Map (property -> station)
viewLeg1MapBtn.addEventListener('click', () => {
    if (!currentPropertyAddress || !nearestStop) {
        console.warn('[RushRoost] Missing addresses for leg 1 map view');
        return;
    }

    const origin = encodeURIComponent(currentPropertyAddress);
    const dest = encodeURIComponent(nearestStop.address || nearestStop.name);
    const travelMode = currentLegMode === 'walking' ? 'walking' : 'driving';

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${travelMode}`;
    chrome.tabs.create({ url: mapsUrl });
});

// View Leg 2 on Map (station -> destination)
viewLeg2MapBtn.addEventListener('click', () => {
    const destination = destinationSelect.value;

    if (!nearestStop || !destination) {
        console.warn('[RushRoost] Missing addresses for leg 2 map view');
        return;
    }

    const origin = encodeURIComponent(nearestStop.address || nearestStop.name);
    const dest = encodeURIComponent(destination);

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`;
    chrome.tabs.create({ url: mapsUrl });
});

function showError(msg) {
    resultsArea.classList.remove('hidden');
    resultsArea.style.backgroundColor = '#ef4444';
    commuteTimeEl.textContent = 'Error';
    commuteDistEl.textContent = msg;
    commuteModeText.textContent = 'Failed';
}

// Request Initial Address Check (in case side panel opened after page load)
function requestAddress() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab || !tab.url) return;

        console.log('[RushRoost] Active tab query result:', tab.url);

        if (tab.id && (tab.url.includes('zillow.com') || tab.url.includes('realtor.com'))) {
            console.log('[RushRoost] Requesting address from tab:', tab.id);
            chrome.tabs.sendMessage(tab.id, { type: 'GET_ADDRESS' }, (response) => {
                if (chrome.runtime.lastError) {
                    // This is expected if the content script hasn't loaded yet or tab is not a property page
                    console.log('[RushRoost] Message note:', chrome.runtime.lastError.message);
                }
            });
        }
    });
}

// Initial request
requestAddress();

// Re-request when tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        requestAddress();
    }
});

