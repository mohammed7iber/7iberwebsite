// db/index.js
// This file exports the database connection

const knex = require('knex');
const dbConfig = require('./config');

// Determine which environment to use
const environment = process.env.NODE_ENV || 'development';
const config = dbConfig[environment];

// Initialize the connection
const db = knex(config);

// Simple function to test the connection
async function testConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('Database connection established successfully!');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

module.exports = {
  db,
  testConnection
};