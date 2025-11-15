# 🚀 Quick Test with ngrok (5 Minutes!)

## 🎯 Why ngrok?

- ✅ **Fastest way to test** (no deployment needed)
- ✅ **Free tier available**
- ✅ **HTTPS automatic** (camera works!)
- ✅ **Test on phone immediately**
- ⚠️ **Temporary URL** (changes every restart)

---

## 📋 Step-by-Step Guide

### **Step 1: Install ngrok**

#### **Windows:**
1. Download: https://ngrok.com/download
2. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)
3. Add to PATH or use full path

#### **Or use Chocolatey:**
```powershell
choco install ngrok
```

---

### **Step 2: Sign Up (Free)**

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up (free account)
3. Copy your authtoken
4. Run:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

---

### **Step 3: Start Backend**

```bash
cd Backend
node server.js
```

**Wait for:**
```
✅ Server running on port 3005
✅ MySQL Connected
```

---

### **Step 4: Start ngrok**

**Open NEW terminal:**
```bash
ngrok http 3005
```

**You'll see:**
```
Session Status                online
Account                       your-email@example.com
Forwarding                    https://abc123.ngrok.io -> http://localhost:3005
```

**Copy the HTTPS URL:** `https://abc123.ngrok.io`

---

### **Step 5: Update Frontend**

**Create/Edit:** `Frontend/.env`

```env
VITE_API_URL=https://abc123.ngrok.io/api/v1
```

**Replace `abc123` with your actual ngrok URL!**

---

### **Step 6: Start Frontend**

```bash
cd Frontend
npm run dev
```

**You'll see:**
```
Local:   http://localhost:5173
```

---

### **Step 7: Expose Frontend (Optional)**

If you want to access frontend from phone too:

**Open ANOTHER terminal:**
```bash
ngrok http 5173
```

**Copy the frontend HTTPS URL:** `https://xyz789.ngrok.io`

---

### **Step 8: Test on Phone!**

#### **Option A: Frontend on PC, Backend on ngrok**
1. Make sure phone and PC are on **same WiFi**
2. Find your PC's IP: `ipconfig` (look for IPv4)
3. On phone, open: `http://YOUR_PC_IP:5173`
4. Backend calls will go through ngrok (HTTPS)

#### **Option B: Both on ngrok**
1. On phone, open: `https://xyz789.ngrok.io` (frontend ngrok URL)
2. Everything works through HTTPS!

---

## 🧪 Testing AR

1. **Open website on phone**
2. **Register/Login**
3. **Create project**
4. **Upload Card.jpg and Video.mp4**
5. **Click "View AR"**
6. **Click "Tap to Start AR"**
7. **Allow camera access**
8. **Point at card → Video plays!** 🎉

---

## 🔧 Troubleshooting

### **ngrok command not found**
```bash
# Use full path
C:\ngrok\ngrok.exe http 3005
```

### **Backend CORS error**
Update `Backend/server.js` CORS to allow ngrok:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3005',
    /\.ngrok\.io$/,  // Allow all ngrok URLs
    /\.ngrok-free\.app$/  // New ngrok domain
  ],
  credentials: true
};
```

### **Camera won't open**
- Make sure you're using **HTTPS** ngrok URL
- Check browser permissions
- Try Chrome on phone

### **Video CORS error**
- Fix S3 CORS (see `S3_CORS_FIX.md`)

---

## 💡 Pro Tips

### **1. Keep ngrok Running**
- Don't close ngrok terminal
- URL changes if you restart ngrok
- Free tier: 1 hour session limit (just restart)

### **2. Update Frontend .env**
- Every time ngrok restarts, URL changes
- Update `VITE_API_URL` in `Frontend/.env`
- Restart frontend: `npm run dev`

### **3. Use Static Domain (Paid)**
- ngrok paid plan: $8/month
- Get permanent URL
- No need to update .env every time

---

## 📊 Quick Command Reference

### **Start Everything:**

**Terminal 1 - Backend:**
```bash
cd Backend
node server.js
```

**Terminal 2 - ngrok Backend:**
```bash
ngrok http 3005
# Copy HTTPS URL
```

**Terminal 3 - Update Frontend:**
```bash
cd Frontend
# Edit .env with ngrok URL
npm run dev
```

**Terminal 4 - ngrok Frontend (Optional):**
```bash
ngrok http 5173
# Copy HTTPS URL for phone
```

---

## 🎉 Tamil Guide

### **Steps:**
1. ✅ ngrok download pannunga
2. ✅ Backend start pannunga (`node server.js`)
3. ✅ ngrok start pannunga (`ngrok http 3005`)
4. ✅ ngrok URL copy pannunga
5. ✅ Frontend `.env` la paste pannunga
6. ✅ Frontend start pannunga (`npm run dev`)
7. ✅ Phone la open pannunga
8. ✅ AR test pannunga!

### **Benefits:**
- ✅ 5 minutes la ready!
- ✅ Free!
- ✅ HTTPS automatic!
- ✅ Phone la test pannalam!

---

## ⚡ Fastest Method (Summary)

```bash
# 1. Start backend
cd Backend && node server.js

# 2. In new terminal, start ngrok
ngrok http 3005
# Copy URL: https://abc123.ngrok.io

# 3. Update frontend .env
echo "VITE_API_URL=https://abc123.ngrok.io/api/v1" > Frontend/.env

# 4. Start frontend
cd Frontend && npm run dev

# 5. Open on phone
# http://YOUR_PC_IP:5173 (same WiFi)
# or use ngrok for frontend too
```

---

## 🎊 Success!

**If everything works:**
- ✅ Website loads on phone
- ✅ Camera opens
- ✅ AR detects card
- ✅ Video plays

**You're ready to deploy to production!** 🚀

See `DEPLOYMENT_GUIDE.md` for permanent deployment.

