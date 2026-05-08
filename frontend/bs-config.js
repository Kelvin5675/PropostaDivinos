module.exports = {
  port: 3001,
  server: {
    baseDir: "src",
    middleware: {
      0: function(req, res, next) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
      }
    }
  },
  ghostMode: false
};
