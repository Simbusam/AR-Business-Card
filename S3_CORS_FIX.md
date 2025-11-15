# 🔧 Fix S3 CORS Error

## ❌ Error:

```
Access to video at 'https://ar-business-card-sam.s3.eu-north-1.amazonaws.com/...'
from origin 'http://localhost:3005' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## ✅ Solution: Add CORS Configuration to S3 Bucket

### **Step 1: Open AWS Console**

1. Go to: https://console.aws.amazon.com/s3/
2. Sign in to your AWS account
3. Find your bucket: **`ar-business-card-sam`**
4. Click on the bucket name

---

### **Step 2: Navigate to Permissions**

1. Click on the **"Permissions"** tab
2. Scroll down to **"Cross-origin resource sharing (CORS)"**
3. Click **"Edit"**

---

### **Step 3: Add CORS Configuration**

Paste this JSON configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

---

### **Step 4: Save Changes**

1. Click **"Save changes"**
2. Wait a few seconds for the changes to propagate

---

## 🔒 Production CORS (More Secure)

For production, replace `"*"` with specific domains:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3005",
            "http://localhost:5173",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

---

## 🧪 Test After Fixing

1. **Save CORS configuration in AWS**
2. **Wait 30 seconds** for changes to propagate
3. **Delete old AR files:**
   ```bash
   cd Backend
   Remove-Item -Path "uploads\ar-projects\*\index.html" -Force
   ```
4. **Refresh browser**
5. **Navigate to AR View**
6. **Video should load without CORS error!** ✅

---

## 📋 What This Does

### **AllowedOrigins: ["*"]**
- Allows requests from any domain
- Good for development
- Change to specific domains in production

### **AllowedMethods: ["GET", "HEAD"]**
- Allows reading files (GET)
- Allows checking file info (HEAD)
- No write access (secure)

### **AllowedHeaders: ["*"]**
- Allows any request headers
- Needed for video playback

### **ExposeHeaders**
- Allows browser to read these response headers
- Needed for video streaming (Content-Length, ETag)

### **MaxAgeSeconds: 3000**
- Browser caches CORS preflight for 50 minutes
- Reduces CORS check requests

---

## 🎉 Tamil Summary

**Problem:**
- S3 bucket la CORS configuration illa
- Video load aagala (CORS error)

**Solution:**
1. AWS Console open pannunga
2. S3 bucket → Permissions → CORS
3. JSON configuration paste pannunga
4. Save pannunga

**Ippodhaiku:**
- Video load aagum
- No CORS errors! ✅

---

## 🚨 Alternative: Use AWS CLI

If you prefer command line:

```bash
aws s3api put-bucket-cors \
  --bucket ar-business-card-sam \
  --cors-configuration file://cors.json
```

**cors.json:**
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

---

## ✅ Verification

After adding CORS, test with curl:

```bash
curl -H "Origin: http://localhost:3005" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://ar-business-card-sam.s3.eu-north-1.amazonaws.com/test.mp4 -v
```

Should see:
```
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET, HEAD
```

---

## 🎊 Status

**After fixing CORS:**
- ✅ Videos load from S3
- ✅ Images load from S3
- ✅ No CORS errors
- ✅ AR works perfectly!

**Fix this in AWS Console and test again!** 🚀

