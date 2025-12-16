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

async function formatDateTime(dateTimeString) {
    if (!dateTimeString) {
        return "N/A";
    }
    
    try {
        const date = new Date(dateTimeString);
        
        if (isNaN(date.getTime())) {
            return dateTimeString;
        }
        
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        
        return date.toLocaleString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateTimeString;
    }
}

export { callSimproAPI, formatDateTime };