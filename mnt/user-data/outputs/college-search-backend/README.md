# College Search Platform - Backend API

A comprehensive Flask-based REST API for the College Search platform using MongoDB and U.S. Department of Education's College Scorecard data.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Usage Examples](#usage-examples)

## ✨ Features

- **School Filtering**: Filter universities by cost, outcomes, location, major, and more
- **School Comparison**: Compare multiple schools side-by-side
- **Program Analytics**: ROI and salary trends by field of study
- **Geographic Visualization**: State-level aggregations and statistics
- **Search**: Full-text search for schools by name
- **RESTful API**: Clean, documented REST API endpoints
- **MongoDB Integration**: Optimized schema design for complex educational data

## 🛠 Tech Stack

- **Backend Framework**: Flask 3.0
- **Database**: MongoDB (with PyMongo)
- **CORS**: Flask-CORS
- **Environment Management**: python-dotenv
- **Production Server**: Gunicorn

## 📦 Installation

### Prerequisites

- Python 3.8+
- MongoDB Atlas account (or local MongoDB instance)
- pip package manager

### Steps

1. **Clone the repository**
   ```bash
   cd college-search-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB credentials
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

   The API will be available at `http://localhost:5000`

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=college_scorecard

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here

# CORS Configuration (add your GitHub Pages URL)
CORS_ORIGINS=http://localhost:3000,https://yourusername.github.io
```

## 🌐 API Endpoints

### Health Check

- **GET** `/` - Basic health check
- **GET** `/api/health` - Detailed health status
- **GET** `/api/docs` - API documentation

### Schools Endpoints

#### Filter Schools
```
GET /api/schools/filter
```

**Query Parameters:**
- `state` (string): State abbreviation (e.g., 'CA', 'NY')
- `cost_min` (number): Minimum average net price
- `cost_max` (number): Maximum average net price
- `earnings_min` (number): Minimum median earnings (10 years)
- `admission_rate_max` (number): Maximum admission rate (0-1)
- `completion_rate_min` (number): Minimum completion rate (0-1)
- `ownership` (number): 1=public, 2=private nonprofit, 3=private for-profit
- `size_min` (number): Minimum student size
- `size_max` (number): Maximum student size
- `degree_level` (number): 1=certificate, 2=associate, 3=bachelor, 4=graduate
- `major` (string): Major field (e.g., 'computer', 'engineering')
- `page` (number): Page number (default 1)
- `limit` (number): Results per page (default 20, max 100)
- `sort_by` (string): Field to sort by
- `sort_order` (string): 'asc' or 'desc'

**Example:**
```bash
curl "http://localhost:5000/api/schools/filter?state=CA&cost_max=30000&major=computer"
```

#### Search Schools
```
GET /api/schools/search?q=stanford&limit=20
```

#### Compare Schools
```
GET /api/schools/compare?school_ids=123456,789012&year=2024
```

#### Get School Details
```
GET /api/schools/<school_id>?year=2024&include_history=true
```

#### Get States List
```
GET /api/schools/states
```

### Programs Endpoints

#### Get Program Trends
```
GET /api/programs/trends?cip_code=1102&start_year=2015&end_year=2024
```

#### Compare Programs Across Schools
```
POST /api/programs/compare
Content-Type: application/json

{
  "cip_code": "1102",
  "school_ids": [123456, 789012, 456789],
  "year": 2024
}
```

#### Get Available Majors
```
GET /api/programs/majors?year=2024
```

#### Get CIP Codes Reference
```
GET /api/programs/cip-codes
```

#### Get School Programs
```
GET /api/programs/school/<school_id>?year=2024
```

### Aggregations Endpoints

#### State Aggregations
```
GET /api/aggregations/state?state=CA
```

#### ROI Calculations
```
GET /api/aggregations/roi?state=CA&major=computer&year=2024
```

#### Earnings Distribution
```
GET /api/aggregations/earnings-distribution?year=2024&major=computer
```

#### Cost vs Earnings Scatter Data
```
GET /api/aggregations/cost-vs-earnings?year=2024&state=CA&limit=200
```

#### Completion Rates
```
GET /api/aggregations/completion-rates?group_by=state&year=2024
```

## 🗄 Database Schema

### Collections

The backend uses 5 MongoDB collections:

1. **schools** (~5,430 documents)
   - Core institution data
   - Latest year snapshot for fast filtering
   - Location, ownership, degree types

2. **admissions_student** (~162,900 documents)
   - Historical admissions statistics
   - Student demographics
   - Retention rates

3. **academics_programs** (~162,900 documents)
   - Programs offered by year
   - Major percentages
   - Degree availability

4. **costs_aid_completion** (~162,900 documents)
   - Costs and financial aid
   - Completion rates
   - Post-graduation earnings
   - Loan repayment data

5. **programs_field_of_study** (~650,000 documents)
   - Program-specific earnings
   - CIP code details
   - Field of study outcomes

### Key Indexes

The database includes optimized indexes for:
- School filtering (state, cost, earnings, admission rate)
- Text search (school name)
- Program filtering (major percentages)
- Geographic queries (lat/lon)
- Historical queries (year)

## 🚀 Deployment

### Option 1: Heroku

1. **Install Heroku CLI**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set DATABASE_NAME=college_scorecard
   heroku config:set SECRET_KEY=your_secret_key
   ```

