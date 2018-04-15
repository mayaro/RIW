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
    let docs = [];
    const results = (await reverseIndexCollection.find({ word: { $in: queryTerms } }, { _id: 0 })
      .toArray()).map(w => {
        w.documents.forEach(d => {
          if (docs.indexOf(d.name) === -1) docs.push(d.name);
        })
    });

    let vectors = (await reverseIndexCollection.aggregate([
      { $unwind: "$documents" },
      { $match: { "documents.name": { $in: docs }}},
      { $unwind: "$documents" },
      { $project: { "name": "$documents.name", "tfidf": "$documents.tfidf", "word": 1 }},
      { $group: {
          _id: { name: "$name" },
          mod: { $sum: { $multiply: [ "$tfidf", "$tfidf"] }},
        }},
      { $project: { "name": "$_id.name", "mod": { $sqrt: "$mod" } }}
    ]).toArray());

    return vectors;
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
