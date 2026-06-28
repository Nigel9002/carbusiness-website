// ========================================
// js/vehicles.js - Vehicle-related functions
// ========================================

import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    doc, 
    updateDoc, 
    increment,
    getDocs,
    where,
    limit,
    getDoc
} from "firebase/firestore";

// ========================================
// CONSTANTS
// ========================================
export const WHATSAPP_NUMBER = '254712345678';
export const DEBOUNCE_DELAY = 300;
export const PHONE_NUMBER = '+254712345678';

// ========================================
// STATE
// ========================================
export let liveInventory = [];
export let debounceTimer = null;
export let currentCarId = null;

// ========================================
// FIRESTORE QUERY - REAL-TIME LISTENER
// ========================================
export function loadVehicles(callback) {
    console.log('📦 Loading vehicles from Firestore...');
    
    const q = query(
        collection(db, "vehicles"), 
        orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
        liveInventory = [];
        snapshot.forEach((doc) => {
            liveInventory.push({ id: doc.id, ...doc.data() });
        });
        console.log(`📦 Found ${liveInventory.length} vehicles`);
        
        if (liveInventory.length > 0) {
            console.log('📦 First vehicle sample:', liveInventory[0]);
        } else {
            console.log('📦 No vehicles found');
        }
        
        if (callback) callback(liveInventory);
    }, (error) => {
        console.error('❌ Firestore error:', error);
    });
}

