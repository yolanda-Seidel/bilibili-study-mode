# Bilibili Study Mode

A lightweight Tampermonkey userscript that turns Bilibili Web into a cleaner, study-focused interface.

## Features

- Filters the Bilibili homepage with a strict study whitelist
- Keeps content related to:
  - Postgraduate entrance exam preparation
  - Mathematics
  - English
  - Programming and computer science
  - Academic courses
  - Study With Me / Pomodoro / focus sessions
- Blocks:
  - Games
  - Business and economics content
  - Entertainment content
  - Livestreams
  - Ads and promotional cards
- Simplifies the top navigation
- Keeps only:
  - Search
  - Dynamic
  - Favorites
- Hides related video recommendations on video pages
- Keeps playlists, collections and multi-part videos
- Automatically filters newly loaded homepage content
- Supports `Alt + S` to toggle Study Mode

## Installation

1. Install Tampermonkey.
2. Open the raw userscript file:
   `bilibili-study-mode.user.js`
3. Tampermonkey should detect it automatically.
4. Install the script.
5. Refresh Bilibili.

## Customization

The filtering rules are defined near the top of the script.

### Allowed content

Edit:

```js
const ALLOW = ...
