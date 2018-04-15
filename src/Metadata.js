const cheerio  = require('cheerio');
const fs = require('fs');
const stem = require('stemmer');
const stopwords = require('./StopWords.json');
const exceptions = require('./Exceptions.json');

/**
 * Module that handles metadata extraction from texts.
 *
 * @exports
 */
module.exports = exports = {

  /**
   * Extract the text required by the indexing stages by:
   *  - eliminating html tags, stop-words or words that contain less than a specified number of characters but
   * keeping the words that can be exceptions,
   *  - converting the text to lowercase
   *
   * @param { string } filePath
   * @return { Promise }
   */
  extractTextSync: function extractText(filePath) {
    return new Promise((resolve, reject) => {
      const rawContent = fs.readFile(filePath, (err, rawContent) => {
        if (err) {
          return reject(err);
        }

        const select = cheerio.load(rawContent);

        const metaContent = removeUnwantedWords(
          removeNonAlphasFromString(
            getMetaFromText(rawContent)
          )
        );

        const parsedContent = select('html *')
          .toArray()
          .reduce((acc, current) => {
              const tagText = select(current).text();
              const normalizedText = removeUnwantedWords(
                removeNonAlphasFromString(tagText)
              );
              const casedText = normalizedText.toLowerCase();

              return `${acc} ${casedText}`;
            },
            '');

        return resolve({
          rawContent,
          parsedContent: removeNonAlphasFromString(`${parsedContent} ${metaContent}`)
        });
      })
    });
  },

};

// Only the selectors declared here will be concatenated to the extracted text
const MetaSelectors = [
  `meta[name="robots"]`,
  `meta[name="description"]`,
  `meta[name="keywords"]`,
];

/**
 * Remove non-alphanumeric characters from a given string
 *
 * @param { string } str
 * @return { string | void | * }
 *
 * @type { function }
 */
const removeNonAlphasFromString = str => str.replace(/\W+/g, ' ');

/**
 * Remove the unwanted words from a text.
 * The words
 *
 * @param { string } text
 * @return { string }
 *
 * @type { function }
 */
const removeUnwantedWords = text => {
  return text.split(/\s+/)
    .reduce((acc, word) => {
      if (!word || !word.length) return acc;

      if (exceptions[word]) return `${acc} ${stem(word)}`;

      if (!word || !word.length || word.length <= 2) return acc;

      if (stopwords[word]) return acc;

      return `${acc} ${stem(word)}`;
    }, '')
};

/**
 * Extract the meta attributes from a given html document if they exist
 *
 * @param { string } rawContent
 * @return { string }
 *
 * @type { function }
 */
const getMetaFromText = function getMetaFromText(rawContent) {

  const select = cheerio.load(rawContent);

  return MetaSelectors.reduce(
    (acc, currentSelector) => {
      const metaElement = select(currentSelector).toArray()[0];

      if (metaElement &&
        metaElement.attribs &&
        metaElement.attribs.content &&
        typeof metaElement.attribs.content === 'string') {

        return acc + removeNonAlphasFromString(
          metaElement.attribs.content
        ).toLowerCase();

      }
    },
    ''
  ) || '';

};
