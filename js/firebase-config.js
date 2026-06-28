// ========================================
// js/firebase-config.js - Shared Firebase Configuration
// ========================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ========================================
// Firebase Configuration
// ========================================
const firebaseConfig = {
    apiKey: "AIzaSyD-ohnQ51vcDmLRckrsxtol8a1_iJ7nb5E",
    authDomain: "caradds-227e9.firebaseapp.com",
    projectId: "caradds-227e9",
    messagingSenderId: "551966179001",
    appId: "1:551966179001:web:1ea551d87511e4967c6568",
    measurementId: "G-RCHG0M7PV7"
};

// ========================================
// Initialize Firebase
// ========================================
let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    console.log('🔥 Firebase initialized successfully');
    console.log('📁 Project:', firebaseConfig.projectId);
    console.log('👤 Auth:', auth ? '✅ Ready' : '❌ Error');
    console.log('📊 Firestore:', db ? '✅ Ready' : '❌ Error');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw new Error(`Firebase initialization failed: ${error.message}`);
}

// ========================================
// Exports
// ========================================
export { app, db, auth };

// ========================================
// Helper: Check auth state
// ========================================
export const getCurrentUser = () => {
    return new Promise((resolve) => {
        if (!auth) {
            console.warn('⚠️ Auth not initialized');
            resolve(null);
            return;
        }
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
};

// ========================================
// Helper: Get user role
// ========================================
export const getUserRole = async () => {
    try {
        const user = await getCurrentUser();
        if (!user) return null;
        
        const tokenResult = await user.getIdTokenResult();
        const role = tokenResult.claims.role || 'viewer';
        console.log(`👤 User: ${user.email}, Role: ${role}`);
        return role;
    } catch (error) {
        console.error('❌ Error getting user role:', error);
        return null;
    }
};

// ========================================
// Helper: Check if user is admin
// ========================================
export const isAdmin = async () => {
    const role = await getUserRole();
    return role === 'super' || role === 'editor';
};

// ========================================
// Helper: Check if user is super admin
// ========================================
export const isSuperAdmin = async () => {
    const user = await getCurrentUser();
    if (!user) return false;
    const role = await getUserRole();
    return role === 'super' || user.email === 'michaelnchege453@gmail.com';
};

// ========================================
// Helper: Get user profile
// ========================================
export const getUserProfile = async () => {
    try {
        const user = await getCurrentUser();
        if (!user) return null;
        
        const role = await getUserRole();
        const isSuper = await isSuperAdmin();
        
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            emailVerified: user.emailVerified,
            role: role,
            isSuperAdmin: isSuper,
            isAdmin: role === 'super' || role === 'editor',
            isViewer: role === 'viewer'
        };
    } catch (error) {
        console.error('❌ Error getting user profile:', error);
        return null;
    }
};

// ========================================
// Debug helper - Log current state
// ========================================
export const logFirebaseState = () => {
    console.log('📊 Firebase State:');
    console.log(`   🔐 Auth: ${auth ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`   📁 Firestore: ${db ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`   📁 Project: ${firebaseConfig.projectId}`);
};

// ========================================
// Log on import
// ========================================
logFirebaseState();

console.log('✅ firebase-config.js loaded successfully');