4. **Create Procfile**
   ```
   web: gunicorn app:app
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 2: Railway

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and initialize**
   ```bash
   railway login
   railway init
   ```

3. **Add environment variables** in Railway dashboard

4. **Deploy**
   ```bash
   railway up
   ```

### Option 3: Render

1. Create a `render.yaml`:
   ```yaml
   services:
     - type: web
       name: college-search-api
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: gunicorn app:app
       envVars:
         - key: MONGODB_URI
           sync: false
         - key: DATABASE_NAME
           value: college_scorecard
   ```

2. Connect your GitHub repository to Render

3. Configure environment variables in Render dashboard

### GitHub Pages Integration

Since GitHub Pages only hosts static sites, your backend needs to be deployed separately. Update your frontend to point to your deployed API:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com/api'
  : 'http://localhost:5000/api';
```

## 📖 Usage Examples

### Python Example

```python
import requests

# Filter schools
response = requests.get(
    'http://localhost:5000/api/schools/filter',
    params={
        'state': 'CA',
        'cost_max': 30000,
        'major': 'computer',
        'limit': 10
    }
)
schools = response.json()
print(f"Found {schools['total']} schools")
```

### JavaScript/React Example

```javascript
// Fetch and filter schools
async function fetchSchools() {
  const response = await fetch(
    'http://localhost:5000/api/schools/filter?' + 
    new URLSearchParams({
      state: 'CA',
      cost_max: 30000,
      major: 'computer',
      limit: 10
    })
  );
  
  const data = await response.json();
  console.log(`Found ${data.total} schools`);
  return data.results;
}

// Compare schools
async function compareSchools(schoolIds) {
  const response = await fetch(
    `http://localhost:5000/api/schools/compare?school_ids=${schoolIds.join(',')}`
  );
  
  return await response.json();
}

// Get program trends
async function getProgramTrends(cipCode) {
  const response = await fetch(
    `http://localhost:5000/api/programs/trends?cip_code=${cipCode}&start_year=2015&end_year=2024`
  );
  
  return await response.json();
}
```

### cURL Examples

```bash
# Filter schools in California with CS programs
curl "http://localhost:5000/api/schools/filter?state=CA&major=computer&cost_max=30000"

# Search for a school
curl "http://localhost:5000/api/schools/search?q=stanford"

# Get school details
curl "http://localhost:5000/api/schools/123456?include_history=true"

# Compare schools
curl "http://localhost:5000/api/schools/compare?school_ids=123456,789012"

# Get state aggregations
curl "http://localhost:5000/api/aggregations/state?state=CA"

# Get ROI data
curl "http://localhost:5000/api/aggregations/roi?major=computer&year=2024"
```

## 🔍 Data Import

To populate your MongoDB database with College Scorecard data, you'll need to:

1. Download the College Scorecard data from https://collegescorecard.ed.gov/data/
2. Create Python scripts to parse and transform the CSV files
3. Import data into MongoDB following the schema design

See the `/data` directory for import scripts (to be created separately).

## 📝 Notes

- All monetary values are in USD
- Rates (admission, completion) are stored as decimals (0-1, not percentages)
- The `latest` field in schools collection contains the most recent year's snapshot for fast filtering
- Historical data is available in time-series collections for trend analysis

## 🤝 Contributing

This is a class project for Advanced Database Systems. Contributions should follow the project guidelines.

## 📄 License

Educational use only - College Scorecard data is public domain.

## 👥 Team

- Humphry Amoakone
- Elisa Rosnes

## 📧 Support

For issues or questions, please contact the development team.

---

**Note**: Remember to update CORS_ORIGINS in your `.env` file with your GitHub Pages URL before deploying your frontend!
