let table = document.getElementById("scorecard");
let running_total_value = document.getElementById("running-total-value");

// 'change' event listener is added to entire table 
// 'change' event is triggered whenever user enters input anywhere in table (input field, checkmark, radio button, etc), which "bubbles up" to the table event listener
// 'event' is the event object that contains information about the 'change' event
// 'event.target' is the specific element that the event happened to
// currently not using an anonymous function since I find it easier to read, can change later
table.addEventListener('change', updateRunningTotal); 
function updateRunningTotal (event)
{
    if (!event.target.matches('input')) return; //makes sure change is from an input tag (the scorecard cells). matches takes any CSS selector

    let running_total = 0;
    table.querySelectorAll('input').forEach(input => {
        running_total += parseInt(input.value, 10) || 0; //parseint converts string to int (base 10). || is logical OR - if parseint fails, return 0 (parse int will fail for empty cells!)
    });

    running_total_value.textContent = running_total;
}