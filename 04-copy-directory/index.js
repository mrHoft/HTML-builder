const fs = require('fs');
const { readdir } = require('node:fs/promises');
const path = require('path');

const origin = 'files';
const target = 'files-copy';
let filesList = [];

function rmDir(target) {
  return new Promise((resolve, reject) => {
    fs.rm(path.join(__dirname, target), { recursive: true }, (error) => {
      if (error) return reject(error);
      console.log(`Directory ${target} deleted successfully.`);
      resolve();
    });
  });
}

function mkDir() {
  fs.mkdir(path.join(__dirname, target), { recursive: true }, (err) => {
    if (err) {
      return console.error(err);
    }
    console.log(`Directory ${target} created successfully.`);
    copyFiles();
  });
}

function copyFiles() {
  for (const file of filesList) {
    const [from, to] = [
      path.join(__dirname, origin, file),
      path.join(__dirname, target, file),
    ];
    fs.copyFile(from, to, fs.constants.COPYFILE_EXCL, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Copyed: ${file}`);
      }
    });
  }
}

async function copyDir() {
  await rmDir(target).catch((error) => {});
  readdir(path.join(__dirname, origin)).then((files) => {
    filesList = [...files];
    mkDir();
  });
}

copyDir();
