import db from '../config/database.js';
import { getJob, getAllSchedule, getDetailSchedule, getLog, getEmployee, getSite, getCustomer } from '../service/simproService.js';
import { filterToGet7DaysSchedule, prepareScheduleTableData, groupScheduleByJobId } from '../utils/dataPreparation.js';
import { isValid, format } from 'date-fns';
import { findData, findJob, createData, createProject, createJob, createWorker, createSite, createCustomer, combineDateTime } from '../utils/simprohelper.js';
// ==database helper functions==
// const getProjectById = async (req,res) => {
//     try{
//         const project = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
//         res.json(project);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const createProject = async (req, res) => {
//     try {
//         const { project } = req.body;
//         const result = await db.query('INSERT INTO projects (name, description, deadline, status, client, manager) VALUES (?, ?, ?, ?, ?, ?)', [project.name, project.description, project.deadline, project.status, project.client, project.manager]);
//         res.json(result);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const findJobById = async (req, res) => {
//     try {
//         const schedule = await db.query('SELECT * FROM jobs WHERE id,project_id,worker_id = ?', [req.params.id,req.params.project_id,req.params.worker_id]);
//         res.json(schedule);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const createJob = async (req, res) => {
//     try {
//         const { job } = req.body;
//         const result = await db.query('INSERT INTO jobs (id,project_id,worker_id,status,scheduled_start,scheduled_end,actual_start,actual_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [job.id,job.project_id,job.worker_id,job.status,job.scheduled_start,job.scheduled_end,job.actual_start,job.actual_end]);
//         res.json(result);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const updateJob = async (req, res) => {
//     try {
//         const { job } = req.body;
//         const result = await db.query('UPDATE jobs SET status=?,scheduled_start=?,scheduled_end=?,actual_start=?,actual_end=? WHERE id=?', [job.status,job.scheduled_start,job.scheduled_end,job.actual_start,job.actual_end,job.id]);
//         res.json(result);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const findData = async(req,res) => {
//     try {
//         const { table,id } = req.body;
//         const result = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
//         return result;
//     } catch (error) {
//         throw new Error(`Error finding data in ${table}: ${error.message}`);
//     }
// };

// const createEmployee = async(req,res) => {
//     try {
//         const { employee } = req.body;
//         const result = await db.query('INSERT INTO employees (id,name,email,phone) VALUES (?, ?, ?, ?)', [employee.id,employee.name,employee.email,employee.phone]);
//         return result;
//     } catch (error) {
//         throw new Error(`Error creating employee: ${error.message}`);
//     }
// };
// const createSite = async(req,res) => {
//     try {
//         const { site } = req.body;
//         const result = await db.query('INSERT INTO sites (id,name,address,city,state,zip) VALUES (?, ?, ?, ?, ?, ?)', [site.id,site.name,site.address,site.city,site.state,site.zip]);
//         return result;
//     } catch (error) {
//         throw new Error(`Error creating site: ${error.message}`);
//     }
// };
// const createCustomer = async(req,res) => {
//     try {
//         const { customer } = req.body;
//         const result = await db.query('INSERT INTO customers (id,name,email,phone) VALUES (?, ?, ?, ?)', [customer.id,customer.name,customer.email,customer.phone]);
//         return result;
//     } catch (error) {
//         throw new Error(`Error creating customer: ${error.message}`);
//     }
// };

// // **
// //  * Find data by ID in any table
// //  * Returns the row or null
// //  */
// export async function findData(table, id) {
//     try {
//         const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
//         return rows[0] || null;
//     } catch (error) {
//         throw new Error(`Error finding data in ${table}: ${error.message}`);
//     }
// }

// /**
//  * Create data in any table
//  * Returns the insert ID
//  */
// export async function createData(table, data) {
//     try {
//         const keys = Object.keys(data);
//         const values = Object.values(data);
//         const placeholders = keys.map(() => '?').join(', ');
        
//         const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
//         const [result] = await db.query(query, values);
        
//         return result.insertId;
//     } catch (error) {
//         throw new Error(`Error creating data in ${table}: ${error.message}`);
//     }
// }

// /**
//  * Find schedule by unique constraint
//  */
// export async function findSchedule(projectId, costCenterId, staffId, date) {
//     try {
//         const query = `
//             SELECT * FROM schedules 
//             WHERE project_id = ? 
//             AND cost_center_id = ? 
//             AND staff_id = ? 
//             AND scheduled_date = ?
//             LIMIT 1
//         `;
        
