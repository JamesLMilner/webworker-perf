var path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/run.js',
  output: {
    path: path.resolve(__dirname, 'docs'),
    filename: 'webworker.bench.bundle.js'
  }
};