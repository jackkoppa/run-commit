// --- CONFIGURATION ---
const GOOGLE_CLIENT_ID = '578004472241-gu7aa52q9lktheqaqjvdooc3bbukep9k.apps.googleusercontent.com';

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const RUN_COMMIT_FILENAME = 'run-commit-data.json';

let appData = {};

// --- INITIAL PLAN DATA ---
const initialPlan = {
    "version": 1, "goal": "Marathon 3:15", "startDate": "2025-10-13", "legend": { "LR": "Long Run", "E": "Easy Run", "MP": "Marathon Pace Run", "T": "Tempo Run", "S_A": "Strength A (Glutes & Core)", "S_B": "Strength B (Power & Stability)", "XT": "Cross-Training", "R": "Rest" },
    "schedule": [ {"day": 1, "plan": "R"}, {"day": 2, "plan": "E 4mi"}, {"day": 3, "plan": "R"}, {"day": 4, "plan": "S_A"}, {"day": 5, "plan": "R"}, {"day": 6, "plan": "LR 10mi"}, {"day": 7, "plan": "R"}, {"day": 8, "plan": "R"}, {"day": 9, "plan": "E 4mi"}, {"day": 10, "plan": "Workout: 2mi WU, 2mi @MP, 1mi CD"}, {"day": 11, "plan": "S_A"}, {"day": 12, "plan": "R"}, {"day": 13, "plan": "LR 12mi"}, {"day": 14, "plan": "R"}, {"day": 15, "plan": "R"}, {"day": 16, "plan": "E 5mi"}, {"day": 17, "plan": "Workout: 2mi WU, 3mi @MP, 1mi CD"}, {"day": 18, "plan": "S_B"}, {"day": 19, "plan": "R"}, {"day": 20, "plan": "LR 14mi"}, {"day": 21, "plan": "R"}, {"day": 22, "plan": "R"}, {"day": 23, "plan": "E 4mi"}, {"day": 24, "plan": "Workout: 1mi WU, 3x1mi @T w/ 3' jog, 1mi CD"}, {"day": 25, "plan": "R"}, {"day": 26, "plan": "R"}, {"day": 27, "plan": "LR 11mi"}, {"day": 28, "plan": "R"}, {"day": 29, "plan": "R"}, {"day": 30, "plan": "E 5mi"}, {"day": 31, "plan": "Workout: 2mi WU, 4mi @MP, 1mi CD"}, {"day": 32, "plan": "S_A"}, {"day": 33, "plan": "R"}, {"day": 34, "plan": "LR 16mi"}, {"day": 35, "plan": "R"}, {"day": 36, "plan": "R"}, {"day": 37, "plan": "E 5mi"}, {"day": 38, "plan": "Workout: 1mi WU, 2x2mi @T w/ 4' jog, 1mi CD"}, {"day": 39, "plan": "S_B"}, {"day": 40, "plan": "R"}, {"day": 41, "plan": "LR 17mi"}, {"day": 42, "plan": "R"}, {"day": 43, "plan": "R"}, {"day": 44, "plan": "E 6mi"}, {"day": 45, "plan": "Workout: 7mi w/ 5mi @MP"}, {"day": 46, "plan": "R"}, {"day": 47, "plan": "R"}, {"day": 48, "plan": "LR 18mi"}, {"day": 49, "plan": "R"}, {"day": 50, "plan": "R"}, {"day": 51, "plan": "E 4mi"}, {"day": 52, "plan": "Workout: 1mi WU, 4x1mi @T w/ 3' jog, 1mi CD"}, {"day": 53, "plan": "S_A"}, {"day": 54, "plan": "R"}, {"day": 55, "plan": "LR 14mi"}, {"day": 56, "plan": "R"}, {"day": 57, "plan": "R"}, {"day": 58, "plan": "E 5mi"}, {"day": 59, "plan": "Workout: 8mi w/ 6mi @MP"}, {"day": 60, "plan": "S_B"}, {"day": 61, "plan": "R"}, {"day": 62, "plan": "LR 20mi"}, {"day": 63, "plan": "R"} ]
};

// --- CORE APP LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    populateWorkoutTypes();
    renderPlan();
});

