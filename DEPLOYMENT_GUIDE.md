# 🚀 Deployment Guide - AR Business Card

## 📱 Why Deploy?

- ✅ Test AR on your phone (PC doesn't have camera)
- ✅ Share with clients
- ✅ Real-world testing
- ✅ HTTPS (required for camera access)

---

## 🎯 Recommended: Render.com (Free Tier)

### **What You'll Deploy:**
1. **Backend** → Render Web Service
2. **Frontend** → Render Static Site
3. **Database** → Keep using your existing MySQL (or use Render MySQL)

---

## 📋 Step-by-Step Deployment

### **Step 1: Prepare Your Code**

#### **1.1 Push to GitHub**
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/ar-business-card.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Deploy Backend to Render**

#### **2.1 Create Render Account**
1. Go to: https://render.com
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**

#### **2.2 Configure Backend Service**
- **Repository:** Select your GitHub repo
- **Name:** `ar-business-card-backend`
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** `Backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

#### **2.3 Add Environment Variables**
Click **"Environment"** and add:

```
NODE_ENV=production
PORT=3005
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# MySQL Database
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=ar_business_card
DB_PORT=3306

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=ar-business-card-sam

# CORS
FRONTEND_URL=https://your-frontend-url.onrender.com
```

#### **2.4 Deploy**
- Click **"Create Web Service"**
- Wait 5-10 minutes for deployment
- Copy your backend URL: `https://ar-business-card-backend.onrender.com`

---

### **Step 3: Deploy Frontend to Render**

#### **3.1 Create Static Site**
1. Click **"New +"** → **"Static Site"**
2. Select your GitHub repo

#### **3.2 Configure Frontend**
- **Name:** `ar-business-card-frontend`
- **Branch:** `main`
- **Root Directory:** `Frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

#### **3.3 Add Environment Variables**
```
VITE_API_URL=https://ar-business-card-backend.onrender.com/api/v1
```

#### **3.4 Deploy**
- Click **"Create Static Site"**
- Wait 5-10 minutes
- Copy your frontend URL: `https://ar-business-card-frontend.onrender.com`

---

### **Step 4: Update Backend CORS**

Go back to your **Backend service** on Render:
1. Click **"Environment"**
2. Update `FRONTEND_URL`:
```
FRONTEND_URL=https://ar-business-card-frontend.onrender.com
```
3. Click **"Save Changes"**
4. Service will auto-redeploy

---

### **Step 5: Update Backend CSP Headers**

You need to update `Backend/server.js` to allow your production URLs:

```javascript
// In Backend/server.js, update helmet CSP:
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": [
        "'self'", 
        "http://localhost:5173", 
        "http://localhost:3005",
        "https://ar-business-card-frontend.onrender.com" // Add this
      ],
      "img-src": ["'self'", "data:", "https:", "http:"],
      "media-src": ["'self'", "https:", "http:"],
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://aframe.io"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  }
}));
```

Then commit and push:
```bash
git add .
git commit -m "Update CSP for production"
git push
```

Render will auto-deploy the changes!

---

## 🧪 Testing on Your Phone

### **Step 1: Open on Phone**
1. Open browser on your phone
2. Go to: `https://ar-business-card-frontend.onrender.com`
3. Login/Register
4. Create a project
5. Upload Card.jpg and Video.mp4

### **Step 2: Test AR**
1. Click "View AR"
2. Click "Tap to Start AR"
3. Allow camera access
4. Point at your business card
5. Video should play! 🎉

---

## 💰 Cost Breakdown

### **Render.com Free Tier:**
- ✅ Backend: Free (spins down after 15 min inactivity)
- ✅ Frontend: Free (always on)
- ✅ 750 hours/month free
- ⚠️ First request after spin-down takes 30-60 seconds

### **Upgrade Options:**
- **Starter ($7/month):** Always on, faster
- **Standard ($25/month):** More resources

---

## 🎉 Tamil Summary

**Deployment Steps:**
1. ✅ GitHub la code push pannunga
2. ✅ Render.com account create pannunga
3. ✅ Backend deploy pannunga (Web Service)
4. ✅ Frontend deploy pannunga (Static Site)
5. ✅ Environment variables add pannunga
6. ✅ Phone la test pannunga!

**Benefits:**
- ✅ Phone la camera use panni test pannalam
- ✅ Free tier use pannalam
- ✅ HTTPS automatic-a varum
- ✅ Auto-deploy from GitHub

---

## 🚨 Important Notes

### **1. S3 CORS**
Make sure you added CORS to your S3 bucket (see `S3_CORS_FIX.md`)

### **2. MySQL Database**
Your MySQL database should be accessible from Render servers. Options:
- Use your existing MySQL (if publicly accessible)
- Use Render MySQL (paid)
- Use PlanetScale (free tier)

### **3. First Load**
Free tier spins down after 15 min. First request takes 30-60 seconds to wake up.

---

## 📱 Alternative: Quick Test with ngrok

If you just want to test quickly without full deployment:

```bash
# Install ngrok
# Download from: https://ngrok.com/download

# Start your backend
cd Backend
node server.js

# In another terminal, expose it
ngrok http 3005
```

Copy the ngrok URL and use it on your phone!

---

## ✅ Next Steps

1. **Push code to GitHub**
2. **Deploy to Render**
3. **Test on phone**
4. **Share with clients!** 🎉

