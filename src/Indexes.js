module.exports = exports = {

  /**
   * Create the direct index for a given text and return it as a object.
   *
   * @param { String } text
   * @return {{}}
   */
  createDirectIndexFromText: function (text) {
    let words = text.split(/\s+/);
    const index = words
      .reduce((index, word) => {
        if (!word || !word.length) return index;

        index[word] = index[word] ? ++index[word] : 1;
        return index;
      }, {});

    const frequencies = {};
    Object.entries(index).forEach(([key, value]) => {
      frequencies[key] = value / words.length;
    });

    return { index, frequencies };
  },

  GetReverseIndexingPipelineStages: function GetReverseIndexingPipelineStages(word) {

    const unwindStage = {
      "$unwind": "$words"
    };

    const matchStage = {
      $match: {}
    };
    matchStage.$match[`words.${word}`] = { $exists: true };

    const projectStage = {
      $project: {
        _id: 0,
        name: 1,
        appearances: `$words.${word}`,
        frequency: `$frequencies.${word}`
      }
    };

    const groupStage = {
      $group: {
        _id: null,
        documents: {
          $push: {
            name: '$name',
            appearances: '$appearances',
            frequency: '$frequency'
          }
        }
      }
    };

    return [ unwindStage, matchStage, projectStage, groupStage ];

  }

};
