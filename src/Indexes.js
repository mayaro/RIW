const utf8 = require('utf8');

module.exports = exports = {

  /**
   * Create the direct index for a given text and return it as a array.
   *
   * @param { String } text
   * @return { object[] }
   */
  createDirectIndexFromText: function (text) {
    let words = text.split(/\s+/).sort();

    let index = [];
    let previousWord = null;

    words.forEach(word => {
      if (previousWord === null) {
        previousWord = { name: word, appearances: 1 }

        index.push(previousWord);

        return;
      }

      if (word !== previousWord.name ) {
        previousWord.tf = previousWord.appearances / words.length;

        previousWord = { name: word, appearances: 0 };

        index.push(previousWord);
      }

      previousWord.appearances++;
    });

    return index;
  },

  GetReverseIndexingPipelineStages: function GetReverseIndexingPipelineStages(word) {

    const matchFirstStage = {
      $match: { "words.name": word }
    };

    const unwindStage = {
      $unwind: "$words"
    };

    const matchSecondStage = {
      $match: {
        "words.name": word
      }
    };

    const projectStage = {
      $project: {
        name: 1,
        appearances: "$words.appearances",
        tf: "$words.tf"
      }
    };

    return [ matchFirstStage, unwindStage, matchSecondStage, projectStage ];

  }

};
