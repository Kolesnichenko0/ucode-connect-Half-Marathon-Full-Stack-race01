const mysql = require('mysql2/promise');
const config = require('./config.json');

// Create a connection pool
const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit
});

// Export the pool for use in other modules
module.exports = pool;
