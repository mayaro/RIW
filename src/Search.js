/**
 * The boolean operations for searching
 */
const Operations = Object.freeze({
  /**
   * @param { Array<string> } results
   * @param { Array<string> } currentWordDocumentNames
   * @returns { Array<string> }
   */
  AND:  (results, currentWordDocumentNames) =>
    results.filter(doc => currentWordDocumentNames.includes(doc)),

  /**
   * @param { Array<string> } results
   * @param { Array<string> } currentWordDocumentNames
   * @returns { Array<string> }
   */
  OR:   (results, currentWordDocumentNames) =>
    results.concat(currentWordDocumentNames),

  /**
   * @param { Array<string> } results
   * @param { Array<string> } currentWordDocumentNames
   * @returns { Array<string> }
   */
  NOT:  (results, currentWordDocumentNames) =>
    results.filter(doc => !currentWordDocumentNames.includes(doc)),

});

/**
 * Check whether the given keyword is present in the list of accepted operations
 *
 * @param { string } keyword
 * @returns { boolean }
 */
const isSearchKeyword = function isSearchKeyword(keyword) {
 return !!Operations[keyword.toUpperCase()];
};

/**
 * @param { Object } reverseIndexCollection
 * @param { string } word
 * @returns { Array<string> }
 */
const getDocumentNamesForWord = async function(reverseIndexCollection, word) {
  return await reverseIndexCollection.findOne({ word }).documents;
};

module.exports = exports = {
  Operations,
  isSearchKeyword,
  getDocumentNamesForWord,
};
