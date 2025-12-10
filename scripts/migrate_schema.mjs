import db from '../database/database.js';

async function migrateSchema() {
  try {
    console.log('Connecting to database...');
    const conn = await db.getConnection();
    conn.release();
    console.log('Database connected.\n');

    // Disable foreign key checks temporarily
    await db.query("SET FOREIGN_KEY_CHECKS = 0");

    // ========================================
    // PROJECTS TABLE
    // ========================================
    console.log('Modifying PROJECTS table...');
    
    // Add new columns to projects
    const projectColumns = [
      { name: 'deadline', query: `ALTER TABLE projects ADD COLUMN deadline DATE NULL AFTER description` },
      { name: 'client', query: `ALTER TABLE projects ADD COLUMN client VARCHAR(255) NULL AFTER status` },
      { name: 'manager', query: `ALTER TABLE projects ADD COLUMN manager VARCHAR(255) NULL AFTER client` }
    ];

    for (const col of projectColumns) {
      try {
        await db.query(col.query);
        console.log(`  ✓ Added column: ${col.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⊘ Column ${col.name} already exists`);
        } else {
          throw err;
        }
      }
    }

    // ========================================
    // WORKERS TABLE
    // ========================================
    console.log('\nModifying WORKERS table...');
    
    // Check if position column exists, if not add it
    try {
      await db.query(`ALTER TABLE workers ADD COLUMN position VARCHAR(100) NULL AFTER name`);
      console.log('  ✓ Added column: position');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  ⊘ Column position already exists');
      } else {
        throw err;
      }
    }

    // ========================================
    // JOBS TABLE
    // ========================================
    console.log('\nModifying JOBS table...');
    
    // Add worker_id if it doesn't exist
    try {
      await db.query(`ALTER TABLE jobs ADD COLUMN worker_id INT NULL AFTER project_id`);
      console.log('  ✓ Added column: worker_id');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  ⊘ Column worker_id already exists');
      } else {
        throw err;
      }
    }

    // Add modified start/end times
    const jobColumns = [
      { name: 'modified_start', query: `ALTER TABLE jobs ADD COLUMN modified_start DATETIME NULL AFTER actual_end` },
      { name: 'modified_end', query: `ALTER TABLE jobs ADD COLUMN modified_end DATETIME NULL AFTER modified_start` }
    ];

    for (const col of jobColumns) {
      try {
        await db.query(col.query);
        console.log(`  ✓ Added column: ${col.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⊘ Column ${col.name} already exists`);
        } else {
          throw err;
        }
      }
    }

    // Remove title column (not in new schema)
    try {
      await db.query(`ALTER TABLE jobs DROP COLUMN title`);
      console.log('  ✓ Removed column: title');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ⊘ Column title does not exist');
      } else {
        throw err;
      }
    }

    // Remove approver_id and comments from jobs (moved to approvals)
    try {
      await db.query(`ALTER TABLE jobs DROP COLUMN approver_id`);
      console.log('  ✓ Removed column: approver_id');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ⊘ Column approver_id does not exist');
      } else {
        throw err;
      }
    }

    try {
      await db.query(`ALTER TABLE jobs DROP COLUMN comments`);
      console.log('  ✓ Removed column: comments');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ⊘ Column comments does not exist');
      } else {
        throw err;
      }
    }

    // ========================================
    // APPROVALS TABLE
    // ========================================
    console.log('\nModifying APPROVALS table...');
    
    // Remove status and approved_at columns (simplified)
    try {
      await db.query(`ALTER TABLE approvals DROP COLUMN status`);
      console.log('  ✓ Removed column: status');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ⊘ Column status does not exist');
      } else {
        throw err;
      }
    }

    try {
      await db.query(`ALTER TABLE approvals DROP COLUMN approved_at`);
      console.log('  ✓ Removed column: approved_at');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ⊘ Column approved_at does not exist');
      } else {
        throw err;
      }
    }

    // Re-enable foreign key checks
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log('\n✅ Schema migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

migrateSchema();
