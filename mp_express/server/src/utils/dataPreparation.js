import { formatDateTime } from './helpers.js';

//data preparation

async function filterToGet7DaysSchedule(data){
    if (!Array.isArray(data)) {
        return data;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    
    const filtered = data.filter(item => {
        if (!item.Date) return false;
        
        const itemDate = new Date(item.Date);
        itemDate.setHours(0, 0, 0, 0);
        
        return itemDate >= today && itemDate <= next7Days;
    });
    
    return filtered;
}

async function prepareScheduleTableData(data){
    if (!Array.isArray(data)) {
        return [];
    }
    
    const tableRows = [];
    
    data.forEach(item => {
        console.log(item);
        if (item.Blocks && item.Blocks.length > 0) {
            item.Blocks.forEach((block, blockIndex) => {
                if (item.Reference) {
                    const [jobId, costCenterId] = item.Reference.split('-');
                    if (jobId && jobId.trim() !== '' && costCenterId && costCenterId.trim() !== '' && costCenterId !== 'null') {
                        tableRows.push({
                            id: item.ID,
                            date: item.Date,
                            JobId: jobId,
                            CostCenterId: costCenterId,
                            totalHours: item.TotalHours,
                            staffId: item.Staff?.ID || "N/A",
                            staffName: item.Staff?.Name || "N/A",
                            startTime: block.StartTime || "N/A",
                            endTime: block.EndTime || "N/A",
                            isFirstBlock: blockIndex === 0,
                            blockCount: item.Blocks.length
                        });
                    }
                }
            });
        }
    });
    
    return tableRows;
}

function prepareLogTableData(data){
    if (!Array.isArray(data)) {
        return [];
    }
    
    const tableRows = [];
    
    data.forEach(item => {
        tableRows.push({
            id: item.ID || "N/A",
            staffId: item.Staff?.ID || "N/A",
            WorkOrderId: item.WorkOrder?.ID || "N/A",
            staffName: item.Staff?.Name || "N/A",
            ProjectId: item.WorkOrder?.ProjectID || "N/A",
            CCID: item.WorkOrder?.CostCenterID || "N/A",
            Status: item.Status?.ID || "N/A",
            StatusName: item.Status?.Name || "N/A",
            Time: item.DateLogged || "N/A"
        });
    });
    tableRows.sort((a, b) => new Date(b.Time) - new Date(a.Time));

    return tableRows;
}

async function groupScheduleByJobId(data){
    const jobMap = {};
  
    data.forEach(entry => {
      const jobId = entry.JobId; // Use JobId from prepareScheduleTableData output
      
      if (!jobId || jobId.trim() === '') {
        return; // Skip entries without valid jobId
      }
      
      if (!jobMap[jobId]) {
        jobMap[jobId] = {
          jobId: jobId,
          costCenterIds: new Set(),
          dates: new Set(),
          staff: {},
          entries: [],
          totalHours: 0
        };
      }
  
      const job = jobMap[jobId];
      
      // Add cost center ID
      if (entry.CostCenterId) {
        job.costCenterIds.add(entry.CostCenterId);
      }
      
      // Add total hours
      job.totalHours += entry.totalHours || 0;
      
      // Add date
      if (entry.date) {
        job.dates.add(entry.date);
      }
      
      // Track staff
      const staffId = entry.staffId || 'N/A';
      if (!job.staff[staffId]) {
        job.staff[staffId] = {
          staffId: staffId,
          staffName: entry.staffName || 'N/A',
          totalHours: 0,
          shifts: []
        };
      }
      
      job.staff[staffId].totalHours += entry.totalHours || 0;
      job.staff[staffId].shifts.push({
        date: entry.date,
        hours: entry.totalHours || 0,
        startTime: entry.startTime,
        endTime: entry.endTime
      });
      
      // Store raw entry
      job.entries.push(entry);
    });
  
    // Convert to array and format
    return Object.values(jobMap).map(job => ({
      jobId: job.jobId,
      costCenterIds: Array.from(job.costCenterIds),
      totalHours: Math.round(job.totalHours * 100) / 100,
      staffCount: Object.keys(job.staff).length,
      staff: Object.values(job.staff).map(s => ({
        ...s,
        totalHours: Math.round(s.totalHours * 100) / 100
      })),
      dateRange: {
        start: job.dates.size > 0 ? Math.min(...Array.from(job.dates).map(d => new Date(d).getTime())) : null,
        end: job.dates.size > 0 ? Math.max(...Array.from(job.dates).map(d => new Date(d).getTime())) : null,
        dates: Array.from(job.dates).sort()
      },
      entryCount: job.entries.length
    })).sort((a, b) => b.totalHours - a.totalHours); // Sort by total hours desc
  }


  export { filterToGet7DaysSchedule, prepareScheduleTableData, prepareLogTableData, groupScheduleByJobId };