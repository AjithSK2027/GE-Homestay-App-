// =====================================
// CHECKOUT ENGINE
// =====================================

let currentBooking = null;

let checkoutExtras = [];

let checkoutState = {

  pricePerHead: 0,

  roomTotal: 0,

  extrasTotal: 0,

  subtotal: 0,

  discountPercent: 0,

  discountAmount: 0,

  advancePaid: 0,

  finalBalance: 0

};

// =====================================
// OPEN CHECKOUT
// =====================================

function openCheckoutModal(booking) {

  currentBooking = booking;

  checkoutExtras = [];

  checkoutState = {

    pricePerHead: 0,

    roomTotal: 0,

    extrasTotal: 0,

    subtotal: 0,

    discountPercent: 0,

    discountAmount: 0,

    advancePaid:
      Number(
        booking.advance_paid || 0
      ),

    finalBalance: 0

  };

  const modal =
    document.getElementById(
      "checkoutModal"
    );

  modal.classList.add(
    "active"
  );

  populateCheckout();

}

// =====================================
// POPULATE
// =====================================

function populateCheckout() {

  document.getElementById(
    "checkoutGuestName"
  ).innerText =
    currentBooking.guest_name;

  document.getElementById(
    "checkoutRoom"
  ).innerText =
    currentBooking.room_type;

  document.getElementById(
    "checkoutGuests"
  ).innerText =
    currentBooking.guests_count;

  document.getElementById(
    "checkoutNights"
  ).innerText =
    currentBooking.nights;

  document.getElementById(
    "checkoutAdvance"
  ).innerText =
    `₹${checkoutState.advancePaid}`;

  updateCheckoutSummary();

}

// =====================================
// PRICE INPUT
// =====================================

function updatePricePerHead() {

  checkoutState.pricePerHead =
    Number(
      document.getElementById(
        "pricePerHead"
      ).value || 0
    );

  calculateTotals();

}

// =====================================
// QUICK EXTRAS
// =====================================

function addExtra(
  desc,
  amount
){

  checkoutExtras.push({

    desc,
    amount

  });

  renderExtras();

  calculateTotals();

}

// =====================================
// CUSTOM EXTRA
// =====================================

function addCustomExtra() {

  const desc =
    document.getElementById(
      "extraDescription"
    ).value;

  const amount =
    Number(
      document.getElementById(
        "extraAmount"
      ).value
    );

  if(!desc || !amount){

    showToast(
      "Enter extra details"
    );

    return;

  }

  addExtra(
    desc,
    amount
  );

  document.getElementById(
    "extraDescription"
  ).value = "";

  document.getElementById(
    "extraAmount"
  ).value = "";

}

// =====================================
// EXTRAS UI
// =====================================

function renderExtras() {

  const container =
    document.getElementById(
      "extrasList"
    );

  container.innerHTML = "";

  checkoutExtras.forEach(
    (extra,index) => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "extra-row";

      div.innerHTML = `

        <span>
          ${extra.desc}
        </span>

        <span>
          ₹${extra.amount}
        </span>

      `;

      container.appendChild(
        div
      );

    }
  );

}

// =====================================
// DISCOUNT PERCENT
// =====================================

function updateDiscountPercent() {

  const percent =
    Number(
      document.getElementById(
        "discountPercent"
      ).value || 0
    );

  checkoutState.discountPercent =
    percent;

  checkoutState.discountAmount =
    (
      checkoutState.subtotal
      *
      percent
    ) / 100;

  document.getElementById(
    "discountAmount"
  ).value =
    Math.round(
      checkoutState.discountAmount
    );

  calculateTotals();

}

// =====================================
// DISCOUNT AMOUNT
// =====================================

function updateDiscountAmount() {

  const amount =
    Number(
      document.getElementById(
        "discountAmount"
      ).value || 0
    );

  checkoutState.discountAmount =
    amount;

  checkoutState.discountPercent =
    checkoutState.subtotal
      ?
      (
        amount
        /
        checkoutState.subtotal
      ) * 100
      :
      0;

  document.getElementById(
    "discountPercent"
  ).value =
    checkoutState.discountPercent.toFixed(1);

  calculateTotals();

}

