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
    const results = {};
    (await reverseIndexCollection.find({ word: { $in: queryTerms } }, { _id: 0 })
      .toArray()).map(w => {
        w.documents.forEach(d => {
          if (docs.indexOf(d.name) === -1) docs.push(d.name);
        });
        results[w.word] = w;
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
    let pathsWithModulus = {};
    vectors.forEach(v => pathsWithModulus[v.name] = v.mod);

    const searchTerms = {};
    queryTerms.forEach(qt => {
      if (!searchTerms[qt]) {
        searchTerms[qt] = {
          count: 0,
          tf: 0,
          idf: results[qt] && results[qt].reverseFrequency ? results[qt].reverseFrequency : 0
        }
      }

      searchTerms[qt].count++;
      searchTerms[qt].tf = searchTerms[qt].count / queryTerms.length;
    });

    const queryMod = Math.sqrt(
      Object.values(searchTerms).reduce((acc, v) => acc + Math.pow(v.tf * v.idf, 2), 0)
    );

    function getVectorTFIDF(path, word) {
      return ((results[word] || {documents: []}).documents.find(pO => pO.name === path) || {}).tfidf || 0;
    }

    return vectors.map(v => {
      const down = (queryMod * pathsWithModulus[v.name]) || 1;
      const up = Object.entries(searchTerms)
        .reduce((acc, [t0, t1]) => acc + t1.tf * t1.idf * getVectorTFIDF(v.name, t0), 0);
      const cos = up / down;

      return {
        name: v.name,
        cos
      };
    }).sort((a, b) => b.cos - a.cos);
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
