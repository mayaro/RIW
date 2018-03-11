const PORT = 80;

const http = require('http');
const app = require('express')();

const SearchServer = require('./src/SearchServer');

app.get(
  '/search',
  (req, res) => {
    if (!req.query.q) {
      return res
        .status(204)
        .json({ docs: [] })
    }

    let documents = [];
    try {
      documents = SearchServer.doBooleanSearch(req.query.q);
    }
    catch (e) {
      return res
        .status(500)
        .json({ docs: [], message: e.toString() });
    }

    return res
      .status(200)
      .json({
        docs: documents
      });
  }
);

http.createServer(app)
  .listen(
    PORT,
    (err) => {
      if (err) { return console.error(`Search server encountered error: ${err}`); }
      console.log(`Search server running on port ${PORT}`);
    });


