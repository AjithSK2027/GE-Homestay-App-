// =====================================
// DASHBOARD ENGINE (FULLY CORRECTED)
// =====================================

let dashboardStats = {};
let activeBookings = [];
let roomInventory = [];
let TOTAL_ROOMS = 0;

// =====================================
// Helper: Get all occupied room names from bookings
// =====================================
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

// =====================================
// Helper: Find booking for a specific room
// =====================================
function findBookingByRoom(roomName) {
  if (!activeBookings) return null;
  return activeBookings.find(booking => {
    if (!booking.room_type) return false;
    const rooms = booking.room_type.split(',');
    return rooms.map(r => r.trim()).includes(roomName);
  });
}

// =====================================
// LOAD DASHBOARD (SAFE)
// =====================================
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

    renderDashboard();
  } catch(error) {
    console.error("Dashboard Load Error", error);
    showToast("Unable to load dashboard");
  }
}

// =====================================
// RENDER ALL
// =====================================
function renderDashboard() {
  updateHeroCard();
  updateStatsCards();
  renderRoomGrid();
}

// =====================================
// OCCUPANCY CARD
// =====================================
function updateHeroCard() {
  const occupiedRooms = getOccupiedRoomNames().length;
  const occupancy = TOTAL_ROOMS ? Math.round((occupiedRooms / TOTAL_ROOMS) * 100) : 0;

  const occupancyCount = document.getElementById("occupancyCount");
  if (occupancyCount) {
    occupancyCount.innerText = `${occupiedRooms}/${TOTAL_ROOMS}`;
  }

  const ring = document.querySelector(".ring-value");
  if (ring) {
    ring.innerText = `${occupancy}%`;
  }
}

// =====================================
// STATS CARDS
// =====================================
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

// =====================================
// ROOM GRID
// =====================================
function renderRoomGrid() {
  const grid = document.getElementById("roomGrid");
  if (!grid) return;
  grid.innerHTML = "";

  roomInventory.forEach(room => {
    const booking = findBookingByRoom(room.room_name);
    const card = createRoomCard(room, booking);
    grid.appendChild(card);
  });

  // Attach event listeners to buttons (delegation not needed because cards are new each render)
  attachButtonEvents();
}

// =====================================
// CREATE SINGLE ROOM CARD
// =====================================
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
    // Attach click handler to the card (not button) so entire card works
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

// Helper to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// =====================================
// ATTACH BUTTON EVENTS (BACKUP)
// =====================================
function attachButtonEvents() {
  document.querySelectorAll(".checkout-btn").forEach(btn => {
    btn.removeEventListener("click", handleCheckoutClick);
    btn.addEventListener("click", handleCheckoutClick);
  });
  document.querySelectorAll(".checkin-btn").forEach(btn => {
    btn.removeEventListener("click", handleCheckinClick);
    btn.addEventListener("click", handleCheckinClick);
  });
}

function handleCheckoutClick(e) {
  e.stopPropagation();
  const bookingId = e.currentTarget.getAttribute("data-booking-id");
  const booking = activeBookings.find(b => b.booking_id === bookingId);
  if (booking && typeof openCheckoutModal === "function") {
    openCheckoutModal(booking);
  }
}

function handleCheckinClick(e) {
  e.stopPropagation();
  const roomName = e.currentTarget.getAttribute("data-room-name");
  if (roomName && typeof openCheckinForRoom === "function") {
    openCheckinForRoom(roomName);
  }
}

// =====================================
// CHECKIN SHORTCUT
// =====================================
function openCheckinForRoom(roomName) {
  const modal = document.getElementById("checkinModal");
  if (modal) modal.classList.add("active");

  // Use preselectRoom from checkin.js if available
  if (typeof preselectRoom === "function") {
    preselectRoom(roomName);
  } else {
    // Fallback: try to find and click room option after short delay
    setTimeout(() => {
      const roomOptions = document.querySelectorAll(".room-option");
      for (let opt of roomOptions) {
        const nameDiv = opt.querySelector(".room-name");
        if (nameDiv && nameDiv.innerText.trim() === roomName) {
          opt.click();
          break;
        }
      }
    }, 100);
  }
}

// =====================================
// AUTO REFRESH
// =====================================
let refreshInterval = null;

function startAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(() => {
    loadDashboard();
  }, 30000);
}

// =====================================
// INITIALIZE DASHBOARD
// =====================================
async function initializeDashboard() {
  await loadDashboard();
  startAutoRefresh();
}

// =====================================
// PAGE LOAD
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
});
