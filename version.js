const package_bot = require('./package.json');
const package_webpanel = require('./webpanel/package.json');

console.log(`Bot version: ${package_bot.version}`);
console.log(`Web panel version: ${package_webpanel.version}`);