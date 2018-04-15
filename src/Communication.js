const { fork } = require('child_process');
const readline = require('readline');
const AvailableCPUs = require('os').cpus().length - 1;

let numberOfDocumentsToIndex = null;

module.exports = exports = {

  /**
   * Initialize workers and return a array of handlers for them.
   *
   * @param { string } filename The absolute path ot the file that contains the code for the child processes.
   * @param { number|undefined } [count=AvailableCPUs] The number of child processes that will be started.
   *  If not provided, the number of CPU cores decremented by 1 (master thread) will be used.
   *
   * @return { Array<ChildProcess> }
   */
  InitializeWorkers: async function InitializeWorkers(filename, count = AvailableCPUs) {
    // Created as async function to better make use of promise chaining in the master code file.

    const workers = [];

    for (let i = 0; i < count; ++i) {
      workers.push(
        fork(filename, [], {
          "execArgv": [`--inspect-brk=${Math.floor(Math.random() * (65000 - 20000) + 20000)}`]
        })
      );
    }

    return workers;

  },

  /**
   * Ensure that the workers are closed before exiting the script.
   *
   * @param { ChildProcess[] } workers
   * @return { Boolean }
   */
  ExitWorkers: async function ExitWorkers(workers) {
    for (let worker of workers) {

      await worker.kill('SIGINT');

    }

    return true;
  },

  /**
   * Handle master thread communication by receiving and sending jobs from and to workers.
   *
   * @param { ChildProcess[] } workers
   * @param { string[] } jobItems
   * @param { string } jobtype The type of job, as in 'text_processing' or 'direct_index'
   */
  HandleJob: function HandleJob(workers, jobItems, jobtype) {
    const remainingJobItems = [ ...jobItems ];

    let processedJobItems = [];
    let busyWorkers = [];
    let progress = 0;

    if (numberOfDocumentsToIndex === null) {
      numberOfDocumentsToIndex = jobItems.length;
    }

    return new Promise((resolve, _) => {

      // Create message communication events
      for (let worker of workers) {
        worker.on('message', message => onWorkerMessage(message, worker));

        const name = remainingJobItems.pop();
        busyWorkers.push(worker);
        sendWorkerMessage({ type: jobtype, name, numberOfDocumentsToIndex }, worker);
      }

      /**
       * Handle worker message incoming event.
       *
       * @param { string|object|any } message
       * @param { ChildProcess } worker
       */
      function onWorkerMessage(message, worker) {
        // Remove the current worker from the busy-marked array
        busyWorkers = busyWorkers.filter(w => w.pid !== worker.pid);

        processedJobItems = processedJobItems.concat(message.jobs.filter(j => processedJobItems.indexOf(j) === -1));

        if (remainingJobItems.length) {
          busyWorkers.push(worker);

          const name = remainingJobItems.pop();
          sendWorkerMessage({ type: jobtype, name, numberOfDocumentsToIndex }, worker);
        }

        if (remainingJobItems.length === 0 && busyWorkers.length === 0) {
          // Remove the listeners for the workers to be used again in other processing steps.
          workers.forEach(w => w.removeAllListeners());

          console.log();
          return resolve({ workers, jobs: processedJobItems });
        }
      }

      /**
       * Send a file to be processed by a worker
       *
       * @param {{ type: string, name: string }} message
       * @param { ChildProcess } worker
       */
      function sendWorkerMessage(message, worker) {
        worker.send(message);

        let newProgress = Math.floor((jobItems.length - remainingJobItems.length) / jobItems.length * 100);
        progress = showProgress(progress, newProgress, jobtype, jobItems.length);
      }
    });
  }

};

const showProgress = function showProgress(progress, newProgress, jobType, numberOfJobItems) {
  if (newProgress !== progress) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${jobType}: ${newProgress}%, ${numberOfJobItems}`);

    return newProgress;
  }

  return progress;
};
