// ========================================
// js/compare.js - Vehicle Comparison
// ========================================

import { db, auth, getCurrentUser } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    arrayUnion, 
    arrayRemove,
    serverTimestamp,
    getDocs,
    query,
    where
} from "firebase/firestore";

// ========================================
// CONSTANTS
// ========================================
export const MAX_COMPARE_ITEMS = 4;

// ========================================
// STATE
// ========================================
let compareItems = [];
let currentUserCompare = null;

// ========================================
// GET USER COMPARE LIST
// ========================================
export async function getUserCompareList() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.warn('⚠️ No user logged in');
            return [];
        }

        console.log(`📋 Fetching compare list for user: ${user.uid}`);
        
        const compareRef = doc(db, "compares", user.uid);
        const compareSnap = await getDoc(compareRef);
        
        if (compareSnap.exists()) {
            const data = compareSnap.data();
            currentUserCompare = data;
            compareItems = data.vehicleIds || [];
            console.log(`📋 Found ${compareItems.length} items in compare list`);
            return compareItems;
        } else {
            console.log('📋 No compare list found, creating empty');
            // Create empty compare list
            await setDoc(compareRef, {
                userId: user.uid,
                email: user.email,
                vehicleIds: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            compareItems = [];
            currentUserCompare = { vehicleIds: [] };
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching compare list:', error);
        return [];
    }
}

// ========================================
// ADD TO COMPARE
// ========================================
export async function addToCompare(vehicleId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.warn('⚠️ Please login to compare vehicles');
            return { success: false, error: 'Please login to compare vehicles' };
        }

        if (!vehicleId) {
            return { success: false, error: 'Vehicle ID is required' };
        }

        // Check if already in compare
        const currentList = await getUserCompareList();
        if (currentList.includes(vehicleId)) {
            return { success: false, error: 'Vehicle already in compare list' };
        }

        // Check max limit
        if (currentList.length >= MAX_COMPARE_ITEMS) {
            return { 
                success: false, 
                error: `Maximum ${MAX_COMPARE_ITEMS} vehicles can be compared at once` 
            };
        }

        console.log(`📊 Adding vehicle ${vehicleId} to compare...`);
        
        const compareRef = doc(db, "compares", user.uid);
        
        // Check if compare list exists
        const compareSnap = await getDoc(compareRef);
        
        if (compareSnap.exists()) {
            // Update existing compare list
            await updateDoc(compareRef, {
                vehicleIds: arrayUnion(vehicleId),
                updatedAt: serverTimestamp()
            });
        } else {
            // Create new compare list
            await setDoc(compareRef, {
                userId: user.uid,
                email: user.email,
                vehicleIds: [vehicleId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        
        // Update local state
        if (!compareItems.includes(vehicleId)) {
            compareItems.push(vehicleId);
        }
        
        console.log(`✅ Added vehicle ${vehicleId} to compare`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error adding to compare:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// REMOVE FROM COMPARE
// ========================================
export async function removeFromCompare(vehicleId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.warn('⚠️ No user logged in');
            return { success: false, error: 'No user logged in' };
        }

        if (!vehicleId) {
            return { success: false, error: 'Vehicle ID is required' };
        }

        console.log(`📊 Removing vehicle ${vehicleId} from compare...`);
        
        const compareRef = doc(db, "compares", user.uid);
        await updateDoc(compareRef, {
            vehicleIds: arrayRemove(vehicleId),
            updatedAt: serverTimestamp()
        });
        
        // Update local state
        compareItems = compareItems.filter(id => id !== vehicleId);
        
        console.log(`✅ Removed vehicle ${vehicleId} from compare`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error removing from compare:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// TOGGLE COMPARE
// ========================================
export async function toggleCompare(vehicleId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.warn('⚠️ Please login to manage compare list');
            return { success: false, error: 'Please login' };
        }

        // Check if already in compare
        const isInCompare = await isInCompare(vehicleId);
        
        if (isInCompare) {
            return await removeFromCompare(vehicleId);
        } else {
            return await addToCompare(vehicleId);
        }
    } catch (error) {
        console.error('❌ Error toggling compare:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// CHECK IF IN COMPARE
// ========================================
export async function isInCompare(vehicleId) {
    try {
        if (!vehicleId) return false;
        
        // First check local state
        if (compareItems.includes(vehicleId)) {
            return true;
        }
        
        // If not in local state, fetch from server
        const user = await getCurrentUser();
        if (!user) return false;
        
        const compareRef = doc(db, "compares", user.uid);
        const compareSnap = await getDoc(compareRef);
        
        if (compareSnap.exists()) {
            const data = compareSnap.data();
            const ids = data.vehicleIds || [];
            compareItems = ids;
            return ids.includes(vehicleId);
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error checking compare:', error);
        return false;
    }
}

// ========================================
// GET COMPARE COUNT
// ========================================
export async function getCompareCount() {
    try {
        const items = await getUserCompareList();
        return items.length;
    } catch (error) {
        console.error('❌ Error getting compare count:', error);
        return 0;
    }
}

// ========================================
// GET COMPARE VEHICLES
// ========================================
export async function getCompareVehicles() {
    try {
        const vehicleIds = await getUserCompareList();
        if (vehicleIds.length === 0) return [];
        
        // Fetch vehicle details
        const { getVehicles } = await import('./vehicles.js');
        const allVehicles = await getVehicles({ limit: 100 });
        return allVehicles.filter(v => vehicleIds.includes(v.id));
    } catch (error) {
        console.error('❌ Error getting compare vehicles:', error);
        return [];
    }
}

// ========================================
// RENDER COMPARE TABLE
// ========================================
export async function renderCompareTable(containerId = 'compareTable') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container #${containerId} not found`);
        return;
    }

    const user = await getCurrentUser();
    if (!user) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p>📊 Please login to compare vehicles</p>
                <button onclick="window.__compare.loginPrompt()" class="btn btn-primary">
                    Login
                </button>
            </div>
        `;
        return;
    }

    const vehicles = await getCompareVehicles();
    
    if (vehicles.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="font-size: 2rem;">📊</p>
                <p>No vehicles to compare</p>
                <p style="font-size: 0.9rem; color: var(--gray);">
                    Add up to ${MAX_COMPARE_ITEMS} vehicles to compare side by side
                </p>
                <a href="/" class="btn btn-primary">Browse Vehicles</a>
            </div>
        `;
        return;
    }

    // Build comparison table
    const fields = [
        { key: 'image', label: 'Vehicle', render: (v) => `
            <img src="${v.images?.[0] || 'https://via.placeholder.com/200x150?text=No+Image'}" 
                 alt="${v.make} ${v.model}"
                 style="width:100%; max-width:200px; border-radius:8px; margin-bottom:8px;">
            <br>
            <strong>${v.make} ${v.model}</strong>
        ` },
        { key: 'year', label: 'Year' },
        { key: 'price', label: 'Price', render: (v) => `KSh ${v.price?.toLocaleString() || 'N/A'}` },
        { key: 'mileage', label: 'Mileage', render: (v) => v.mileage ? `${v.mileage.toLocaleString()} km` : 'N/A' },
        { key: 'transmission', label: 'Transmission' },
        { key: 'fuelType', label: 'Fuel Type' },
        { key: 'engine', label: 'Engine' },
        { key: 'color', label: 'Color' },
        { key: 'status', label: 'Status', render: (v) => {
            const colors = { available: '🟢', pending: '🟡', sold: '🔴' };
            return `${colors[v.status] || '🟢'} ${v.status || 'Available'}`;
        } },
        { key: 'action', label: 'Action', render: (v) => `
            <button onclick="window.__compare.removeFromCompare('${v.id}')" 
                    class="btn btn-danger btn-sm">
                Remove
            </button>
        ` }
    ];

    let html = `
        <div style="overflow-x: auto;">
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        ${fields.map(f => `<th style="padding:12px; background: var(--dark); color: white;">${f.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    // For each vehicle, create a row
    vehicles.forEach((vehicle, index) => {
        html += `<tr style="${index % 2 === 0 ? 'background: var(--light);' : ''}">`;
        fields.forEach(field => {
            html += `<td style="padding:12px; text-align:center; border-bottom:1px solid var(--gray-light);">`;
            if (field.render) {
                html += field.render(vehicle);
            } else {
                html += vehicle[field.key] || 'N/A';
            }
            html += `</td>`;
        });
        html += `</tr>`;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div style="text-align:center; margin-top:16px;">
            <p style="font-size:0.9rem; color:var(--gray);">
                ${vehicles.length} of ${MAX_COMPARE_ITEMS} vehicles compared
            </p>
            <button onclick="window.__compare.clearCompare()" class="btn btn-danger">
                Clear All
            </button>
        </div>
    `;

    container.innerHTML = html;
}

// ========================================
// CLEAR COMPARE
// ========================================
export async function clearCompare() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'No user logged in' };
        }

        console.log('🗑️ Clearing compare list...');
        
        const compareRef = doc(db, "compares", user.uid);
        await updateDoc(compareRef, {
            vehicleIds: [],
            updatedAt: serverTimestamp()
        });
        
        compareItems = [];
        console.log('✅ Compare list cleared');
        return { success: true };
    } catch (error) {
        console.error('❌ Error clearing compare:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// RENDER COMPARE BUTTON
// ========================================
export function renderCompareButton(vehicleId, containerId = null) {
    const container = containerId ? document.getElementById(containerId) : document;
    
    const buttons = container.querySelectorAll(`.compare-btn[data-vehicle-id="${vehicleId}"]`);
    
    buttons.forEach(async (button) => {
        const isInList = await isInCompare(vehicleId);
        const count = await getCompareCount();
        
        if (isInList) {
            button.innerHTML = '📊 Added';
            button.classList.add('active');
            button.title = 'Remove from compare';
        } else {
            button.innerHTML = count >= MAX_COMPARE_ITEMS ? '📊 Full' : '📊 Compare';
            button.classList.remove('active');
            button.title = count >= MAX_COMPARE_ITEMS ? 'Compare list full' : 'Add to compare';
        }
        
        // Disable if full
        if (count >= MAX_COMPARE_ITEMS && !isInList) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }
    });
}

// ========================================
// LOGIN PROMPT
// ========================================
window.__compare = {
    getUserCompareList,
    addToCompare,
    removeFromCompare,
    toggleCompare,
    isInCompare,
    getCompareCount,
    getCompareVehicles,
    renderCompareTable,
    renderCompareButton,
    clearCompare,
    loginPrompt: () => {
        window.location.href = '/admin.html';
    },
    MAX_COMPARE_ITEMS
};

console.log('✅ compare.js loaded successfully');