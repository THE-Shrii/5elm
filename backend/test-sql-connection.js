// Test SQL Server Connection
require('dotenv').config();
const { connectSQLServer, executeQuery, closeSQLConnection } = require('./src/config/sqlserver');

async function testSQLConnection() {
  console.log('🔍 Testing SQL Server Connection...\n');
  
  try {
    // Connect to SQL Server
    const pool = await connectSQLServer();
    
    if (!pool) {
      console.error('❌ Failed to connect to SQL Server');
      return;
    }

    console.log('\n✅ Connection successful!\n');

    // Test query 1: Get SQL Server version
    console.log('📊 Running test queries...\n');
    const versionResult = await executeQuery('SELECT @@VERSION AS version');
    console.log('Version:', versionResult.recordset[0].version.split('\n')[0]);

    // Test query 2: Get current date/time
    const dateResult = await executeQuery('SELECT GETDATE() AS currentDateTime');
    console.log('Current DateTime:', dateResult.recordset[0].currentDateTime);

    // Test query 3: List databases
    const dbResult = await executeQuery('SELECT name FROM sys.databases ORDER BY name');
    console.log('\n📁 Available Databases:');
    dbResult.recordset.forEach(db => {
      console.log(`   - ${db.name}`);
    });

    // Test query 4: List tables in current database
    const tablesResult = await executeQuery(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    console.log('\n📋 Tables in current database:');
    if (tablesResult.recordset.length === 0) {
      console.log('   No tables found');
    } else {
      tablesResult.recordset.forEach(table => {
        console.log(`   - ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
      });
    }

    console.log('\n✅ All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    // Close connection
    await closeSQLConnection();
  }
}

// Run the test
testSQLConnection();
