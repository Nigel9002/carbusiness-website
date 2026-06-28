// ========================================
// js/admin.js - Admin Panel Functions (SECURE)
// ========================================

import { db, auth, getCurrentUser, getUserRole, isAdmin, isSuperAdmin, reloadUser } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    where
} from "firebase/firestore";
import { 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged,
    sendEmailVerification
} from "firebase/auth";

// ========================================
// STATE
// ========================================
let currentUser = null;
let currentUserRole = null;
let isAuthenticated = false;
let isEmailVerified = false;

// ========================================
// IMAGEKIT CONFIGURATION
// ========================================
let imagekitInstance = null;
let imagekitAuthToken = null;

// ========================================
// AUTHENTICATION FUNCTIONS
// ========================================

// Login with email and password
export async function loginAdmin(email, password) {
    try {
        console.log('🔐 Logging in...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        isEmailVerified = currentUser.emailVerified || false;
        console.log(`✅ Logged in as: ${currentUser.email}`);
        console.log(`📧 Email verified: ${isEmailVerified}`);
        
        // Get user role
        currentUserRole = await getUserRole();
        isAuthenticated = true;
        
        // Check if email is verified
        if (!isEmailVerified) {
            console.warn('⚠️ Email not verified. Please check your inbox.');
        }
        
        return { success: true, user: currentUser, role: currentUserRole, emailVerified: isEmailVerified };
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return { success: false, error: error.message };
    }
}

// Logout
export async function logoutAdmin() {
    try {
        await signOut(auth);
        currentUser = null;
        currentUserRole = null;
        isAuthenticated = false;
        isEmailVerified = false;
        console.log('👋 Logged out');
        return { success: true };
    } catch (error) {
        console.error('❌ Logout error:', error.message);
        return { success: false, error: error.message };
    }
}

// Resend email verification
export async function resendVerificationEmail() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }
        
        if (user.emailVerified) {
            return { success: false, error: 'Email already verified' };
        }
        
        await sendEmailVerification(user);
        console.log('📧 Verification email sent');
        return { success: true, message: 'Verification email sent. Please check your inbox.' };
    } catch (error) {
        console.error('❌ Error sending verification:', error.message);
        return { success: false, error: error.message };
    }
}

// Check auth state
export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            currentUserRole = await getUserRole();
            isAuthenticated = true;
            isEmailVerified = user.emailVerified || false;
            console.log(`👤 User: ${user.email}, Role: ${currentUserRole}, Email Verified: ${isEmailVerified}`);
        } else {
            currentUser = null;
            currentUserRole = null;
            isAuthenticated = false;
            isEmailVerified = false;
            console.log('👤 No user logged in');
        }
        if (callback) callback(user, currentUserRole, isEmailVerified);
    });
}

// Check if user has admin access (with email verification)
export async function checkAdminAccess() {
    // First check if user is logged in
    const user = await getCurrentUser();
    if (!user) {
        console.warn('⛔ No user logged in');
        return { allowed: false, reason: 'not_logged_in' };
    }
    
    // Check email verification
    if (!user.emailVerified) {
        console.warn('⛔ Email not verified');
        return { allowed: false, reason: 'email_not_verified' };
    }
    
    // Check admin role
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
        console.warn('⛔ User does not have admin access');
        return { allowed: false, reason: 'not_admin' };
    }
    
    return { allowed: true, reason: 'ok' };
}

// ========================================
// IMAGEKIT AUTH FUNCTIONS
// ========================================

// Get ImageKit authentication token (with email verification check)
export async function getImageKitAuth() {
    try {
        // Check admin access first
        const access = await checkAdminAccess();
        if (!access.allowed) {
            console.warn(`⛔ Access denied: ${access.reason}`);
            return null;
        }
        
        console.log('🔑 Getting ImageKit auth token...');
        
        // Get the current user's ID token
        const user = await getCurrentUser();
        if (!user) {
            console.warn('⚠️ No user logged in');
            return null;
        }
        
        const idToken = await user.getIdToken();
        
        // Call the auth endpoint
        const response = await fetch('/imagekit-auth', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get auth token');
        }
        
        const data = await response.json();
        console.log('✅ ImageKit auth token received');
        return data;
    } catch (error) {
        console.error('❌ Error getting ImageKit auth:', error);
        return null;
    }
}

// Initialize ImageKit SDK
export async function initImageKit() {
    try {
        // Check if ImageKit SDK is loaded
        if (typeof ImageKit === 'undefined') {
            console.warn('⚠️ ImageKit SDK not loaded');
            return null;
        }
        
        // Check admin access
        const access = await checkAdminAccess();
        if (!access.allowed) {
            console.warn(`⛔ Access denied: ${access.reason}`);
            return null;
        }
        
        // Get auth token
        const authData = await getImageKitAuth();
        if (!authData) {
            console.error('❌ Failed to get ImageKit auth');
            return null;
        }
        
        // Initialize ImageKit
        imagekitInstance = new ImageKit({
            publicKey: authData.publicKey,
            urlEndpoint: authData.urlEndpoint,
            authenticationEndpoint: '/imagekit-auth'
        });
        
        console.log('✅ ImageKit initialized');
        return imagekitInstance;
    } catch (error) {
        console.error('❌ Error initializing ImageKit:', error);
        return null;
    }
}

