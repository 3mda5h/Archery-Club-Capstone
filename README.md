# Archery Club Capstone Project

This project is a scoring webapp and database for the Oregon State University Archery Club. 

## Project objectives:
### Front end:
- A public, very mobile-friendly web UI where users can select a competition/event, enter their raw arrow scores and submit to the database, view their past scores and their running average, and view their place in a club-wide leaderboard for each competition
  - These pages will be publicly available and require no individual login (no account) to reduce friction for users. However, there will be a reasonably secure system so that only Archery Club members can submit their scores to the database. Likely a password told to members at practice + rate-limiting to prevent brute-force + only allowing submissions during club practice hours + avoid page showing up on Google.
  - Ideally, the scoring page should support double-scoring, where each archer can (optionally) be scored by two other archers to avoid mistakes or cheating. In this case the UI should easily allow for switching between multiple scorecards.
Pages should also use browser caching to save scores and other user-selected data in case internet connection is lost or page is accidentally reloaded. User's name should be stored long-term as well so they don't have to re-select it every time
  - Pages should also be lightweight and be able load reasonably quickly when internet connection isn't great.
- An admin page only accessible to club officers that will allow for addition and bulk removal of members, editing scores after they are submitted in case of error, changing the score-submission/admin password + managing other security features, and any other configurations needed
Accessible via a password known only by club officers, protected by rate limiting
 
### Back end:
- Server-side logic for team-making, competition-specific scoring, leaderboards, averages, pin achievements, etc
- A database backend that maps members to their scorecards for all events they have participated in

### General goals:
- Needs to be highly configurable via UI, allowing future archery club officers with no technical knowledge to change things to fit with current competition rules/conditions
- Needs to be hosted somewhere STABLE and CHEAP so future club officers can continue to use it. (AWS? maybe OSU can host?)

