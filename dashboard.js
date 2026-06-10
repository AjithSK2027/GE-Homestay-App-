// =====================================
// DASHBOARD ENGINE (FIXED)
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
  activeBookings.forEach(booking => {
    const rooms = booking.room_type.split(',');
    rooms.forEach(room => occupied.push(room.trim()));
  });
  return occupied;
}

// =====================================
// Helper: Find booking for a specific room
// =====================================
function findBookingByRoom(roomName) {
  return activeBookings.find(booking => {
    const rooms = booking.room_type.split(',');
    return rooms.map(r => r.trim()).includes(roomName);
  });
}

// =====================================
// LOAD DASHBOARD (UPDATED)
// =====================================
async function loadDashboard() {
  try {
    const [rooms, bookings, stats] = await Promise.all([
      getRooms(),
      getActiveBookings(),
      getDashboardStats()
    ]);

    roomInventory = rooms || [];
    TOTAL_ROOMS = roomInventory.length; // Dynamic instead of hardcoded 8
    activeBookings = bookings || [];
    dashboardStats = stats || {};

    renderDashboard();
  } catch(error) {
    console.error("Dashboard Load Error", error);
    showToast("Unable to load dashboard");
  }
}

// =====================================
// OCCUPANCY CARD (FIXED)
// =====================================
function updateHeroCard() {
  const occupiedRooms = getOccupiedRoomNames().length;
  const occupancy = TOTAL_ROOMS ? Math.round((occupiedRooms / TOTAL_ROOMS) * 100) : 0;

  const occupancyCount = document.getElementById("occupancyCount");
  if(occupancyCount) {
    occupancyCount.innerText = `${occupiedRooms}/${TOTAL_ROOMS}`;
  }

  const ring = document.querySelector(".ring-value");
  if(ring) {
    ring.innerText = `${occupancy}%`;
  }
}

// =====================================
// CREATE ROOM CARD (FIXED)
// =====================================
function createRoomCard(room, booking) {
  const card = document.createElement("div");
  card.className = "room-card";

  if(booking) {
    card.innerHTML = `
      <div class="room-top">
        <div>
          <div class="room-name">${room.room_name}</div>
          <div class="room-guest">${booking.guest_name}</div>
        </div>
        <div class="room-status status-occupied">Occupied</div>
      </div>
      <div class="room-meta">
        <span>👥 ${booking.guests_count}</span>
        <span>🌙 ${booking.nights}</span>
      </div>
      <div class="room-actions">
        <button class="checkout-btn" data-booking="${booking.booking_id}">Checkout</button>
      </div>
    `;
    card.onclick = () => openCheckoutModal(booking);
  } else {
    card.innerHTML = `
      <div class="room-top">
        <div>
          <div class="room-name">${room.room_name}</div>
          <div class="room-guest">Available</div>
        </div>
        <div class="room-status status-vacant">Vacant</div>
      </div>
      <div class="room-actions">
        <button class="checkin-btn" data-room="${room.room_name}">Check In</button>
      </div>
    `;
    card.onclick = () => openCheckinForRoom(room.room_name);
  }
  return card;
}

function renderRoomGrid() {
  const grid = document.getElementById("roomGrid");
  if(!grid) return;
  grid.innerHTML = "";

  roomInventory.forEach(room => {
    const booking = findBookingByRoom(room.room_name);
    const card = createRoomCard(room, booking);
    grid.appendChild(card);
  });
}

// Keep other functions (updateStatsCards, startAutoRefresh, etc.) as originally written
