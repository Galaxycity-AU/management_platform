import db from '../models/database.js';

async function verify() {
  try {
    const conn = await db.getConnection();
    
    const [workers] = await conn.query('SELECT * FROM workers LIMIT 3');
    const [projects] = await conn.query('SELECT * FROM projects LIMIT 3');
    const [jobs] = await conn.query('SELECT * FROM jobs LIMIT 3');
    const [approvals] = await conn.query('SELECT * FROM approvals LIMIT 3');
    
    console.log('\n=== WORKERS (showing 3 of 20) ===');
    console.table(workers);
    
    console.log('\n=== PROJECTS (showing 3 of 8) ===');
    console.table(projects);
    
    console.log('\n=== JOBS (showing 3 of 80) ===');
    console.table(jobs);
    
    console.log('\n=== APPROVALS (showing 3 of 45) ===');
    console.table(approvals);
    
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

verify();
