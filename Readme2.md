# 🚗 MOTO KENYA - Car Dealership Website

A fully functional car dealership website with an admin panel for managing vehicle inventory. Built with Firebase, ImageKit, and vanilla JavaScript.

![MOTO KENYA](https://img.shields.io/badge/MOTO-KENYA-blue)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![ImageKit](https://img.shields.io/badge/ImageKit-00A8E8?style=flat&logo=imagekit&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Live Demo

| Page | URL |
| :--- | :--- |
| **Public Showroom** | [https://caradds-227e9.web.app](https://caradds-227e9.web.app) |
| **Admin Panel** | [https://caradds-227e9.web.app/admin.html](https://caradds-227e9.web.app/admin.html) |
| **GitHub Pages** | [https://YOUR_USERNAME.github.io/carbusiness-website/](https://YOUR_USERNAME.github.io/carbusiness-website/) |

---

## ✨ Features

### Public Showroom (`index.html`)
- ✅ Real-time vehicle listings from Firestore
- ✅ Search vehicles by brand
- ✅ Filter by maximum price
- ✅ Image gallery with thumbnail navigation
- ✅ WhatsApp integration for inquiries
- ✅ Featured vehicle badges
- ✅ Mobile responsive design

### Admin Panel (`admin.html`)
- ✅ Firebase Authentication (Admin only)
- ✅ Upload vehicles with multiple images
- ✅ ImageKit integration for image hosting
- ✅ Real-time inventory management
- ✅ Delete vehicles from inventory
- ✅ Create new admin accounts
- ✅ Featured vehicle toggle

### Backend Services
- ✅ Firebase Firestore (Database)
- ✅ Firebase Cloud Functions (Auth endpoint)
- ✅ Firebase Hosting (Static files)
- ✅ ImageKit (Image hosting and optimization)
- ✅ Firebase Security Rules

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **HTML5/CSS3** | Frontend structure and styling |
| **JavaScript (ES Modules)** | Frontend logic and interactions |
| **Firebase Authentication** | Admin login and user management |
| **Firebase Firestore** | Vehicle data storage |
| **Firebase Cloud Functions** | ImageKit authentication backend |
| **Firebase Hosting** | Static file hosting |
| **ImageKit** | Image hosting and CDN |
| **Google Fonts (Inter)** | Typography |

---

## 📁 Project Structure
carbusiness-website/
├── admin.html # Admin panel (upload/manage vehicles)
├── index.html # Public showroom (view vehicles)
├── firebase.json # Firebase configuration
├── firestore.rules # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── .gitignore # Git ignored files
├── README.md # This file
├── functions/ # Firebase Cloud Functions
│ ├── index.js # ImageKit auth function
│ └── package.json # Function dependencies
├── .env # Environment variables (DO NOT COMMIT)
└── node_modules/ # Dependencies (DO NOT COMMIT)

text

---

## 🚀 Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [ImageKit Account](https://imagekit.io/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/carbusiness-website.git
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
PORT=3000
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_app_id
FIREBASE_PROJECT_ID=your_project_id
4. Set Up Firebase
bash
# Login to Firebase
firebase login

# Select your project
firebase use your-project-id

# Set the ImageKit secret
firebase functions:secrets:set IMAGEKIT_PRIVATE_KEY
# Paste your private key when prompted
5. Run Locally
bash
# Start the local server
node imagekit-auth-server.js

# Or use the PowerShell script
.\start-imagekit-auth.ps1
Open in browser:

Admin Panel: http://localhost:3000/admin.html

Public Showroom: http://localhost:3000/index.html

6. Admin Credentials (Default)
Field	Value
Email	michaelnchege453@gmail.com
Password	admin1234
📦 Deployment
Deploy to Firebase
bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
Deploy to GitHub Pages
bash
# Initialize git
git init

# Add files
git add .
git commit -m "Initial commit"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/carbusiness-website.git
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
Where to Get These:
Variable	Where to Find
IMAGEKIT_*	ImageKit Dashboard → Developer Options → API Keys
FIREBASE_PROJECT_ID	Firebase Console → Project Settings
📸 Screenshots
Public Showroom
https://via.placeholder.com/800x400?text=Public+Showroom

Admin Panel
https://via.placeholder.com/800x400?text=Admin+Panel

Image Gallery Modal
https://via.placeholder.com/800x400?text=Image+Gallery

🗄️ Firestore Security Rules
javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vehicles/{vehicle} {
      allow read: if true;
      allow write: if request.auth != null;
      allow delete: if request.auth != null && 
        request.auth.token.email == "michaelnchege453@gmail.com";
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
View Function Logs
bash
firebase functions:log
Local Debugging
bash
# Run emulators
firebase emulators:start --only functions
🔒 Security Notes
✅ Private keys are stored in .env and NEVER committed to Git

✅ Firebase secrets are stored securely in Google Cloud

✅ Firestore rules restrict write access to authenticated admins only

✅ ImageKit private key never exposed to the client

✅ CORS is properly configured

🤝 Contributing
Fork the repository

Create a new branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Firebase - Backend services

ImageKit - Image hosting

Google Fonts - Typography

Unsplash - Hero images

📞 Contact
Developer: Michael Nchege
Email: michaelnchege453@gmail.com
GitHub: YOUR_USERNAME

🎯 Roadmap
Add user favorites/save feature

Implement vehicle comparison tool

Add email notifications for new listings

Create user profiles and wishlist

Add multi-language support

Implement vehicle history reports

Add financing calculator

Create appointment booking system

⭐ Star this repository if you found it helpful!

text

---

## 📁 How to Add the README

### Option 1: Create File in VS Code/Notepad

1. Open your project folder
2. Create a new file called `README.md`
3. Copy and paste the content above
4. Save the file

### Option 2: Add via GitHub Website

1. Go to your GitHub repository
2. Click **"Add file"** → **"Create new file"**
3. Name it `README.md`
4. Paste the content above
5. Scroll down and click **"Commit new file"**

---

## ✅ After Adding README

```bash
# Add the README to Git
git add README.md

# Commit
git commit -m "Add README.md"

# Push to GitHub
git push
Your README.md is ready! 🚀

This response is AI-generated, for reference only.




---

## 🚀 Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [ImageKit Account](https://imagekit.io/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/carbusiness-website.git
cd carbusiness-website


. Install Dependencies
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
PORT=3000
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_app_id
FIREBASE_PROJECT_ID=your_project_id
4. Set Up Firebase
bash
# Login to Firebase
firebase login

# Select your project
firebase use your-project-id

# Set the ImageKit secret
firebase functions:secrets:set IMAGEKIT_PRIVATE_KEY
# Paste your private key when prompted
5. Run Locally
bash
# Start the local server
node imagekit-auth-server.js

# Or use the PowerShell script
.\start-imagekit-auth.ps1
Open in browser:

Admin Panel: http://localhost:3000/admin.html

Public Showroom: http://localhost:3000/index.html

6. Admin Credentials (Default)
Field	Value
Email	michaelnchege453@gmail.com
Password	admin1234
📦 Deployment
Deploy to Firebase
bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
Deploy to GitHub Pages
bash
# Initialize git
git init

# Add files
git add .
git commit -m "Initial commit"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/carbusiness-website.git
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
Where to Get These:
Variable	Where to Find
IMAGEKIT_*	ImageKit Dashboard → Developer Options → API Keys
FIREBASE_PROJECT_ID	Firebase Console → Project Settings
📸 Screenshots
Public Showroom
https://via.placeholder.com/800x400?text=Public+Showroom

Admin Panel
https://via.placeholder.com/800x400?text=Admin+Panel

Image Gallery Modal
https://via.placeholder.com/800x400?text=Image+Gallery

🗄️ Firestore Security Rules
javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vehicles/{vehicle} {
      allow read: if true;
      allow write: if request.auth != null;
      allow delete: if request.auth != null && 
        request.auth.token.email == "michaelnchege453@gmail.com";
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
View Function Logs
bash
firebase functions:log
Local Debugging
bash
# Run emulators
firebase emulators:start --only functions
🔒 Security Notes
✅ Private keys are stored in .env and NEVER committed to Git

✅ Firebase secrets are stored securely in Google Cloud

✅ Firestore rules restrict write access to authenticated admins only

✅ ImageKit private key never exposed to the client

✅ CORS is properly configured

🤝 Contributing
Fork the repository

Create a new branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Firebase - Backend services

ImageKit - Image hosting

Google Fonts - Typography

Unsplash - Hero images

📞 Contact
Developer: Michael Nchege
Email: michaelnchege453@gmail.com
GitHub: YOUR_USERNAME

🎯 Roadmap
Add user favorites/save feature

Implement vehicle comparison tool

Add email notifications for new listings

Create user profiles and wishlist

Add multi-language support

Implement vehicle history reports

Add financing calculator

Create appointment booking system

⭐ Star this repository if you found it helpful!

text

---

## 📁 How to Add the README

### Option 1: Create File in VS Code/Notepad

1. Open your project folder
2. Create a new file called `README.md`
3. Copy and paste the content above
4. Save the file

### Option 2: Add via GitHub Website

1. Go to your GitHub repository
2. Click **"Add file"** → **"Create new file"**
3. Name it `README.md`
4. Paste the content above
5. Scroll down and click **"Commit new file"**

---

## ✅ After Adding README

```bash
# Add the README to Git
git add README.md

# Commit
git commit -m "Add README.md"

# Push to GitHub
git push
Your README.md is ready! 🚀