const PORT = 80;

const http = require('http');
const app = require('express')();

const SearchServer = require('./src/SearchServer');
const MongoClient = require('mongodb').MongoClient;

let dbConnection = null;
let db = null;
let reverseIndexCollection = null;

app.get(
  '/search',
  async (req, res) => {
    if (!req.query.q) {
      return res
        .status(204)
        .json({ docs: [] })
    }

    let wordDocuments = [];
    let docs = [];
    try {
      docs = (await SearchServer.doSearch(req.query.q, reverseIndexCollection));
    }
    catch (e) {
      return res
        .status(500)
        .json({ docs, message: e.toString() });
    }

    return res
      .status(200)
      .json({
        docs
      });
  }
);

http.createServer(app)
  .listen(
    PORT,
    async (err) => {
      if (err) { return console.error(`Search server encountered error: ${err}`); }

      try {

        dbConnection = await MongoClient.connect('mongodb://localhost:27017');
        db = await dbConnection.db('riw');
        reverseIndexCollection = await db.collection('reverse-index');

      } catch (e) {

        return console.error(e);

      }
      console.log(`Search server running on port ${PORT}`);
    });


