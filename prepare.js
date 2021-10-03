// download latest gitmojis.json
const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream('./src/vendors/gitmojis.json');
const request = https.get('https://gitmoji.dev/api/gitmojis', function (
  response,
) {
  response.pipe(file);
});
