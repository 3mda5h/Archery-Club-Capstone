const table = document.getElementById("scorecard");
const running_total_value = document.getElementById("running-total-value");
const submit_button = document.getElementById("submit-scorecard-button");
const submit_message = document.getElementById("submit-message");

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

submit_button.addEventListener('click', () => {
    const inputs = table.querySelectorAll('input');
    let all_valid = true;

    inputs.forEach(input => {
        markValidity(input);
        if (!input.validity.valid) all_valid = false;
    });

    submit_message.textContent = all_valid ? '' : 'Your scorecard is invalid!';

    if (all_valid) {
        // send the scorecard to your server here
    }
});