const table = document.getElementById("scorecard");
const running_total_value = document.getElementById("running-total-value");
const submit_button = document.getElementById("submit-scorecard-button");
const submit_message = document.getElementById("submit-message");
const event_code_input = document.getElementById("event-code");

// The server handler must read these exact names from the JSON body (see docs/design.md)
const SUBMIT_URL = "/api/scorecards";
const FIELD_EVENT_CODE = "event_code";
const FIELD_ENDS = "ends";

//input listener fires at every keystroke
table.addEventListener('input', handleInput);

function handleInput(event) {
    const input = event.target;
    if (!input.matches('input')) return; //makes sure change is from an input tag (the scorecard cells). matches takes any CSS selector

    markValidity(input);
    updateRunningTotal();
}

function markValidity(input) {
    //second argument determines whether or not to toggle the class to invalid
    input.classList.toggle('invalid', !input.validity.valid); //browser does validity checking based on the constraints specified with the input HTML attributes
}

function updateRunningTotal() {
    let running_total = 0;
    table.querySelectorAll('input').forEach(input => {
        if (input.validity.valid) {   // ignore invalid entries
            running_total += parseInt(input.value, 10) || 0;//parseint converts string to int (base 10). || is logical OR - if parseint fails, return 0 (parse int will fail for empty cells!)
        }
    });
    running_total_value.textContent = running_total;
}

//builds the 2D array of arrow scores: one inner array per end (table row), one number per arrow
function collectEnds() {
    const ends = [];
    table.querySelectorAll('tr').forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length === 0) return; //skips header and total rows
        //a blank cell is sent as null so it isn't confused with a real score of 0 (a miss)
        ends.push(Array.from(inputs, input => input.value === '' ? null : parseInt(input.value, 10)));
    });
    return ends;
}

function showMessage(text, isSuccess) {
    submit_message.textContent = text;
    submit_message.classList.toggle('success', isSuccess);
}

submit_button.addEventListener('click', async () => {
    const inputs = table.querySelectorAll('input');
    let all_valid = true;
 
    inputs.forEach(input => {
        markValidity(input);
        if (!input.validity.valid) all_valid = false;
    });
 
    if (!all_valid) {
        showMessage('Your scorecard is invalid!', false);
        return;
    }
 
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