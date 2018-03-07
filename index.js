const Files = require('./src/Files');
const Metadata = require('./src/Metadata');
const Indexes = require('./src/Indexes');
const path = require('path');

const files = {};

const InputDirectory = './samples';
const DirectIndexDirectory = './direct-index';
const ReverseIndexDirectory = './reverse-index';
const ChunkSize = 5;

/**
 * Wrap the body of the index in a function to be able to execute the steps,
 * text-parsing, direct-indexing and reverse-indexing in a series manner
 */
(async () => {
const inputFilenames = Files.getFilesInDirectory(
  InputDirectory,
  filename => filename.endsWith('.html')
);
console.log();

/**
 * Normalize a HTML file:
 * - remove all tags
 * - remove all non-alphanumeric characters
 * - concatenate meta attributes to the text
 * - normalize the casing (lowercase)
 * and write the resulting text in a file with the extension .normalized
 */
for (const [index, inputFilename] of inputFilenames.entries()) {
  process.stdout.write(`\rExtracting text from file: ${index + 1} / ${inputFilenames.length}`);

  const normalizedText = Metadata.extractTextSync(inputFilename);
  const normalizedFilename = `${inputFilename}.normalized`;

  Files.writeFileSync(normalizedFilename, normalizedText);
  files[inputFilename] = { normalized: normalizedFilename, 'directIndex': null };
}
console.log('\nText extraction complete.');

/**
 * Create the direct index of a text file
 * The indexes will be grouped in chunks, of ChunkSize size
 * and will be located under DirectIndexDirectory
 */
let index = 1;
let directIndexChunk = {};
let directIndexPromises = [];
Object.entries(files).forEach(
    ([file, properties]) => {
      directIndexPromises.push(new Promise(async (resolve, reject) => {
        const normalizedFileReadStream = Files.getFileStream(properties.normalized);

        const directIndex = await Indexes.createDirectIndexFromFileStream(
          normalizedFileReadStream
        );
        directIndexChunk[file] = directIndex;

        process.stdout.write(`\rCreated direct index for file: ${index} / ${Object.keys(files).length}`);
        properties.directIndex = path.join(process.cwd(), DirectIndexDirectory, `${Math.ceil(index / ChunkSize)}.json`);
        //TODO: Maybe write these paths on the disk ?

        if (index % ChunkSize === 0 || index === Object.keys(files).length) {
          Files.writeFileSync(
            properties.directIndex,
            JSON.stringify(directIndexChunk, null, 4)
          );
          directIndexChunk = {};
        }

        index += 1;

        return resolve();
      }));
  });
await Promise.all(directIndexPromises);
console.log('\nDirect index creation complete.');


/**
 * Create the reverse index of of the input files, from the direct indexes by
 * reverting each file
 * TODO: Apply BSBI, split in stacks of 5 and concatenate them after that
 */
const reverseIndex = await Indexes.createReverseIndex(Object.entries(files));
Files.writeFileSync(
  path.join(process.cwd(), ReverseIndexDirectory, 'reverse-index.json'),
  JSON.stringify(reverseIndex, null, 4)
);
console.log('Reverse index creation complete.');

})();
