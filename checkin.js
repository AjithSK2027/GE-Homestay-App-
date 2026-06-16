// =====================================
// CHECK-IN ENGINE (FINAL)
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
  closeBtns.forEach(btn => btn.addEventListener("click", () => closeModal(btn.dataset.close)));
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

function addGuestEntry() {
  const container = document.getElementById("guestsContainer");
  const newEntry = document.createElement("div");
  newEntry.className = "guest-entry";
  newEntry.innerHTML = `
    <input type="text" class="guest-name" placeholder="Full Name *" required>
    <input type="text" class="guest-aadhaar" placeholder="Aadhaar Number">
    <input type="email" class="guest-email" placeholder="Email">
    <input type="tel" class="guest-phone" placeholder="Phone Number">
    <button type="button" class="remove-guest-btn" onclick="this.parentElement.remove()">✖ Remove</button>
  `;
  container.appendChild(newEntry);
}

function collectAllGuests() {
  const guests = [];
  const entries = document.querySelectorAll("#guestsContainer .guest-entry");
  for (let entry of entries) {
    const name = entry.querySelector(".guest-name")?.value.trim();
    if (!name) continue;
    guests.push({
      name: name,
      aadhaar: entry.querySelector(".guest-aadhaar")?.value.trim() || "",
      email: entry.querySelector(".guest-email")?.value.trim() || "",
      phone: entry.querySelector(".guest-phone")?.value.trim() || ""
    });
  }
  return guests;
}

function openCheckinModal() {
  const modal = document.getElementById("checkinModal");
  if (modal) modal.classList.add("active");
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultDateTime = now.toISOString().slice(0, 16);
  const dtInput = document.getElementById("checkinDateTime");
  if (dtInput && !dtInput.value) dtInput.value = defaultDateTime;
  selectedRooms = [];
  const countSpan = document.getElementById("selectedRoomCount");
  if (countSpan) countSpan.innerText = "0";
  document.querySelectorAll(".room-option").forEach(card => card.classList.remove("selected"));
  const container = document.getElementById("guestsContainer");
  if (container) {
    container.innerHTML = `
      <div class="guest-entry">
        <input type="text" class="guest-name" placeholder="Full Name *" required>
        <input type="text" class="guest-aadhaar" placeholder="Aadhaar Number">
        <input type="email" class="guest-email" placeholder="Email">
        <input type="tel" class="guest-phone" placeholder="Phone Number">
      </div>
    `;
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function validateCheckin(data) {
  if (!data.guest_name) { showToast("Primary guest name is required"); return false; }
  if (selectedRooms.length === 0) { showToast("Select at least one room"); return false; }
  if (!data.guests_count || data.guests_count < 1) { showToast("Enter total PAX"); return false; }
  if (!data.nights || data.nights < 1) { showToast("Enter nights"); return false; }
  if (!data.check_in_date) { showToast("Select check-in date & time"); return false; }
  if (!data.advance_received_by) { showToast("Enter staff name who received advance"); return false; }
  return true;
}

async function submitCheckin(event) {
  event.preventDefault();
  const submitBtn = document.querySelector("#checkinForm .primary-btn");
  if (!submitBtn) return;
  submitBtn.disabled = true;
  submitBtn.innerText = "Checking In...";

  const allGuests = collectAllGuests();
  if (allGuests.length === 0) {
    showToast("At least one guest is required");
    submitBtn.disabled = false;
    submitBtn.innerText = "Check In";
    return;
  }
  const primaryGuest = allGuests[0];

  const payload = {
    guest_name: primaryGuest.name,
    phone_number: primaryGuest.phone,
    email_id: document.getElementById("emailId").value,
    aadhaar_number: document.getElementById("aadhaarNumber").value,
    guests_json: JSON.stringify(allGuests),
    room_type: selectedRooms.join(","),
    guests_count: Number(document.getElementById("guestCount").value),
    nights: Number(document.getElementById("nights").value),
    meal_plan: document.getElementById("mealPlan").value,
    advance_paid: Number(document.getElementById("advancePaid").value || 0),
    advance_payment_mode: document.getElementById("paymentMode").value,
    advance_received_by: document.getElementById("advanceReceivedBy").value,
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
      sendOwnerCheckinMessage(payload, allGuests);
      resetCheckinForm();
      closeModal("checkinModal");
      if (typeof loadDashboard === "function") await loadDashboard();
      await loadAvailableRooms();
      showSuccessToast("Checked In Successfully");
    } else throw new Error("API returned false");
  } catch (error) {
    console.error(error);
    showToast("Check-in failed. Check connection.");
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
  const container = document.getElementById("guestsContainer");
  if (container) {
    container.innerHTML = `
      <div class="guest-entry">
        <input type="text" class="guest-name" placeholder="Full Name *" required>
        <input type="text" class="guest-aadhaar" placeholder="Aadhaar Number">
        <input type="email" class="guest-email" placeholder="Email">
        <input type="tel" class="guest-phone" placeholder="Phone Number">
      </div>
    `;
  }
}

function sendOwnerCheckinMessage(booking, guestsList) {
  if (!CONFIG.OWNER_PHONE) return;
  
  let guestSummary = guestsList.map(g => `${g.name} (${g.phone})`).join("\n");
  const msg = 
`🏡 GOOD EARTH HOMESTAY

✅ New Check-In

Guest: ${booking.guest_name}
Phone: ${booking.phone_number}
Rooms: ${booking.room_type}
PAX: ${booking.guests_count}
Nights: ${booking.nights}
Meal Plan: ${booking.meal_plan}
Advance Paid: ₹${booking.advance_paid}
Payment Mode: ${booking.advance_payment_mode}
Received By: ${booking.advance_received_by}
Check-in: ${booking.check_in_date}

Guests:
${guestSummary}

📝 Notes: ${booking.note || "None"}`;

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

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

document.addEventListener("DOMContentLoaded", () => initializeCheckin());
