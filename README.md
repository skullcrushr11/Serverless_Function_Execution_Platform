# Serverless Function Execution Platform

A platform for executing serverless functions with support for multiple virtualization technologies.

## Features

- Function deployment and management
- Multiple virtualization technologies (Docker and gVisor)
- Metrics collection and monitoring
- Web-based dashboard
- Function warm-up mechanism
- Container pooling for performance

## Project Structure

```
serverless-platform/
├── backend/           # Backend API and execution engine
├── frontend/          # Web-based dashboard
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Setup Instructions

1. Install dependencies:
   ```bash
   # Backend dependencies
   cd backend
   pip install -r requirements.txt

   # Frontend dependencies
   cd frontend
   npm install
   ```

2. Start the services:
   ```bash
   # Start backend
   cd backend
   python main.py

   # Start frontend
   cd frontend
   npm start
   ```

## Technology Stack

- Backend: Python (FastAPI)
- Frontend: React.js
- Database: MySQL
- Virtualization: Docker, gVisor
- Container Orchestration: Kubernetes

## API Documentation

The API documentation is available at `/docs` when running the backend server.

## License

MIT License 