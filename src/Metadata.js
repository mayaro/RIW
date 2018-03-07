const cheerio  = require('cheerio');
const fs = require('fs');

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
   * @return { string }
   */
  extractTextSync: function extractText(filePath) {

    const rawContent = fs.readFileSync(filePath).toString();
    const select = cheerio.load(rawContent);

    const metaContent = getMetaFromText(rawContent);

    const parsedContent = select('html *')
      .toArray()
      .reduce((acc, current) => {
          const tagText = select(current).text();
          const normalizedText = removeNonAlphasFromString(tagText);
          const casedText = normalizedText.toLowerCase();

          return `${acc} ${casedText}`;
        },
        '');

    return `${parsedContent} ${metaContent}`;

  },

};

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
  );

};