const stem = require('stem-porter');
const SearchHelper = require('./Search');

/**
 * Execute a search operation over the reverse-index collection for a given query string
 *
 * @param { string } searchQueryString
 * @returns { Array<string> }
 */
const doSearch = async function doBooleanSearch(searchQueryString, reverseIndexCollection) {

  const searchString = searchQueryString.toLowerCase();
  const searchParams = searchString.split(' ');

  let response = [];
  let queryTerms = [];
  for (let index = 0; index < searchParams.length; ++index) {

    if (SearchHelper.isSearchKeyword(searchParams[index])) {
      ++index;
      continue;
    }

    let queryTerm = processSearchTerm(searchParams[index]);
    if (queryTerm) queryTerms.push(queryTerm);
  }

  try {
    const results = await reverseIndexCollection.find({ word: { $in: queryTerms } }, { _id: 0 })
      .toArray();
    return results;
  } catch(e) {
    console.error(e);
    return [];
  }

};

module.exports = exports = {
  doSearch: doSearch
};

const processSearchTerm = function processSearchTerm(term) {
  return stem(term.toLocaleLowerCase());
};