// Upload image to ImageKit
export async function uploadImage(file, folder = 'vehicles') {
    try {
        // Check admin access
        const access = await checkAdminAccess();
        if (!access.allowed) {
            throw new Error(`Access denied: ${access.reason}`);
        }
        
        if (!imagekitInstance) {
            await initImageKit();
            if (!imagekitInstance) {
                throw new Error('ImageKit not initialized');
            }
        }
        
        console.log(`📤 Uploading image: ${file.name}`);
        
        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop();
        const filename = `${folder}/${timestamp}_${random}.${extension}`;
        
        // Upload using ImageKit SDK
        const result = await new Promise((resolve, reject) => {
            imagekitInstance.upload({
                file: file,
                fileName: filename,
                folder: folder,
                useUniqueFileName: true,
                responseFields: ['url', 'fileId', 'name', 'size']
            }, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
        
        console.log(`✅ Image uploaded: ${result.url}`);
        return result.url;
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        return null;
    }
}

// Upload multiple images
export async function uploadImages(files, folder = 'vehicles') {
    try {
        // Check admin access
        const access = await checkAdminAccess();
        if (!access.allowed) {
            throw new Error(`Access denied: ${access.reason}`);
        }
        
        const urls = [];
        for (const file of files) {
            const url = await uploadImage(file, folder);
            if (url) {
                urls.push(url);
            }
        }
        console.log(`✅ Uploaded ${urls.length} images`);
        return urls;
    } catch (error) {
        console.error('❌ Error uploading images:', error);
        return [];
    }
}

// ========================================
// VEHICLE CRUD OPERATIONS
// ========================================

// Add new vehicle (with admin access check)
export async function addVehicle(vehicleData) {
    try {
        // Check admin access
        const access = await checkAdminAccess();
        if (!access.allowed) {
            throw new Error(`Access denied: ${access.reason}`);
        }
        
        console.log('📝 Adding new vehicle...');
        
        // Validate required fields
        const requiredFields = ['make', 'model', 'price', 'year'];
        for (const field of requiredFields) {
            if (!vehicleData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Add timestamps
        const data = {
            ...vehicleData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            views: 0,
            status: vehicleData.status || 'available'
        };
        
        // Add to Firestore
        const docRef = await addDoc(collection(db, "vehicles"), data);
        console.log(`✅ Vehicle added with ID: ${docRef.id}`);
        
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('❌ Error adding vehicle:', error);
        return { success: false, error: error.message };
    }
}

// Update vehicle (with admin access check)
export async function updateVehicle(vehicleId, vehicleData) {
    try {
        // Check admin access
        const access = await checkAdminAccess();
        if (!access.allowed) {
            throw new Error(`Access denied: ${access.reason}`);
        }
        
        if (!vehicleId) {
            throw new Error('Vehicle ID is required');
        }
        
        console.log(`📝 Updating vehicle: ${vehicleId}`);
        
        // Add updated timestamp
        const data = {
            ...vehicleData,
            updatedAt: serverTimestamp()
        };
        
        // Update in Firestore
        const docRef = doc(db, "vehicles", vehicleId);
        await updateDoc(docRef, data);
        console.log(`✅ Vehicle updated: ${vehicleId}`);
        
        return { success: true };
    } catch (error) {
        console.error('❌ Error updating vehicle:', error);
        return { success: false, error: error.message };
    }
}

// Delete vehicle (with admin access check)
export async function deleteVehicle(vehicleId) {
    try {
        // Check admin access
        const access = await checkAdminAccess();
        if (!access.allowed) {
            throw new Error(`Access denied: ${access.reason}`);
        }
        
        if (!vehicleId) {
            throw new Error('Vehicle ID is required');
        }
        
        console.log(`🗑️ Deleting vehicle: ${vehicleId}`);
        
        // Delete from Firestore
        const docRef = doc(db, "vehicles", vehicleId);
        await deleteDoc(docRef);
        console.log(`✅ Vehicle deleted: ${vehicleId}`);
        
        return { success: true };
    } catch (error) {
        console.error('❌ Error deleting vehicle:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// ADMIN ROLE MANAGEMENT
// ========================================

// Set user role (Super Admin only - with email verification)
export async function setUserRole(targetEmail, role) {
    try {
        console.log(`👤 Setting role for ${targetEmail} to ${role}`);
        
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Not authenticated');
        }
        
        // Check email verification
        if (!user.emailVerified) {
            throw new Error('Email not verified. Please verify your email first.');
        }
        
        const idToken = await user.getIdToken();
        
        const response = await fetch('/setAdminRole', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetEmail, role })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to set role');
        }
        
        const data = await response.json();
        console.log(`✅ Role set: ${targetEmail} → ${role}`);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Error setting role:', error);
        return { success: false, error: error.message };
    }
}

// Get user role (Super Admin only)
export async function getUserRoleByEmail(email) {
    try {
        console.log(`👤 Getting role for ${email}`);
        
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Not authenticated');
        }
        
        // Check email verification
        if (!user.emailVerified) {
            throw new Error('Email not verified. Please verify your email first.');
        }
        
        const idToken = await user.getIdToken();
        
        const response = await fetch(`/getUserRole?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get role');
        }
        
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('❌ Error getting role:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// EXPOSE FOR GLOBAL USE
// ========================================
window.__admin = {
    loginAdmin,
    logoutAdmin,
    onAuthStateChange,
    checkAdminAccess,
    resendVerificationEmail,
    getImageKitAuth,
    initImageKit,
    uploadImage,
    uploadImages,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setUserRole,
    getUserRoleByEmail,
    getCurrentUser,
    getUserRole,
    isAdmin,
    isSuperAdmin,
    currentUser,
    currentUserRole,
    isAuthenticated,
    isEmailVerified
};

console.log('✅ admin.js loaded successfully (SECURE VERSION)');