// download latest gitmojis.json
const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream('./src/vendors/gitmojis.json');
const request = https.get('https://raw.githubusercontent.com/carloscuesta/gitmoji/v3.5.0/src/data/gitmojis.json', function (
  response,
) {
  response.pipe(file);
});
