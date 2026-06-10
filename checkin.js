// =====================================
// CHECK-IN ENGINE (FULLY CORRECTED)
// =====================================

let selectedRooms = [];
let checkinForm = null;

function initializeCheckin() {
  checkinForm = document.getElementById("checkinForm");
  bindCheckinEvents();
  loadAvailableRooms();
}

function bindCheckinEvents() {
  const fab = document.getElementById("fab");
  if (fab) fab.addEventListener("click", openCheckinModal);

  const closeBtns = document.querySelectorAll("[data-close]");
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  if (checkinForm) checkinForm.addEventListener("submit", submitCheckin);
}

async function loadAvailableRooms() {
  try {
    const rooms = await getRooms();
    const container = document.getElementById("roomSelector");
    if (!container) return;
    container.innerHTML = "";
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      container.innerHTML = '<div class="error-msg">⚠️ No rooms configured.</div>';
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
    console.error(error);
    showToast("Could not load rooms");
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function toggleRoom(roomName, card) {
  if (selectedRooms.includes(roomName)) {
    selectedRooms = selectedRooms.filter(r => r !== roomName);
    card.classList.remove("selected");
  } else {
    selectedRooms.push(roomName);
    card.classList.add("selected");
  }
  const countSpan = document.getElementById("selectedRoomCount");
  if (countSpan) countSpan.innerText = selectedRooms.length;
}

function openCheckinModal() {
  const modal = document.getElementById("checkinModal");
  if (modal) modal.classList.add("active");

  // Set default datetime to now (local)
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultDateTime = now.toISOString().slice(0, 16);
  const dtInput = document.getElementById("checkinDateTime");
  if (dtInput && !dtInput.value) dtInput.value = defaultDateTime;

  // Clear previous selections
  selectedRooms = [];
  document.getElementById("selectedRoomCount").innerText = "0";
  document.querySelectorAll(".room-option").forEach(card => card.classList.remove("selected"));
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function validateCheckin(data) {
  if (!data.guest_name) { showToast("Enter guest name"); return false; }
  if (!data.phone_number) { showToast("Enter phone number"); return false; }
  if (selectedRooms.length === 0) { showToast("Select at least one room"); return false; }
  if (!data.guests_count || data.guests_count < 1) { showToast("Enter guest count"); return false; }
  if (!data.nights || data.nights < 1) { showToast("Enter nights"); return false; }
  if (!data.check_in_date) { showToast("Select check-in date & time"); return false; }
  return true;
}

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
    check_in_date: document.getElementById("checkinDateTime").value,
    note: document.getElementById("notes").value
  };

  if (!validateCheckin(payload)) {
    submitBtn.disabled = false;
    submitBtn.innerText = "Check In";
    return;
  }

  try {
    const result = await createCheckin(payload);
    if (result) {
      sendOwnerCheckinMessage(payload);
      resetCheckinForm();
      closeModal("checkinModal");
      if (typeof loadDashboard === "function") await loadDashboard();
      await loadAvailableRooms();
      showSuccessToast("Guest Checked In");
    } else throw new Error("API failed");
  } catch (error) {
    console.error(error);
    showToast("Check-in failed");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Check In";
  }
}

function resetCheckinForm() {
  if (checkinForm) checkinForm.reset();
  selectedRooms = [];
  const countSpan = document.getElementById("selectedRoomCount");
  if (countSpan) countSpan.innerText = "0";
  document.querySelectorAll(".room-option").forEach(card => card.classList.remove("selected"));
}

function sendOwnerCheckinMessage(booking) {
  if (!CONFIG.OWNER_PHONE) return;
  const msg = `🏡 GOOD EARTH HOMESTAY\n\nNew Check-In\nGuest: ${booking.guest_name}\nRoom: ${booking.room_type}\nGuests: ${booking.guests_count}\nNights: ${booking.nights}\nAdvance: ₹${booking.advance_paid}\nMeal Plan: ${booking.meal_plan}\nPhone: ${booking.phone_number}\nCheck-in: ${booking.check_in_date}`;
  sendWhatsApp(CONFIG.OWNER_PHONE, msg);
}

function showSuccessToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) { toast = document.createElement("div"); toast.className = "toast"; document.body.appendChild(toast); }
  toast.innerText = message;
  toast.classList.add("success", "show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function preselectRoom(roomName) {
  openCheckinModal();
  setTimeout(() => {
    const options = document.querySelectorAll(".room-option");
    for (let opt of options) {
      if (opt.innerText.trim() === roomName) {
        if (!selectedRooms.includes(roomName)) opt.click();
        break;
      }
    }
  }, 100);
}

document.addEventListener("DOMContentLoaded", () => initializeCheckin());