function loadData() {
    const savedData = localStorage.getItem('runCommitData');
    if (savedData) {
        appData = JSON.parse(savedData);
        if (!appData.plans || appData.plans.length === 0) {
            appData = { currentPlanVersion: 1, plans: [initialPlan], completed: {} };
            saveData();
        }
    } else {
        appData = { currentPlanVersion: 1, plans: [initialPlan], completed: {} };
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
        const actual = appData.completed[`day_${item.day}`] || "";
        let status, statusClass, statusText;

        if (actual === "MISSED") {
            status = 'missed'; statusClass = 'bg-red-200 text-red-800'; statusText = 'Missed';
        } else if (actual) {
            status = 'completed'; statusClass = 'bg-green-200 text-green-800'; statusText = 'Completed';
        } else if (isPast) {
            status = 'pending'; statusClass = 'bg-gray-200 text-gray-800'; statusText = 'Pending';
        } else {
            status = 'upcoming'; statusClass = 'bg-blue-200 text-blue-800'; statusText = 'Upcoming';
        }

        const dayEl = document.createElement('div');
        dayEl.className = 'bg-white p-4 rounded-lg border-2 border-black neo-shadow';
        dayEl.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center space-x-2">
                         <span class="text-sm font-bold px-2 py-0.5 rounded-full ${statusClass}">${statusText}</span>
                         <input type="date" value="${dateString}" onchange="changeWorkoutDate(${item.day}, this.value)" class="text-lg font-bold bg-transparent">
                    </div>
                    <p class="mt-1 text-slate-800">${parsePlanText(item.plan, plan.legend)}</p>
                </div>
                ${ status !== 'completed' && status !== 'missed' && isPast ? `<button onclick="markAsMissed(${item.day})" class="text-sm bg-red-500 text-white font-semibold py-1 px-3 rounded border-2 border-black hover:bg-red-600">Mark Missed</button>` : ''}
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
    
    const diffTime = Math.abs(newDate - startDate);
    const newDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

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
        alert("Please select a date and add some notes.");
        return;
    }

    const plan = getCurrentPlan();
    const startDate = new Date(plan.startDate + 'T00:00:00');
    const workoutDate = new Date(dateVal + 'T00:00:00');
    
    const diffTime = Math.abs(workoutDate - startDate);
    const day = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (!plan.schedule.some(item => item.day === day)) {
        plan.schedule.push({ day: day, plan: typeVal });
    }
    
    appData.completed[`day_${day}`] = notesVal;
    saveData();
    toggleModal('add-workout-modal');
    
    document.getElementById('workout-date').value = '';
    document.getElementById('workout-notes').value = '';
}

function toggleImport() {
    document.getElementById('import-div').classList.toggle('hidden');
}

function exportPlan() {
    const plan = getCurrentPlan();
    const exportObject = {
        prompt: `You are an expert running coach AI. Analyze the provided training plan and the user's completed workouts to generate a new, revised weekly schedule. User's Goal: ${plan.goal}. Current Plan Version: ${plan.version}. Analyze the 'completed' log for patterns (missed workouts, pace comments, etc.). Adjust the *remaining, uncompleted* workouts in the schedule. Do not change past workouts. Keep day numbers consistent. Increase the 'version' number by 1. Keep the JSON structure identical and use the provided 'legend' for abbreviations. Your response MUST be ONLY the updated JSON object, starting with { and ending with }.`,
        data: { ...plan, completed: appData.completed }
    };

    const exportString = JSON.stringify(exportObject, null, 2);
    const ioTextarea = document.getElementById('io-textarea');
    ioTextarea.value = exportString;
    if (document.getElementById('import-div').classList.contains('hidden')) {
        toggleImport();
    }
    navigator.clipboard.writeText(exportString).then(() => {
        alert('Plan data and LLM prompt copied to clipboard!');
    });
}

function importPlan() {
    const ioTextarea = document.getElementById('io-textarea');
    try {
        const newPlan = JSON.parse(ioTextarea.value);
        if (!newPlan.version || !newPlan.schedule) throw new Error("Invalid plan format.");
        if (appData.plans.some(p => p.version === newPlan.version)) {
            alert(`Error: Plan version ${newPlan.version} already exists.`);
            return;
        }

        delete newPlan.completed; 
        appData.plans.push(newPlan);
        appData.currentPlanVersion = newPlan.version;
        saveData();
        ioTextarea.value = "";
        toggleImport();
        alert(`Successfully imported plan version ${newPlan.version}!`);
    } catch (e) {
        alert("Error parsing plan. Please make sure it's valid JSON. Error: " + e.message);
    }
}

// --- GOOGLE DRIVE INTEGRATION ---
let tokenClient;
let accessToken = null;

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
        alert('Please connect to Google Drive first.');
        return false;
    }
    return true;
}

async function saveToDrive() {
    if (!await ensureAccessToken()) return;

    try {
        const fileId = await getFileId();
        const content = JSON.stringify(appData, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const formData = new FormData();

        if (fileId) { // Update existing file
            formData.append('metadata', new Blob([JSON.stringify({ name: RUN_COMMIT_FILENAME })], { type: 'application/json' }));
            formData.append('file', blob);
            await gapi.client.request({
                path: `/upload/drive/v3/files/${fileId}`,
                method: 'PATCH',
                params: { uploadType: 'multipart' },
                body: formData
            });
            alert('Data synced to Google Drive!');
        } else { // Create new file
            formData.append('metadata', new Blob([JSON.stringify({ name: RUN_COMMIT_FILENAME, parents: ['root'] })], { type: 'application/json' }));
            formData.append('file', blob);
            await gapi.client.request({
                path: '/upload/drive/v3/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                body: formData
            });
            alert('Data file created in Google Drive!');
        }
    } catch (error) {
        console.error('Error saving to Drive:', error);
        if (error.status === 401) {
            alert('Session expired. Please reconnect to Google Drive.');
            handleSignoutClick();
        } else {
            alert('Error saving to Google Drive: ' + error.message);
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
            alert('No backup file found in Google Drive.');
            return;
        }

        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        const driveData = JSON.parse(response.body);
        appData = driveData;
        saveData(); // This will save to localStorage and re-render the UI
        alert('Data loaded successfully from Google Drive!');
    } catch(e) {
        console.error('Error loading from Drive:', e);
        if (e.status === 401) {
            alert('Session expired. Please reconnect to Google Drive.');
            handleSignoutClick();
        } else {
            alert('Failed to load data from Google Drive. Error: ' + e.message);
        }
    }
}

// Kick off the Google auth process after the page loads
window.onload = handleClientLoad;

