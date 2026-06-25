// update-rankings.mjs
// Previously used headless Chrome to scrape FIFA's Akamai-protected API.
// Rankings are now self-calculated via FIFA Elo formula inside sync-live-data.mjs
// after each WC match. This file is retained only so the weekly workflow
// doesn't break; it writes nothing and exits cleanly.

console.log('Rankings are now Elo-calculated in sync-live-data.mjs after each WC match.');
console.log('This weekly job is no longer needed — safe to disable the workflow if desired.');
process.exit(0);
