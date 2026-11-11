const table = document.getElementById("scorecard");
const running_total_row = document.getElementById("running-total-row");
const running_total_value = document.getElementById("running-total-value");
const submit_button = document.getElementById("submit-scorecard-button");
const submit_message = document.getElementById("submit-message");
const event_code_input = document.getElementById("event-code");
const keypad = document.getElementById("keypad");

// The server handler must read these exact names from the JSON body (see docs/design.md)
const SUBMIT_URL = "/api/scorecards";
const FIELD_EVENT_CODE = "event_code";
const FIELD_ENDS = "ends";

const NUM_ENDS = 6;
const ARROWS_PER_END = 5;
const TOTAL_ARROWS = NUM_ENDS * ARROWS_PER_END;
const STORAGE_KEY = "arrowscore.draft";

// ---- State -------------------------------------------------------------
// scores[end][arrow] is null (not entered) or a token: "M", "1".."10", "X"
let scores = Array.from({ length: NUM_ENDS }, () => Array(ARROWS_PER_END).fill(null));
let current = { end: 0, arrow: 0 };
const cells = []; // cells[end][arrow] -> the <button> element

// ---- The ONE place tokens are converted to database values -------------
// M is a miss (score 0). X is an inner ten (score 10 with the x flag set).
function tokenToArrow(token) {
    if (token === null) return null;               // blank stays null, distinct from a miss
    if (token === 'M') return { score: 0, x: false };
    if (token === 'X') return { score: 10, x: true };
    return { score: parseInt(token, 10), x: false };
}

// ---- Build the table ---------------------------------------------------
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
            cell.dataset.end = e;
            cell.dataset.arrow = a;
            td.append(cell);
            row.append(td);
            cells[e][a] = cell;
        }
        running_total_row.before(row);
    }
}

// ---- Render (state -> DOM) ---------------------------------------------
function render() {
    for (let e = 0; e < NUM_ENDS; e++) {
        for (let a = 0; a < ARROWS_PER_END; a++) {
            const cell = cells[e][a];
            const token = scores[e][a];
            cell.textContent = token ?? '';
            cell.dataset.token = token ?? '';   // CSS colors the cell by ring from this
            cell.classList.toggle('current', e === current.end && a === current.arrow);
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
            total += tokenToArrow(token)?.score ?? 0;
        }
    }
    running_total_value.textContent = total;
}

// ---- Cursor + input ----------------------------------------------------
function flatIndex() { return current.end * ARROWS_PER_END + current.arrow; }
function setFlatIndex(i) {
    i = Math.max(0, Math.min(TOTAL_ARROWS - 1, i));
    current = { end: Math.floor(i / ARROWS_PER_END), arrow: i % ARROWS_PER_END };
}

function enterToken(token) {
    scores[current.end][current.arrow] = token;
    setFlatIndex(flatIndex() + 1);   // auto-advance (stays put on the last cell)
    render();
    cells[current.end][current.arrow].scrollIntoView({ block: 'nearest' });
}

function backspace() {
    // if the current cell has a value, clear it; otherwise step back and clear that one
    if (scores[current.end][current.arrow] === null) setFlatIndex(flatIndex() - 1);
    scores[current.end][current.arrow] = null;
    render();
}

table.addEventListener('click', (event) => {
    const cell = event.target.closest('button.cell');
    if (!cell) return;
    current = { end: Number(cell.dataset.end), arrow: Number(cell.dataset.arrow) };
    render();
});

keypad.addEventListener('click', (event) => {
    const key = event.target.closest('button.key');
    if (!key) return;
    if (key.dataset.action === 'back') backspace();
    else enterToken(key.dataset.token);
});

// The event code is a normal text field, so the system keyboard opens for it.
// Hide the keypad meanwhile so the two don't stack on top of each other.
event_code_input.addEventListener('focus', () => { keypad.hidden = true; });
event_code_input.addEventListener('blur', () => { keypad.hidden = false; });
event_code_input.addEventListener('input', saveDraft);

// ---- Draft caching (page reload / lost signal) -------------------------
function saveDraft() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            event_code: event_code_input.value, scores, current,
        }));
    } catch (e) { /* storage full or blocked (private mode): just skip caching */ }
}

function loadDraft() {
    try {
        const draft = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!draft) return;
        // only trust the saved grid if its shape matches the current table
        if (draft.scores?.length === NUM_ENDS &&
            draft.scores.every(end => end.length === ARROWS_PER_END)) {
            scores = draft.scores;
            current = draft.current ?? current;
        }
        event_code_input.value = draft.event_code ?? '';
    } catch (e) { /* corrupt draft: start fresh */ }
}

// ---- Submit ------------------------------------------------------------
//builds the 2D array of arrows: one inner array per end, one {score, x} (or null if blank) per arrow
function collectEnds() {
    return scores.map(end => end.map(tokenToArrow));
}

function showMessage(text, isSuccess) {
    submit_message.textContent = text;
    submit_message.classList.toggle('success', isSuccess);
}

submit_button.addEventListener('click', async () => {
    const event_code = event_code_input.value.trim();
    if (event_code === '') {
        showMessage('Please enter the event code.', false);
        return;
    }

    const body = {
        [FIELD_EVENT_CODE]: event_code,
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
buildTable();
loadDraft();
render();