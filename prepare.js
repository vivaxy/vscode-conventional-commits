// download latest gitmojis.json
import https from 'node:https';
import fs from 'node:fs';

const file = fs.createWriteStream('./src/vendors/gitmojis.json');
const request = https.get(
  'https://raw.githubusercontent.com/carloscuesta/gitmoji/v3.13.1/packages/gitmojis/src/gitmojis.json',
  function (response) {
    response.pipe(file);
  },
);
