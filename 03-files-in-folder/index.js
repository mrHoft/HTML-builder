const { readdir } = require('node:fs/promises');
const path = require('path');
const { stat } = require('node:fs');

function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const postfix = ['Bytes', 'Kb', 'Mb', 'Gb', 'Tb'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))}${
    postfix[i]
  }`;
}

try {
  readdir(path.join(__dirname, 'secret-folder'), { withFileTypes: true }).then(
    (files) => {
      for (const file of files) {
        const isDir = file.isDirectory();
        const ext = path.extname(file.name);
        const name = path.basename(file.name, ext);

        if (!isDir) {
          stat(
            path.join(__dirname, 'secret-folder', file.name),
            (err, stats) => {
              if (err) {
                console.error(err);
                return;
              }
              console.log(
                `${name} - ${ext.slice(1)} - ${formatBytes(stats.size, 3)}`,
              );
            },
          );
        }
      }
    },
  );
} catch (err) {
  console.error(err);
}
