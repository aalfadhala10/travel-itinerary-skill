const fs = require('fs');
const world = fs.readFileSync('geo/world.json', 'utf8');
// `modes` is one entry per HOP between cities — how you actually cover that leg. The app decides
// this per leg already (rail if the country has it and the hop is under 600km, else road, else
// fly); these are the true answers for these seven trips rather than a plane for everything.
const TRIPS = {};   // the trip is built by the user now, not chosen from a list
const cities = fs.readFileSync('cities.json', 'utf8');
const html = fs.readFileSync('demo-src.html', 'utf8')
  .replace('/*__WORLD__*/', 'var WORLD=' + world + ';')
  .replace('/*__CITIES__*/', 'var CITIES=' + cities + ';')
  .replace('/*__TRIPS__*/', 'var TRIPS=' + JSON.stringify(TRIPS) + ';');
fs.mkdirSync('/home/user/travel-itinerary-skill/demo', { recursive: true });
fs.writeFileSync('/home/user/travel-itinerary-skill/demo/globe.html', html);
console.log('demo/globe.html', fs.statSync('/home/user/travel-itinerary-skill/demo/globe.html').size, 'bytes');
