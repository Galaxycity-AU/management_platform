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

    // Add approval_id to jobs (to reference the approval with modified times)
    try {
      await db.query(`ALTER TABLE jobs ADD COLUMN approval_id INT NULL AFTER actual_end`);
      console.log('  ✓ Added column: approval_id');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  ⊘ Column approval_id already exists');
      } else {
        throw err;
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

    // Modify approver_id to allow NULL (for scheduled, active, and waiting_approval status)
    try {
      await db.query(`ALTER TABLE approvals MODIFY COLUMN approver_id INT NULL`);
      console.log('  ✓ Modified column: approver_id to allow NULL');
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        console.log('  ⊘ Column approver_id does not exist');
      } else {
        console.log(`  ⚠ Could not modify approver_id: ${err.message}`);
      }
    }

    // Add modified_start and modified_end to approvals
    const approvalColumns = [
      { name: 'modified_start', query: `ALTER TABLE approvals ADD COLUMN modified_start DATETIME NULL AFTER comments` },
      { name: 'modified_end', query: `ALTER TABLE approvals ADD COLUMN modified_end DATETIME NULL AFTER modified_start` }
    ];

    for (const col of approvalColumns) {
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
    // DATA MIGRATION: Move modified times from jobs to approvals
    // ========================================
    console.log('\nMigrating data: Moving modified_start/modified_end from jobs to approvals...');
    
    try {
      // Get all jobs with modified_start or modified_end
      const [jobsWithModified] = await db.query(
        `SELECT id, modified_start, modified_end FROM jobs 
         WHERE modified_start IS NOT NULL OR modified_end IS NOT NULL`
      );

      if (jobsWithModified.length > 0) {
        console.log(`  Found ${jobsWithModified.length} jobs with modified times to migrate`);
        
        for (const job of jobsWithModified) {
          // Check if there's already an approval for this job
          const [existingApprovals] = await db.query(
            `SELECT id FROM approvals WHERE job_id = ? LIMIT 1`,
            [job.id]
          );

          if (existingApprovals.length > 0) {
            // Update existing approval with modified times
            await db.query(
              `UPDATE approvals SET modified_start = ?, modified_end = ? WHERE id = ?`,
              [job.modified_start, job.modified_end, existingApprovals[0].id]
            );
            // Link job to this approval
            await db.query(
              `UPDATE jobs SET approval_id = ? WHERE id = ?`,
              [existingApprovals[0].id, job.id]
            );
          } else {
            // Create new approval with modified times
            // We need an approver, so we'll use a default or find one
            const [workers] = await db.query(`SELECT id FROM workers LIMIT 1`);
            if (workers.length > 0) {
              const [result] = await db.query(
                `INSERT INTO approvals (job_id, approver_id, comments, modified_start, modified_end)
                 VALUES (?, ?, ?, ?, ?)`,
                [job.id, workers[0].id, 'Migrated from job modified times', job.modified_start, job.modified_end]
              );
              // Link job to this approval
              await db.query(
                `UPDATE jobs SET approval_id = ? WHERE id = ?`,
                [result.insertId, job.id]
              );
            }
          }
        }
        console.log(`  ✓ Migrated ${jobsWithModified.length} jobs`);
      } else {
        console.log('  ⊘ No jobs with modified times to migrate');
      }
    } catch (err) {
      console.error('  ⚠ Error during data migration:', err.message);
      // Continue anyway
    }

    // ========================================
    // REMOVE modified_start/modified_end from JOBS
    // ========================================
    console.log('\nRemoving modified_start/modified_end from JOBS table...');
    
    try {
      await db.query(`ALTER TABLE jobs DROP COLUMN modified_end`);
      console.log('  ✓ Removed column: modified_end');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ⊘ Column modified_end does not exist');
      } else {
        throw err;
      }
    }

    try {
      await db.query(`ALTER TABLE jobs DROP COLUMN modified_start`);
      console.log('  ✓ Removed column: modified_start');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('  ⊘ Column modified_start does not exist');
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
