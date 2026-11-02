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

## Quickstart (Windows)

These steps take you from a clean clone to a running local server on Windows 10 or 11. Commands are for **PowerShell** (press <kbd>Win</kbd>, type `PowerShell`, press <kbd>Enter</kbd>).

### 1\. Install Git and Go

The quickest way is with `winget`, which ships with Windows 10 (1809+) and Windows 11:

```powershell
winget install --id Git.Git -e
winget install --id GoLang.Go -e
```

Alternatively, download and run the installers from [git-scm.com](https://git-scm.com/download/win) and [go.dev/dl](https://go.dev/dl/) (pick the `windows-amd64.msi`, or `windows-arm64.msi` on ARM laptops), accepting the defaults.

**Close and reopen PowerShell** after installing so the new `PATH` takes effect, then check both tools:

```powershell
git --version
go version
```

`go version` should print `go1.26.8` or newer. If you already have an older Go (1.21 or later) installed, that is fine: the first time you run the project, Go automatically downloads the toolchain version that `go.mod` asks for (this needs an internet connection).

### 2\. Clone the repository

```powershell
cd $HOME\\Documents
git clone https://github.com/3mda5h/Archery-Club-Capstone.git
cd Archery-Club-Capstone
```

### 3\. Run the server

From the repository root (the folder containing `main.go`):

```powershell
go run .
```

The server prints nothing when it starts successfully; the cursor just sits there. That means it is running.

The first time, **Windows Defender Firewall** may ask whether to allow the program to communicate on networks. For local development only, you can click **Cancel**; `localhost` still works. Click **Allow** for *Private networks* if you want to test from your phone (see [Testing on a phone](#testing-on-a-phone)).

### 4\. Open the app

Go to [http://localhost:4000](http://localhost:4000) in your browser. You should see a page titled **Test Scorecard** with a grid of score inputs and an orange **Submit Scorecard** button.

To stop the server, click in the PowerShell window and press <kbd>Ctrl</kbd>+<kbd>C</kbd>.

That's it: you have a running system.

## Usage

### Local pages

|URL|Page|
|-|-|
|`http://localhost:4000/`|Test scorecard (`public/index.html`)|
|`http://localhost:4000/scorecard.html`|Same scorecard (`public/scorecard.html`)|

Locally, include the `.html` extension. The extensionless URLs (for example `/scorecard`) only work on Vercel, which applies `cleanUrls` from `vercel.json`.

### How the server decides what to serve

`main.go` checks the `PORT` environment variable. Vercel sets it in production; on your machine it is normally unset, so the server listens on port **4000** and serves the `public/` folder. In production, Vercel serves `public/` itself.

**The browser console shows a 404 for `/assets/js/score.js`.** Expected for now: the scorecard page references a script that hasn't been added to the repository yet. The page still loads.
