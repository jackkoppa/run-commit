// --- CONFIGURATION ---
const GOOGLE_CLIENT_ID = '578004472241-gu7aa52q9lktheqaqjvdooc3bbukep9k.apps.googleusercontent.com';

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const RUN_COMMIT_FILENAME = 'run-commit-data.json';

// Workout type options
const WORKOUT_TYPES = [
    "Long Run",
    "Easy Run", 
    "Marathon Pace Run",
    "Tempo Run",
    "Strength A (Glutes & Core)",
    "Strength B (Power & Stability)",
    "Cross-Training",
    "Workout",
    "Rest"
];

let appData = {};

// --- INITIAL PLAN DATA ---
const initialPlan = {
    "version": 1, "goal": "Marathon 3:15", "startDate": "2025-10-13", "legend": { "LR": "Long Run", "E": "Easy Run", "MP": "Marathon Pace Run", "T": "Tempo Run", "S_A": "Strength A (Glutes & Core)", "S_B": "Strength B (Power & Stability)", "XT": "Cross-Training", "R": "Rest" },
    "schedule": [ {"day": 1, "plan": "R"}, {"day": 2, "plan": "E 4mi"}, {"day": 3, "plan": "R"}, {"day": 4, "plan": "S_A"}, {"day": 5, "plan": "R"}, {"day": 6, "plan": "LR 10mi"}, {"day": 7, "plan": "R"}, {"day": 8, "plan": "R"}, {"day": 9, "plan": "E 4mi"}, {"day": 10, "plan": "Workout: 2mi WU, 2mi @MP, 1mi CD"}, {"day": 11, "plan": "S_A"}, {"day": 12, "plan": "R"}, {"day": 13, "plan": "LR 12mi"}, {"day": 14, "plan": "R"}, {"day": 15, "plan": "R"}, {"day": 16, "plan": "E 5mi"}, {"day": 17, "plan": "Workout: 2mi WU, 3mi @MP, 1mi CD"}, {"day": 18, "plan": "S_B"}, {"day": 19, "plan": "R"}, {"day": 20, "plan": "LR 14mi"}, {"day": 21, "plan": "R"}, {"day": 22, "plan": "R"}, {"day": 23, "plan": "E 4mi"}, {"day": 24, "plan": "Workout: 1mi WU, 3x1mi @T w/ 3' jog, 1mi CD"}, {"day": 25, "plan": "R"}, {"day": 26, "plan": "R"}, {"day": 27, "plan": "LR 11mi"}, {"day": 28, "plan": "R"}, {"day": 29, "plan": "R"}, {"day": 30, "plan": "E 5mi"}, {"day": 31, "plan": "Workout: 2mi WU, 4mi @MP, 1mi CD"}, {"day": 32, "plan": "S_A"}, {"day": 33, "plan": "R"}, {"day": 34, "plan": "LR 16mi"}, {"day": 35, "plan": "R"}, {"day": 36, "plan": "R"}, {"day": 37, "plan": "E 5mi"}, {"day": 38, "plan": "Workout: 1mi WU, 2x2mi @T w/ 4' jog, 1mi CD"}, {"day": 39, "plan": "S_B"}, {"day": 40, "plan": "R"}, {"day": 41, "plan": "LR 17mi"}, {"day": 42, "plan": "R"}, {"day": 43, "plan": "R"}, {"day": 44, "plan": "E 6mi"}, {"day": 45, "plan": "Workout: 7mi w/ 5mi @MP"}, {"day": 46, "plan": "R"}, {"day": 47, "plan": "R"}, {"day": 48, "plan": "LR 18mi"}, {"day": 49, "plan": "R"}, {"day": 50, "plan": "R"}, {"day": 51, "plan": "E 4mi"}, {"day": 52, "plan": "Workout: 1mi WU, 4x1mi @T w/ 3' jog, 1mi CD"}, {"day": 53, "plan": "S_A"}, {"day": 54, "plan": "R"}, {"day": 55, "plan": "LR 14mi"}, {"day": 56, "plan": "R"}, {"day": 57, "plan": "R"}, {"day": 58, "plan": "E 5mi"}, {"day": 59, "plan": "Workout: 8mi w/ 6mi @MP"}, {"day": 60, "plan": "S_B"}, {"day": 61, "plan": "R"}, {"day": 62, "plan": "LR 20mi"}, {"day": 63, "plan": "R"} ]
};

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg border-2 border-black neo-shadow text-white font-semibold z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        'bg-blue-500'
    }`;
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 font-bold">✕</button>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// --- CORE APP LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    populateWorkoutTypes();
    renderPlan();
    scrollToUpcoming();
});

function loadData() {
    const savedData = localStorage.getItem('runCommitData');
    if (savedData) {
        appData = JSON.parse(savedData);
    } else {
        appData = { currentPlanVersion: 1, plans: [initialPlan], completed: {}, userPrompts: [] };
        saveData();
    }
}

function saveData() {
    localStorage.setItem('runCommitData', JSON.stringify(appData));
    renderPlan();
}

function getCurrentPlan() {
    return appData.plans.find(p => p.version === appData.currentPlanVersion) || appData.plans[0];
}

function parsePlanText(planString, legend) {
    let result = planString;
    Object.keys(legend).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        result = result.replace(regex, legend[key]);
    });
    return result;
}

// Parse workout into type and details
function parseWorkoutTypeAndDetails(planString, legend) {
    const parsed = parsePlanText(planString, legend);
    
    // Try to match one of the predefined workout types
    for (const workoutType of WORKOUT_TYPES) {
        if (parsed.startsWith(workoutType)) {
            const details = parsed.substring(workoutType.length).trim();
            // Remove leading colon or dash if present
            const cleanDetails = details.replace(/^[:-]\s*/, '');
            return { type: workoutType, details: cleanDetails };
        }
    }
    
    // Default to Workout type if no match
    return { type: 'Workout', details: parsed };
}

function renderPlan() {
    const plan = getCurrentPlan();
    if (!plan) return;
    const container = document.getElementById('plan-container');
    container.innerHTML = '';
    const startDate = new Date(plan.startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedSchedule = [...plan.schedule].sort((a, b) => a.day - b.day);

    sortedSchedule.forEach(item => {
        if (item.plan === "R") return;

        const itemDate = new Date(startDate);
        itemDate.setDate(startDate.getDate() + item.day - 1);
        const dateString = itemDate.toISOString().split('T')[0];

        const isPast = itemDate < today;
        const isToday = itemDate.getTime() === today.getTime();
        const actual = appData.completed[`day_${item.day}`] || "";
        let status, statusClass, statusText, cardClass;

        if (actual === "MISSED") {
            status = 'missed'; statusClass = 'bg-red-200 text-red-800'; statusText = 'Missed';
            cardClass = 'bg-white';
        } else if (actual) {
            status = 'completed'; statusClass = 'bg-green-200 text-green-800'; statusText = 'Completed';
            cardClass = 'bg-white';
        } else if (isToday) {
            status = 'today'; statusClass = 'bg-orange-200 text-orange-800'; statusText = 'Today';
            cardClass = 'bg-orange-50 ring-4 ring-orange-400';
        } else if (isPast) {
            status = 'pending'; statusClass = 'bg-gray-200 text-gray-800'; statusText = 'Pending';
            cardClass = 'bg-white';
        } else {
            status = 'upcoming'; statusClass = 'bg-blue-200 text-blue-800'; statusText = 'Upcoming';
            cardClass = 'bg-white';
        }

        const { type, details } = parseWorkoutTypeAndDetails(item.plan, plan.legend);
        const workoutTypeOptions = WORKOUT_TYPES.map(wt => 
            `<option value="${wt}" ${wt === type ? 'selected' : ''}>${wt}</option>`
        ).join('');

        const dayEl = document.createElement('div');
        dayEl.className = `${cardClass} p-4 rounded-lg border-2 border-black neo-shadow workout-card`;
        dayEl.dataset.status = status;
        dayEl.dataset.day = item.day;
        dayEl.dataset.date = dateString;
        dayEl.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                         <span class="text-sm font-bold px-2 py-0.5 rounded-full ${statusClass}">${statusText}</span>
                         <input type="date" value="${dateString}" onchange="changeWorkoutDate(${item.day}, this.value)" class="text-lg font-bold bg-transparent">
                    </div>
                    <div class="mt-2 flex flex-col sm:flex-row gap-2">
                        <select onchange="updateWorkoutType(${item.day}, this.value, document.getElementById('details-${item.day}').value)" 
                                class="w-full sm:w-auto p-2 border-2 border-black rounded text-slate-800 font-semibold">
                            ${workoutTypeOptions}
                        </select>
                        <input type="text" id="details-${item.day}" value="${details}" 
                               onblur="updateWorkoutType(${item.day}, document.querySelector('[onchange*=\\'updateWorkoutType(${item.day}\\']').value, this.value)" 
                               placeholder="e.g., 4mi, 2mi WU + 3x1mi @T"
                               class="w-full sm:flex-1 p-2 border-2 border-black rounded text-slate-800" />
                    </div>
                </div>
                <div class="relative ml-2 flex-shrink-0">
                    <button onclick="toggleWorkoutMenu(${item.day})" class="text-gray-500 hover:text-gray-700 p-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                    </button>
                    <div id="menu-${item.day}" class="hidden absolute right-0 mt-1 w-40 bg-white border-2 border-black rounded shadow-lg z-10">
                        ${ status !== 'completed' && status !== 'missed' && isPast ? 
                            `<button onclick="markAsMissed(${item.day}); toggleWorkoutMenu(${item.day})" class="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Mark Missed</button>` : ''}
                        <button onclick="deleteWorkout(${item.day})" class="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Delete Workout</button>
                    </div>
                </div>
            </div>
            <div class="mt-2">
                <textarea class="w-full p-2 border-2 border-black rounded text-sm" 
                          onchange="saveActual(${item.day}, this.value)" 
                          placeholder="Log your actual effort here...">${actual === "MISSED" ? '' : actual}</textarea>
            </div>
        `;
        container.appendChild(dayEl);
    });
}

function scrollToUpcoming() {
    setTimeout(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Find the first workout that's today or upcoming
        const workoutCards = document.querySelectorAll('.workout-card');
        let targetCard = null;
        
        for (const card of workoutCards) {
            const cardDate = new Date(card.dataset.date + 'T00:00:00');
            if (cardDate >= today) {
                targetCard = card;
                break;
            }
        }
        
        if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function toggleWorkoutMenu(day) {
    const menu = document.getElementById(`menu-${day}`);
    // Close all other menus
    document.querySelectorAll('[id^="menu-"]').forEach(m => {
        if (m.id !== `menu-${day}`) {
            m.classList.add('hidden');
        }
    });
    menu.classList.toggle('hidden');
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('[onclick^="toggleWorkoutMenu"]') && !e.target.closest('[id^="menu-"]')) {
        document.querySelectorAll('[id^="menu-"]').forEach(m => m.classList.add('hidden'));
    }
});

function deleteWorkout(day) {
    const plan = getCurrentPlan();
    const workoutIndex = plan.schedule.findIndex(item => item.day === day);
    
    if (workoutIndex !== -1) {
        plan.schedule.splice(workoutIndex, 1);
        delete appData.completed[`day_${day}`];
        saveData();
        showToast('Workout deleted', 'success');
    }
}

function updateWorkoutType(day, type, details) {
    const plan = getCurrentPlan();
    const workoutItem = plan.schedule.find(item => item.day === day);
    
    if (workoutItem) {
        // Combine type and details
        const newPlan = details ? `${type}: ${details}` : type;
        workoutItem.plan = newPlan;
        saveData();
    }
}

function saveActual(day, value) {
    const trimmedValue = value.trim();
    if (trimmedValue) {
        appData.completed[`day_${day}`] = trimmedValue;
    } else {
        delete appData.completed[`day_${day}`];
    }
    saveData();
}

function markAsMissed(day) {
    appData.completed[`day_${day}`] = "MISSED";
    saveData();
}

function changeWorkoutDate(oldDay, newDateString) {
    const plan = getCurrentPlan();
    const startDate = new Date(plan.startDate + 'T00:00:00');
    const newDate = new Date(newDateString + 'T00:00:00');
    
    const msPerDay = 1000 * 60 * 60 * 24;
    const signedDiffDays = Math.floor((newDate - startDate) / msPerDay);
    const newDay = signedDiffDays + 1;

    const workoutItem = plan.schedule.find(item => item.day === oldDay);
    if (workoutItem) { workoutItem.day = newDay; }
    
    if (appData.completed[`day_${oldDay}`]) {
        appData.completed[`day_${newDay}`] = appData.completed[`day_${oldDay}`];
        delete appData.completed[`day_${oldDay}`];
    }
    saveData();
}

function toggleModal(modalId) {
    document.getElementById(modalId).classList.toggle('hidden');
}

function populateWorkoutTypes() {
    const select = document.getElementById('workout-type');
    select.innerHTML = '';
    const legend = getCurrentPlan().legend;
    for (const key in legend) {
        const planString = key.startsWith('S_') ? key : `${key} workout`;
        const option = document.createElement('option');
        option.value = planString;
        option.textContent = parsePlanText(planString, legend);
        select.appendChild(option);
    }
}

function saveUnplannedWorkout() {
    const dateVal = document.getElementById('workout-date').value;
    const typeVal = document.getElementById('workout-type').value;
    const notesVal = document.getElementById('workout-notes').value.trim();

    if (!dateVal || !notesVal) {
        showToast("Please select a date and add some notes.", "warning");
        return;
    }

    const plan = getCurrentPlan();
    const startDate = new Date(plan.startDate + 'T00:00:00');
    const workoutDate = new Date(dateVal + 'T00:00:00');
    
    const msPerDay = 1000 * 60 * 60 * 24;
    const signedDiffDays = Math.floor((workoutDate - startDate) / msPerDay);
    const day = signedDiffDays + 1;
    
    if (!plan.schedule.some(item => item.day === day)) {
        plan.schedule.push({ day: day, plan: typeVal });
    }
    
    appData.completed[`day_${day}`] = notesVal;
    saveData();
    toggleModal('add-workout-modal');
    showToast("Workout saved successfully!", "success");
    
    document.getElementById('workout-date').value = '';
    document.getElementById('workout-notes').value = '';
}

function toggleImport() {
    document.getElementById('import-div').classList.toggle('hidden');
}

function openUserPromptModal() {
    const modal = document.getElementById('user-prompt-modal');
    const textarea = document.getElementById('user-prompt-textarea');
    
    // Load the most recent user prompt if it exists
    if (appData.userPrompts && appData.userPrompts.length > 0) {
        textarea.value = appData.userPrompts[appData.userPrompts.length - 1].prompt;
    } else {
        textarea.value = '';
    }
    
    modal.classList.remove('hidden');
}

function saveUserPrompt() {
    const textarea = document.getElementById('user-prompt-textarea');
    const promptText = textarea.value.trim();
    
    if (!promptText) {
        showToast("Please enter your training goals.", "warning");
        return;
    }
    
    // Save the prompt with timestamp and version
    appData.userPrompts.push({
        prompt: promptText,
        timestamp: new Date().toISOString(),
        planVersion: appData.currentPlanVersion
    });
    
    localStorage.setItem('runCommitData', JSON.stringify(appData));
    toggleModal('user-prompt-modal');
    showToast("Training goals saved!", "success");
}

function exportPlan() {
    // Check if user has saved a prompt
    if (!appData.userPrompts || appData.userPrompts.length === 0) {
        showToast("Please set your training goals first by clicking 'Set Training Goals'.", "warning");
        openUserPromptModal();
        return;
    }
    
    toggleModal('export-modal');
}

function performExport(includeAllPlans) {
    const plan = getCurrentPlan();
    const latestUserPrompt = appData.userPrompts[appData.userPrompts.length - 1].prompt;
    
    const systemPrompt = `You are an expert running coach AI. Analyze the provided training plan and the user's completed workouts to generate a new, revised weekly schedule. 

