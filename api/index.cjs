/**
 * Vercel Serverless Function entry point
 * Directs /api/* requests to the Express application
 */
const app = require('../server/index.js');
module.exports = app;
