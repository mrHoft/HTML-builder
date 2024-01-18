const fs = require('fs');
const { readdir } = require('node:fs/promises');
const path = require('path');

const HASH = '> ';

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

    console.log(
      `${HASH}Styles was bundled to ./${this.target}/${this.fileName}`,
    );
  }
}

function rmDir(target) {
  return new Promise((resolve, reject) => {
    fs.rm(path.join(__dirname, target), { recursive: true }, (error) => {
      if (error) return reject(error);
      console.log(`${HASH}Deleted: old project files.`);
      resolve();
    });
  });
}

async function mkDir(url) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path.join(url), { recursive: true }, (error) => {
      if (error) return reject(error);
      console.log(`${HASH}Created directory: ${url}`);
      resolve();
    });
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
    components[name] =
      data[data.length - 1] === '\n' ? data.slice(0, data.length - 1) : data;
  }
  return components;
}

function writeFile(url, data) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(url, { encoding: 'utf8' });
    file.on('finish', () => {
      console.log(`${HASH}Created file: ${url}`);
      resolve();
    });
    for (const bunch of data) {
      file.write(bunch);
    }
    file.end();
  });
}

async function copyFiles(from, dest) {
  await mkDir(dest);
  return new Promise((resolve, reject) => {
    readdir(from, { withFileTypes: true }).then((files) => {
      for (const file of files) {
        const isDir = file.isDirectory();
        const [a, b] = [path.join(from, file.name), path.join(dest, file.name)];
        if (isDir) copyFiles(a, b);
        else
          fs.copyFile(a, b, fs.constants.COPYFILE_EXCL, (err) => {
            if (err) console.log(err);
            else console.log(`${HASH}Copied: ${b}`);
          });
      }
      resolve();
    });
  });
}

async function build() {
  const stylesOrigin = 'styles';
  const target = 'project-dist';
  const stylesName = 'style.css';
  const indexName = 'index.html';
  const templateName = 'template.html';

  console.log('==================\nBundling project...');
  performance.mark('begin');

  await rmDir(target).catch((error) => {
    // console.log(error.mssage) // ignore no such folder message
  });
  await mkDir(path.join(__dirname, target));

  // Reading template
  let template = await readFile(path.join(__dirname, templateName));
  const components = await readComponents(path.join(__dirname, 'components'));

  // Changing template
  Object.keys(components).forEach((name) => {
    template = template.replace(RegExp(`{{${name}}}`, 'm'), components[name]);
  });
  console.log(`${HASH}Prepared: ${templateName}`);

  // Wrighting template
  await writeFile(path.join(__dirname, target, indexName), template);

  // Copy assets
  await copyFiles(
    path.join(__dirname, 'assets'),
    path.join(__dirname, target, 'assets'),
  );

  // Merge and copy styles
  await new mergeStyles({
    origin: stylesOrigin,
    target,
    fileName: stylesName,
  }).perform();

  performance.mark('end');
  const measure = performance.measure('BuildProcess', 'begin', 'end');
  const duration = measure.duration.toFixed(2);
  console.log(`✨ Job was done in ${duration}ms`);
}

build();
