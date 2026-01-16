const path = require('path');

module.exports = {
  entry: './checkout-widget/src/sdk/PaymentGateway.js',
  output: {
    path: path.resolve(__dirname, 'checkout-widget/dist'),
    filename: 'checkout.js',
    library: 'PaymentGateway',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};