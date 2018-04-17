const Metadata = require('./src/Metadata');
const Indexing = require('./src/Indexes');
const MongoClient = require('mongodb').MongoClient;

let dbConnection = null;
let db = null;
let docsCollection = null;
let directIndexCollection = null;
let reverseIndexCollection = null;

process.on('message', async (message, socket) => {

  // Create database connections on first run
  if (dbConnection === null) {
    try {
      dbConnection = await MongoClient.connect('mongodb://localhost:27017');
      db = await dbConnection.db('riw');
      docsCollection = await db.collection('documents');
      directIndexCollection = await db.collection('direct-index');
      reverseIndexCollection = await db.collection('reverse-index');
    } catch (e) {
      console.error(`Process ${process.pid} could not create MongoDB connection, reason: ${e}`);
      process.exit(1);
    }
  }

  // Choose the correct processing stage for the received message
  switch(message.type) {

    case 'text_processing': {

      const filename = message.name.replace(/\\/g, '\\');

      try {
        const {rawContent, parsedContent} = await Metadata.extractTextSync(message.name);

        await docsCollection
          .update({
            name: filename
          }, {
            name: filename,
            rawContent,
            parsedContent
          }, {
            upsert: true
          });
      } catch (e) {
        console.error(`Process ${process.pid} could not add document's ${message.name} contents to db, reason ${e}`);
      }

      return process.send({type: message.type, jobs: [ filename ]});
    }

    case 'direct_index': {
      const filename = message.name.replace(/\\/g, '\\');
      let dbDocument = null;

      try {
        dbDocument = await docsCollection.findOne({name: filename}, {parsedContent: 1});
      } catch (e) {
        console.error(`Process ${process.pid} could not retrieve document's ${message.name} parsed contents from db,
          reason ${e}`)

        return process.send({type: message.type, jobs: [ ]});
      }

      const index = Indexing.createDirectIndexFromText(dbDocument.parsedContent);

      try {
        await directIndexCollection
          .update({
            name: filename
          }, {
            name: filename,
            words: index
          }, {
            upsert: true
          });
      } catch (e) {
        console.error(`Process ${process.pid} could not add document's ${message.name} direct-index to db,
          reason ${e}`);
      }

      return process.send({type: message.type, jobs: index.map(w => w.name)});
    }

    case 'reverse_index': {
      try {
        const pipeline = Indexing.GetReverseIndexingPipelineStages(message.name);

        const results = await directIndexCollection.aggregate(pipeline);
        const docs = await results.toArray();

        if (!docs) {
          console.warn(`Reverse indexing did not return results for word ${message.name}`);
          return process.send({type: message.type, jobs: [ message.name ]});
        }

        const idf = Math.log(message.numberOfDocumentsToIndex / (1 + docs.length));

        const reverseIndex = { word: message.name, reverseFrequency: idf, documents: docs };

        reverseIndex.documents = reverseIndex.documents.map(d => { d.tfidf = d.tf * idf; return d; });
        delete reverseIndex['_id'];

        await reverseIndexCollection
          .update(
            { word: message.name },
            reverseIndex,
            { upsert: true }
          );
      } catch (e) {
        console.error(e);
      }

      return process.send({type: message.type, jobs: [ message.name ]});
    }
  }
});

process.on('beforeExit', async () => {
  if (dbConnection !== null) {
    dbConnection.close();
  }
});

