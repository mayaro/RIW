const ReverseIndexFilePath = './reverse-index/reverse-index.json';

const searchArguments = process.argv.slice(2);
if (!searchArguments.length) {
  console.error(`
    No search query string was passed, exiting
  `);
  process.exit(2);
}

const searchString = searchArguments.join(' ').toLowerCase();
const searchParams = searchString.split(' ');

const reverseIndex = require(ReverseIndexFilePath);
if (!reverseIndex) {
  console.error(`
    Could not direct index at path: ${ReverseIndexFilePath}
  `);
  process.exit(1);
}

const SearchHelper = require('./src/Search');

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

console.log(response);


