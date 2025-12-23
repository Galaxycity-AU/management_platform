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

/**
 * Convert ISO datetime string to MySQL datetime format
 * @param {string|null|undefined} isoString - ISO datetime string or null/undefined
 * @returns {string|null} MySQL datetime format (YYYY-MM-DD HH:MM:SS) or null
 */
function toMySQLDateTime(isoString) {
  if (!isoString) return null;
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    
    // Format as YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error converting datetime:', error);
    return null;
  }
}

export { callSimproAPI, formatDateTime, toMySQLDateTime };