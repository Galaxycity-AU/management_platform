
export async function fetchSimproJobs() {
    await fetch('https://gccg.simprosuite.com/api/v1.0/companies/4/jobs/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.SIMPRO_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    return data;
}

export async function fetchSimproDetail(jobId) {
    const response = await fetch(`https://gccg.simprosuite.com/api/v1.0/companies/4/jobs/${jobId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.SIMPRO_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    return data;
}