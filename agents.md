# Archery Club Capstone Project Context

This project is a scoring webapp and database for a university archery club

Usage context:
- Primarily used by college students on varying mobile devices. Therefore, it needs work on all common mobile operating systems, browsers, and screen sizes
- Will mostly be used outdoors in conditions where the cellular connection is not super fast/reliable. Therefore, the pages must be lightweight, caching must be used whenever possible, and communication with the server must be efficient + generous retries
- Will be used to enter raw arrow scores during competitions. Therefore, it must be very intuitive and easy to use to avoid disrupting competitions.

Competition context:
- There are multiple types of competitions and some of them are long term/cumulative, while others are just 1 or 2 days
- Submitted scores need to be tracked per-event and per-user so the user's average can be calculated and so they can look back on their history of scorecards
- There will be public leaderboards for each competition

Security context:
- The web app does NOT have individual user accounts to reduce friction. Instead, users select their name from a drop down of known approved users, and submit their scores using a password told to them at practice.
- All password checking needs to be IP rate-limited to avoid bot bruteforce 
- Submission to the database should also only be allowed when an admin opens submissions for a specific event
- The website is intended to be internal to the club and will not show up in search engines. Club members will be told the url. 

Admin context:
- The app will have an admin page only accessible to club officers (likely via a separate secret password). Admins should be assumed to be non-technical with no access to or understanding of the codebase. Therefore, everything they would reasonably want to change (security settings, competition variables, approved users, etc) needs be configurable via intuitive UI

Architecture & tech stack context
- Supabase to host the relational database
- Vercel to host the webserver
- Webserver backend is golang
- Front end is (currently) vanilla HTML, CSS, js. Might use a framework for admin page
