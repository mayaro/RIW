module.exports = exports = {

  /**
   * Create the direct index of a file given it's read stream
   *
   * @param { ReadStream } fileStream
   * @return {Promise<any>}
   *
   * @type { function }
   * @exports
   */
  createDirectIndexFromFileStream: function createDirectIndexFromString(fileStream) {
    return new Promise((resolve, reject) => {

      let index = {};

      let receivedString = '';

      fileStream.on('end', () => {
        if (receivedString && receivedString.length) {
          const splittedChunk = receivedString.split(/\s+/);

          index = createIndexFromSplittedChunk(splittedChunk);
        }

        return resolve(index);
      });

      fileStream.on('data', chunk => {
        receivedString += chunk.toString();
        const splittedChunk = receivedString.split(/\s+/);

        index = createIndexFromSplittedChunk(index, splittedChunk);

        receivedString = splittedChunk[splittedChunk.length];
      });

      fileStream.on('error', err => reject(err));

    });
  },

  createReverseIndex: async function createReverseIndex(files) {

    const reverseIndexObject = {};

    files.forEach(([file, properties]) => {

      const directIndex = require(properties.directIndex)[file];

      for (const [word, numberOfAppearances] of Object.entries(directIndex)) {

        reverseIndexObject[word] = reverseIndexObject[word] || {};
        reverseIndexObject[word][file] = numberOfAppearances;

      }

    });

    return reverseIndexObject;

  }

};

/**
 * Create the direct index of a given string chunk by concatenating entries to a already existing index.
 *
 * @param { object } indexObject
 * @param {string} splittedChunk
 *
 * @return { object }
 *
 * @type { function }
 */
const createIndexFromSplittedChunk = function createIndexFromSplittedChunk(indexObject, splittedChunk) {
  const newIndexObject = JSON.parse(JSON.stringify(indexObject));

  for (let idx = 0; idx < splittedChunk.length - 1; ++idx) {

    if (!splittedChunk[idx] || !splittedChunk[idx].length || splittedChunk[idx].length <= 3 ) continue;

    newIndexObject[splittedChunk[idx]] = newIndexObject[splittedChunk[idx]] ?
      ++newIndexObject[splittedChunk[idx]] : 1;

  }

  return newIndexObject;
};