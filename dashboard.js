// =====================================
// DASHBOARD ENGINE (FULLY CORRECTED)
// =====================================

let dashboardStats = {};
let activeBookings = [];
let roomInventory = [];
let TOTAL_ROOMS = 0;

// Helper: Get occupied room names
function getOccupiedRoomNames() {
  const occupied = [];
  if (!activeBookings) return occupied;
  activeBookings.forEach(booking => {
    if (booking.room_type) {
      const rooms = booking.room_type.split(',');
      rooms.forEach(room => occupied.push(room.trim()));
    }
  });
  return occupied;
}

// Helper: Find booking by room name
function findBookingByRoom(roomName) {
  if (!activeBookings) return null;
  return activeBookings.find(booking => {
    if (!booking.room_type) return false;
    const rooms = booking.room_type.split(',');
    return rooms.map(r => r.trim()).includes(roomName);
  });
}

// Load all data
async function loadDashboard() {
  try {
    const [rooms, bookings, stats] = await Promise.all([
      getRooms(),
      getActiveBookings(),
      getDashboardStats()
    ]);

    roomInventory = Array.isArray(rooms) ? rooms : [];
    TOTAL_ROOMS = roomInventory.length;
    activeBookings = Array.isArray(bookings) ? bookings : [];
    dashboardStats = stats || { revenue: 0, pending: 0, checkouts: 0, guests: 0 };

    renderDashboard();  // Now defined below
  } catch(error) {
    console.error("Dashboard Load Error", error);
    showToast("Unable to load dashboard");
  }
}

// Render everything
function renderDashboard() {
  updateHeroCard();
  updateStatsCards();
  renderRoomGrid();
}

// Update occupancy card
function updateHeroCard() {
  const occupiedRooms = getOccupiedRoomNames().length;
  const occupancy = TOTAL_ROOMS ? Math.round((occupiedRooms / TOTAL_ROOMS) * 100) : 0;

  const occupancyCount = document.getElementById("occupancyCount");
  if (occupancyCount) occupancyCount.innerText = `${occupiedRooms}/${TOTAL_ROOMS}`;

  const ring = document.querySelector(".ring-value");
  if (ring) ring.innerText = `${occupancy}%`;
}

// Update stats cards
function updateStatsCards() {
  const revenueEl = document.querySelector(".stat-card.revenue h3");
  if (revenueEl) revenueEl.innerText = `₹${dashboardStats.revenue || 0}`;

  const pendingEl = document.querySelector(".stat-card.pending h3");
  if (pendingEl) pendingEl.innerText = `₹${dashboardStats.pending || 0}`;

  const checkoutsEl = document.querySelector(".stat-card.checkout h3");
  if (checkoutsEl) checkoutsEl.innerText = dashboardStats.checkouts || 0;

  const guestsEl = document.querySelector(".stat-card.guests h3");
  if (guestsEl) guestsEl.innerText = dashboardStats.guests || 0;
}

// Render room grid
function renderRoomGrid() {
  const grid = document.getElementById("roomGrid");
  if (!grid) return;
  grid.innerHTML = "";

  roomInventory.forEach(room => {
    const booking = findBookingByRoom(room.room_name);
    const card = createRoomCard(room, booking);
    grid.appendChild(card);
  });
}

// Create one room card
function createRoomCard(room, booking) {
  const card = document.createElement("div");
  card.className = "room-card";

  if (booking) {
    card.innerHTML = `
      <div class="room-top">
        <div>
          <div class="room-name">${escapeHtml(room.room_name)}</div>
          <div class="room-guest">${escapeHtml(booking.guest_name)}</div>
        </div>
        <div class="room-status status-occupied">Occupied</div>
      </div>
      <div class="room-meta">
        <span>👥 ${booking.guests_count || 0}</span>
        <span>🌙 ${booking.nights || 0}</span>
      </div>
      <div class="room-actions">
        <button class="checkout-btn" data-booking-id="${booking.booking_id}">Checkout</button>
      </div>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("checkout-btn")) {
        e.stopPropagation();
        openCheckoutModal(booking);
      } else {
        openCheckoutModal(booking);
      }
    });
  } else {
    card.innerHTML = `
      <div class="room-top">
        <div>
          <div class="room-name">${escapeHtml(room.room_name)}</div>
          <div class="room-guest">Available</div>
        </div>
        <div class="room-status status-vacant">Vacant</div>
      </div>
      <div class="room-actions">
        <button class="checkin-btn" data-room-name="${escapeHtml(room.room_name)}">Check In</button>
      </div>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("checkin-btn")) {
        e.stopPropagation();
        openCheckinForRoom(room.room_name);
      } else {
        openCheckinForRoom(room.room_name);
      }
    });
  }
  return card;
}

// Helper: escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Open checkin for a specific room (used by dashboard)
function openCheckinForRoom(roomName) {
  const modal = document.getElementById("checkinModal");
  if (modal) modal.classList.add("active");
  if (typeof preselectRoom === "function") {
    preselectRoom(roomName);
  }
}

// Auto refresh every 30 sec
let refreshInterval = null;
function startAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(() => loadDashboard(), 30000);
}

// Initialize
async function initializeDashboard() {
  await loadDashboard();
  startAutoRefresh();
}

// Start on page load
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
});
