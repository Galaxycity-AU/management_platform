const sequelize = require('../database');
const Job = require('./Job');
const Worker = require('./Worker');
const Project = require('./Project');
const Approval = require('./Approval');

// Relationships
Worker.hasMany(Job, { foreignKey: 'workerId' });
Job.belongsTo(Worker, { foreignKey: 'workerId' });
Project.hasMany(Job, { foreignKey: 'projectId' });
Job.belongsTo(Project, { foreignKey: 'projectId' });
Job.hasMany(Approval, { foreignKey: 'jobId' });
Approval.belongsTo(Job, { foreignKey: 'jobId' });
module.exports = {
    sequelize,
    Job,
    Worker,
    Project,
    Approval
};