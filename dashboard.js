// =====================================
// DASHBOARD ENGINE
// =====================================

let dashboardStats = {};
let activeBookings = [];
let roomInventory = [];

const TOTAL_ROOMS = 8;

// =====================================
// INIT
// =====================================

async function initializeDashboard() {

  await loadDashboard();

  startAutoRefresh();

}

// =====================================
// LOAD DASHBOARD
// =====================================

async function loadDashboard() {

  try {

    const [
      rooms,
      bookings,
      stats
    ] = await Promise.all([

      getRooms(),
      getActiveBookings(),
      getDashboardStats()

    ]);

    roomInventory =
      rooms || [];

    activeBookings =
      bookings || [];

    dashboardStats =
      stats || {};

    renderDashboard();

  }

  catch(error) {

    console.error(
      "Dashboard Load Error",
      error
    );

    showToast(
      "Unable to load dashboard"
    );

  }

}

// =====================================
// RENDER
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

  const occupiedRooms =
    activeBookings.length;

  const occupancy =
    Math.round(
      (occupiedRooms / TOTAL_ROOMS)
      * 100
    );

  const occupancyCount =
    document.getElementById(
      "occupancyCount"
    );

  if(occupancyCount){

    occupancyCount.innerText =
      `${occupiedRooms}/${TOTAL_ROOMS}`;

  }

  const ring =
    document.querySelector(
      ".ring-value"
    );

  if(ring){

    ring.innerText =
      `${occupancy}%`;

  }

}

// =====================================
// STATS CARDS
// =====================================

function updateStatsCards() {

  const cards =
    document.querySelectorAll(
      ".stat-card h3"
    );

  if(cards.length < 4)
    return;

  cards[0].innerText =
    `₹${dashboardStats.revenue || 0}`;

  cards[1].innerText =
    `₹${dashboardStats.pending || 0}`;

  cards[2].innerText =
    dashboardStats.checkouts || 0;

  cards[3].innerText =
    dashboardStats.guests || 0;

}

// =====================================
// ROOM GRID
// =====================================

function renderRoomGrid() {

  const grid =
    document.getElementById(
      "roomGrid"
    );

  if(!grid)
    return;

  grid.innerHTML = "";

  roomInventory.forEach(room => {

    const booking =
      activeBookings.find(
        b =>
        b.room_type ===
        room.room_name
      );

    const card =
      createRoomCard(
        room,
        booking
      );

    grid.appendChild(
      card
    );

  });

}

// =====================================
// CREATE ROOM CARD
// =====================================

function createRoomCard(
  room,
  booking
) {

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "room-card";

  if(booking){

    card.innerHTML = `

      <div class="room-top">

        <div>

          <div class="room-name">
            ${room.room_name}
          </div>

          <div class="room-guest">
            ${booking.guest_name}
          </div>

        </div>

        <div class="room-status status-occupied">
          Occupied
        </div>

      </div>

      <div class="room-meta">

        <span>
          👥 ${booking.guests_count}
        </span>

        <span>
          🌙 ${booking.nights}
        </span>

      </div>

      <div class="room-actions">

        <button
        class="checkout-btn"
        data-booking="${booking.booking_id}">

          Checkout

        </button>

      </div>

    `;

    card.onclick = () => {

      openCheckoutModal(
        booking
      );

    };

  }

  else {

    card.innerHTML = `

      <div class="room-top">

        <div>

          <div class="room-name">
            ${room.room_name}
          </div>

          <div class="room-guest">
            Available
          </div>

        </div>

        <div class="room-status status-vacant">
          Vacant
        </div>

      </div>

      <div class="room-actions">

        <button
        class="checkin-btn"
        data-room="${room.room_name}">

          Check In

        </button>

      </div>

    `;

    card.onclick = () => {

      openCheckinForRoom(
        room.room_name
      );

    };

  }

  return card;

}

// =====================================
// CHECKIN SHORTCUT
// =====================================

function openCheckinForRoom(
  roomName
) {

  const modal =
    document.getElementById(
      "checkinModal"
    );

  if(modal){

    modal.classList.add(
      "active"
    );

  }

  const roomSelect =
    document.getElementById(
      "roomSelect"
    );

  if(roomSelect){

    roomSelect.value =
      roomName;

  }

}

// =====================================
// PENDING COLLECTION
// =====================================

function calculatePending() {

  let total = 0;

  activeBookings.forEach(
    booking => {

      total += Number(
        booking.balance_due || 0
      );

    }
  );

  return total;

}

// =====================================
// ACTIVE GUESTS
// =====================================

function getActiveGuestCount() {

  let guests = 0;

  activeBookings.forEach(
    booking => {

      guests += Number(
        booking.guests_count || 0
      );

    }
  );

  return guests;

}

// =====================================
// REFRESH
// =====================================

function startAutoRefresh() {

  setInterval(() => {

    loadDashboard();

  },30000);

}

// =====================================
// PAGE LOAD
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeDashboard();

  }
);
