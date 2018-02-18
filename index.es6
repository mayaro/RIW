const DocumentLoader    = require('./DocumentLoader.es6');
const MetadataExtractor = require('./MetadataExtractor.es6');
const fs                = require('fs');

new DocumentLoader().loadUrl(`https://en.wikipedia.org/wiki/Computer_science2`)
  .then(content => {
    const metadata = new MetadataExtractor(content).parse();

    fs.writeFileSync('metadata.json', JSON.stringify(metadata));
  }, (err) => { console.error(err); });