import { callSimproAPI } from '../utils/helpers.js';

async function getJob(jobId) {
    const url = `https://gccg.simprosuite.com/api/v1.0/companies/4/jobs/${jobId}`;
    return await callSimproAPI(url, 'GET');
}

async function getAllSchedule() {
    const url = `https://gccg.simprosuite.com/api/v1.0/companies/4/schedules/?orderby=-Date&pageSize=250`;
    return await callSimproAPI(url, 'GET');
}

async function getDetailSchedule(scheduleId) {
    const url = `https://gccg.simprosuite.com/api/v1.0/companies/4/schedules/${scheduleId}`;
    return await callSimproAPI(url, 'GET');
}

async function getLog() {
    const url = `https://gccg.simprosuite.com/api/v1.0/companies/4/logs/mobileStatus/`;
    return await callSimproAPI(url, 'GET');
}

export { getJob, getAllSchedule, getDetailSchedule, getLog };