# Diagnosia Backend

This is the backend for the Diagnosia Online Pathology Lab Booking System.

## Stack
- Node.js
- Express
- PostgreSQL

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Configure your `.env` file with your PostgreSQL credentials, JWT secret, and Gemini API key.
   - Add `GEMINI_API_KEY=your_key_here` to enable AI interpretation generation.
3. Start the server:
   ```sh
   npm run dev
   ```

## API Endpoints
- `/api/auth` — Register, login, get current user
- `/api/tests` — List/search tests, get test details, categories
- `/api/bookings` — Book, list, cancel, get slots
- `/api/users` — Appointments, test results, update profile
- `/api/chatbot` — Chatbot and FAQs
- `/api/employee/lab/generate-interpretation` — Generates interpretation and recommendation (requires GEMINI_API_KEY)

## Database
See `Diagnosia_Docs/diagnosia_schema.md` for schema details.
