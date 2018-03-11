const ReverseIndexFilePath = '../reverse-index/reverse-index.json';

const reverseIndex = require(ReverseIndexFilePath) || null;
if (!reverseIndex) {
  console.error(`
    Could not direct index at path: ${ReverseIndexFilePath}
  `);
}

const SearchHelper = require('../src/Search');

/**
 * Execute a search operation over the reverse-index collection for a given query string
 *
 * @param { string } searchQueryString
 * @returns { Array<string> }
 */
const doBooleanSearch = function doBooleanSearch(searchQueryString) {

  const searchString = searchQueryString.toLowerCase();
  const searchParams = searchString.split(' ');

  let response = [];
  for (let index = 0; index < searchParams.length; ++index) {

    if (SearchHelper.isSearchKeyword(searchParams[index])) {

      // Search string is in a invalid format
      // Multiple consecutive search params, so on
      if (SearchHelper.isSearchKeyword(searchParams[index + 1]) ||
        (index >= 1 && SearchHelper.isSearchKeyword(searchParams[index - 1]))) {

        throw new Error('Malformed search string');

      }

      const documentNames = SearchHelper.getDocumentNamesForWord(
        reverseIndex,
        searchParams[index + 1]
      );
      response = SearchHelper.Operations[searchParams[index].toUpperCase()](
        response,
        documentNames
      );

      continue;
    }

    // First position, add all entries to the result array
    if (index === 0) {
      const documentNames = SearchHelper.getDocumentNamesForWord(
        reverseIndex,
        searchParams[index]
      );

      response = response.concat(documentNames);
    }

  }

  return response;

};

module.exports = exports = {
  doBooleanSearch
};

