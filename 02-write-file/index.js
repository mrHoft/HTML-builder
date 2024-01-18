const fs = require('fs');
const path = require('path');
const { stdin } = require('node:process');
const { Readable } = require('stream');

console.log(`>> Your typed input wiil be writed to ${__dirname}/text.txt`);

const writeStream = fs.createWriteStream(path.join(__dirname, 'text.txt'), {
  encoding: 'utf8',
});
const readStream = Readable.from(stdin);

readStream.on('data', (chunk) => {
  const text = `${chunk}`;
  if (text === 'exit\n') {
    readStream.destroy();
    return;
  }
  // console.log(text, text.split(''));
  writeStream.write(text);
});

readStream.on('end', () => {
  console.log('>> Typing was exited.');
  writeStream.end();
});

process.on('SIGINT', () => {
  console.log('\n>> Typing was exited.');
  writeStream.end();
  process.exit();
});
