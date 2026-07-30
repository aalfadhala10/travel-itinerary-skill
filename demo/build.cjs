const fs = require('fs');
const world = fs.readFileSync('geo/world.json', 'utf8');
// `modes` is one entry per HOP between cities — how you actually cover that leg. The app decides
// this per leg already (rail if the country has it and the hop is under 600km, else road, else
// fly); these are the true answers for these seven trips rather than a plane for everything.
const TRIPS = {
  Kenya:       { label: '🇰🇪 Kenya', modes: ['air'],
                 cities: [{n:'Nairobi',lat:-1.3,lng:36.8},{n:'Maasai Mara',lat:-1.4939,lng:35.144}] },
  Japan:       { label: '🇯🇵 Japan', modes: ['rail','rail'],
                 cities: [{n:'Tokyo',lat:35.7,lng:139.7},{n:'Kyoto',lat:35,lng:135.8},{n:'Osaka',lat:34.7,lng:135.5}] },
  Spain:       { label: '🇪🇸 Spain', modes: ['rail','rail'],
                 cities: [{n:'Madrid',lat:40.4,lng:-3.7},{n:'Barcelona',lat:41.4,lng:2.2},{n:'Seville',lat:37.4,lng:-6}] },
  Thailand:    { label: '🇹🇭 Thailand', modes: ['air','air'],
                 cities: [{n:'Bangkok',lat:13.8,lng:100.5},{n:'Phuket',lat:7.9,lng:98.4},{n:'Chiang Mai',lat:18.8,lng:99}] },
  Turkey:      { label: '🇹🇷 Türkiye', modes: ['air','road'],
                 cities: [{n:'Istanbul',lat:41,lng:28.9},{n:'Cappadocia',lat:38.6,lng:34.8},{n:'Antalya',lat:36.9,lng:30.7}] },
  Switzerland: { label: '🇨🇭 Switzerland', modes: ['rail','rail'],
                 cities: [{n:'Zurich',lat:47.4,lng:8.5},{n:'Interlaken',lat:46.7,lng:7.9},{n:'Zermatt',lat:46,lng:7.7}] },
  Georgia:     { label: '🇬🇪 Georgia', modes: ['road'],
                 cities: [{n:'Tbilisi',lat:41.7,lng:44.8},{n:'Batumi',lat:41.6,lng:41.6}] },
};
const html = fs.readFileSync('demo-src.html', 'utf8')
  .replace('/*__WORLD__*/', 'var WORLD=' + world + ';')
  .replace('/*__TRIPS__*/', 'var TRIPS=' + JSON.stringify(TRIPS) + ';');
fs.mkdirSync('/home/user/travel-itinerary-skill/demo', { recursive: true });
fs.writeFileSync('/home/user/travel-itinerary-skill/demo/globe.html', html);
console.log('demo/globe.html', fs.statSync('/home/user/travel-itinerary-skill/demo/globe.html').size, 'bytes');