//         const [rows] = await db.query(query, [projectId, costCenterId, staffId, date]);
//         return rows[0] || null;
//     } catch (error) {
//         throw new Error(`Error finding schedule: ${error.message}`);
//     }
// }

// /**
//  * Create project
//  */
// export async function createProject(projectData) {
//     try {
//         const query = `
//             INSERT INTO projects (id, name, customer_id, site_id, project_manager_id, stage, status_id, created_at, updated_at)
//             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
//         `;
        
//         const [result] = await db.query(query, [
//             projectData.id,
//             projectData.name,
//             projectData.customer_id,
//             projectData.site_id,
//             projectData.project_manager_id,
//             projectData.stage,
//             projectData.status_id
//         ]);
        
//         return result.insertId;
//     } catch (error) {
//         throw new Error(`Error creating project: ${error.message}`);
//     }
// }

// /**
//  * Create schedule
//  */
// export async function createSchedule(scheduleData) {
//     try {
//         const query = `
//             INSERT INTO schedules (
//                 project_id, work_order_id, cost_center_id, staff_id, staff_name,
//                 scheduled_date, scheduled_start, scheduled_end,
//                 actual_start, actual_end, work_minutes, break_minutes,
//                 status, status_code, is_currently_active,
//                 created_at, updated_at
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
//         `;
        
//         const [result] = await db.query(query, [
//             scheduleData.project_id,
//             scheduleData.work_order_id,
//             scheduleData.cost_center_id,
//             scheduleData.staff_id,
//             scheduleData.staff_name,
//             scheduleData.scheduled_date,
//             scheduleData.scheduled_start,
//             scheduleData.scheduled_end,
//             scheduleData.actual_start,
//             scheduleData.actual_end,
//             scheduleData.work_minutes,
//             scheduleData.break_minutes,
//             scheduleData.status,
//             scheduleData.status_code,
//             scheduleData.is_currently_active ? 1 : 0
//         ]);
        
//         return result.insertId;
//     } catch (error) {
//         throw new Error(`Error creating schedule: ${error.message}`);
//     }
// }

// /**
//  * Create employee
//  */
// export async function createEmployee(employeeData) {
//     try {
//         const query = `INSERT INTO employees (id, name, email, phone) VALUES (?, ?, ?, ?)`;
//         const [result] = await db.query(query, [
//             employeeData.id,
//             employeeData.name,
//             employeeData.email,
//             employeeData.phone
//         ]);
//         return result.insertId;
//     } catch (error) {
//         throw new Error(`Error creating employee: ${error.message}`);
//     }
// }

// /**
//  * Create site
//  */
// export async function createSite(siteData) {
//     try {
//         const query = `INSERT INTO sites (id, name, address, city, state, zip) VALUES (?, ?, ?, ?, ?, ?)`;
//         const [result] = await db.query(query, [
//             siteData.id,
//             siteData.name,
//             siteData.address,
//             siteData.city,
//             siteData.state,
//             siteData.zip
//         ]);
//         return result.insertId;
//     } catch (error) {
//         throw new Error(`Error creating site: ${error.message}`);
//     }
// }

// /**
//  * Create customer
//  */
// export async function createCustomer(customerData) {
//     try {
//         const query = `INSERT INTO customers (id, name, email, phone) VALUES (?, ?, ?, ?)`;
//         const [result] = await db.query(query, [
//             customerData.id,
//             customerData.name,
//             customerData.email,
//             customerData.phone
//         ]);
//         return result.insertId;
//     } catch (error) {
//         throw new Error(`Error creating customer: ${error.message}`);
//     }
// }

// /**
//  * Combine date and time strings into DateTime
//  */
// function combineDateTime(date, time) {
//     if (!date || !time || time === 'N/A') return null;
//     return `${date} ${time}`;
// }

// export const setupFunction = async (req, res) => {
//     try {
//         const data = await getAllSchedule();

//         const filteredData = filterToGet7DaysSchedule(data);
//         console.log('filteredData',filteredData);
//         const tableData = prepareScheduleTableData(filteredData);
//         console.log('tableData',tableData);
//         const groupedData = groupScheduleByJobId(tableData);
//         console.log('groupedData',groupedData);

