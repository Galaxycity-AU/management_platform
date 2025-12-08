import { sequelize, Project, Job, Worker, Approval } from '../models/models/index.js';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

function timeStringFromMinutes(minutes) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}:00`;
}

async function main() {
  try {
    console.log('Connecting to DB...');
    await sequelize.authenticate();
    console.log('DB connected — syncing models (no destructive changes).');
    await sequelize.sync();

    // Clear existing data to avoid unique constraint and FK issues.
    // Temporarily disable foreign key checks so we can truncate in any order.
    console.log('Clearing existing data from Approval, Job, Project, Worker tables (disabling FK checks)...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Approval.destroy({ where: {}, truncate: true, cascade: true });
    await Job.destroy({ where: {}, truncate: true, cascade: true });
    await Project.destroy({ where: {}, truncate: true, cascade: true });
    await Worker.destroy({ where: {}, truncate: true, cascade: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create Workers
    const positions = ['Technician', 'Operator', 'Engineer', 'Supervisor', 'Administrator'];
    const workers = [];
    for (let i = 1; i <= 40; i++) {
      const w = await Worker.create({
        name: `Worker ${i}`,
        email: `worker${i}@example.local`,
        position: positions[i % positions.length]
      });
      workers.push(w);
    }
    console.log(`Created ${workers.length} workers`);

    // Create Projects
    const statuses = ['active', 'paused', 'completed', 'planning'];
    const projects = [];
    for (let i = 1; i <= 40; i++) {
      const manager = workers[randInt(0, workers.length - 1)];
      const deadline = new Date(Date.now() + randInt(1, 120) * 24 * 60 * 60 * 1000);
      const p = await Project.create({
        title: `Project ${i}`,
        description: `Auto-generated project ${i}`,
        managerId: manager.id,
        status: statuses[randInt(0, statuses.length - 1)],
        progress: randFloat(0, 100, 1),
        budget: randFloat(1000, 200000, 2),
        expenses: randFloat(0, 50000, 2),
        deadline
      });
      projects.push(p);
    }
    console.log(`Created ${projects.length} projects`);

    // Create Jobs
    const jobStatuses = ['pending', 'approved', 'rejected', 'in_review', 'completed'];
    const jobs = [];
    for (let i = 1; i <= 40; i++) {
      const worker = workers[randInt(0, workers.length - 1)];
      const project = projects[randInt(0, projects.length - 1)];

      // job date within +/- 15 days
      const jobDate = new Date(Date.now() + randInt(-15, 15) * 24 * 60 * 60 * 1000);
      const startMinutes = randInt(8 * 60, 11 * 60); // between 08:00 and 11:59
      const durationMinutes = randInt(4 * 60, 9 * 60); // 4-9 hours
      const endMinutes = startMinutes + durationMinutes;

      const job = await Job.create({
        workerId: worker.id,
        projectId: project.id,
        jobDate,
        startTime: timeStringFromMinutes(startMinutes),
        endTime: timeStringFromMinutes(endMinutes),
        clockedInTime: null,
        clockedOutTime: null,
        editedInTime: null,
        editedOutTime: null,
        status: jobStatuses[randInt(0, jobStatuses.length - 1)]
      });
      jobs.push(job);
    }
    console.log(`Created ${jobs.length} jobs`);

    // Create Approvals (one approval per job)
    const approvalStatuses = ['approved', 'rejected', 'pending'];
    const approvals = [];
    for (const job of jobs) {
      // choose an approver that is not the job worker (if possible)
      let approver = workers[randInt(0, workers.length - 1)];
      if (workers.length > 1 && approver.id === job.workerId) {
        approver = workers.find(w => w.id !== job.workerId) || approver;
      }
      const approvalDate = new Date(new Date(job.jobDate).getTime() + randInt(0, 2) * 24 * 60 * 60 * 1000);
      const a = await Approval.create({
        jobId: job.id,
        approverId: approver.id,
        approvalDate,
        status: approvalStatuses[randInt(0, approvalStatuses.length - 1)],
        comments: `Auto approval for job ${job.id}`
      });
      approvals.push(a);
    }
    console.log(`Created ${approvals.length} approvals`);

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();
