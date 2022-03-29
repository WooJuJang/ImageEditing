const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['source-map-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  ignoreWarnings: [/Failed to parse source map/],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
