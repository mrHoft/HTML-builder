const fs = require('fs');
const { readdir } = require('node:fs/promises');
const path = require('path');

/**
 * Merges styles from 'origin' folder
 * to 'target' folder 'targetName' file.
 *
 * It might be better to implement this
 * without awaits: just open read
 * and write streams at the same time.
 *
 * @async perform() - executes merging. *
 */
class mergeStyles {
  constructor({ origin = '', target = '', targetName = '' }) {
    this.origin = origin;
    this.target = target;
    this.targetName = targetName;
  }

  async getFilesList() {
    try {
      const files = await readdir(path.join(__dirname, this.origin), {
        withFileTypes: true,
      });
      const list = [];
      for (const file of files) {
        const isDir = file.isDirectory();
        const ext = path.extname(file.name);

        if (!isDir && ext === '.css') {
          list.push(file.name);
        }
      }
      return { list, error: null };
    } catch (error) {
      return { list: [], error };
    }
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
      path.join(__dirname, this.target, this.targetName),
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
    console.log(
      `Merging styles from ./${this.origin}/ to ./${this.target}/${this.targetName}`,
    );
    performance.mark('begin');

    const { list: filesList, error } = await this.getFilesList();
    if (error) {
      console.error(error);
      return;
    }

    const mergedStyles = await this.readFiles(filesList);
    await this.writeMergedStyles(mergedStyles);

    performance.mark('end');
    const measure = performance.measure('MergeProcess', 'begin', 'end');
    const duration = measure.duration.toFixed(2);
    console.log(`Job is done in ${duration}ms`);
  }
}

module.exports = { mergeStyles };

new mergeStyles({
  origin: 'styles',
  target: 'project-dist',
  targetName: 'bundle.css',
}).perform();
