const table = document.getElementById("scorecard");
const running_total_row = document.getElementById("running-total-row");
const running_total_value = document.getElementById("running-total-value");
const submit_button = document.getElementById("submit-scorecard-button");
const submit_message = document.getElementById("submit-message");
const scorecard_title = document.getElementById("scorecard-title");
const keypad = document.getElementById("keypad");

// The server handler must read these exact names from the JSON body (see docs/design.md)
const SUBMIT_URL = "/api/scorecards";
const FIELD_EVENT_CODE = "event_code";
const FIELD_ENDS = "ends";

const NUM_ENDS = 6;
const ARROWS_PER_END = 5;
const TOTAL_ARROWS = NUM_ENDS * ARROWS_PER_END;
const STORAGE_KEY = "arrowscore.draft";
const SESSION_KEY = "arrowscore.session";

// ---- State -------------------------------------------------------------
// scores tracks the score symbols (tokens): "M", "1".."10", and "X" 
let scores = Array.from({ length: NUM_ENDS }, () => Array(ARROWS_PER_END).fill(null)); //creats a 2d array of all null
let current = { end: 0, arrow: 0 }; //tuple, tracks current cell user is focused on
const cells = []; // cells are the html <button> elements

// The home page saves { member_id, user_name, event_code } before sending the user here
// Returns null if nobody has joined yet
function loadSession() {
    try {
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (saved?.user_name && saved?.event_code) return saved;
    } catch (e) { /* missing or corrupt: treat as not joined */ }
    return null;
}
const session = loadSession();

function setKeypadVisible(is_visible) {
    keypad.hidden = !is_visible;
    document.body.classList.toggle('keypad-hidden', !is_visible);
    updateKeypadHeight()
}

//allows for scolling correct distance when cell is clicked
function updateKeypadHeight() {
    // offsetHeight is 0 when the keypad is hidden, so scrolling ignores it automatically
    document.documentElement.style.setProperty('--keypad-height', keypad.offsetHeight + 'px');
}

//convert a scoring symbol (token) to its actual numeric value
// M is a miss, worth 0. X is an inner ten, worth 10. The X itself is only tracked as a 'total X' count per end
function tokenToScore(token) {
    if (token === null || token === 'M') return 0;
    if (token === 'X') return 10;
    return Number(token);
}

// ---- Build the table ---------------------------------------------------\
// dynamically builds HTML table with correct row and col nums
function buildTable() {
    for (let e = 0; e < NUM_ENDS; e++) {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.className = 'end-label';
        label.textContent = e + 1;
        row.append(label);

        cells[e] = [];
        for (let a = 0; a < ARROWS_PER_END; a++) {
            const td = document.createElement('td');
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'cell';
            cell.dataset.end = e; //dataset creates a data-* attribute for arbitrary info ignored by browser
            cell.dataset.arrow = a;
            td.append(cell);
            row.append(td);
            cells[e][a] = cell;
        }
        running_total_row.before(row);
    }
}

// ---- Render (state -> DOM) ---------------------------------------------

//display score tokens as the text of the html buttons
function render() {
    for (let e = 0; e < NUM_ENDS; e++) {
        for (let a = 0; a < ARROWS_PER_END; a++) {
            const cell = cells[e][a];
            const token = scores[e][a];
            cell.textContent = token ?? ''; //if score is null (nothing entered), display empty string
            cell.classList.toggle('current', e === current.end && a === current.arrow); //adds or removed 'current' CSS class
            cell.setAttribute('aria-label',
                `End ${e + 1}, arrow ${a + 1}: ${token ?? 'empty'}`);
        }
    }
    updateRunningTotal();
    saveDraft();
}

function updateRunningTotal() {
    let total = 0;
    for (const end of scores) {
        for (const token of end) {
            total += tokenToScore(token);
        }
    }
    running_total_value.textContent = total;
}

// ---- Cursor + input ----------------------------------------------------

//counts cells left to right, top to bottom
//makes cursor math easier
function flatIndex() { return current.end * ARROWS_PER_END + current.arrow; }

