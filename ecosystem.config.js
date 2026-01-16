module.exports = {
  apps: [
    {
      name: 'payment-api',
      script: 'backend/src/server.js',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'payment-workers',
      script: 'backend/src/workers/index.js',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
