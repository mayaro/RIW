const fs = require('fs');
const path = require('path');

module.exports = exports = {

  /**
   * Get a list of files from a specified directory
   *
   * @param { string } dir
   * @param { Array<string> | function } [filelist]
   * @param { function } [filter]
   *
   * @return { Array<string> }
   *
   * @type { function }
   * @exports
   */
  getFilesInDirectory: function getFilesInDirectory(dir, filelist, filter) {

    // Allow a filter function to be passed. If the second argument is the filter function,
    // it will be passed in the recursive stack as the third parameter
    if (typeof filelist === 'function') {
      filter = filelist;
      filelist = [];
    }

    const files = fs.readdirSync(dir);

    filelist = filelist || [];

    files.forEach((file) => {
      const fPath = path.join(dir, file);

      if (fs.statSync(fPath).isDirectory()) {
        filelist = getFilesInDirectory(fPath, filelist, filter);
      }
      else {
        if (!filter ||
          (filter && filter(file))) {          
          filelist.push(
            path.join(dir, file)
          );
        }
      }
    });

    return filelist;

  },

  /**
   * Write the content provided as parameter in a file on the disk
   *
   * @param { string } filePath
   * @param { string } content
   *
   * @type { function }
   * @exports
   */
  writeFileSync: function writeSync(filePath, content) {

    try {

      fs.writeFileSync(filePath, content);

    } catch (e) {
      console.error(`
        Could not write file "${filePath}" to disk, reason: ${e.stack}
      `);
    }

  },

  /**
   * Get the read stream for a given file
   *
   * @param { string } filePath
   * @return { ReadStream }
   *
   * @type { function }
   * @exports
   */
  getFileStream: function getFileStream(filePath) {

    return fs.createReadStream(filePath);

  }

};