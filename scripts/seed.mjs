import db from "../database/database.js";

// Helpers
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function timeStringFromMinutes(min) {
  const hh = String(Math.floor(min / 60)).padStart(2, "0");
  const mm = String(min % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

async function main() {
  try {
    console.log("Connecting...");
    const conn = await db.getConnection();
    conn.release();
    console.log("Database connected.");

    console.log("Clearing existing data...");
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query("TRUNCATE TABLE approvals");
    await db.query("TRUNCATE TABLE jobs");
    await db.query("TRUNCATE TABLE projects");
    await db.query("TRUNCATE TABLE workers");
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    // -------------------------------
    // WORKERS
    // -------------------------------
    const workerNames = [
      "John Smith", "Emily Carter", "Michael Brown", "Sarah Johnson",
      "Daniel Wilson", "Kevin Murphy", "Laura Nguyen", "David Cooper",
      "James Lee", "Ella Thompson", "Olivia Davis", "Robert Clark",
      "Grace Miller", "Jack Harris", "Amelia White", "Liam Martin",
      "Ava Walker", "Thomas King", "Sophie Allen", "Henry Wright"
    ];

    const positions = [
      "Carpenter", "Electrician", "Plumber", "Laborer", "Site Supervisor",
      "Project Manager", "Foreman", "Heavy Equipment Operator", "Painter",
      "HVAC Technician", "Welder", "Mason", "Roofer"
    ];

    console.log("Creating workers...");
    const workers = [];
    for (let name of workerNames) {
      const email = name.toLowerCase().replace(/ /g, ".") + "@gcsda.com.au";
      const phone = `04${randInt(10, 99)} ${randInt(100, 999)} ${randInt(100, 999)}`;
      const position = positions[randInt(0, positions.length - 1)];

      const [result] = await db.query(
        "INSERT INTO workers (name, position, email, phone) VALUES (?, ?, ?, ?)",
        [name, position, email, phone]
      );

      workers.push({ id: result.insertId, name, position });
    }
    console.log(`Workers created: ${workers.length}`);

    // -------------------------------
    // PROJECTS
    // -------------------------------
    const projectList = [
      "Illowra SDA Complex – Stage 1",
      "Merriweather Apartments Fit-out",
      "King St Disability Housing Upgrade",
      "Somerville Road Townhouse Build",
      "Highton SDA Renovation Project",
      "Footscray Social Housing Upgrade",
      "Apex Road Warehousing Extension",
      "Lara SDA New Build"
    ];

    const clients = [
      "Melbourne City Council", "Victoria Housing Trust", "SDA Property Group",
      "Disability Services Australia", "Urban Development Corp", "Community Housing Ltd"
    ];

    const managers = [
      "Jennifer Wilson", "Andrew Chen", "Rebecca Martinez", "Christopher Lee",
      "Michelle Taylor", "David Anderson", "Patricia Brown"
    ];

    const statuses = ["active", "completed", "planning"];
    const projects = [];

    console.log("Creating projects...");
    for (let name of projectList) {
      // Generate deadline 30-180 days from now
      const deadline = new Date(Date.now() + randInt(30, 180) * 86400000);
      const client = clients[randInt(0, clients.length - 1)];
      const manager = managers[randInt(0, managers.length - 1)];

      const [result] = await db.query(
        `INSERT INTO projects (name, description, deadline, status, client, manager, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, `Project: ${name}`, deadline, statuses[randInt(0, statuses.length - 1)], client, manager, new Date()]
      );
      projects.push({ id: result.insertId, name });
    }
    console.log(`Projects created: ${projects.length}`);

    // -------------------------------
    // JOBS
    // -------------------------------
    const tasks = [
      "Concrete Pouring", "Electrical Rough-in", "Site Cleaning", "Plumbing Installation",
      "Wall Framing", "Roofing Inspection", "Safety Audit", "Material Delivery Check",
      "Painting Prep Work", "Carpentry Fix", "HVAC Installation", "Drywall Installation",
      "Flooring Installation", "Window Installation", "Door Installation", "Demolition Work"
    ];

    const jobStatuses = ["schedule", "active", "approved", "rejected", "waiting_approval"];
    const jobs = [];

    console.log("Creating jobs...");
    for (let i = 0; i < 80; i++) {
      const project = projects[randInt(0, projects.length - 1)];
      const worker = workers[randInt(0, workers.length - 1)];
      const status = jobStatuses[randInt(0, jobStatuses.length - 1)];

      // Generate scheduled start date/time (within -10 to +20 days from now)
      const scheduledStart = new Date(Date.now() + randInt(-10, 20) * 86400000);
      scheduledStart.setHours(randInt(6, 10), randInt(0, 59), 0, 0);

      // Generate scheduled end date/time (4-8 hours after start)
      const scheduledEnd = new Date(scheduledStart.getTime() + randInt(4, 8) * 3600000);

      // Generate actual times based on status
      let actualStart = null;
      let actualEnd = null;

      if (status === 'schedule') {
        // SCHEDULE: Only schedule start and end time, no actual times
        actualStart = null;
        actualEnd = null;
      } else if (status === 'active') {
        // ACTIVE: Schedule start and end time, actual start but no end
        actualStart = new Date(scheduledStart.getTime() + randInt(-30, 60) * 60000);
        actualEnd = null;
      } else if (status === 'approved' || status === 'rejected' || status === 'waiting_approval') {
        // APPROVED/REJECTED/WAITING_APPROVAL: All schedule and actual times
        actualStart = new Date(scheduledStart.getTime() + randInt(-30, 60) * 60000);
        actualEnd = new Date(scheduledEnd.getTime() + randInt(-60, 120) * 60000);
      }

      // Sometimes jobs get rescheduled (20% chance)
      let modifiedStart = null;
      let modifiedEnd = null;
      if (Math.random() < 0.2) {
        // Modified time is 1-3 days different from scheduled
        modifiedStart = new Date(scheduledStart.getTime() + randInt(-3, 3) * 86400000);
        modifiedStart.setHours(randInt(6, 10), randInt(0, 59), 0, 0);
        modifiedEnd = new Date(modifiedStart.getTime() + randInt(4, 8) * 3600000);
      }

      const [result] = await db.query(
        `INSERT INTO jobs 
         (project_id, worker_id, status, scheduled_start, scheduled_end, 
          actual_start, actual_end, modified_start, modified_end)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id,
          worker.id,
          status,
          scheduledStart,
          scheduledEnd,
          actualStart,
          actualEnd,
          modifiedStart,
          modifiedEnd
        ]
      );

      jobs.push({ id: result.insertId, projectId: project.id, workerId: worker.id });
    }
    console.log(`Jobs created: ${jobs.length}`);

    // -------------------------------
    // APPROVALS (Simplified - just approver and comments)
    // -------------------------------
    console.log("Creating approvals...");
    let approvalCount = 0;
    
    // Create approvals for about 60% of jobs
    for (const job of jobs) {
      if (Math.random() < 0.6) {
        const approver = workers[randInt(0, workers.length - 1)];
        
        // Make sure approver is not the same as worker
        let finalApprover = approver;
        if (approver.id === job.workerId) {
          finalApprover = workers.find(w => w.id !== job.workerId) || approver;
        }
        
        const commentTemplates = [
          `Approved by ${finalApprover.name} - Good work`,
          `Reviewed and approved - ${finalApprover.name}`,
          `Please adjust start time - ${finalApprover.name}`,
          `Safety concerns noted - ${finalApprover.name}`,
          `Timeline looks good - ${finalApprover.name}`,
          `Need to reschedule - ${finalApprover.name}`,
          `Resources confirmed - ${finalApprover.name}`
        ];

        await db.query(
          `INSERT INTO approvals (job_id, approver_id, comments)
           VALUES (?, ?, ?)`,
          [
            job.id,
            finalApprover.id,
            commentTemplates[randInt(0, commentTemplates.length - 1)]
          ]
        );
        approvalCount++;
      }
    }

    console.log(`Approvals created: ${approvalCount}`);
    console.log("Seeding complete.");
    process.exit(0);

  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

main();