import app from './app.js';

const API_PORT = process.env.API_PORT || 3001;
app.listen(API_PORT, () => {
    console.log(`API running on http://localhost:${API_PORT}`);
    console.log(`Health check: http://localhost:${API_PORT}/health`);
});
