import { GoogleGenAI } from "@google/genai";
import { Project, WorkerLog, LogStatus } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeProjectHealth = async (project: Project, recentLogs: WorkerLog[]) => {
  const ai = getAiClient();
  if (!ai) return "AI API Key not configured.";

  const prompt = `
    Analyze the health of the following project based on its schedule and recent worker logs.
    
    Project: ${project.name}
    Status: ${project.status}
    Schedule: ${project.scheduledStart.toDateString()} to ${project.scheduledEnd.toDateString()}
    Progress: ${project.progress}%
    
    Recent Logs (Last 5):
    ${recentLogs.slice(0, 5).map(l => `- ${l.workerName}: ${l.actualEnd ? 'Completed' : ' ongoing'}, Variance: ${l.notes}`).join('\n')}

    Provide a concise 3-sentence executive summary on risks and recommendations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Could not generate analysis at this time.";
  }
};

export const suggestApprovalAction = async (log: WorkerLog) => {
    const ai = getAiClient();
    if (!ai) return "Unable to suggest.";

    // Calculate variance
    const startDiff = log.actualStart && log.scheduledStart 
        ? (log.actualStart.getTime() - log.scheduledStart.getTime()) / 60000 
        : 0;
    const endDiff = log.actualEnd && log.scheduledEnd
        ? (log.actualEnd.getTime() - log.scheduledEnd.getTime()) / 60000
        : 0;
    
    const prompt = `
    A worker submitted the following time log. Suggest if the manager should Approve or Investigate.
    
    Scheduled: ${log.scheduledStart.toLocaleTimeString()} - ${log.scheduledEnd.toLocaleTimeString()}
    Actual: ${log.actualStart?.toLocaleTimeString()} - ${log.actualEnd?.toLocaleTimeString()}
    Variance Start: ${startDiff} minutes (positive is late)
    Variance End: ${endDiff} minutes (positive is overtime)
    Notes: ${log.notes}
    
    Return only one word: "Approve" or "Investigate".
    `;

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        return "Manual Review";
    }
}
