# Quick Start Guide

Get your College Search API up and running in 5 minutes!

## 📋 Prerequisites

- Python 3.8+ installed
- MongoDB Atlas account (free tier)
- Git installed

## 🚀 5-Minute Setup

### Step 1: Get MongoDB Connection String (2 mins)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you haven't)
3. Click "Connect" -> "Connect your application"
4. Copy the connection string (looks like `mongodb+srv://...`)
5. Replace `<password>` with your database password

### Step 2: Clone and Configure (1 min)

```bash
# Navigate to your project folder

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

### Step 3: Edit .env File (1 min)

Open `.env` and add your MongoDB URI:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/
DATABASE_NAME=college_scorecard
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000,https://yourusername.github.io
```

### Step 4: Run the Server (30 seconds)

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

### Step 5: Test It (30 seconds)

Open your browser and go to:
- http://localhost:5000 (should see `{"status": "online"}`)
- http://localhost:5000/api/health (should see database status)
- http://localhost:5000/api/docs (API documentation)

---

## 🎯 Next Steps

### Add Sample Data (Optional)

If you have College Scorecard data:

```bash
python import_data.py
```

### Test the API

```bash
python test_api.py
```

### Start Frontend Development

Your backend is ready! Now you can:
1. Build your React frontend
2. Connect it to `http://localhost:5000/api`
3. Use the API endpoints documented at `/api/docs`

---

## 📖 API Examples

### Filter Schools
```bash
curl "http://localhost:5000/api/schools/filter?state=CA&cost_max=30000&limit=5"
```

### Search Schools
```bash
curl "http://localhost:5000/api/schools/search?q=stanford"
```

### Get States List
```bash
curl "http://localhost:5000/api/schools/states"
```

### Get Available Majors
```bash
curl "http://localhost:5000/api/programs/majors"
```

---

## 🐛 Troubleshooting

**"ModuleNotFoundError"**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**"Connection refused" or Database errors**
- Check your MongoDB URI in `.env`
- Make sure your MongoDB cluster is running
- Verify IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for testing)

**"Port already in use"**
```bash
# Change port in app.py or kill the process using port 5000
# On macOS/Linux:
lsof -ti:5000 | xargs kill -9
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**CORS errors from frontend**
- Make sure your frontend URL is in `CORS_ORIGINS` in `.env`
- Restart the backend after changing `.env`

---

## 📁 Project Structure

```
college-search-backend/
├── app.py                      # Main Flask application
├── database.py                 # Database connection
├── models.py                   # Data models
├── routes_schools.py           # School endpoints
├── routes_programs.py          # Program endpoints
├── routes_aggregations.py      # Analytics endpoints
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (create this)
├── .env.example               # Environment template
├── test_api.py                # API tests
├── import_data.py             # Data import script
├── README.md                  # Full documentation
├── DEPLOYMENT.md              # Deployment guide
└── Procfile                   # For Heroku deployment
```

---

## ✅ Ready to Deploy?

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to:
- Render (Recommended - Free)
- Railway (Free credits)
- Heroku
- PythonAnywhere
- Google Cloud Run

---

## 💻 Development Workflow

1. **Make changes** to your code
2. **Test locally** with `python app.py`
3. **Test API** with `python test_api.py` or curl
4. **Commit changes** to Git
5. **Deploy** to your chosen platform

---

## 📚 Learn More

- [Full README](README.md) - Complete documentation
- [API Documentation](http://localhost:5000/api/docs) - When server is running
- [Deployment Guide](DEPLOYMENT.md) - Deploy to production

---

## 🎓 For Your Team

**Quick Team Setup:**

1. One person deploys the backend
2. Share the deployed API URL with team
3. Everyone uses the same API URL in their frontend
4. No need for everyone to run the backend locally!

**Environment Variables Team Members Need:**
```env
# In your React .env
REACT_APP_API_URL=https://your-deployed-backend.com/api
```

---

**Questions?** Check the [README.md](README.md) for more details!

Happy coding! 🚀
