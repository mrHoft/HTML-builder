const fs = require('fs');
const { readdir } = require('node:fs/promises');
const path = require('path');

async function getFilesList(url, ext) {
  try {
    const files = await readdir(url, {
      withFileTypes: true,
    });
    const list = [];
    for (const file of files) {
      const isDir = file.isDirectory();
      const _ext = path.extname(file.name);

      if (!isDir && _ext === ext) {
        list.push(file.name);
      }
    }
    return { list, error: null };
  } catch (error) {
    return { list: [], error };
  }
}

class mergeStyles {
  constructor({ origin = '', target = '', fileName = '' }) {
    this.origin = origin;
    this.target = target;
    this.fileName = fileName;
  }

  async readFiles(list) {
    const styles = [];
    for (const file of list) {
      const res = await new Promise((resolve, reject) => {
        let data = '';
        const stream = fs.createReadStream(
          path.join(__dirname, this.origin, file),
        );
        stream.on('data', (chunk) => (data += chunk));
        stream.on('end', () => {
          resolve(data);
        });
      });
      styles.push(res);
    }
    return styles;
  }

  async writeMergedStyles(styles) {
    const file = fs.createWriteStream(
      path.join(__dirname, this.target, this.fileName),
      {
        encoding: 'utf8',
      },
    );

    for (const bunch of styles) {
      file.write(bunch);
    }
    file.end();
  }

  async perform() {
    const { list: filesList, error } = await getFilesList(
      path.join(__dirname, this.origin),
      '.css',
    );
    if (error) return console.error(error);

    const mergedStyles = await this.readFiles(filesList);
    await this.writeMergedStyles(mergedStyles);

    console.log(`Styles was bundled to ./${this.target}/${this.fileName}`);
  }
}

function rmDir(target) {
  return new Promise((resolve, reject) => {
    fs.rm(path.join(__dirname, target), { recursive: true }, (error) => {
      if (error) return reject(error);
      console.log('Old project was deleted.');
      resolve();
    });
  });
}

async function mkDir(target) {
  fs.mkdir(path.join(__dirname, target), { recursive: true }, (error) => {
    if (error) return error;
    console.log(`Directory ${target} created successfully.`);
  });
}

async function readFile(url) {
  return new Promise((resolve, reject) => {
    let data = '';
    const stream = fs.createReadStream(url);
    stream.on('data', (chunk) => (data += chunk));
    stream.on('end', () => {
      resolve(data);
    });
  });
}

async function readComponents(url) {
  const ext = '.html';
  const components = {};
  const fileList = await new Promise((resolve, reject) => {
    getFilesList(url, ext).then(({ list, error }) => {
      if (error) return reject(error);
      resolve(list);
    });
  });
  for (const file of fileList) {
    const data = await readFile(path.join(url, file));
    const name = path.basename(file, ext);
    components[name] = data;
  }
  return components;
}

async function build() {
  const origin = 'styles';
  const target = 'project-dist';
  const stylesName = 'styles.css';
  const indexName = 'index.html';
  const templateName = 'template.html';

  console.log('Bundling project...');
  performance.mark('begin');

  await rmDir(target).catch((error) => {
    // console.log(error.mssage) // ignore no such folder message
  });

  // const template = await readFile(path.join(__dirname, templateName));
  // console.log(template);

  const components = await readComponents(path.join(__dirname, 'components'));
  console.log(components);

  // await mkDir(target);
  // await new mergeStyles({ origin, target, fileName: stylesName }).perform();

  performance.mark('end');
  const measure = performance.measure('MergeProcess', 'begin', 'end');
  const duration = measure.duration.toFixed(2);
  console.log(`Job is done in ${duration}ms`);
}

build();