// =====================================
// TOTALS
// =====================================

function calculateTotals() {

  const guests =
    Number(
      currentBooking.guests_count
    );

  const nights =
    Number(
      currentBooking.nights
    );

  checkoutState.roomTotal =

    checkoutState.pricePerHead
    *
    guests
    *
    nights;

  checkoutState.extrasTotal =

    checkoutExtras.reduce(
      (sum,item) =>
        sum + item.amount,
      0
    );

  checkoutState.subtotal =

    checkoutState.roomTotal
    +
    checkoutState.extrasTotal;

  checkoutState.finalBalance =

    checkoutState.subtotal
    -
    checkoutState.discountAmount
    -
    checkoutState.advancePaid;

  updateCheckoutSummary();

}

// =====================================
// SUMMARY
// =====================================

function updateCheckoutSummary() {

  document.getElementById(
    "roomTotal"
  ).innerText =
    `₹${checkoutState.roomTotal}`;

  document.getElementById(
    "extrasTotal"
  ).innerText =
    `₹${checkoutState.extrasTotal}`;

  document.getElementById(
    "subtotal"
  ).innerText =
    `₹${checkoutState.subtotal}`;

  document.getElementById(
    "discountDisplay"
  ).innerText =
    `₹${Math.round(
      checkoutState.discountAmount
    )}`;

  document.getElementById(
    "balanceDue"
  ).innerText =
    `₹${Math.round(
      checkoutState.finalBalance
    )}`;

}

// =====================================
// COMPLETE CHECKOUT
// =====================================

async function completeCheckoutProcess() {

  const paymentMethod =
    document.getElementById(
      "paymentMethod"
    ).value;

  const discountReason =
    document.getElementById(
      "discountReason"
    ).value;

  const payload = {

    booking_id:
      currentBooking.booking_id,

    guest_name:
      currentBooking.guest_name,

    phone_number:
      currentBooking.phone_number,

    room_type:
      currentBooking.room_type,

    guests_count:
      currentBooking.guests_count,

    nights:
      currentBooking.nights,

    price_per_head:
      checkoutState.pricePerHead,

    room_total:
      checkoutState.roomTotal,

    extra_desc:
      checkoutExtras
        .map(e => e.desc)
        .join(","),

    extra_amount:
      checkoutState.extrasTotal,

    discount_percent:
      checkoutState.discountPercent,

    discount_amount:
      checkoutState.discountAmount,

    discount_reason:
      discountReason,

    payment_received:
      checkoutState.finalBalance,

    payment_method:
      paymentMethod,

    advance_paid:
      checkoutState.advancePaid,

    balance_due:
      0,

    note:
      currentBooking.note,

    check_out_date:
      new Date()
      .toISOString()
      .split("T")[0]

  };

  const result =
    await completeCheckout(
      payload
    );

  if(result){

    showSuccessToast(
      "Checkout Complete"
    );

    closeCheckoutModal();

    await loadDashboard();

  }

}

// =====================================
// CLOSE
// =====================================

function closeCheckoutModal() {

  const modal =
    document.getElementById(
      "checkoutModal"
    );

  modal.classList.remove(
    "active"
  );

}

// =====================================
// QUICK EXTRA BUTTONS
// =====================================

function setupQuickExtras() {

  document
    .getElementById("extraCampfire")
    ?.addEventListener(
      "click",
      () =>
      addExtra(
        "Campfire",
        500
      )
    );

  document
    .getElementById("extraFood")
    ?.addEventListener(
      "click",
      () =>
      addExtra(
        "Food",
        1000
      )
    );

  document
    .getElementById("extraMattress")
    ?.addEventListener(
      "click",
      () =>
      addExtra(
        "Extra Mattress",
        300
      )
    );

  document
    .getElementById("extraBbq")
    ?.addEventListener(
      "click",
      () =>
      addExtra(
        "BBQ",
        1000
      )
    );

}

// =====================================
// INIT
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupQuickExtras();

  }
);