//         const JobId = groupedData.map(job => job.jobId).filter(id => id && id !== 'N/A');
//         for (const id of JobId) {
//             const project = await findData('projects',id);
//             if (project) {
//                 continue;
//             } else {
//                 const SimProJob = await getJob(id);
//                 console.log('SimProJob',SimProJob);
//                 const newProject = prepareProjectData(SimProJob);
//                 console.log('newProject',newProject);
//                 // const newJob = await createJob(newJob);
//                 // await updateJob(newJob);
//             }
//         }
//     //     // Ensure the data directory exists
//     //     const dataDir = path.dirname(filePath);
//     //     await fs.mkdir(dataDir, { recursive: true });
//     //     await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
//     //     res.json({ success: true, project: existingIndex >= 0 ? data.projects[existingIndex] : project });
//     } catch (error) {
//         console.error(`Error in setupFunction:`, error);
//         res.status(500).json({ error: error.message });
//     }
// };

export const setupFunction = async (req, res) => {
    try {
        console.log('=== Starting Daily Setup Sync ===');
        
        // Get all schedules from SimPRO API
        const data = await getAllSchedule();
        console.log(`Fetched ${data.length} schedules from SimPRO`);

        // Filter to get next 7 days
        const filteredData = filterToGet7DaysSchedule(data);
        console.log(`Filtered to ${filteredData.length} schedules in next 7 days`);

        // Prepare table data
        const tableData = prepareScheduleTableData(filteredData);
        console.log(`Prepared ${tableData.length} schedule entries`);

        // Group by job ID
        const groupedData = groupScheduleByJobId(tableData);
        console.log(`Grouped into ${groupedData.length} unique jobs`);

        // Extract unique job IDs
        const jobIds = groupedData.map(job => job.jobId).filter(id => id && id !== 'N/A');
        console.log(`Processing ${jobIds.length} job IDs...`);

        // Process each job - Create projects
        let projectsCreated = 0;
        let projectsSkipped = 0;

        for (const id of jobIds) {
            const existingProject = await findData('projects', id);
            
            if (existingProject) {
                console.log(`  ✓ Project ${id} already exists`);
                projectsSkipped++;
                continue;
            }

            console.log(`  → Fetching job ${id} from SimPRO...`);
            const simProJob = await getJob(id);
            
            if (!simProJob) {
                console.log(`  ✗ Could not fetch job ${id}`);
                continue;
            }
            // ---------- SITE ----------
            let siteDataDB;

            const site = await findData('site', simProJob.Site.ID);
            
            if (!site) {
              console.log(`✗ Could not find site ${simProJob.Site.ID}`);
            
              const siteData = await getSite(simProJob.Site.ID);
            
              siteDataDB = {
                id: siteData.ID,
                name: siteData.Name,
                address: siteData.Name,
              };
            
              await createSite(siteDataDB);
              console.log(`✓ Created site ${siteData.ID}`);
            } else {
              siteDataDB = site;
            }
            

            // ---------- CUSTOMER ----------
            let customerId;

            let customer = await findData('customer', simProJob.Customer.ID);
            if (!customer) {
            console.log(`✗ Could not find customer ${simProJob.Customer.ID}`);

            let customerData;
            let customerDataDB;

            if (simProJob.Customer?.CompanyName) {
                customerData = await getCustomer('company', simProJob.Customer.ID);
                customerDataDB = {
                id: customerData.ID,
                type: 'company',
                name: customerData.CompanyName,
                phone: customerData.Phone || null,
                };
            } else {
                customerData = await getCustomer('individual', simProJob.Customer.ID);
                customerDataDB = {
                id: customerData.ID,
                type: 'individual',
                name: `${customerData.GivenName} ${customerData.FamilyName}`.trim(),
                phone: customerData.Phone || null,
                };
            }

            await createCustomer(customerDataDB);
            console.log(`✓ Created customer ${customerData.ID}`);

            customerId = customerData.ID;
            } else {
            customerId = customer.id;
            }

            // ---------- PROJECT MANAGER ----------
            let projectManagerId;

            if (!simProJob.ProjectManager || !simProJob.ProjectManager.ID) {
                console.log(`⚠ Job ${simProJob.ID} has no project manager assigned`);
                projectManagerId = 1; //default project manager id
            } else {
                let projectManager = await findData('workers', simProJob.ProjectManager.ID);
                if (!projectManager) {
                console.log(`✗ Could not find project manager ${simProJob.ProjectManager.ID}`);

                const pmData = await getEmployee(simProJob.ProjectManager.ID);
                const pmDataDB = {
                    id: pmData.ID,
                    name: pmData.Name,
                    phone: pmData.PrimaryContact?.CellPhone || null,
                    position: pmData.Position || null,
                };

                await createWorker(pmDataDB);
                console.log(`✓ Created project manager ${pmData.ID}`);

                projectManagerId = pmData.ID;
                } else {
                projectManagerId = projectManager.id;
                }
            }

            //create more worker

            // ---------- PROJECT ----------
            const projectDataDB = {
            id: simProJob.ID,
            name: siteDataDB.name,
            customer_id: customerId,
            site_id: siteDataDB.id,
            project_manager_id: projectManagerId,
            stage: simProJob.Stage,
            status_id: simProJob.StatusID,
            };

            await createData('projects', projectDataDB);
            console.log(`✓ Created project ${simProJob.ID}`);
            projectsCreated++;
        }

        // Process schedules - Create schedule records
        let schedulesCreated = 0;
        let schedulesSkipped = 0;

        console.log('\nProcessing schedules...');
        
        // Sort tableData by schedules_start (date + startTime) before inserting
        const sortedTableData = [...tableData].sort((a, b) => {
            // First compare by date
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            
            // If dates are equal, compare by startTime
            const timeA = a.startTime && a.startTime !== 'N/A' ? a.startTime : '00:00:00';
            const timeB = b.startTime && b.startTime !== 'N/A' ? b.startTime : '00:00:00';
            
            return timeA.localeCompare(timeB);
        });
        
        for (const entry of sortedTableData) {
            // Check if schedule already exists
            const existingSchedule = await findJob(entry.id);

            if (existingSchedule) {
                schedulesSkipped++;
                continue;
            }

            const worker = await findData('workers', entry.staffId);
            if (!worker) {
                try {
                    console.log(`✗ Could not find worker(schedule) ${entry.staffId}`);
                    const workerData = await getEmployee(entry.staffId);
                    const workerDataDB = {
                        id: workerData.ID,
                        name: workerData.Name,
                        phone: workerData.PrimaryContact?.CellPhone || null,
                        position: workerData.Position || null,
                    };
                    await createWorker(workerDataDB);
                    console.log(`✓ Created worker(schedule) ${workerData.ID}`);
                } catch (error) {
                    console.log(`✗ Skipping worker creation for ${entry.staffId}: ${error.message}. Continuing with schedule creation...`);
                    // Continue to create schedule even if worker doesn't exist
                }
            }

            // const scheduleData = {
            //     schedules_id: entry.id,
            //     cc_id: entry.CostCenterId,
            //     project_id: entry.JobId,
            //     worker_id: entry.staffId,
            //     status: 'scheduled',
            //     schedules_start: combineDateTime(entry.date, entry.startTime),
            //     schedules_end: combineDateTime(entry.date, entry.endTime),
            // }
            // Create schedule record
            const scheduleData = {
                schedules_id: entry.id,
                project_id: entry.JobId,
                cc_id: entry.CostCenterId,
                worker_id: entry.staffId,
                status: 'scheduled',
                schedules_start: combineDateTime(entry.date, entry.startTime),
                schedules_end: combineDateTime(entry.date, entry.endTime),
                schedule_date: format(new Date(entry.date), 'yyyy-MM-dd')
                
                // Actual time (will be updated from logs)
                // actual_start: null,
                // actual_end: null,
                // work_minutes: 0,
                // break_minutes: 0,
                
                // Status
                // status: 'Scheduled',
                // is_currently_active: false
            };
            console.log('scheduleData',scheduleData);

            await createData('jobs', scheduleData);
            schedulesCreated++;
        }

        console.log('\n=== Daily Setup Sync Complete ===');
        console.log(`Projects: ${projectsCreated} created, ${projectsSkipped} skipped`);
        console.log(`Schedules: ${schedulesCreated} created, ${schedulesSkipped} skipped`);

        res.json({
            success: true,
            message: 'Daily setup sync completed successfully',
            stats: {
                projects: { created: projectsCreated, skipped: projectsSkipped },
                schedules: { created: schedulesCreated, skipped: schedulesSkipped }
            }
        });

    } catch (error) {
        console.error('Error in setupFunction:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

