const form = document.getElementById("join-form");
const member_select = document.getElementById("member");
const event_code_input = document.getElementById("event-code");
const status_message = document.getElementById("status");

const MEMBERS_URL = "/api/members"; // should return [{ id, user_name }, ...] (public names only)
const SESSION_KEY = "arrowscore.session"; // read by score.js on the scorecard page
const SCORECARD_PAGE = "scorecard.html";

// TEMP: only used while GET /api/members doesn't exist yet (the server answers 404).
// Delete this list and the 404 check in loadMembers() once that endpoint is built.
const PLACEHOLDER_MEMBERS = [
    { id: 1, user_name: "Emily" },
    { id: 2, user_name: "George" },
    { id: 3, user_name: "David" },
    { id: 4, user_name: "Aidan" },
];

function showStatus(text){
    status_message.textContent = text;
}

// the name chosen last time, so user doesn't have to re-select
function loadSavedMemberId(){
    try{
        return JSON.parse(localStorage.getItem(SESSION_KEY))?.member_id ?? null;
    } catch(e){
        return null; // missing or corrupt
    }
}

async function loadMembers(){
    const response = await fetch(MEMBERS_URL);
    if(!response.ok) return PLACEHOLDER_MEMBERS
    return response.json();
}

function fillMemberSelect(members, saved_id) {
    const sorted = [...members].sort((a, b) => a.user_name.localeCompare(b.user_name));
    //new Option(text, value) sets the text safely, so a name can't inject HTML
    member_select.replaceChildren(new Option("Choose your name", ""));
    for (const member of sorted) {
        member_select.add(new Option(member.user_name, member.id));
    }
    if (saved_id !== null && sorted.some(member => member.id === saved_id)) {
        member_select.value = String(saved_id);
    }
    member_select.disabled = false;
}

form.addEventListener("submit", (event) => {
    event.preventDefault(); //stay on this page so we can save the choice first
    // the browser already blocks an empty name or code (required), but not a code of only spaces
    const event_code = event_code_input.value.trim();
    if (event_code === "") {
        showStatus("Please enter the event code.");
        return;
    }

    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            member_id: Number(member_select.value),
            user_name: member_select.selectedOptions[0].textContent,
            event_code,
        }));
    } catch (e) {
        showStatus("Couldn't save your choice. If you're in private browsing mode, turn it off and try again.");
        return;
    }
    location.href = SCORECARD_PAGE;
});

// ---- Startup -----------------------------------------------------------
(async () => {
    try {
        fillMemberSelect(await loadMembers(), loadSavedMemberId());
    } catch (e) {
        console.error(e);
        member_select.replaceChildren(new Option("Names unavailable", ""));
        showStatus("Couldn't load the list of names. Check your connection and reload the page.");
    }
})();