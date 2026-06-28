// ========================================
// js/wishlist.js - Wishlist Functionality
// ========================================

import { db, auth, getCurrentUser, getUserRole } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    arrayUnion, 
    arrayRemove,
    serverTimestamp
} from "firebase/firestore";

// ========================================
// STATE
// ========================================
let wishlistItems = [];
let currentUserWishlist = null;

// ========================================
// GET USER WISHLIST
// ========================================
export async function getUserWishlist() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.warn('⚠️ No user logged in');
            return [];
        }

        console.log(`📋 Fetching wishlist for user: ${user.uid}`);
        
        const wishlistRef = doc(db, "wishlists", user.uid);
        const wishlistSnap = await getDoc(wishlistRef);
        
        if (wishlistSnap.exists()) {
            const data = wishlistSnap.data();
            currentUserWishlist = data;
            wishlistItems = data.vehicleIds || [];
            console.log(`📋 Found ${wishlistItems.length} items in wishlist`);
            return wishlistItems;
        } else {
            console.log('📋 No wishlist found, creating empty wishlist');
            // Create empty wishlist
            await setDoc(wishlistRef, {
                userId: user.uid,
                email: user.email,
                vehicleIds: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            wishlistItems = [];
            currentUserWishlist = { vehicleIds: [] };
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching wishlist:', error);
        return [];
    }
}

// ========================================
// ADD TO WISHLIST
// ========================================
export async function addToWishlist(vehicleId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.warn('⚠️ Please login to add to wishlist');
            return { success: false, error: 'Please login to add to wishlist' };
        }

        if (!vehicleId) {
            return { success: false, error: 'Vehicle ID is required' };
        }

        console.log(`❤️ Adding vehicle ${vehicleId} to wishlist...`);
        
        const wishlistRef = doc(db, "wishlists", user.uid);
        
        // Check if wishlist exists
        const wishlistSnap = await getDoc(wishlistRef);
        
        if (wishlistSnap.exists()) {
            // Update existing wishlist
            await updateDoc(wishlistRef, {
                vehicleIds: arrayUnion(vehicleId),
                updatedAt: serverTimestamp()
            });
        } else {
            // Create new wishlist
            await setDoc(wishlistRef, {
                userId: user.uid,
                email: user.email,
                vehicleIds: [vehicleId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        
        // Update local state
        if (!wishlistItems.includes(vehicleId)) {
            wishlistItems.push(vehicleId);
        }
        
        console.log(`✅ Added vehicle ${vehicleId} to wishlist`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error adding to wishlist:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// REMOVE FROM WISHLIST
// ========================================
export async function removeFromWishlist(vehicleId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.warn('⚠️ No user logged in');
            return { success: false, error: 'No user logged in' };
        }

        if (!vehicleId) {
            return { success: false, error: 'Vehicle ID is required' };
        }

        console.log(`💔 Removing vehicle ${vehicleId} from wishlist...`);
        
        const wishlistRef = doc(db, "wishlists", user.uid);
        await updateDoc(wishlistRef, {
            vehicleIds: arrayRemove(vehicleId),
            updatedAt: serverTimestamp()
        });
        
        // Update local state
        wishlistItems = wishlistItems.filter(id => id !== vehicleId);
        
        console.log(`✅ Removed vehicle ${vehicleId} from wishlist`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error removing from wishlist:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// TOGGLE WISHLIST
// ========================================
export async function toggleWishlist(vehicleId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.warn('⚠️ Please login to manage wishlist');
            return { success: false, error: 'Please login' };
        }

        // Check if already in wishlist
        const isInWishlist = await isInWishlist(vehicleId);
        
        if (isInWishlist) {
            return await removeFromWishlist(vehicleId);
        } else {
            return await addToWishlist(vehicleId);
        }
    } catch (error) {
        console.error('❌ Error toggling wishlist:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// CHECK IF IN WISHLIST
// ========================================
export async function isInWishlist(vehicleId) {
    try {
        if (!vehicleId) return false;
        
        // First check local state
        if (wishlistItems.includes(vehicleId)) {
            return true;
        }
        
        // If not in local state, fetch from server
        const user = await getCurrentUser();
        if (!user) return false;
        
        const wishlistRef = doc(db, "wishlists", user.uid);
        const wishlistSnap = await getDoc(wishlistRef);
        
        if (wishlistSnap.exists()) {
            const data = wishlistSnap.data();
            const ids = data.vehicleIds || [];
            wishlistItems = ids;
            return ids.includes(vehicleId);
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error checking wishlist:', error);
        return false;
    }
}

// ========================================
// GET WISHLIST COUNT
// ========================================
export async function getWishlistCount() {
    try {
        const items = await getUserWishlist();
        return items.length;
    } catch (error) {
        console.error('❌ Error getting wishlist count:', error);
        return 0;
    }
}

// ========================================
// RENDER WISHLIST BUTTON
// ========================================
export function renderWishlistButton(vehicleId, containerId = null) {
    const container = containerId ? document.getElementById(containerId) : document;
    
    // Find all wishlist buttons
    const buttons = container.querySelectorAll(`.wishlist-btn[data-vehicle-id="${vehicleId}"]`);
    
    buttons.forEach(async (button) => {
        const isInList = await isInWishlist(vehicleId);
        
        if (isInList) {
            button.innerHTML = '❤️';
            button.classList.add('active');
            button.title = 'Remove from wishlist';
        } else {
            button.innerHTML = '🤍';
            button.classList.remove('active');
            button.title = 'Add to wishlist';
        }
    });
}

// ========================================
// RENDER WISHLIST PAGE
// ========================================
export async function renderWishlistPage(containerId = 'wishlistGrid') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container #${containerId} not found`);
        return;
    }

    const user = await getCurrentUser();
    if (!user) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p>❤️ Please login to view your wishlist</p>
                <button onclick="window.__wishlist.loginPrompt()" class="btn btn-primary">
                    Login
                </button>
            </div>
        `;
        return;
    }

    const vehicleIds = await getUserWishlist();
    
    if (vehicleIds.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="font-size: 2rem;">❤️</p>
                <p>Your wishlist is empty</p>
                <p style="font-size: 0.9rem; color: var(--gray);">
                    Start adding vehicles you love!
                </p>
                <a href="/" class="btn btn-primary">Browse Vehicles</a>
            </div>
        `;
        return;
    }

    // Fetch vehicle details
    const { getVehicles } = await import('./vehicles.js');
    const vehicles = await getVehicles({ limit: 100 });
    const wishlistVehicles = vehicles.filter(v => vehicleIds.includes(v.id));
    
    if (wishlistVehicles.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p>⚠️ Some vehicles may have been removed</p>
                <a href="/" class="btn btn-primary">Browse Vehicles</a>
            </div>
        `;
        return;
    }

    // Render vehicles
    const { renderVehicleCards } = await import('./vehicles.js');
    renderVehicleCards(wishlistVehicles, containerId);
}

// ========================================
// LOGIN PROMPT
// ========================================
window.__wishlist = {
    getUserWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
    renderWishlistButton,
    renderWishlistPage,
    loginPrompt: () => {
        // Redirect to login or show login modal
        window.location.href = '/admin.html';
    }
};

console.log('✅ wishlist.js loaded successfully');