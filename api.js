// =====================================
// GOOD EARTH API LAYER
// =====================================

const CONFIG = {

  APPS_SCRIPT_URL:
    localStorage.getItem("apps_script_url") || "",

  OWNER_PHONE:
    localStorage.getItem("owner_phone") || "",

  UPI_ID:
    localStorage.getItem("upi_id") || "",

  PLACE_ID:
    localStorage.getItem("place_id") || ""

};

// =====================================
// CONFIG
// =====================================

function saveConfig() {

  localStorage.setItem(
    "apps_script_url",
    CONFIG.APPS_SCRIPT_URL
  );

  localStorage.setItem(
    "owner_phone",
    CONFIG.OWNER_PHONE
  );

  localStorage.setItem(
    "upi_id",
    CONFIG.UPI_ID
  );

  localStorage.setItem(
    "place_id",
    CONFIG.PLACE_ID
  );

}

// =====================================
// GENERIC GET
// =====================================

async function apiGet(action) {

  try {

    const response = await fetch(
      `${CONFIG.APPS_SCRIPT_URL}?action=${action}`
    );

    if (!response.ok) {

      throw new Error(
        `GET ${action} failed`
      );

    }

    return await response.json();

  }

  catch(error) {

    console.error(error);

    showToast(
      "Connection failed"
    );

    return null;

  }

}

// =====================================
// GENERIC POST
// =====================================

async function apiPost(payload) {

  try {

    const response = await fetch(
      CONFIG.APPS_SCRIPT_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
          "application/json"
        },

        body:
        JSON.stringify(payload)
      }
    );

    if (!response.ok) {

      throw new Error(
        "POST failed"
      );

    }

    return await response.json();

  }

  catch(error) {

    console.error(error);

    showToast(
      "Save failed"
    );

    return null;

  }

}

// =====================================
// ROOMS
// =====================================

async function getRooms() {

  return await apiGet(
    "getRooms"
  );

}

// =====================================
// ACTIVE BOOKINGS
// =====================================

async function getActiveBookings() {

  return await apiGet(
    "getActiveBookings"
  );

}

// =====================================
// DASHBOARD
// =====================================

async function getDashboardStats() {

  return await apiGet(
    "getDashboardStats"
  );

}

// =====================================
// ROOM STATUS
// =====================================

async function getRoomStatus() {

  return await apiGet(
    "getRoomStatus"
  );

}

// =====================================
// CREATE BOOKING
// =====================================

async function createCheckin(data) {

  const payload = {

    event_type:
      "check_in",

    booking_id:
      generateBookingId(),

    guest_name:
      data.guest_name,

    phone_number:
      data.phone_number,

    room_type:
      data.room_type,

    check_in_date:
      data.check_in_date,

    nights:
      data.nights,

    guests_count:
      data.guests_count,

    meal_plan:
      data.meal_plan,

    advance_paid:
      data.advance_paid,

    advance_received_by:
      data.advance_received_by,

    advance_payment_mode:
      data.advance_payment_mode,

    note:
      data.note,

    balance_due:
      -(data.advance_paid || 0)

  };

  return await apiPost(
    payload
  );

}

// =====================================
// CHECKOUT
// =====================================

async function completeCheckout(data) {

  return await apiPost({

    event_type:
      "check_out",

    booking_id:
      data.booking_id,

    guest_name:
      data.guest_name,

    phone_number:
      data.phone_number,

    room_type:
      data.room_type,

    check_out_date:
      data.check_out_date,

    guests_count:
      data.guests_count,

    nights:
      data.nights,

    price_per_head:
      data.price_per_head,

    room_total:
      data.room_total,

    extra_desc:
      data.extra_desc,

    extra_amount:
      data.extra_amount,

    advance_paid:
      data.advance_paid,

    payment_received:
      data.payment_received,

    payment_method:
      data.payment_method,

    discount_percent:
      data.discount_percent,

    discount_amount:
      data.discount_amount,

    discount_reason:
      data.discount_reason,

    balance_due:
      0,

    note:
      data.note

  });

}

// =====================================
// BOOKING ID
// =====================================

function generateBookingId() {

  const now =
    new Date();

  const yyyy =
    now.getFullYear();

  const mm =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const dd =
    String(
      now.getDate()
    ).padStart(2, "0");

  const rand =
    Math.floor(
      Math.random() * 900
    ) + 100;

  return `GE-${yyyy}${mm}${dd}-${rand}`;

}

// =====================================
// WHATSAPP
// =====================================

function sendWhatsApp(
  phone,
  message
) {

  const clean =
    phone.replace(/\D/g,'');

  window.open(
    `https://wa.me/${clean}?text=${encodeURIComponent(message)}`,
    "_blank"
  );

}

// =====================================
// REVIEW LINK
// =====================================

function getReviewLink() {

  if(!CONFIG.PLACE_ID)
    return "#";

  return `https://search.google.com/local/writereview?placeid=${CONFIG.PLACE_ID}`;

}

// =====================================
// TOAST
// =====================================

function showToast(message) {

  let toast =
    document.querySelector(
      ".toast"
    );

  if(!toast){

    toast =
      document.createElement(
        "div"
      );

    toast.className =
      "toast";

    document.body.appendChild(
      toast
    );

  }

  toast.innerText =
    message;

  toast.classList.add(
    "show"
  );

  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  },2500);

}
