# 🎯 AR Business Card - Dynamic WebAR Platform

A full-stack web application that enables users to create interactive AR business cards with video content using marker-based AR technology.

## ✨ Features

- 🎨 **Dynamic AR Generation** - Automatically generates AR experiences from uploaded images and videos
- 📱 **Mobile-First** - Optimized for mobile devices with camera access
- 🔐 **User Authentication** - Secure JWT-based authentication system
- ☁️ **Cloud Storage** - AWS S3 integration for media storage
- 🎥 **Video AR** - Play videos in AR when scanning business cards
- 🌐 **WebAR** - No app installation required, works in browser
- 📊 **Project Management** - Create and manage multiple AR projects
- 🚀 **Production Ready** - Deployment guides for Render.com and ngrok

## 🛠️ Tech Stack

### **Backend**
- Node.js + Express 5
- MySQL (mysql2/promise)
- AWS S3 (@aws-sdk/client-s3)
- JWT Authentication
- Multer (file uploads)
- Helmet (security)

### **Frontend**
- React 18
- Vite
- Redux Toolkit
- React Router v7
- Tailwind CSS 4
- Axios

### **AR Technology**
- A-Frame 1.4.2
- MindAR 1.2.2 (Image Tracking)
- Browser-based AR (no app needed)

## 📋 Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- AWS Account (for S3)
- Git

## 🚀 Quick Start

### **1. Clone Repository**
```bash
git clone https://github.com/Simbusam/AR-Business-Card.git
cd AR-Business-Card
git checkout xr-ar-business-card
```

### **2. Backend Setup**
```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your credentials
node server.js
```

### **3. Frontend Setup**
```bash
cd Frontend
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev
```

### **4. Database Setup**
Create MySQL database and tables (see `Backend/db/mysql.js` for schema)

### **5. AWS S3 Setup**
- Create S3 bucket
- Configure CORS (see `S3_CORS_FIX.md`)
- Add credentials to `.env`

## 📱 Testing on Mobile

### **Option 1: ngrok (Quick Test - 5 min)**
See: `QUICK_TEST_NGROK.md`

### **Option 2: Render.com (Production - 30 min)**
See: `DEPLOYMENT_GUIDE.md`

## 📚 Documentation

- **`DEPLOYMENT_OPTIONS_SUMMARY.md`** - Choose deployment method
- **`QUICK_TEST_NGROK.md`** - Test on phone in 5 minutes
- **`DEPLOYMENT_GUIDE.md`** - Full production deployment
- **`DEPLOYMENT_CHECKLIST.md`** - Step-by-step checklist
- **`S3_CORS_FIX.md`** - Fix S3 CORS issues
- **`MINDAR_DYNAMIC_AR_SETUP.md`** - AR system architecture
- **`CLEANUP_SUMMARY.md`** - Code cleanup history

## 🎯 How It Works

1. **User uploads** Card.jpg (AR marker) and Video.mp4
2. **Backend generates** dynamic HTML with A-Frame + MindAR
3. **Frontend redirects** to AR experience
4. **User scans** business card with phone camera
5. **Video plays** in AR when card is detected

## 🔧 Environment Variables

### **Backend (.env)**
```env
NODE_ENV=development
PORT=3005
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=ar_business_card
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=your-bucket
FRONTEND_URL=http://localhost:5173
```

### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:3005/api/v1
```

## 🌐 API Endpoints

### **Authentication**
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### **Projects**
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects/template` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### **AR**
- `POST /api/v1/ar/generate/:projectId` - Generate AR experience
- `GET /api/v1/ar/check/:projectId` - Check if AR exists
- `GET /ar-view/:projectId/index.html` - View AR experience

## 🎨 Project Structure

```
AR-Business-Card/
├── Backend/
│   ├── controllers/      # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic (AR generator)
│   ├── middleware/      # Auth, validation
│   ├── db/             # MySQL connection
│   └── server.js       # Entry point
├── Frontend/
│   ├── src/
│   │   ├── pages/      # React pages
│   │   ├── components/ # Reusable components
│   │   ├── redux/      # State management
│   │   └── services/   # API client
│   └── vite.config.js
└── Documentation/       # Guides and docs
```

## 🐛 Troubleshooting

See `DEPLOYMENT_CHECKLIST.md` for common issues and solutions.

## 📄 License

MIT

## 👨‍💻 Author

Simbusam

## 🙏 Acknowledgments

- A-Frame for WebAR framework
- MindAR for image tracking
- Render.com for hosting

