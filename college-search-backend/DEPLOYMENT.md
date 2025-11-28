# Deployment Guide

This guide covers deploying your Flask backend to various cloud platforms so it can be accessed by your GitHub Pages frontend.

## 🌐 Deployment Options

### Option 1: Render (Recommended - Free Tier Available)

Render offers a free tier perfect for student projects.

**Steps:**

1. **Create a Render account** at https://render.com

2. **Create a new Web Service**
   - Connect your GitHub repository
   - Select the backend repository/folder

3. **Configure the service:**
   ```
   Name: college-search-api
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   ```

4. **Add Environment Variables:**
   - `MONGODB_URI`: Your MongoDB connection string
   - `DATABASE_NAME`: college_scorecard
   - `SECRET_KEY`: Generate a random secret key
   - `FLASK_ENV`: production
   - `CORS_ORIGINS`: https://yourusername.github.io

5. **Deploy** - Render will automatically deploy your app

6. **Get your API URL**: `https://your-app-name.onrender.com`

**Important Notes:**
- Free tier spins down after inactivity (first request may be slow)
- Excellent for student projects
- Automatic SSL certificates

---

### Option 2: Railway (Free Credits for Students)

Railway offers $5 free credit per month.

**Steps:**

1. **Create Railway account** at https://railway.app

2. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

3. **Login and deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

4. **Add environment variables** in Railway dashboard:
   - MONGODB_URI
   - DATABASE_NAME
   - SECRET_KEY
   - CORS_ORIGINS

5. **Generate domain** in Railway dashboard

**Benefits:**
- Fast deployments
- Good free tier
- Easy GitHub integration

---

### Option 3: Heroku (Paid after Nov 2022)

Heroku no longer offers a free tier but is still a good option if you have credits.

**Steps:**

1. **Install Heroku CLI:**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login and create app:**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Add MongoDB add-on** (or use MongoDB Atlas):
   ```bash
   heroku addons:create mongolab:sandbox
   ```
   
   Or set your MongoDB Atlas URI:
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set DATABASE_NAME=college_scorecard
   heroku config:set SECRET_KEY=your_secret_key
   heroku config:set FLASK_ENV=production
   heroku config:set CORS_ORIGINS=https://yourusername.github.io
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

6. **Your API URL**: `https://your-app-name.herokuapp.com`

---

### Option 4: PythonAnywhere (Free Tier Available)

Good for simple Flask apps.

**Steps:**

1. **Create account** at https://www.pythonanywhere.com

2. **Upload your code** via dashboard or Git

3. **Create a web app:**
   - Choose Flask
   - Python 3.10+
   - Point to your `app.py`

4. **Install dependencies** in Bash console:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set environment variables** in web app settings

6. **Reload** your web app

**Note:** Free tier has some limitations on outgoing HTTP requests.

---

### Option 5: Google Cloud Run (Free Tier)

Professional option with good free tier.

**Steps:**

1. **Create `Dockerfile`:**
   ```dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   ENV PORT=8080
   CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 app:app
   ```

2. **Install Google Cloud CLI** and login

3. **Deploy:**
   ```bash
   gcloud run deploy college-search-api \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

4. **Set environment variables** in Cloud Run console

---

## 🔐 Environment Variables

For any deployment, you'll need these environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=college_scorecard
SECRET_KEY=generate-a-random-secret-key
FLASK_ENV=production
CORS_ORIGINS=https://yourusername.github.io
```

**To generate a secure SECRET_KEY:**
```python
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🗄️ MongoDB Setup (MongoDB Atlas)

Your backend needs a MongoDB database. MongoDB Atlas offers a free tier perfect for this project.

**Steps:**

1. **Create account** at https://www.mongodb.com/cloud/atlas

2. **Create a cluster:**
   - Choose Free Tier (M0)
   - Select a region close to your users

3. **Create database user:**
   - Username and password
   - Give read/write permissions

4. **Whitelist IP addresses:**
   - Add `0.0.0.0/0` to allow access from anywhere (for development)
   - Or add specific IPs of your deployment platform

5. **Get connection string:**
   - Click "Connect" -> "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

6. **Create database:**
   - Database name: `college_scorecard`
   - Create collections as needed

---

## 🚀 Connecting Frontend to Backend

Once deployed, update your frontend (React) to use the deployed API:

**In your React app (`src/config.js` or similar):**

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend-url.com/api'  // Your deployed backend URL
  : 'http://localhost:5000/api';

export default API_BASE_URL;
```

**Update CORS in backend `.env`:**
```env
CORS_ORIGINS=https://yourusername.github.io,http://localhost:3000
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend is deployed and accessible
- [ ] Environment variables are set correctly
- [ ] MongoDB connection is working
- [ ] CORS is configured with GitHub Pages URL
- [ ] Test API endpoints with curl or Postman
- [ ] Frontend can successfully call backend APIs
- [ ] SSL/HTTPS is enabled (most platforms do this automatically)

---

## 🧪 Testing Deployed API

Test your deployed API:

```bash
# Replace YOUR_API_URL with your actual deployed URL

# Health check
curl https://YOUR_API_URL/

# API health
curl https://YOUR_API_URL/api/health

# Filter schools
curl "https://YOUR_API_URL/api/schools/filter?state=CA&limit=5"

# Search schools
curl "https://YOUR_API_URL/api/schools/search?q=stanford"
```

---

## 📊 Monitoring & Logs

Most platforms provide logging:

**Render:**
```bash
# View logs in dashboard or CLI
```

**Railway:**
```bash
railway logs
```

**Heroku:**
```bash
heroku logs --tail
```

---

## 💡 Tips for Student Projects

1. **Use free tiers wisely**: Most platforms offer generous free tiers perfect for class projects

2. **MongoDB Atlas**: The M0 free tier (512MB) is usually sufficient for projects

3. **Keep your API key secure**: Never commit `.env` files to Git

4. **Use environment variables**: Keep all secrets in environment variables

5. **Monitor usage**: Check your platform's usage dashboard to avoid surprises

6. **CORS**: Make sure to update CORS settings when you deploy your frontend

7. **SSL**: All major platforms provide free SSL certificates

---

## 🐛 Common Issues

**CORS errors:**
- Make sure `CORS_ORIGINS` includes your GitHub Pages URL
- Check that your frontend is using the correct API URL

**Database connection errors:**
- Verify MongoDB URI is correct
- Check that IP whitelist includes deployment platform IPs
- Ensure database user has correct permissions

**504 Gateway Timeout:**
- Free tier services may sleep after inactivity
- First request might be slow - this is normal

**Module not found:**
- Ensure `requirements.txt` is up to date
- Check build logs for installation errors

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/2.3.x/deploying/)

---

**Need Help?** Check the logs first - they usually tell you what's wrong!
