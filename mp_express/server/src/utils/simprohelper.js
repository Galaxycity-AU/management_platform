import db from '../config/database.js';


// **
//  * Find data by ID in any table
//  * Returns the row or null
//  */
async function findData(table, id) {
    try {
        const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        return rows[0] || null;
    } catch (error) {
        throw new Error(`Error finding data in ${table}: ${error.message}`);
    }
}

async function findJob(id){
    try {
        const [rows] = await db.query(`SELECT * FROM jobs WHERE schedule_id = ?`, [id]);
        return rows[0] || null;
    } catch (error) {
        throw new Error(`Error finding job: ${error.message}`);
    }
}

/**
 * Create data in any table
 * Returns the insert ID
 */
async function createData(table, data) {
    try {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');
        
        const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        const [result] = await db.query(query, values);
        
        return result.insertId;
    } catch (error) {
        throw new Error(`Error creating data in ${table}: ${error.message}`);
    }
}


/**
 * Create project
 */
async function createProject(projectData) {
    try {
        const query = `
            INSERT INTO projects (id, name, customer_id, site_id, project_manager_id, stage, status_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const [result] = await db.query(query, [
            projectData.id,
            projectData.name,
            projectData.customer_id,
            projectData.site_id,
            projectData.project_manager_id,
            projectData.stage,
            projectData.status_id
        ]);
        
        return result.insertId;
    } catch (error) {
        throw new Error(`Error creating project: ${error.message}`);
    }
}

/**
 * Create job
 */
async function createJob(jobData) {
    try {
        const query = `
            INSERT INTO jobs (id,project_id,worker_id,status,scheduled_start,scheduled_end,actual_start,actual_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [
            jobData.id,
            jobData.project_id,
            jobData.worker_id,
            jobData.status,
            jobData.scheduled_start,
            jobData.scheduled_end,
            jobData.actual_start,
            jobData.actual_end
        ]);
        
        return result.insertId;
    } catch (error) {
        throw new Error(`Error creating job: ${error.message}`);
    }
}

/**
 * Create employee
 */
async function createWorker(workerData) {
    try {
        const query = `INSERT INTO workers (id, name, phone,position) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(query, [
            workerData.id,
            workerData.name,
            workerData.phone,
            workerData.position,
        ]);
        return result.insertId;
    } catch (error) {
        throw new Error(`Error creating worker: ${error.message}`);
    }
}

/**
 * Create site
 */
async function createSite(siteData) {
    try {
        const query = `INSERT INTO site (id, name, address) VALUES (?, ?, ?)`;
        const [result] = await db.query(query, [
            siteData.id,
            siteData.name,
            siteData.address
        ]);
        return result.insertId;
    } catch (error) {
        throw new Error(`Error creating site: ${error.message}`);
    }
}

/**
 * Create customer
 */
async function createCustomer(customerData) {
    try {
        const query = `INSERT INTO customer (id, type, name, phone) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(query, [
            customerData.id,
            customerData.type,
            customerData.name,
            customerData.phone
        ]);
        return result.insertId;
    } catch (error) {
        throw new Error(`Error creating customer: ${error.message}`);
    }
}

/**
 * Combine date and time strings into DateTime
 */
function combineDateTime(date, time) {
    if (!date || !time || time === 'N/A') return null;
    return `${date} ${time}`;
}

export { findData, findJob, createData, createProject, createJob, createWorker, createSite, createCustomer, combineDateTime };