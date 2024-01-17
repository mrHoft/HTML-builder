const fs = require('fs');
const path = require('path');

console.log(`>> reading ${__dirname}/text.txt:`);

const stream = fs.createReadStream(path.join(__dirname, 'text.txt'));
stream.setEncoding('UTF8');

function logStream(stream) {
  stream.on('readable', () => console.log(`${stream.read()}`));
  stream.on('end', () => console.log('> end'));
}

function logData(stream) {
  let data = '';
  stream.on('data', (chunk) => (data += chunk));
  stream.on('end', () => console.log(data));
  stream.on('error', (err) => console.warn(err.stack));
}

async function logChunks(stream) {
  for await (const chunk of stream) {
    console.log(`${chunk}`);
  }
}

// logStream(stream);
// logData(stream);
// logChunks(stream);
stream.forEach((chunk) => console.log(`${chunk}`)); // Short implementation
