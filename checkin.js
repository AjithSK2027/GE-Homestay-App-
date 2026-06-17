// =====================================
// CHECK-IN ENGINE (NO MANDATORY FIELDS)
// =====================================

let selectedRooms = [];
let checkinForm = null;

function initializeCheckin() {
  checkinForm = document.getElementById("checkinForm");
  if (!checkinForm) {
    console.error("checkinForm not found!");
    return;
  }
  bindCheckinEvents();
  loadAvailableRooms();
}

function bindCheckinEvents() {
  const fab = document.getElementById("fab");
  if (fab) fab.addEventListener("click", openCheckinModal);

  const closeBtns = document.querySelectorAll("[data-close]");
  closeBtns.forEach(btn => btn.addEventListener("click", () => closeModal(btn.dataset.close)));

  if (checkinForm) {
    checkinForm.addEventListener("submit", submitCheckin);
  }
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
    console.error("Room load error:", error);
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
  if (!container) return;
  const newEntry = document.createElement("div");
  newEntry.className = "guest-entry";
  newEntry.innerHTML = `
    <input type="text" class="guest-name" placeholder="Full Name *">
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
        <input type="text" class="guest-name" placeholder="Full Name *">
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

// ===== NO VALIDATION – submit even if empty =====
function validateCheckin(data) {
  return true; // always passes
}

async function submitCheckin(event) {
  event.preventDefault();
  const submitBtn = document.querySelector("#checkinForm .primary-btn");
  if (!submitBtn) return;
  submitBtn.disabled = true;
  submitBtn.innerText = "Checking In...";

  // Collect additional guests (optional)
  const allGuests = collectAllGuests();

  // Primary guest comes from the separate fields (not from the list)
  const primaryGuestName = document.getElementById("guestName")?.value || "";
  const primaryPhone = document.getElementById("phoneNumber")?.value || "";
  const primaryEmail = document.getElementById("emailId")?.value || "";
  const primaryAadhaar = document.getElementById("aadhaarNumber")?.value || "";

  const payload = {
    guest_name: primaryGuestName,
    phone_number: primaryPhone,
    email_id: primaryEmail,
    aadhaar_number: primaryAadhaar,
    guests_json: JSON.stringify(allGuests),
    room_type: selectedRooms.join(","),
    guests_count: Number(document.getElementById("guestCount")?.value || 0),
    nights: Number(document.getElementById("nights")?.value || 0),
    meal_plan: document.getElementById("mealPlan")?.value || "EP",
    advance_paid: Number(document.getElementById("advancePaid")?.value || 0),
    advance_payment_mode: document.getElementById("paymentMode")?.value || "",
    advance_received_by: document.getElementById("advanceReceivedBy")?.value || "",
    check_in_date: document.getElementById("checkinDateTime")?.value || "",
    note: document.getElementById("notes")?.value || ""
  };

  // No validation – we skip it
  // if (!validateCheckin(payload)) { ... } // removed

  try {
    const result = await createCheckin(payload);
    if (result && result.success !== false) {
      // Only send WhatsApp if there is a guest name (optional)
      if (primaryGuestName) {
        sendOwnerCheckinMessage(payload, allGuests);
      }
      resetCheckinForm();
      closeModal("checkinModal");
      if (typeof loadDashboard === "function") await loadDashboard();
      await loadAvailableRooms();
      showSuccessToast("Checked In Successfully");
    } else {
      throw new Error("API returned failure");
    }
  } catch (error) {
    console.error("Check-in error:", error);
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
        <input type="text" class="guest-name" placeholder="Full Name *">
        <input type="text" class="guest-aadhaar" placeholder="Aadhaar Number">
        <input type="email" class="guest-email" placeholder="Email">
        <input type="tel" class="guest-phone" placeholder="Phone Number">
      </div>
    `;
  }
}

// WhatsApp Check‑in Message (only if primary guest exists)
function sendOwnerCheckinMessage(booking, guestsList) {
  if (!CONFIG.OWNER_PHONE) return;
  if (!booking.guest_name) return; // skip if no primary guest
  let guestSummary = guestsList.map(g => `${g.name} (${g.phone})`).join("\n") || "None";
  const msg =
`🏡 GOOD EARTH HOMESTAY

✅ New Check-In

Guest: ${booking.guest_name}
Phone: ${booking.phone_number}
Rooms: ${booking.room_type || "Not selected"}
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
