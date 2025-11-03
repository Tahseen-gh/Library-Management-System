const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./library.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to database');
});

const sql = fs.readFileSync('./LOAD_THIS_test_data.sql', 'utf8');

// Split by semicolons and execute each statement
const statements = sql.split(';').filter(stmt => stmt.trim());

db.serialize(() => {
  statements.forEach((statement, index) => {
    if (statement.trim()) {
      db.run(statement, (err) => {
        if (err) {
          console.error(`Error on statement ${index + 1}:`, err.message);
        } else {
          console.log(`✓ Statement ${index + 1} executed`);
        }
      });
    }
  });
  
  // Verify after all statements
  setTimeout(() => {
    db.all("SELECT COUNT(*) as count FROM PATRONS", (err, rows) => {
      if (err) {
        console.error('Error checking patrons:', err);
      } else {
        console.log(`\n✅ SUCCESS! ${rows[0].count} patrons loaded`);
        console.log('\n🎯 USE THESE IDs TO TEST:');
        console.log('   Patron ID: patron-001');
        console.log('   Item ID: copy-001');
      }
      db.close();
    });
  }, 1000);
});