// ========================================
// GET VEHICLES - ONE TIME FETCH
// ========================================
export async function getVehicles(filters = {}) {
    try {
        console.log('🔍 Fetching vehicles with filters:', filters);
        
        let constraints = [orderBy("createdAt", "desc")];
        
        // Apply filters
        if (filters.featured) {
            constraints.push(where("featured", "==", true));
        }
        if (filters.limit) {
            constraints.push(limit(filters.limit));
        }
        if (filters.make) {
            constraints.push(where("make", "==", filters.make));
        }
        if (filters.status) {
            constraints.push(where("status", "==", filters.status));
        }
        
        const finalQuery = query(collection(db, "vehicles"), ...constraints);
        const snapshot = await getDocs(finalQuery);
        
        const vehicles = [];
        snapshot.forEach((doc) => {
            vehicles.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`🔍 Found ${vehicles.length} vehicles with filters`);
        return vehicles;
    } catch (error) {
        console.error('❌ Error fetching vehicles:', error);
        return [];
    }
}

// ========================================
// GET VEHICLE BY ID - FIXED
// ========================================
export async function getVehicleById(vehicleId) {
    try {
        if (!vehicleId) {
            console.error('❌ No vehicle ID provided');
            return null;
        }
        
        console.log(`🔍 Fetching vehicle by ID: ${vehicleId}`);
        
        // Simple and efficient: use doc() + getDoc()
        const docRef = doc(db, "vehicles", vehicleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const vehicle = { id: docSnap.id, ...docSnap.data() };
            console.log(`✅ Vehicle found: ${vehicle.make} ${vehicle.model}`);
            return vehicle;
        } else {
            console.log(`❌ No vehicle found with ID: ${vehicleId}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching vehicle:', error);
        return null;
    }
}

// ========================================
// VIEW COUNTER
// ========================================
export async function incrementViewCount(carId) {
    try {
        if (!carId) {
            console.warn('⚠️ No car ID provided for view increment');
            return;
        }
        
        console.log(`👁️ Incrementing view count for: ${carId}`);
        const carRef = doc(db, "vehicles", carId);
        await updateDoc(carRef, { views: increment(1) });
        console.log(`✅ View count incremented for: ${carId}`);
    } catch (error) {
        console.log('⚠️ View count update skipped:', error.message);
    }
}

// ========================================
// RENDER VEHICLE CARDS ON INDEX PAGE
// ========================================
export function renderVehicleCards(vehicles, containerId = 'vehicleGrid') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container #${containerId} not found`);
        return;
    }

    if (!vehicles || vehicles.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--gray); grid-column: 1 / -1;">
                <p>🚗 No vehicles available at the moment.</p>
                <p style="font-size: 0.9rem;">Check back later for new arrivals.</p>
            </div>
        `;
        return;
    }

    console.log(`🎨 Rendering ${vehicles.length} vehicle cards...`);

    container.innerHTML = vehicles.map(vehicle => {
        // Get the first image from the images array
        let imageUrl = 'https://via.placeholder.com/400x225?text=No+Image';
        
        if (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
            imageUrl = vehicle.images[0];
        } else if (vehicle.image && typeof vehicle.image === 'string') {
            imageUrl = vehicle.image;
        }

        // Format price
        const formattedPrice = vehicle.price ? `KSh ${vehicle.price.toLocaleString()}` : 'Price on Request';

        // Build badges HTML
        let badgesHtml = '';
        if (vehicle.badges && Array.isArray(vehicle.badges)) {
            badgesHtml = vehicle.badges.map(badge => 
                `<span class="vehicle-badge">${sanitize(badge)}</span>`
            ).join('');
        }

        // Status badge
        const statusColors = {
            available: '🟢 Available',
            pending: '🟡 Pending',
            sold: '🔴 Sold'
        };
        const statusText = statusColors[vehicle.status] || '🟢 Available';
        const statusClass = vehicle.status || 'available';

        // Vehicle details
        const details = [
            vehicle.year ? `📅 ${vehicle.year}` : null,
            vehicle.transmission ? `⚙️ ${sanitize(vehicle.transmission)}` : null,
            vehicle.fuelType ? `⛽ ${sanitize(vehicle.fuelType)}` : null,
            vehicle.mileage ? `📊 ${vehicle.mileage.toLocaleString()} km` : null
        ].filter(Boolean);

        return `
            <div class="vehicle-card" data-id="${vehicle.id}" data-status="${statusClass}">
                <div class="vehicle-image">
                    <img src="${imageUrl}" 
                         alt="${sanitize(vehicle.make || '')} ${sanitize(vehicle.model || '')}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x225?text=Image+Error'">
                    ${vehicle.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
                    ${vehicle.status === 'sold' ? '<span class="sold-badge">SOLD</span>' : ''}
                </div>
                <div class="vehicle-info">
                    <h3>${sanitize(vehicle.make || 'Unknown')} ${sanitize(vehicle.model || 'Unknown')}</h3>
                    <p class="vehicle-price">${formattedPrice}</p>
                    ${vehicle.description ? `<p class="vehicle-desc">${sanitize(vehicle.description.substring(0, 100))}${vehicle.description.length > 100 ? '...' : ''}</p>` : ''}
                    <div class="vehicle-badges">${badgesHtml}</div>
                    <div class="vehicle-details">
                        ${details.join(' | ')}
                    </div>
                    <div class="vehicle-status status-${statusClass}">${statusText}</div>
                    <a href="/vehicle-detail?id=${vehicle.id}" class="btn btn-primary btn-sm">View Details</a>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// RENDER VEHICLE TABLE FOR ADMIN
// ========================================
export function renderVehicleTable(items, containerId = 'adminTableBody', countId = 'count') {
    const tbody = document.getElementById(containerId);
    const countEl = document.getElementById(countId);
    
    if (!tbody) {
        console.error(`❌ Table body #${containerId} not found`);
        return;
    }
    
    if (countEl) {
        countEl.textContent = items.length;
    }

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color:var(--gray); padding:1.5rem;">
                    No vehicles yet
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map((car) => {
        let imgSrc = 'https://via.placeholder.com/60x34?text=No+Image';
        if (car.images && Array.isArray(car.images) && car.images.length > 0) {
            imgSrc = car.images[0];
        } else if (car.images && typeof car.images === 'string') {
            imgSrc = car.images;
        }

        const status = car.status || 'available';
        const statusColors = {
            available: '🟢',
            pending: '🟡',
            sold: '🔴'
        };

        return `
            <tr>
                <td>
                    <img class="td-img" 
                         src="${imgSrc}" 
                         alt="${sanitize(car.make)} ${sanitize(car.model)}"
                         onerror="this.src='https://via.placeholder.com/60x34?text=Error'; this.style.border='2px solid #dc2626';"
                         loading="lazy" />
                </td>
                <td>
                    <strong>${sanitize(car.make)} ${sanitize(car.model)}</strong>
                    <div style="font-size:0.8rem; color:var(--gray);">${car.badges?.join(' | ') || ''}</div>
                    ${car.engine ? `<div style="font-size:0.7rem; color:var(--gray);">⚙️ ${sanitize(car.engine)}</div>` : ''}
                </td>
                <td>KSh ${car.price?.toLocaleString() || 0}</td>
                <td>${statusColors[status] || '🟢'} ${status.charAt(0).toUpperCase() + status.slice(1)}</td>
                <td>
                    <span style="color:var(--gray); font-size:0.8rem;">View Only</span>
                </td>
            </tr>
        `;
    }).join('');
}

// ========================================
// HELPER: SANITIZE
// ========================================
function sanitize(str) {
    if (!str) return '';
    return String(str).replace(/[<>]/g, '');
}

// ========================================
// EXPOSE FOR GLOBAL USE
// ========================================
window.__vehicles = {
    liveInventory,
    loadVehicles,
    getVehicles,
    getVehicleById,
    renderVehicleCards,
    renderVehicleTable,
    incrementViewCount
};

console.log('✅ vehicles.js loaded successfully');