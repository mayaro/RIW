/**
 * @author Ștefan Muraru <muraru.stefaan@gmail.com>
 * @description 
 * Module that provides the neccessary functionality for extracting metadata from HTML documents.
 */

const cheerioApi  = require('cheerio');

const metadataSelectors = [
  'meta[name="keywords"]',
  'meta[name="description"]',
  'meta[name="robots"]',
];

/**
 * Metadata class object
 * 
 * @private
 * @class Metadata
 */
class Metadata {
  
  /**
   * Creates an instance of Metadata.
   * 
   * @memberof Metadata
   */
  constructor() {
    this.title = null;
    this.meta = new Object();
    this.links = new Array();
    this.body = '';
  }

}

/**
 * Service used to extract metadata from documents
 * 
 * @class MetadataExtractor
 * @exports
 */
module.exports = exports = class MetadataExtractor {

  /**
   * Creates an instance of MetadataExtractor.
   * 
   * @param { String } content
   * @memberof MetadataExtractor
   */
  constructor(content) {
    if (typeof content !== 'string' ||
      content.length === 0) {
      throw new Error(`
        MetadataExtractor constructor(content):
        The given content argument is either not a string or is an empty one.
        Please ensure that you provide a valid content parameter.
      `);
    }

    this.content = content;
    this.metadata = new Metadata();
  }

  /**
   * Parse the document content that was provided and return a object containing the extracted metadata
   * 
   * @memberof MetadataExtractor
   */
  parse() {
    // Initialize cheerio with the current document content.
    const cheerio = cheerioApi.load(this.content);

    // Load metadata tags
    // The selectors for the meta tags should be specified in the metadataSelectors object
    metadataSelectors.reduce((accumulator, currentSelector) => {
      const key = currentSelector.split('"')[1];
      const value = cheerio(currentSelector).attr('content') || null;

      if (value) {
        accumulator[key] = value;
      }
    }, this.metadata['meta'] = new Object());

    // Load the title of the document
    this.metadata['title'] = cheerio('title').text() || null;

    cheerio('body *')
      .toArray()
      .forEach((current) => {

        const normalizedTagContent = cheerio(current)
          .text()
          .replace(new RegExp(/^\w+( +\w+)*$|\[.*?\]/g), '')
          .replace(new RegExp(/[\s]+/g), ' ');

        this.metadata['body'] += ` ${normalizedTagContent} `;

        if (current.tagName.toLowerCase() === 'a') {
          const url = cheerio(current).attr('href') || null;
          // Ensure that the URL is not null and not a document anchor
          if (url === null || url.startsWith('#')) return;
          
          this.metadata['links'].push(url);
        }

      });

    return this.metadata;
  }

}