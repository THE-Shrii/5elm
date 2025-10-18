// Advanced SQL Server Connection Diagnostic
require('dotenv').config();
const sql = require('mssql');

async function diagnoseConnection() {
  console.log('🔍 SQL Server Connection Diagnostics\n');
  console.log('📋 Configuration:');
  console.log(`   Server: ${process.env.SQL_SERVER}`);
  console.log(`   User: ${process.env.SQL_USER}`);
  console.log(`   Database: ${process.env.SQL_DATABASE}`);
  console.log(`   Encrypt: ${process.env.SQL_ENCRYPT}`);
  console.log(`   Trust Certificate: ${process.env.SQL_TRUST_CERT}\n`);

  // Try different connection configurations
  const configurations = [
    {
      name: 'Config 1: Default port, no encryption',
      config: {
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
      }
    },
    {
      name: 'Config 2: With default port 1433',
      config: {
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        server: process.env.SQL_SERVER,
        port: 1433,
        database: process.env.SQL_DATABASE,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
      }
    },
    {
      name: 'Config 3: With encryption enabled',
      config: {
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        options: {
          encrypt: true,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
      }
    },
    {
      name: 'Config 4: Using instance name format',
      config: {
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        server: process.env.SQL_SERVER,
        database: 'master', // Try master database
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
          useUTC: false,
        },
      }
    },
  ];

  for (const { name, config } of configurations) {
    console.log(`\n🧪 Trying ${name}...`);
    try {
      const pool = await sql.connect(config);
      console.log('✅ Connection successful!');
      
      // Try a simple query
      const result = await pool.request().query('SELECT @@VERSION AS version, DB_NAME() AS database');
      console.log('   Version:', result.recordset[0].version.split('\n')[0]);
      console.log('   Database:', result.recordset[0].database);
      
      await pool.close();
      console.log('✅ This configuration works!\n');
      console.log('Use this configuration in your .env file:');
      console.log(JSON.stringify(config, null, 2));
      return;
    } catch (error) {
      console.log('❌ Failed:', error.message);
      if (error.code) {
        console.log('   Error Code:', error.code);
      }
    }
  }

  console.log('\n❌ All connection attempts failed.');
  console.log('\n💡 Possible issues:');
  console.log('   1. Server might not be accessible from your network');
  console.log('   2. Firewall might be blocking the connection');
  console.log('   3. SQL Server might not be configured for remote connections');
  console.log('   4. Username/password might be incorrect');
  console.log('   5. User might not have permission for the specified database');
  console.log('\n📝 Suggestions:');
  console.log('   - Verify the server IP and port are correct');
  console.log('   - Check if SQL Server allows remote connections');
  console.log('   - Ensure SQL Server Authentication is enabled');
  console.log('   - Try connecting with SQL Server Management Studio first');
  console.log('   - Check firewall settings on both client and server');
}

diagnoseConnection();
