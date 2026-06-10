// =====================================
// CHECK-IN ENGINE (FULLY CORRECTED)
// =====================================

let selectedRooms = [];
let checkinForm = null;               // DECLARED HERE

// =====================================
// INIT
// =====================================

function initializeCheckin() {

  checkinForm = document.getElementById("checkinForm");

  bindCheckinEvents();

  loadAvailableRooms();

}

// =====================================
// EVENTS
// =====================================

function bindCheckinEvents() {

  const fab = document.getElementById("fab");

  if (fab) {
    fab.addEventListener("click", openCheckinModal);
  }

  const closeBtn = document.querySelector(".close-modal");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeCheckinModal);
  }

  if (checkinForm) {
    checkinForm.addEventListener("submit", submitCheckin);
  }

}

// =====================================
// LOAD ROOMS (SAFE)
// =====================================

async function loadAvailableRooms() {

  try {

    const rooms = await getRooms();

    console.log("Rooms Loaded", rooms);

    const container = document.getElementById("roomSelector");

    if (!container) {
      console.warn("roomSelector element not found");
      return;
    }

    container.innerHTML = "";

    // ✅ Guard against null/undefined rooms
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      container.innerHTML = '<div class="error-msg">⚠️ No rooms configured. Check API settings.</div>';
      return;
    }

    rooms.forEach(room => {

      const card = document.createElement("div");
      card.className = "room-option";
      card.innerHTML = `<div class="room-name">${escapeHtml(room.room_name)}</div>`;

      card.onclick = () => toggleRoom(room.room_name, card);

      container.appendChild(card);

    });

  } catch (error) {

    console.error("Room Loading Error", error);
    showToast("Could not load rooms. Check API URL.");

  }

}

// Helper to prevent XSS
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
// TOGGLE ROOM SELECTION
// =====================================

function toggleRoom(roomName, card) {

  if (selectedRooms.includes(roomName)) {

    selectedRooms = selectedRooms.filter(room => room !== roomName);
    card.classList.remove("selected");

  } else {

    selectedRooms.push(roomName);
    card.classList.add("selected");

  }

  const countSpan = document.getElementById("selectedRoomCount");
  if (countSpan) {
    countSpan.innerText = selectedRooms.length;
  }

  console.log("Selected rooms:", selectedRooms);

}

// =====================================
// OPEN MODAL
// =====================================

function openCheckinModal() {

  const modal = document.getElementById("checkinModal");
  if (modal) modal.classList.add("active");

  // Reset selected rooms when opening modal? (Optional - but improves UX)
  // Uncomment next line if you want fresh selection each time
  // selectedRooms = [];
  // const countSpan = document.getElementById("selectedRoomCount");
  // if (countSpan) countSpan.innerText = "0";
  // document.querySelectorAll(".room-option").forEach(card => card.classList.remove("selected"));

}

// =====================================
// CLOSE MODAL
// =====================================

function closeCheckinModal() {

  const modal = document.getElementById("checkinModal");
  if (modal) modal.classList.remove("active");

}

// =====================================
// VALIDATION
// =====================================

function validateCheckin(data) {

  if (!data.guest_name) {
    showToast("Enter guest name");
    return false;
  }

  if (!data.phone_number) {
    showToast("Enter phone number");
    return false;
  }

  if (selectedRooms.length === 0) {
    showToast("Select at least one room");
    return false;
  }

  if (!data.guests_count || data.guests_count < 1) {
    showToast("Enter valid guest count");
    return false;
  }

  if (!data.nights || data.nights < 1) {
    showToast("Enter valid number of nights");
    return false;
  }

  return true;

}

// =====================================
// SUBMIT CHECK-IN
// =====================================

async function submitCheckin(event) {

  event.preventDefault();

  const submitBtn = document.querySelector("#checkinForm .primary-btn");
  if (!submitBtn) return;

  submitBtn.disabled = true;
  submitBtn.innerText = "Checking In...";

  const payload = {
    guest_name: document.getElementById("guestName").value.trim(),
    phone_number: document.getElementById("phoneNumber").value.trim(),
    room_type: selectedRooms.join(","),
    guests_count: Number(document.getElementById("guestCount").value),
    nights: Number(document.getElementById("nights").value),
    meal_plan: document.getElementById("mealPlan").value,
    advance_paid: Number(document.getElementById("advancePaid").value || 0),
    advance_payment_mode: document.getElementById("paymentMode").value,
    advance_received_by: "Reception",
    check_in_date: new Date().toISOString().split("T")[0],
    note: document.getElementById("notes").value
  };

  if (!validateCheckin(payload)) {
    submitBtn.disabled = false;
    submitBtn.innerText = "Check In";
    return;
  }

  try {

    const result = await createCheckin(payload);

    if (result && result.success !== false) {   // adjust if your API returns different success indicator
      sendOwnerCheckinMessage(payload);
      resetCheckinForm();
      closeCheckinModal();

      // Refresh UI
      if (typeof loadDashboard === "function") await loadDashboard();
      if (typeof loadAvailableRooms === "function") await loadAvailableRooms();

      showSuccessToast("Guest Checked In");
    } else {
      throw new Error("API returned failure");
    }

  } catch (error) {

    console.error("Check-in error:", error);
    showToast("Check-in failed. Check API connectivity.");

  } finally {

    submitBtn.disabled = false;
    submitBtn.innerText = "Check In";

  }

}

// =====================================
// RESET FORM
// =====================================

function resetCheckinForm() {

  if (!checkinForm) return;

  checkinForm.reset();

  // Also reset selected rooms
  selectedRooms = [];
  const countSpan = document.getElementById("selectedRoomCount");
  if (countSpan) countSpan.innerText = "0";

  document.querySelectorAll(".room-option").forEach(card => {
    card.classList.remove("selected");
  });

}

// =====================================
// OWNER WHATSAPP NOTIFICATION
// =====================================

function sendOwnerCheckinMessage(booking) {

  if (!CONFIG.OWNER_PHONE) return;

  const msg = `🏡 GOOD EARTH HOMESTAY

New Check-In

Guest: ${booking.guest_name}
Room: ${booking.room_type}
Guests: ${booking.guests_count}
Nights: ${booking.nights}
Advance: ₹${booking.advance_paid}
Meal Plan: ${booking.meal_plan}
Phone: ${booking.phone_number}`;

  sendWhatsApp(CONFIG.OWNER_PHONE, msg);

}

// =====================================
// SUCCESS TOAST
// =====================================

function showSuccessToast(message) {

  let toast = document.querySelector(".toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.innerText = message;
  toast.classList.add("success", "show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);

}

// =====================================
// PRESELECT ROOM (FIXED)
// =====================================

function preselectRoom(roomName) {

  openCheckinModal();

  // Wait a tiny bit for modal animation and room options to render
  setTimeout(() => {
    const roomOptions = document.querySelectorAll(".room-option");
    for (let opt of roomOptions) {
      const nameDiv = opt.querySelector(".room-name");
      if (nameDiv && nameDiv.innerText.trim() === roomName) {
        // If not already selected, click it
        if (!selectedRooms.includes(roomName)) {
          opt.click();
        }
        break;
      }
    }
  }, 100);

}

// =====================================
// START ON PAGE LOAD
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  initializeCheckin();
});
