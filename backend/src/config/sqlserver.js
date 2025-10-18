const sql = require('mssql');

let pool = null;

const sqlConfig = {
  user: process.env.SQL_USER || 'FiveELMUser',
  password: process.env.SQL_PASSWORD || 'FiveELM@@2017##',
  server: process.env.SQL_SERVER || '103.174.102.61',
  database: process.env.SQL_DATABASE || 'FiveELMECommerce', // ✅ use your actual DB
  options: {
    encrypt: false, // ✅ matches VS Code config
    trustServerCertificate: true, // ✅ must be true for your server
    enableArithAbort: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function connectSQLServer() {
  try {
    if (pool) {
      console.log('🔁 SQL Server connection already established.');
      return pool;
    }

    console.log(`🔌 Connecting to SQL Server at ${sqlConfig.server}...`);

    pool = await sql.connect(sqlConfig);
    const versionResult = await pool.request().query('SELECT @@VERSION AS version');

    console.log('✅ SQL Server Connected Successfully!');
    console.log(`🗄️ Database: ${sqlConfig.database}`);
    console.log(`👤 User: ${sqlConfig.user}`);
    console.log('🧩 Version:', versionResult.recordset[0].version.split('\n')[0]);

    // Handle connection pool errors
    pool.on('error', err => console.error('❌ SQL Pool Error:', err));
    return pool;
  } catch (error) {
    console.error('❌ SQL Server connection failed:', error.message);
    console.log('💡 Please check if your IP is whitelisted and port 1433 is open.');
    return null;
  }
}

async function closeSQLConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✅ SQL Server connection closed.');
    }
  } catch (error) {
    console.error('❌ Error closing SQL Server connection:', error.message);
  }
}

module.exports = {
  sql,
  connectSQLServer,
  closeSQLConnection,
};
