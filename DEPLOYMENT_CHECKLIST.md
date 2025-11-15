# ✅ Deployment Checklist

## 📋 Pre-Deployment

### **1. Code Preparation**
- [ ] All code committed to Git
- [ ] `.gitignore` file created
- [ ] `.env` files NOT committed (only `.env.example`)
- [ ] Backend `package.json` has `"start": "node server.js"`
- [ ] Frontend build works: `cd Frontend && npm run build`

### **2. S3 Configuration**
- [ ] S3 bucket CORS configured (see `S3_CORS_FIX.md`)
- [ ] S3 bucket is public or has proper access policies
- [ ] Test S3 URLs are accessible

### **3. Database**
- [ ] MySQL database is accessible from internet
- [ ] Database credentials ready
- [ ] Database tables created

---

## 🚀 Deployment Steps

### **Option A: Render.com (Recommended)**

#### **Backend Deployment**
- [ ] Create Render account
- [ ] Create new Web Service
- [ ] Connect GitHub repo
- [ ] Set root directory: `Backend`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add environment variables (see below)
- [ ] Deploy and wait
- [ ] Copy backend URL

#### **Frontend Deployment**
- [ ] Create new Static Site
- [ ] Connect GitHub repo
- [ ] Set root directory: `Frontend`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add `VITE_API_URL` environment variable
- [ ] Deploy and wait
- [ ] Copy frontend URL

#### **Update Backend CORS**
- [ ] Update `FRONTEND_URL` in backend env vars
- [ ] Update CSP in `Backend/server.js`
- [ ] Commit and push changes
- [ ] Wait for auto-redeploy

---

### **Option B: Quick Test with ngrok**

- [ ] Install ngrok: https://ngrok.com/download
- [ ] Start backend: `cd Backend && node server.js`
- [ ] Run ngrok: `ngrok http 3005`
- [ ] Copy ngrok URL
- [ ] Update frontend `.env`: `VITE_API_URL=https://your-ngrok-url.ngrok.io/api/v1`
- [ ] Start frontend: `cd Frontend && npm run dev`
- [ ] Test on phone using ngrok URL

---

## 🔧 Environment Variables

### **Backend (Render.com)**
```
NODE_ENV=production
PORT=3005
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=ar_business_card
DB_PORT=3306
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=ar-business-card-sam
FRONTEND_URL=https://your-frontend.onrender.com
```

### **Frontend (Render.com)**
```
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

---

## 🧪 Testing

### **After Deployment**
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can create project
- [ ] Can upload Card.jpg
- [ ] Can upload Video.mp4
- [ ] Can view AR page
- [ ] Camera opens on phone
- [ ] AR detection works
- [ ] Video plays when card detected

---

## 🐛 Troubleshooting

### **Backend won't start**
- Check logs in Render dashboard
- Verify all environment variables are set
- Check database connection

### **Frontend shows API errors**
- Check `VITE_API_URL` is correct
- Check backend CORS settings
- Check backend is running

### **AR page won't load**
- Check S3 CORS configuration
- Check CSP headers in backend
- Check browser console for errors

### **Camera won't open**
- HTTPS is required for camera access
- Check browser permissions
- Try different browser

### **Video won't play**
- Check S3 CORS
- Check video file format (MP4 recommended)
- Check browser console

---

## 📱 Testing on Phone

### **Steps:**
1. Open browser on phone
2. Go to your frontend URL
3. Register/Login
4. Create project
5. Upload files
6. Click "View AR"
7. Allow camera access
8. Point at card
9. Video should play! 🎉

---

## 🎉 Success Criteria

- ✅ Website accessible from phone
- ✅ HTTPS enabled (automatic with Render)
- ✅ Camera access works
- ✅ AR detection works
- ✅ Video plays smoothly
- ✅ No CORS errors
- ✅ No CSP errors

---

## 📊 Deployment Status

**Backend:** ⬜ Not Started | 🟡 In Progress | ✅ Complete
**Frontend:** ⬜ Not Started | 🟡 In Progress | ✅ Complete
**Testing:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## 🎊 Tamil Checklist

### **Deployment Pannanum:**
- [ ] GitHub la code push pannunga
- [ ] Render.com account create pannunga
- [ ] Backend deploy pannunga
- [ ] Frontend deploy pannunga
- [ ] Environment variables add pannunga
- [ ] S3 CORS fix pannunga
- [ ] Phone la test pannunga

### **Test Pannanum:**
- [ ] Website open aagudha?
- [ ] Login work aagudha?
- [ ] File upload aagudha?
- [ ] Camera open aagudha?
- [ ] AR work aagudha?
- [ ] Video play aagudha?

**Ellam work aanaa - SUCCESS! 🎉**

---

## 📞 Need Help?

If stuck, check:
1. Render logs (Dashboard → Logs)
2. Browser console (F12)
3. Network tab (F12 → Network)
4. `DEPLOYMENT_GUIDE.md` for detailed steps

