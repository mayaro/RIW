const InputDirectory = 'samples';

const Communication = require('./src/Communication');
const FileOperations = require('./src/Files');

// Get the number of available CPU cores to start the exact number of worker processes.
const AvailableCPUCores = require('os').cpus().length - 1;
console.log(`Available CPU cores: ${AvailableCPUCores}`);

// Get the ".html" filenames in the input directory
const dirFiles = FileOperations.getFilesInDirectory(
  InputDirectory,
  filename => filename.endsWith('.html')
);

if (!dirFiles.length) {
  console.error(`Could not find any input files in directory ${InputDirectory}. Exiting...`);
  process.exit(4);
}

Communication.InitializeWorkers('child.js')
  .then(workers => Communication.HandleJob.call(null, workers, dirFiles, 'text_processing'))
  .then(({ workers, jobs: files }) => Communication.HandleJob.call(null, workers, files, 'direct_index'))
  .then(({ workers, jobs: words }) => Communication.HandleJob.call(null, workers, words, 'reverse_index'))
  .then(({ workers }) => Communication.ExitWorkers.call(null, workers))
  .then(_ => { console.log('Threads exited...'); });
