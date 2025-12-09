import dotenv from 'dotenv';
dotenv.config();

// Helper function to call Simpro API
async function callSimproAPI(url, method = 'GET', data = null) {
    const response = await fetch(url, {
        method: method,
        headers: {
            'Authorization': `Bearer ${process.env.SIMPRO_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : null,
    });
    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }

    return responseData;

}

// Backend functions - direct Simpro API calls
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

// Scheduler function helper - cooldown period after API calls
async function cooldownPeriod(minutes = 3) {
    const milliseconds = minutes * 60 * 1000;
    console.log(`Starting cooldown period: ${minutes} minute(s) (${milliseconds}ms)`);
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Cooldown period completed after ${minutes} minute(s)`);
            resolve();
        }, milliseconds);
    });
}

// CommonJS exports for backend
export {
    getJob,
    getAllSchedule,
    getDetailSchedule,
    getLog,
    cooldownPeriod
};

