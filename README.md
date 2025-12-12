# College Search Platform - Frontend

A modern, interactive React + TypeScript frontend for the College Search Platform with C3.js visualizations.

## 📋 Features

- **School Search** - Search for University by name
- **Smart School Filter** - Filter by location, major, and institution type
- **School Exploration** - Quickly scan through key stats like price, admission rate, completion rate, and size
- **Side-by-Side Comparison** - Compare up to 10 schools stats at once
- **Interactive Visualizations** - ROI charts, program trends, state comparisons
-

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Backend API running (see backend README)

## Backend Setup

### Navigate to Backend

```bash
cd college-search-backend
```

### Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Add the following MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://Elisamawby18_db_user:vt90U6Cs5lKmwpME@cscapp.uks39sd.mongodb.net/
DATABASE_NAME=college_scorecard
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-change-later
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Start Backend Server

```bash
python app.py
```

## Front End Installation

```bash
# Navigate to frontend directory
cd college-search-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

Add your backend URL:

```env
REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```
## 🐛 Troubleshooting

### CORS Errors
- Ensure backend has correct CORS_ORIGINS in `.env`
- Check REACT_APP_API_URL points to correct backend

### Charts Not Rendering
- Verify C3.js CSS is loaded in `public/index.html`
- Check browser console for errors
- Ensure data is not empty

### Build Errors
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node -v` (should be 16+)