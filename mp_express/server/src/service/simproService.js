import { callSimproAPI } from '../utils/helpers.js';

const BASE_URL = process.env.SIMPRO_BASE_URL;

async function getJob(jobId) {
    const url = `${BASE_URL}jobs/${jobId}`;
    return await callSimproAPI(url, 'GET');
}

async function getAllSchedule() {
    const url = `${BASE_URL}schedules/?orderby=-Date&pageSize=250`;
    return await callSimproAPI(url, 'GET');
}

async function getDetailSchedule(scheduleId) {
    const url = `${BASE_URL}schedules/${scheduleId}`;
    return await callSimproAPI(url, 'GET');
}

async function getLog() {
    const url = `${BASE_URL}logs/mobileStatus/`;
    return await callSimproAPI(url, 'GET');
}

//==other simpro function==
async function getEmployee(id){
    const url =`${BASE_URL}employees/${id}`;
    return await callSimproAPI(url, 'GET');
}

async function getSite(id){
    const url =`${BASE_URL}sites/${id}`;
    return await callSimproAPI(url, 'GET');
}

async function getCustomer(type,id){
    if (type === 'company'){
        const url = `${BASE_URL}customers/companies/${id}`
        console.log('url',url);
        return await callSimproAPI(url, 'GET');
    }else if (type === 'individual'){
        const url = `${BASE_URL}customers/individuals/${id}`
        return await callSimproAPI(url, 'GET');
    }
}

export { getJob, getAllSchedule, getDetailSchedule, getLog, getEmployee, getSite, getCustomer };