User's Training Goals:
${latestUserPrompt}

Instructions:
- Analyze the 'completed' log for patterns (missed workouts, pace comments, etc.)
- Adjust the *remaining, uncompleted* workouts in the schedule
- Do not change past workouts
- Keep day numbers consistent
- Increase the 'version' number by 1
- Keep the JSON structure identical and use the provided 'legend' for abbreviations
- Your response MUST be ONLY the updated JSON object, starting with { and ending with }`;

    const exportObject = {
        systemPrompt: systemPrompt,
        userPrompts: includeAllPlans ? appData.userPrompts : [appData.userPrompts[appData.userPrompts.length - 1]],
        plans: includeAllPlans ? appData.plans : [plan],
        currentPlan: plan,
        completed: appData.completed
    };

    const exportString = JSON.stringify(exportObject, null, 2);
    const ioTextarea = document.getElementById('io-textarea');
    ioTextarea.value = exportString;
    
    toggleModal('export-modal');
    
    if (document.getElementById('import-div').classList.contains('hidden')) {
        toggleImport();
    }
    
    navigator.clipboard.writeText(exportString).then(() => {
        showToast('Plan data and LLM prompt copied to clipboard!', 'success');
    });
}

function importPlan() {
    const ioTextarea = document.getElementById('io-textarea');
    try {
        const newPlan = JSON.parse(ioTextarea.value);
        if (!newPlan.version || !newPlan.schedule) throw new Error("Invalid plan format.");
        if (appData.plans.some(p => p.version === newPlan.version)) {
            showToast(`Error: Plan version ${newPlan.version} already exists.`, "error");
            return;
        }

        delete newPlan.completed; 
        appData.plans.push(newPlan);
        appData.currentPlanVersion = newPlan.version;
        saveData();
        ioTextarea.value = "";
        toggleImport();
        showToast(`Successfully imported plan version ${newPlan.version}!`, "success");
    } catch (e) {
        showToast("Error parsing plan. Please make sure it's valid JSON. Error: " + e.message, "error");
    }
}

// --- GOOGLE DRIVE INTEGRATION ---
let tokenClient;
let accessToken = null;

// TODO: Investigate session persistence - access token is not being stored in sessionStorage/localStorage
// This causes the "Connect to Google Drive" button to appear on every page refresh
// Consider storing the access token and checking if it's still valid on page load

function handleClientLoad() { 
    gapi.load('client', initClient); 
}

async function initClient() {
    await gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
    });

    // Initialize the token client
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            accessToken = tokenResponse.access_token;
            gapi.client.setToken({
                access_token: tokenResponse.access_token
            });
            updateSigninStatus(true);
        },
    });

    // Check if we have a stored token (optional - for better UX)
    updateSigninStatus(false);
}

function updateSigninStatus(isSignedIn) {
    const authSection = document.getElementById('drive-auth-section');
    const syncSection = document.getElementById('drive-sync-section');
    if (isSignedIn) {
        authSection.style.display = 'none';
        syncSection.style.display = 'block';
    } else {
        authSection.style.display = 'block';
        syncSection.style.display = 'none';
    }
}

function handleAuthClick() { 
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

function handleSignoutClick() {
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken, () => {
            console.log('Token revoked');
        });
        gapi.client.setToken(null);
        accessToken = null;
    }
    updateSigninStatus(false);
}

async function getFileId() {
    const response = await gapi.client.drive.files.list({
        q: `name='${RUN_COMMIT_FILENAME}' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)'
    });
    if (response.result.files.length > 0) {
        return response.result.files[0].id;
    }
    return null;
}

