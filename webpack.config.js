module.exports = {
  resolve: {
    extensions: ['.js'],
    alias: {
      '@': path.resolve(__dirname, 'app'),
      'App': path.resolve(__dirname, 'app'),
    },
  },
}
