# lecturer-locator
Find any lecturer's office in seconds — just scan their QR code.


## Tech Stack

* **Frontend:** React + TypeScript
* **Backend:** Node.js + Express + TypeScript
* **Database:** To be decided

The frontend and backend are kept separate and communicate through a simple REST API.

## Project Structure

```text
lecturer-locator/
├── frontend/               # React frontend
│   └── src/
│
├── backend/                # Express backend
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── controllers/    # Handles API requests
│   │   ├── db/             # Database access
│   │   ├── data/           # Floor plans and map data
│   │   └── app.ts          # Starts the backend
│   │
│   └── tsconfig.json
│
└── README.md
```

The structure may change as the project develops.

## How It Works

```text
React Frontend
      ↓
   REST API
      ↓
Express Backend
      ↓
   Database
```

The frontend is responsible for what the user sees and interacts with.

The backend provides lecturer information and calculates routes to offices.

## Prerequisites

Before starting, make sure you have:

* **Node.js** — install the latest LTS version from the official [Node.js website](https://nodejs.org/en/download?utm_source=chatgpt.com)
* **Git** — for cloning and working with the project

Check that Node.js and npm are installed:

```bash
node --version
npm --version
```


## Running the Project

Install and start the backend:

```bash
cd backend
npm install
npm run dev
```

The backend runs at:

```text
http://localhost:3000
```

In a separate terminal, install and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Development Approach

Keep the code simple and easy to understand.

* Avoid unnecessary libraries and complexity.
* Keep API routes small.
* Put request handling in controllers.
* Keep navigation and path-finding logic separate.
* Ask before introducing a new technology or major dependency.
