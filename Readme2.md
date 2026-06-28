markdown
# 🚗 MOTO KENYA - Premium Vehicle Management System

[![MOTO KENYA](https://img.shields.io/badge/MOTO-KENYA-blue)](https://nige19002.github.io/carbusiness-website/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![ImageKit](https://img.shields.io/badge/ImageKit-00A8E8?style=flat&logo=imagekit&logoColor=white)](https://imagekit.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-blueviolet)](https://web.dev/progressive-web-apps/)

> A fully functional, production-ready car dealership platform with real-time inventory management, PWA support, and secure admin panel.

---

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Security](#-security)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Live Demo

| Page | URL |
| :--- | :--- |
| **🏠 Public Showroom** | [https://nige19002.github.io/carbusiness-website/](https://nige19002.github.io/carbusiness-website/) |
| **🔧 Admin Panel** | [https://nige19002.github.io/carbusiness-website/admin.html](https://nige19002.github.io/carbusiness-website/admin.html) |
| **👥 Admin Management** | [https://nige19002.github.io/carbusiness-website/pages/admin-management.html](https://nige19002.github.io/carbusiness-website/pages/admin-management.html) |
| **💚 Health Check** | [https://nige19002.github.io/carbusiness-website/health](https://nige19002.github.io/carbusiness-website/health) |

---

## ✨ Features

### 🏠 Public Showroom (`index.html`)
- ✅ **Real-time vehicle listings** from Firestore
- ✅ **Advanced search** - Search by brand, model, status
- ✅ **Price range filter** with visual slider
- ✅ **Autocomplete suggestions** for brand/model
- ✅ **Image gallery** with thumbnail navigation
- ✅ **WhatsApp integration** for instant inquiries
- ✅ **Featured vehicle badges** with gold gradient
- ✅ **Recently viewed** vehicles (localStorage)
- ✅ **Wishlist/Save** functionality with heart animation
- ✅ **Customer ratings & reviews** section
- ✅ **Trust badges** (Verified, Warranty, Financing)
- ✅ **Mobile responsive** design
- ✅ **PWA support** - Install as app on mobile
- ✅ **Offline support** via Service Worker
- ✅ **Dark mode** toggle
- ✅ **Share vehicle** links
- ✅ **Quick reply** buttons for common questions
- ✅ **Similar vehicles** suggestions
- ✅ **View counter** for each vehicle
- ✅ **Loading skeletons** for better UX

### 🔧 Admin Panel (`admin.html`)
- ✅ **Firebase Authentication** (Admin only)
- ✅ **Role-based access control** (Super Admin, Editor, Viewer)
- ✅ **Upload vehicles** with multiple images
- ✅ **ImageKit integration** for image hosting
- ✅ **Real-time inventory management**
- ✅ **Delete vehicles** from inventory
- ✅ **Image preview** with cancel option
- ✅ **Featured vehicle** toggle
- ✅ **Dashboard metrics** (Total, Featured, Sold)
- ✅ **Session timeout** (30 minutes)
- ✅ **Brute force protection** on login
- ✅ **CSRF protection**
- ✅ **Input validation** & sanitization
- ✅ **Rate limiting** on authentication
- ✅ **Dark mode** support

### 👥 Admin Management (`pages/admin-management.html`)
- ✅ **Create new admins** (Super Admin only)
- ✅ **Update admin roles** (Super Admin only)
- ✅ **Delete admin users** (Super Admin only)
- ✅ **View all admin users** with roles
- ✅ **Password strength indicator**
- ✅ **Role management** dropdown
- ✅ **Real-time user list** updates
- ✅ **Access control** protection

### 📄 Additional Pages (`pages/`)
- ✅ **About** - Company story, mission, team
- ✅ **Blog** - Articles and car buying tips
- ✅ **Contact** - Form with map integration
- ✅ **FAQ** - Accordion with category filters
- ✅ **Finance** - Payment calculator with options
- ✅ **Testimonials** - Customer reviews with ratings
- ✅ **Trade-In** - Valuation form with instant estimate
- ✅ **Privacy Policy** - GDPR compliant
- ✅ **Terms & Conditions** - Legal documentation

### 🔒 Backend Services
- ✅ **Firebase Firestore** - Real-time database
- ✅ **Firebase Authentication** - Secure admin login
- ✅ **Firebase Cloud Functions** - ImageKit auth endpoint
- ✅ **Firebase Hosting** - Static file hosting
- ✅ **ImageKit** - Image hosting and CDN optimization
- ✅ **Security Rules** - Granular access control
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **CORS** - Secure cross-origin requests
- ✅ **Helmet** - Security headers (CSP, HSTS, XSS)

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Frontend structure |
| **CSS3** | Styling with dark mode support |
| **JavaScript (ES Modules)** | Frontend logic |
| **Firebase Authentication** | Admin login & user management |
| **Firebase Firestore** | Real-time vehicle data storage |
| **Firebase Cloud Functions** | Backend API endpoints |
| **Firebase Hosting** | Static file hosting |
| **ImageKit** | Image hosting and CDN |
| **Google Fonts (Inter)** | Typography |
| **Service Worker** | PWA offline support |
| **Web App Manifest** | PWA installation |

---

## 📁 Project Structure
carbusiness website/
│
├── 📁 .agents/ # Agent configuration files
├── 📁 functions/ # Firebase Cloud Functions
│ ├── 📁 node_modules/ # Dependencies
│ ├── 📄 index.js # Cloud Functions
│ ├── 📄 package-lock.json # Locked dependencies
│ └── 📄 package.json # Function dependencies
├── 📁 scripts/ # Utility scripts
│ └── 📄 sanity-check.js # Pre-deployment validation
├── 📁 css/ # Shared styles
│ ├── 📄 style.css # Global styles
│ ├── 📄 admin.css # Admin styles
│ └── 📄 dark-mode.css # Dark mode styles
├── 📁 js/ # Shared JavaScript
│ ├── 📄 main.js # Shared functions
│ ├── 📄 firebase-config.js # Firebase config
│ ├── 📄 vehicles.js # Vehicle functions
│ ├── 📄 admin.js # Admin panel logic
│ ├── 📄 wishlist.js # Wishlist functionality
│ └── 📄 compare.js # Comparison functionality
├── 📁 pages/ # All HTML pages
│ ├── 📄 about.html # About the dealership
│ ├── 📄 admin-management.html # Admin user management
│ ├── 📄 admin.html # Vehicle management
│ ├── 📄 blog.html # Blog/articles
│ ├── 📄 contact.html # Contact with map
│ ├── 📄 faq.html # Frequently asked questions
│ ├── 📄 finance.html # Financing options
│ ├── 📄 privacy.html # Privacy policy
│ ├── 📄 terms.html # Terms & conditions
│ ├── 📄 testimonials.html # Customer reviews
│ └── 📄 trade-in.html # Trade-in valuation
├── 📁 images/ # Image assets
│ ├── 📁 icons/ # App icons
│ └── 📁 screenshots/ # PWA screenshots
├── 📄 index.html # Main showroom
├── 📄 manifest.json # PWA manifest
├── 📄 sw.js # Service Worker
├── 📄 package.json # Root dependencies
├── 📄 package-lock.json # Locked dependencies
├── 📄 .env # Environment variables (local)
├── 📄 .env.example # Environment variables template
├── 📄 .gitignore # Git ignore rules
├── 📄 firebase.json # Firebase configuration
├── 📄 firestore.rules # Firestore security rules
├── 📄 imagekit-auth-server.js # Local ImageKit auth server
├── 📄 readme.md # Project documentation
└── 📄 firebase-debug.log # Firebase debug log (auto-generated)

text

---

## 🚀 Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [ImageKit Account](https://imagekit.io/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/nige19002/carbusiness-website.git
cd carbusiness-website
2. Install Dependencies
bash
# Install root dependencies
npm install

# Install function dependencies
cd functions
npm install
cd ..
3. Set Up Environment Variables
Create a .env file in the root directory:

env
# Server Configuration
PORT=3000
NODE_ENV=development

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_app_id

# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=caradds-227e9

# Security
JWT_SECRET=your_jwt_secret
CSRF_SECRET=your_csrf_secret
SESSION_TIMEOUT=30

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_WINDOW_MS=60000

# Super Admin
SUPER_ADMIN_EMAILS=michaelnchege453@gmail.com

# WhatsApp
WHATSAPP_NUMBER=254712345678
4. Set Up Firebase
bash
# Login to Firebase
firebase login

# Select your project
firebase use caradds-227e9

# Set the ImageKit secret
firebase functions:secrets:set IMAGEKIT_PRIVATE_KEY
# Paste your private key when prompted
5. Run Locally
bash
# Start the local server
node imagekit-auth-server.js

# Or use the start script
npm start
Open in browser:

Page	URL
Public Showroom	http://localhost:3000/index.html
Admin Panel	http://localhost:3000/admin.html
Admin Management	http://localhost:3000/pages/admin-management.html
6. Admin Credentials (Default)
Field	Value
Email	michaelnchege453@gmail.com
Password	Set during Firebase Auth setup
📦 Deployment
Deploy to Firebase
bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy using npm script
npm run deploy
Deploy to GitHub Pages
bash
# Initialize git (if not already)
git init

# Add all files
git add .
git commit -m "Initial commit"

# Add remote
git remote add origin https://github.com/nige19002/carbusiness-website.git
git branch -M main
git push -u origin main
Enable GitHub Pages:

Go to repository Settings → Pages

Select branch: main

Select folder: / (root)

Click Save

🔑 Environment Variables
Variable	Required	Description
PORT	Yes	Server port (default: 3000)
IMAGEKIT_PUBLIC_KEY	Yes	ImageKit public key
IMAGEKIT_PRIVATE_KEY	Yes	ImageKit private key
IMAGEKIT_URL_ENDPOINT	Yes	ImageKit URL endpoint
FIREBASE_PROJECT_ID	Yes	Firebase project ID
SUPER_ADMIN_EMAILS	Yes	Comma-separated list of Super Admin emails
WHATSAPP_NUMBER	Yes	WhatsApp business number
SESSION_TIMEOUT	No	Session timeout in minutes (default: 30)
Where to Get These:
Variable	Where to Find
IMAGEKIT_*	ImageKit Dashboard → Developer Options → API Keys
FIREBASE_*	Firebase Console → Project Settings → General
SUPER_ADMIN_EMAILS	Your email addresses
🔒 Security
Security Features
✅ CSP Headers - Content Security Policy

✅ HSTS - HTTP Strict Transport Security

✅ XSS Protection - Cross-site scripting prevention

✅ XFO - Clickjacking prevention

✅ Rate Limiting - Brute force protection

✅ Input Validation - All user inputs validated

✅ Input Sanitization - All user inputs sanitized

✅ CSRF Protection - Cross-site request forgery prevention

✅ Session Timeout - Automatic logout after 30 minutes

✅ Role-based Access Control - Super Admin, Editor, Viewer

✅ Firestore Security Rules - Granular database access control

✅ Environment Variables - Secrets never committed to Git

✅ Firebase Secrets - Secure storage for sensitive keys

Firestore Security Rules
javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vehicles/{vehicle} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'super' || 
         request.auth.token.role == 'editor' ||
         request.auth.token.email == 'michaelnchege453@gmail.com');
    }
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.token.role == 'super' ||
         request.auth.token.email == 'michaelnchege453@gmail.com');
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
🐛 Troubleshooting
Common Issues
Issue	Solution
Missing or insufficient permissions	Check Firestore rules and Firebase Auth
ImageKit auth failed	Verify .env keys are correct
CORS error	Ensure cors() middleware is enabled
Firebase login failed	Run firebase login --reauth
404 on pages	Check file paths and Firebase hosting rewrites
Service Worker not registering	Check HTTPS or localhost
View Function Logs
bash
firebase functions:log
Local Debugging
bash
# Run Firebase emulators
firebase emulators:start --only functions,firestore

# Run local server with debug
node --inspect imagekit-auth-server.js
📡 API Documentation
ImageKit Auth Endpoint
Endpoint: GET /imagekit-auth

Headers:

text
Authorization: Bearer <Firebase-ID-Token>
Response:

json
{
  "token": "generated_token",
  "expire": 1700000000,
  "signature": "generated_signature",
  "publicKey": "your_public_key",
  "urlEndpoint": "https://ik.imagekit.io/your_app_id"
}
Health Check
Endpoint: GET /health

Response:

json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "server": {
    "name": "MOTO KENYA - ImageKit Auth Server",
    "version": "2.0.0",
    "port": 3000
  }
}
🤝 Contributing
Fork the repository

Create a new branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

Contribution Guidelines
✅ Follow existing code style

✅ Add comments for complex logic

✅ Test changes locally before pushing

✅ Update documentation if needed

✅ Run npm run lint before committing

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Firebase - Backend services

ImageKit - Image hosting and CDN

Google Fonts - Typography (Inter)

Unsplash - Hero images

All Contributors - For their valuable input

📞 Contact
Developer: Michael Nchege

Email: michaelnchege453@gmail.com

GitHub: nige19002

Live Demo: MOTO KENYA

🎯 Roadmap
Phase 1: Core Features (✅ Completed)
✅ Vehicle listing with real-time updates

✅ Admin panel with CRUD operations

✅ Image upload with ImageKit

✅ Dark mode support

✅ PWA and offline support

✅ Responsive design

Phase 2: User Features (🔄 In Progress)
🔄 User authentication and profiles

🔄 Wishlist/Save for later

🔄 Recently viewed vehicles

🔄 Vehicle comparison tool

Phase 3: Advanced Features (📋 Planned)
📋 Email notifications

📋 Price drop alerts

📋 Vehicle history reports

📋 Test drive booking system

📋 Multi-language support

📋 Analytics dashboard

⭐ Star this repository if you found it helpful!
https://img.shields.io/github/stars/nige19002/carbusiness-website.svg?style=social
https://img.shields.io/github/forks/nige19002/carbusiness-website.svg?style=social

Built with ❤️ by the MOTO KENYA Team

text

---

## ✅ Summary of Changes

1. **Updated project structure** - New folders (css/, js/, pages/, images/)
2. **Added missing features** - Wishlist, recently viewed, dark mode, etc.
3. **Added Security section** - All security features documented
4. **Added API Documentation** - ImageKit auth and health check
5. **Added Roadmap** - Phase 1, 2, 3 planning
6. **Added Troubleshooting** - Common issues and solutions
7. **Added Contribution Guidelines** - How to contribute
8. **Updated deployment instructions** - Firebase and GitHub Pages

---

**Please paste the next file (`Readme2.md`) and I'll update it!** 🚀