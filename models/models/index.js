import sequelize from '../database.js';
import Job from './Job.js';
import Worker from './Worker.js';
import Project from './Project.js';
import Approval from './Approval.js';

// Relationships
Worker.hasMany(Job, { foreignKey: 'workerId' });
Job.belongsTo(Worker, { foreignKey: 'workerId' });
Project.hasMany(Job, { foreignKey: 'projectId' });
Job.belongsTo(Project, { foreignKey: 'projectId' });
Job.hasMany(Approval, { foreignKey: 'jobId' });
Approval.belongsTo(Job, { foreignKey: 'jobId' });

export {
    sequelize,
    Job,
    Worker,
    Project,
    Approval
};