async function ensureAccessToken() {
    if (!accessToken) {
        showToast('Please connect to Google Drive first.', 'warning');
        return false;
    }
    return true;
}

// TODO: File content sync issue - the multipart upload format needs proper boundary handling
// The current implementation creates an empty file in Google Drive because the content isn't being
// properly encoded in the multipart request. Need to either:
// 1. Use the simpler JSON API for metadata and then upload content separately
// 2. Properly format the multipart request with correct boundaries and headers
// 3. Use the Google Drive API client library's built-in upload methods instead of raw requests

async function saveToDrive() {
    if (!await ensureAccessToken()) return;

    try {
        const fileId = await getFileId();
        const content = JSON.stringify(appData, null, 2);
        
        // Using simpler approach: create/update with metadata, then upload content
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        
        const metadata = {
            name: RUN_COMMIT_FILENAME,
            mimeType: 'application/json'
        };
        
        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            content +
            close_delim;

        if (fileId) { // Update existing file
            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'multipart/related; boundary=' + boundary
                },
                body: multipartRequestBody
            });
            
            if (response.ok) {
                showToast('Data synced to Google Drive!', 'success');
            } else {
                throw new Error('Failed to update file: ' + response.statusText);
            }
        } else { // Create new file
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'multipart/related; boundary=' + boundary
                },
                body: multipartRequestBody
            });
            
            if (response.ok) {
                showToast('Data file created in Google Drive!', 'success');
            } else {
                throw new Error('Failed to create file: ' + response.statusText);
            }
        }
    } catch (error) {
        console.error('Error saving to Drive:', error);
        if (error.status === 401) {
            showToast('Session expired. Please reconnect to Google Drive.', 'error');
            handleSignoutClick();
        } else {
            showToast('Error saving to Google Drive: ' + error.message, 'error');
        }
    }
}

async function loadFromDrive() {
    if (!await ensureAccessToken()) return;

    if (!confirm('This will overwrite your current local data with the data from Google Drive. Are you sure?')) {
        return;
    }

    try {
        const fileId = await getFileId();
        if (!fileId) {
            showToast('No backup file found in Google Drive.', 'warning');
            return;
        }

        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        const driveData = JSON.parse(response.body);
        appData = driveData;
        saveData(); // This will save to localStorage and re-render the UI
        showToast('Data loaded successfully from Google Drive!', 'success');
    } catch(e) {
        console.error('Error loading from Drive:', e);
        if (e.status === 401) {
            showToast('Session expired. Please reconnect to Google Drive.', 'error');
            handleSignoutClick();
        } else {
            showToast('Failed to load data from Google Drive. Error: ' + e.message, 'error');
        }
    }
}

// Kick off the Google auth process after the page loads
window.onload = handleClientLoad;