function moveCursorBy(step) {
    const flat_index = current.end * ARROWS_PER_END + current.arrow + step; //Converts the cursor's two-part position (which end, which arrow) into a single number from 0 to # of arrows (ex 30), 
    const clamped = Math.max(0, Math.min(TOTAL_ARROWS - 1, flat_index)); //converts 'flat' index to 2-part array index
    current = { end: Math.floor(clamped / ARROWS_PER_END), arrow: clamped % ARROWS_PER_END };
}

function enterToken(token) {
    scores[current.end][current.arrow] = token;
    moveCursorBy(1);   // auto-advance (stays put on the last cell)
    render();
    cells[current.end][current.arrow].scrollIntoView({ block: 'nearest' }); //ensure auto-scrolling when auto-advancing to row beneath keyboard
}

function backspace() {
    // if the current cell has a value, clear it; otherwise step back and clear that one
    if (scores[current.end][current.arrow] === null) moveCursorBy(-1);
    scores[current.end][current.arrow] = null;
    render();
}

table.addEventListener('click', (event) => {
    const cell = event.target.closest('button.cell');
    if (!cell) return;
    setKeypadVisible(true);
    current = { end: Number(cell.dataset.end), arrow: Number(cell.dataset.arrow) };
    render();
    cell.scrollIntoView({ block: 'nearest' });
});

keypad.addEventListener('click', (event) => {
    const key = event.target.closest('button.key');
    if (!key) return;
    if (key.dataset.action === 'back') backspace();
    else if (key.dataset.action === 'hide') setKeypadVisible(false);
    else enterToken(key.dataset.token);
});

// ---- Draft caching (page reload / lost signal) -------------------------
function saveDraft() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            user_name: session.user_name, event_code: session.event_code, scores, current,
        }));
    } catch (e) { /* storage full or blocked (private mode): just skip caching */ }
}

function loadDraft() {
    try {
        const draft = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!draft) return;
        // a draft saved for a different person or event isn't theirs, so start fresh
if (draft.user_name !== session.user_name || draft.event_code !== session.event_code) return;
        // only trust the saved grid if its shape matches the current table
        if (draft.scores?.length === NUM_ENDS &&
            draft.scores.every(end => end.length === ARROWS_PER_END)) {
            scores = draft.scores;
            current = draft.current ?? current;
        }
    } catch (e) { /* corrupt draft: start fresh */ }
}

// ---- Submit ------------------------------------------------------------
function collectEnds() {
    return scores.map(end => ({
        arrows: end.map(tokenToScore),
        total_x: end.filter(token => token === 'X').length,
    }));
}

function showMessage(text, isSuccess) {
    submit_message.textContent = text;
    submit_message.classList.toggle('success', isSuccess);
}

submit_button.addEventListener('click', async () => {
    if (scores.flat().includes(null)) {
        showMessage('Fill in every arrow before submitting.', false);
        return;
    }

    const body = {
        [FIELD_EVENT_CODE]: session.event_code,
        [FIELD_ENDS]: collectEnds(),
    };

    submit_button.disabled = true; //prevents double-submitting while the request is in flight
    showMessage('Submitting...', false);

    try {
        const response = await fetch(SUBMIT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            showMessage('Scorecard submitted!', true);
        } else if (response.status === 401) {
            showMessage('Wrong event code.', false);
        } else {
            showMessage('Something went wrong (error ' + response.status + '). Please try again.', false);
        }
    } catch (error) {
        //fetch only throws on network failure (no signal, timeout, etc)
        showMessage('Could not reach the server. Check your connection and try again.', false);
    } finally {
        submit_button.disabled = false;
    }
});

// ---- Startup -----------------------------------------------------------
if (session === null) {
    location.replace("./"); // nobody has joined yet, so go to the home page
} else {
    const title = session.user_name + "'s scorecard";
    scorecard_title.textContent = title;
    document.title = title;
    buildTable();
    loadDraft();
    updateKeypadHeight();
    render();
}