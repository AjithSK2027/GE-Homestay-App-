// =====================================
// GOOD EARTH API LAYER (FINAL)
// =====================================

const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzxQD5SWmsqL3mwHeWthf4W9orK2TVxYPsLfKQ44AcTT0CwXXKZFhqPHj95ICk9s4TJEQ/exec",
  OWNER_PHONE: localStorage.getItem("owner_phone") || "",
  UPI_ID: localStorage.getItem("upi_id") || "",
  PLACE_ID: localStorage.getItem("place_id") || ""
};

function saveConfig() {
  localStorage.setItem("apps_script_url", CONFIG.APPS_SCRIPT_URL);
  localStorage.setItem("owner_phone", CONFIG.OWNER_PHONE);
  localStorage.setItem("upi_id", CONFIG.UPI_ID);
  localStorage.setItem("place_id", CONFIG.PLACE_ID);
}

async function apiGet(action) {
  try {
    const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=${action}`);
    if (!response.ok) throw new Error(`GET ${action} failed`);
    return await response.json();
  } catch (error) {
    console.error(error);
    showToast("Connection failed");
    return null;
  }
}

async function apiPost(payload) {
  try {
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("POST ERROR", error);
    showToast("Save failed");
    return null;
  }
}

async function getRooms() { return await apiGet("getRooms"); }
async function getActiveBookings() { return await apiGet("getActiveBookings"); }
async function getDashboardStats() { return await apiGet("getDashboardStats"); }
async function getRoomStatus() { return await apiGet("getRoomStatus"); }

async function createCheckin(data) {
  const payload = {
    event_type: "check_in",
    booking_id: generateBookingId(),
    guest_name: data.guest_name,
    phone_number: data.phone_number,
    email_id: data.email_id || "",
    aadhaar_number: data.aadhaar_number || "",
    room_type: data.room_type,
    check_in_date: data.check_in_date,
    nights: data.nights,
    guests_count: data.guests_count,
    meal_plan: data.meal_plan,
    advance_paid: data.advance_paid,
    advance_received_by: data.advance_received_by,
    advance_payment_mode: data.advance_payment_mode,
    note: data.note,
    guests_json: data.guests_json || "[]",
    balance_due: -(data.advance_paid || 0)
  };
  return await apiPost(payload);
}

async function completeCheckout(data) {
  return await apiPost({
    event_type: "check_out",
    booking_id: data.booking_id,
    guest_name: data.guest_name,
    phone_number: data.phone_number,
    room_type: data.room_type,
    check_out_date: data.check_out_date,
    guests_count: data.guests_count,
    nights: data.nights,
    price_per_head: data.price_per_head,
    room_total: data.room_total,
    extra_desc: data.extra_desc,
    extra_amount: data.extra_amount,
    advance_paid: data.advance_paid,
    payment_received: data.payment_received,
    payment_method: data.payment_method,
    discount_percent: data.discount_percent,
    discount_amount: data.discount_amount,
    discount_reason: data.discount_reason,
    received_by: data.received_by,
    balance_due: 0,
    note: data.note
  });
}

function generateBookingId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900) + 100;
  return `GE-${yyyy}${mm}${dd}-${rand}`;
}

// =====================================
// FIXED WHATSAPP – works on mobile & desktop
// =====================================
function sendWhatsApp(phone, message) {
  if (!phone) {
    console.warn("No phone number provided for WhatsApp");
    return;
  }
  const clean = phone.replace(/\D/g, '');
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  
  // Try window.open first (works on desktop)
  try {
    const win = window.open(url, '_blank');
    // If window.open is blocked or returns null, fallback to location.href
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = url;
    }
  } catch (e) {
    // On mobile, window.open is often blocked; fallback to direct navigation
    window.location.href = url;
  }
}

function getReviewLink() {
  if (!CONFIG.PLACE_ID) return "#";
  return `https://search.google.com/local/writereview?placeid=${CONFIG.PLACE_ID}`;
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}
