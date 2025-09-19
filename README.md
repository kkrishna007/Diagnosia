# Diagnosia - Online Pathology Lab System

Diagnosia is a full-stack, enterprise-grade application for managing an online pathology lab. It provides a seamless experience for patients to book tests and view results, and a comprehensive portal for employees (sample collectors, lab technicians, and admins) to manage operations. The system features an AI-powered chatbot for booking and an AI interpretation generator for test results.

## Key Features

*   **Patient Portal**:
    *   User authentication (Register/Login).
    *   Browse and search a catalog of lab tests and health packages.
    *   Book appointments for home sample collection or lab visits.
    *   View appointment history and status updates (Confirmed, Sample Collected, Completed).
    *   View and download detailed, formatted test reports in PDF.
*   **Employee & Admin Portals**:
    *   Role-based access control for Admins, Lab Managers, Lab Technicians, and Sample Collectors.
    *   **Admin**: Manage users, tests, and view system-wide operational data.
    *   **Sample Collector**: View assigned tasks, manage collection schedules, and update sample status to "collected".
    *   **Lab Technician**: Access a worklist of collected samples, enter test results, and generate AI-powered interpretations.
*   **AI-Powered Assistant**:
    *   An intelligent chatbot (powered by Google Gemini) that assists users with booking tests, viewing reports, and checking appointment status.
*   **Automated Notifications**:
    *   Email notifications for key events like booking confirmation, sample collection, and report readiness.
*   **Dynamic PDF Generation**:
    *   On-the-fly generation of booking receipts and detailed, multi-page laboratory test reports.

## Technology Stack

*   **Backend**:
    *   Node.js, Express.js
    *   PostgreSQL for the database
    *   JWT (JSON Web Tokens) for authentication
    *   bcrypt.js for password hashing
    *   nodemailer for sending emails
    *   `@google/generative-ai` for AI features
*   **Frontend**:
    *   React.js, Vite
    *   Tailwind CSS for styling
    *   React Router for navigation
    *   Axios for API communication
    *   jsPDF & jspdf-autotable for PDF generation
*   **Database**:
    *   PostgreSQL with a comprehensive schema including users, roles, tests, appointments, samples, results, and more.

## Project Structure

```
.
├── Diagnosia_Backend/     # Node.js/Express REST API
│   ├── src/
│   │   ├── controllers/   # Request handling logic
│   │   ├── middleware/    # Auth and error handling
│   │   ├── models/        # Database schema and seeds
│   │   ├── routes/        # API endpoint definitions
│   │   └── agents/        # AI chatbot logic
│   └── .env.example
├── Diagnosia_Frontend/    # React patient & employee UI
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Auth state management
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Top-level page components
│   │   └── employee/      # Employee portal components and pages
│   └── vite.config.js
├── Daignosia_DB/
│   └── schema.sql         # Full database schema export
└── Diagnosia_Docs/
    ├── diagnosia_schema.md
    └── Diagnosia_userStories.md
```

## Getting Started

### Prerequisites

*   Node.js v18+
*   npm v9+
*   PostgreSQL v13+

### 1. Configure Environment

The project uses `.env` files for configuration. Copy the examples in both the frontend and backend directories.

**Backend:**
```bash
cp Diagnosia_Backend/.env.example Diagnosia_Backend/.env
```
Edit `Diagnosia_Backend/.env` with your details:
```env
PORT=5000
DATABASE_URL=postgres://YOUR_USER:YOUR_PASSWORD@localhost:5432/diagnosia
JWT_SECRET=a-very-strong-and-secret-key-for-jwt
GEMINI_API_KEY=your_google_ai_studio_api_key

# Optional for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL="Diagnosia Lab <your-email@gmail.com>"
```

**Frontend:**
The frontend defaults to using a proxy. No `.env` file is needed unless you change the backend port.

### 2. Set Up the Database

You'll need `psql`, the PostgreSQL command-line tool.

```bash
# 1. Create a user and a database
psql -c "CREATE DATABASE diagnosia;"

# 2. Initialize the schema
psql -d diagnosia -f Diagnosia_Backend/src/models/init.sql

# 3. Seed roles and sample data (includes default admin user)
psql -d diagnosia -f Diagnosia_Backend/src/models/seed_roles.sql
psql -d diagnosia -f Diagnosia_Backend/src/models/seed.sql
```
This seeds the database with several users, including an admin.

*   **Admin Login**: `admin@diagnosia.test` / `Admin@1234` (Use the `/admin/login` page)

### 3. Install Dependencies

Run `npm install` in both the frontend and backend directories.

```bash
# In the root directory, install backend dependencies
cd Diagnosia_Backend
npm install

# Then, install frontend dependencies
cd ../Diagnosia_Frontend
npm install
```

### 4. Run The Application

You will need two separate terminals to run the backend and frontend servers.

**Terminal 1: Start the Backend Server**
```bash
cd Diagnosia_Backend
npm run dev
```
The backend will be running on `http://localhost:5000`.

**Terminal 2: Start the Frontend Server**
```bash
cd Diagnosia_Frontend
npm run dev
```
The frontend will be running on `http://localhost:3000`. Open this URL in your browser. The Vite dev server will automatically proxy API requests from the frontend to the backend.