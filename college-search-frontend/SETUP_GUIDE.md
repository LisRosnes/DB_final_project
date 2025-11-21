# Complete Setup Guide - College Search Platform

This guide will help you set up both the backend and frontend for the College Search Platform.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Python 3.8+ installed
- ✅ Node.js 16+ installed
- ✅ npm or yarn package manager
- ✅ MongoDB Atlas account (free tier)
- ✅ Git installed
- ✅ Code editor (VS Code recommended)

## 🎯 Setup Overview

```
1. Set up MongoDB Atlas (5 min)
2. Set up Backend API (10 min)
3. Set up Frontend (5 min)
4. Test Everything (5 min)
Total: ~25 minutes
```

---

## Part 1: MongoDB Atlas Setup (5 min)

### Step 1.1: Create MongoDB Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Click "Build a Database"
4. Choose **FREE** tier (M0)
5. Select a cloud provider and region (choose closest to you)
6. Click "Create"

### Step 1.2: Create Database User

1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. Username: `college_user`
4. Password: Generate a strong password (save this!)
5. User Privileges: "Read and write to any database"
6. Click "Add User"

### Step 1.3: Whitelist IP Address

1. Go to "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Enter `0.0.0.0/0`
5. Click "Confirm"

### Step 1.4: Get Connection String

1. Go to "Database" in left menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. It looks like: `mongodb+srv://college_user:<password>@cluster0.xxxxx.mongodb.net/`
6. Replace `<password>` with your actual password

---

## Part 2: Backend Setup (10 min)

### Step 2.1: Navigate to Backend

```bash
cd college-search-backend
```

### Step 2.2: Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Step 2.3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2.4: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Add your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://college_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/
DATABASE_NAME=college_scorecard
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-change-later
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Step 2.5: Start Backend Server

```bash
python app.py
```

You should see:
```
🚀 College Search API Starting...
📍 Host: http://localhost:5000
🔧 Debug Mode: True
📚 API Docs: http://localhost:5000/api/docs
```

### Step 2.6: Test Backend

Open another terminal and test:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Should return JSON with database status
```

**Keep this terminal running!**

---

## Part 3: Frontend Setup (5 min)

### Step 3.1: Open New Terminal

Keep the backend running, open a new terminal window.

### Step 3.2: Navigate to Frontend

```bash
cd college-search-frontend
```

### Step 3.3: Install Dependencies

```bash
npm install
```

This will take a few minutes to install all packages.

### Step 3.4: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Add your backend URL:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3.5: Start Frontend Server

```bash
npm start
```

Your browser should automatically open to `http://localhost:3000`

---

## Part 4: Testing Everything (5 min)

### Test 4.1: Frontend Loads

- ✅ Browser opens to http://localhost:3000
- ✅ You see "College Search" in the navbar
- ✅ The page loads without errors

### Test 4.2: API Connection

1. Open browser console (F12)
2. Look for "API Request" messages
3. No errors should appear

### Test 4.3: Try Filtering

1. In the filter panel, select a state (e.g., "California")
2. Click "Apply Filters"
3. Schools should load below

### Test 4.4: Try Navigation

1. Click "Compare" in navbar
2. Click "Analytics" in navbar
3. Click "About" in navbar
4. All pages should load

---

## 🎉 Success!

If all tests pass, you're ready to use the College Search Platform!

---

## 🔧 Troubleshooting

### Backend Issues

**"ModuleNotFoundError"**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**"Connection refused" or Database errors**
- Check your MongoDB URI in `.env`
- Verify IP whitelist in MongoDB Atlas (0.0.0.0/0)
- Make sure you replaced `<password>` with actual password

**"Port 5000 already in use"**
```bash
# On macOS/Linux
lsof -ti:5000 | xargs kill -9

# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Issues

**"npm ERR!"**
```bash
# Clear npm cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

**"CORS errors"**
- Check backend `.env` has `CORS_ORIGINS=http://localhost:3000`
- Restart backend after changing `.env`
- Check frontend `.env` has correct API URL

**"Charts not rendering"**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors
- Verify C3.js CSS is loaded (view page source)

**"No data showing"**
- This is normal if your database is empty
- You need to import College Scorecard data
- See "Data Import" section below

---

## 📊 Data Import (Optional but Recommended)

### Option 1: Use Sample Data

If you just want to test the app, you can use a small sample dataset:

1. Download sample data from [link to be provided]
2. Use `import_data.py` script
3. Follow instructions in backend README

### Option 2: Full Dataset

To import the complete College Scorecard data:

1. Download from https://collegescorecard.ed.gov/data/
2. Customize `import_data.py` for your data structure
3. Run: `python import_data.py`
4. This may take 30-60 minutes for full dataset

**Note:** The app will work without data, but won't show any results.

---

## 🚀 Next Steps

### For Development

1. **Read the Documentation**
   - Backend README for API details
   - Frontend README for component docs

2. **Explore the Code**
   - Backend: Start with `app.py` and `models.py`
   - Frontend: Start with `src/App.tsx` and `src/pages/Home.tsx`

3. **Make Changes**
   - Both servers auto-reload on file changes
   - Backend: Just save Python files
   - Frontend: Just save TypeScript/React files

### For Deployment

See the DEPLOYMENT.md guide in the backend folder for detailed deployment instructions.

**Quick Deploy Options:**
- Backend: Render (free, recommended)
- Frontend: GitHub Pages (free)
- Database: MongoDB Atlas (free tier)

Total cost: **$0** 🎉

---

## 📚 Useful Commands

### Backend

```bash
# Start server
python app.py

# Run tests
python test_api.py

# Import data
python import_data.py
```

### Frontend

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Deploy to GitHub Pages
npm run deploy
```

---

## 💡 Tips

1. **Keep both terminals open** - Backend and frontend need to run simultaneously
2. **Use browser dev tools** - F12 to see console logs and network requests
3. **Check API endpoints** - Visit http://localhost:5000/api/docs
4. **Save your work** - Use Git to commit changes regularly
5. **Ask for help** - Check the README files or reach out to team

---

## 📞 Support

Having issues? Check these resources:

1. **Backend README** - API documentation
2. **Frontend README** - Component documentation
3. **MongoDB Docs** - https://docs.mongodb.com/
4. **React Docs** - https://reactjs.org/
5. **C3.js Docs** - https://c3js.org/

---

**Happy Coding!** 🎓

Built with ❤️ by Humphry Amoakone & Elisa Rosnes
