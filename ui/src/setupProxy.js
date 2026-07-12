const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Proxy to local sandbox (for local dev)
  app.use(
    '/v1',
    createProxyMiddleware({
      target: 'http://127.0.0.1:7575',
      changeOrigin: true,
      ws: true,
    })
  );

  // Proxy to DevNet (to avoid CORS)
  app.use(
    '/devnet',
    createProxyMiddleware({
      target: 'https://ledger-api.validator.devnet.sandbox.fivenorth.io',
      changeOrigin: true,
      pathRewrite: { '^/devnet': '' },
      secure: true,
    })
  );
};