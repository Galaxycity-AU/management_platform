# Express + React Full-Stack Project

## Project Structure

```
mp_express/
├── client/                    # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/         # API calls
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── types.js
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MySQL Database

### Client Setup

```bash
cd client
npm install
npm run dev
```

The client will run on `http://localhost:3000` with API proxy to `http://localhost:3001/api`.

### Server Setup

```bash
cd server
npm install
cp .env.example .env  # Update with your database credentials
npm run dev
```

The server will run on `http://localhost:3001`.

## Environment Variables

### Server (.env)
- `SQL_USER`: MySQL username
- `SQL_PASSWORD`: MySQL password
- `DATABASE_NAME`: MySQL database name
- `SQL_HOST`: MySQL host
- `SQL_PORT`: MySQL port
- `API_PORT`: Express server port (default: 3001)
- `GEMINI_API_KEY`: Google Gemini API key for AI features

### Client
Configure environment variables in `client/.env.local` or via `vite.config.js`.

## API Endpoints

### Projects
- `GET /projects` - Get all projects
- `GET /projects/:id` - Get project by ID
- `POST /projects` - Create project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Workers
- `GET /workers` - Get all workers
- `GET /workers/:id` - Get worker by ID
- `POST /workers` - Create worker
- `PUT /workers/:id` - Update worker
- `DELETE /workers/:id` - Delete worker

### Jobs
- `GET /jobs` - Get all jobs
- `GET /jobs/project/:projectId` - Get jobs by project
- `POST /jobs` - Create job
- `PUT /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job

### Approvals
- `GET /approvals` - Get all approvals
- `GET /approvals/:id` - Get approval by ID
- `PUT /approvals/:id` - Update approval
- `DELETE /approvals/:id` - Delete approval

## Database Schema

Ensure your MySQL database has the following tables:
- `projects`
- `workers`
- `jobs`
- `approvals`

Refer to the SQL files in the root directory for schema creation.

## Features

- **Project Management**: Create, view, and manage projects
- **Worker Management**: Track workers and their assignments
- **Job Scheduling**: Schedule and track job assignments
- **Approval Workflow**: Manage approval of work items
- **Real-time Dashboard**: View project status and statistics
- **AI Analysis**: Gemini-powered project health analysis

## Tech Stack

### Frontend
- React 19
- Vite
- TailwindCSS
- Lucide Icons
- Axios for API calls

### Backend
- Express.js
- MySQL
- dotenv for configuration

## Running Both Simultaneously

From the root directory:

```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

The frontend will be available at `http://localhost:3000`.
