// =====================================
// CHECKOUT ENGINE (FINAL WITH WHATSAPP)
// =====================================

let currentBooking = null;
let checkoutExtras = [];
let checkoutState = {
  pricePerHead: 0, roomTotal: 0, extrasTotal: 0, subtotal: 0,
  discountPercent: 0, discountAmount: 0, advancePaid: 0, finalBalance: 0
};

function openCheckoutModal(booking) {
  currentBooking = booking;
  checkoutExtras = [];
  checkoutState = {
    pricePerHead: 0, roomTotal: 0, extrasTotal: 0, subtotal: 0,
    discountPercent: 0, discountAmount: 0,
    advancePaid: Number(booking.advance_paid || 0),
    finalBalance: 0
  };
  const modal = document.getElementById("checkoutModal");
  if (modal) modal.classList.add("active");
  populateCheckout();
}

function populateCheckout() {
  document.getElementById("checkoutGuestName").innerText = currentBooking.guest_name;
  document.getElementById("checkoutRoom").innerText = currentBooking.room_type;
  document.getElementById("checkoutGuests").innerText = currentBooking.guests_count;
  document.getElementById("checkoutNights").innerText = currentBooking.nights;
  document.getElementById("checkoutAdvance").innerText = `₹${checkoutState.advancePaid}`;
  const now = new Date();
  now.setDate(now.getDate() + 1);
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultDateTime = now.toISOString().slice(0, 16);
  const dtInput = document.getElementById("checkoutDateTime");
  if (dtInput && !dtInput.value) dtInput.value = defaultDateTime;
  updateCheckoutSummary();
}

function updatePricePerHead() {
  checkoutState.pricePerHead = Number(document.getElementById("pricePerHead").value || 0);
  calculateTotals();
}

function addExtra(desc, amount) {
  checkoutExtras.push({ desc, amount });
  renderExtras();
  calculateTotals();
}

function addCustomExtra() {
  const desc = document.getElementById("extraDescription").value;
  const amount = Number(document.getElementById("extraAmount").value);
  if (!desc || !amount) { showToast("Enter extra details"); return; }
  addExtra(desc, amount);
  document.getElementById("extraDescription").value = "";
  document.getElementById("extraAmount").value = "";
}

function renderExtras() {
  const container = document.getElementById("extrasList");
  if (!container) return;
  container.innerHTML = "";
  checkoutExtras.forEach((extra) => {
    const div = document.createElement("div");
    div.className = "extra-row";
    div.innerHTML = `<span>${escapeHtml(extra.desc)}</span><span>₹${extra.amount}</span>`;
    container.appendChild(div);
  });
}

function updateDiscountPercent() {
  const percent = Number(document.getElementById("discountPercent").value || 0);
  checkoutState.discountPercent = percent;
  checkoutState.discountAmount = (checkoutState.subtotal * percent) / 100;
  document.getElementById("discountAmount").value = Math.round(checkoutState.discountAmount);
  calculateTotals();
}

function updateDiscountAmount() {
  const amount = Number(document.getElementById("discountAmount").value || 0);
  checkoutState.discountAmount = amount;
  checkoutState.discountPercent = checkoutState.subtotal ? (amount / checkoutState.subtotal) * 100 : 0;
  document.getElementById("discountPercent").value = checkoutState.discountPercent.toFixed(1);
  calculateTotals();
}

function calculateTotals() {
  const guests = Number(currentBooking.guests_count);
  const nights = Number(currentBooking.nights);
  checkoutState.roomTotal = checkoutState.pricePerHead * guests * nights;
  checkoutState.extrasTotal = checkoutExtras.reduce((sum, i) => sum + i.amount, 0);
  checkoutState.subtotal = checkoutState.roomTotal + checkoutState.extrasTotal;
  checkoutState.finalBalance = checkoutState.subtotal - checkoutState.discountAmount - checkoutState.advancePaid;
  updateCheckoutSummary();
}

function updateCheckoutSummary() {
  document.getElementById("roomTotal").innerText = `₹${checkoutState.roomTotal}`;
  document.getElementById("extrasTotal").innerText = `₹${checkoutState.extrasTotal}`;
  document.getElementById("subtotal").innerText = `₹${checkoutState.subtotal}`;
  document.getElementById("discountDisplay").innerText = `₹${Math.round(checkoutState.discountAmount)}`;
  document.getElementById("balanceDue").innerText = `₹${Math.round(checkoutState.finalBalance)}`;
}

async function completeCheckoutProcess() {
  const checkoutDateTime = document.getElementById("checkoutDateTime").value;
  const receivedBy = document.getElementById("receivedByCheckout").value;
  if (!checkoutDateTime) { showToast("Select check-out date & time"); return; }
  if (!receivedBy) { showToast("Enter staff name who received payment"); return; }

  const payload = {
    booking_id: currentBooking.booking_id,
    guest_name: currentBooking.guest_name,
    phone_number: currentBooking.phone_number,
    room_type: currentBooking.room_type,
    guests_count: currentBooking.guests_count,
    nights: currentBooking.nights,
    price_per_head: checkoutState.pricePerHead,
    room_total: checkoutState.roomTotal,
    extra_desc: checkoutExtras.map(e => e.desc).join(","),
    extra_amount: checkoutState.extrasTotal,
    discount_percent: checkoutState.discountPercent,
    discount_amount: checkoutState.discountAmount,
    discount_reason: document.getElementById("discountReason").value,
    payment_received: checkoutState.finalBalance,
    payment_method: document.getElementById("paymentMethodCheckout").value,
    advance_paid: checkoutState.advancePaid,
    received_by: receivedBy,
    note: currentBooking.note,
    check_out_date: checkoutDateTime
  };

  const result = await completeCheckout(payload);
  if (result) {
    sendOwnerCheckoutMessage(currentBooking, payload);
    showSuccessToast("Checkout Complete");
    closeCheckoutModal();
    if (typeof loadDashboard === "function") await loadDashboard();
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  if (modal) modal.classList.remove("active");
}

// ===== WHATSAPP CHECKOUT MESSAGE =====
function sendOwnerCheckoutMessage(booking, payload) {
  if (!CONFIG.OWNER_PHONE) return;
  
  const msg = 
`🏡 GOOD EARTH HOMESTAY

✅ Check-Out Completed

Guest: ${booking.guest_name}
Phone: ${booking.phone_number}
Rooms: ${booking.room_type}
PAX: ${booking.guests_count}
Nights: ${booking.nights}
Check-out: ${payload.check_out_date}

💰 Billing:
Price per Head: ₹${payload.price_per_head}
Room Total: ₹${payload.room_total}
Extras: ${payload.extra_desc || "None"} (₹${payload.extra_amount || 0})
Discount: ₹${payload.discount_amount || 0} (${payload.discount_percent || 0}%)
Advance Paid: ₹${payload.advance_paid}
Final Amount Received: ₹${payload.payment_received}
Payment Mode: ${payload.payment_method}
Received By: ${payload.received_by}

📝 Notes: ${payload.note || "None"}`;

  sendWhatsApp(CONFIG.OWNER_PHONE, msg);
}

function setupQuickExtras() {
  const add = (id, desc, amt) => document.getElementById(id)?.addEventListener("click", () => addExtra(desc, amt));
  add("extraCampfire", "Campfire", 500);
  add("extraFood", "Food", 1000);
  add("extraMattress", "Extra Mattress", 300);
  add("extraBbq", "BBQ", 1000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

document.addEventListener("DOMContentLoaded", () => setupQuickExtras());
