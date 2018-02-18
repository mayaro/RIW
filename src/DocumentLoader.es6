const fetch   = require('node-fetch');
const fs      = require('fs');
const { URL } = require('url');

/**
 * Load the content of a given path as UTF8 string
 * 
 * @param { String }  filePath
 * @return { Promise<String> }
 */
module.exports = exports = class DocumentLoader {
  
  loadFile(filePath) {

    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, content) => {
        // Handle the case that a error occured but there is no handling done on the callback
        if (typeof reject !== 'function' && err) {
          throw new Error(`
            Something went wrong while trying to load the document with a file path;
            Please make sure that the path is correct and try again.
          `);
        }
        
        return err ?
          reject(err) :
          resolve(content);
      });
    });
  
  }

  async loadUrl(fileLocation) {

    try {
      const res = await fetch(fileLocation);
      const content = await res.text();

      return content;
    } catch(e) {
      throw new Error(`
        Something went wrong while trying to load the document with a URL.
        Please make sure the URL is correct and try again.
      `);
    }

  }

}