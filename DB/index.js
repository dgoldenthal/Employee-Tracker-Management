const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'employee_db',
    password: 'your_password',  // Replace with your actual PostgreSQL password
    port: 5432,
});

module.exports = pool;