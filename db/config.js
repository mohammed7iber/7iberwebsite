// db/config.js
// This file contains your database configuration settings

const dbConfig = {
    development: {
      client: 'mysql2', // You can change this to postgres, sqlite3, mssql, etc.
      connection: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'business_website_dev',
        charset: 'utf8'
      },
      pool: {
        min: 2,
        max: 10
      },
      migrations: {
        directory: './migrations',
        tableName: 'knex_migrations'
      },
      seeds: {
        directory: './seeds'
      }
    },
    
    production: {
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
          rejectUnauthorized: false
        }
      },
      pool: {
        min: 2,
        max: 10
      },
      migrations: {
        directory: './migrations',
        tableName: 'knex_migrations'
      }
    }
  };
  
  module.exports = dbConfig;