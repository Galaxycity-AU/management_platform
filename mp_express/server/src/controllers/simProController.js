import * as simproService from '../service/simproService.js';
import {syncLogs, processLogsFromDatabase} from '../service/simproLogServices.js';

export const getJobById = async (req, res) => {
    try {
        const data = await simproService.getJob(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllSchedules = async (req, res) => {
    try {
        const data = await simproService.getAllSchedule();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getScheduleById = async (req, res) => {
    try {
        const data = await simproService.getDetailSchedule(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMobileStatusLog = async (req, res) => {
    try {
        const rawData = await simproService.getLog();
        const data = await syncLogs(rawData);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const processLogsfromDB = async (req, res) => {
    try {
        const data = await processLogsFromDatabase();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// export const storeSimProLogToDb = async (req, res) => {
//     try {
//         const data = await getLogsFromDatabase();
//         res.json(data);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };