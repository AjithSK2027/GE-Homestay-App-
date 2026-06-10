// =====================================
// CHECK-IN ENGINE
// =====================================

let selectedRooms = [];

// =====================================
// INIT
// =====================================

function initializeCheckin() {

  checkinForm =
    document.getElementById(
      "checkinForm"
    );

  bindCheckinEvents();

  loadAvailableRooms();

}

// =====================================
// EVENTS
// =====================================

function bindCheckinEvents() {

  const fab =
    document.getElementById(
      "fab"
    );

  if(fab){

    fab.addEventListener(
      "click",
      openCheckinModal
    );

  }

  const closeBtn =
    document.querySelector(
      ".close-modal"
    );

  if(closeBtn){

    closeBtn.addEventListener(
      "click",
      closeCheckinModal
    );

  }

  if(checkinForm){

    checkinForm.addEventListener(
      "submit",
      submitCheckin
    );

  }

}

// =====================================
// LOAD ROOMS
// =====================================

async function loadAvailableRooms() {

  try {

    const rooms =
      await getRooms();

    const active =
      await getActiveBookings();

    const occupied =
      active.map(
        b => b.room_type
      );

    const select =
      document.getElementById(
        "roomSelect"
      );

    if(!select)
      return;

    select.innerHTML = `
      <option value="">
        Select Room
      </option>
    `;

    rooms.forEach(room => {

      if(
        occupied.includes(
          room.room_name
        )
      ) return;

      const option =
        document.createElement(
          "option"
        );

      option.value =
        room.room_name;

      option.innerText =
        room.room_name;

      select.appendChild(
        option
      );

    });

  }

  catch(error){

    console.error(error);

  }

}

// =====================================
// OPEN MODAL
// =====================================

function openCheckinModal() {

  const modal =
    document.getElementById(
      "checkinModal"
    );

  if(modal){

    modal.classList.add(
      "active"
    );

  }

}

// =====================================
// CLOSE MODAL
// =====================================

function closeCheckinModal() {

  const modal =
    document.getElementById(
      "checkinModal"
    );

  if(modal){

    modal.classList.remove(
      "active"
    );

  }

}

// =====================================
// VALIDATION
// =====================================

function validateCheckin(data) {

  if(!data.guest_name){

    showToast(
      "Enter guest name"
    );

    return false;

  }

  if(!data.phone_number){

    showToast(
      "Enter phone number"
    );

    return false;

  }

  if(!data.room_type){

    showToast(
      "Select room"
    );

    return false;

  }

  if(!data.guests_count){

    showToast(
      "Enter guest count"
    );

    return false;

  }

  if(!data.nights){

    showToast(
      "Enter nights"
    );

    return false;

  }

  return true;

}

// =====================================
// SUBMIT
// =====================================

async function submitCheckin(event) {

  event.preventDefault();

  const submitBtn =
    document.querySelector(
      ".primary-btn"
    );

  submitBtn.disabled = true;

  submitBtn.innerText =
    "Checking In...";

  const payload = {

    guest_name:
      document.getElementById(
        "guestName"
      ).value.trim(),

    phone_number:
      document.getElementById(
        "phoneNumber"
      ).value.trim(),

    room_type:
      document.getElementById(
        "roomSelect"
      ).value,

    guests_count:
      Number(
        document.getElementById(
          "guestCount"
        ).value
      ),

    nights:
      Number(
        document.getElementById(
          "nights"
        ).value
      ),

    meal_plan:
      document.getElementById(
        "mealPlan"
      ).value,

    advance_paid:
      Number(
        document.getElementById(
          "advancePaid"
        ).value || 0
      ),

    advance_payment_mode:
      document.getElementById(
        "paymentMode"
      ).value,

    advance_received_by:
      "Reception",

    check_in_date:
      new Date()
      .toISOString()
      .split("T")[0],

    note:
      document.getElementById(
        "notes"
      ).value

  };

  if(
    !validateCheckin(
      payload
    )
  ){

    submitBtn.disabled = false;

    submitBtn.innerText =
      "Check In";

    return;

  }

  try {

    const result =
      await createCheckin(
        payload
      );

    if(result){

      sendOwnerCheckinMessage(
        payload
      );

      resetCheckinForm();

      closeCheckinModal();

      await loadDashboard();

      await loadAvailableRooms();

      showSuccessToast(
        "Guest Checked In"
      );

    }

  }

  catch(error){

    console.error(error);

    showToast(
      "Check-in failed"
    );

  }

  submitBtn.disabled = false;

  submitBtn.innerText =
    "Check In";

}

// =====================================
// RESET FORM
// =====================================

function resetCheckinForm() {

  if(
    !checkinForm
  ) return;

  checkinForm.reset();

}

// =====================================
// OWNER WHATSAPP
// =====================================

function sendOwnerCheckinMessage(
  booking
){

  if(
    !CONFIG.OWNER_PHONE
  ) return;

  const msg =

`🏡 GOOD EARTH HOMESTAY

New Check-In

Guest:
${booking.guest_name}

Room:
${booking.room_type}

Guests:
${booking.guests_count}

Nights:
${booking.nights}

Advance:
₹${booking.advance_paid}

Meal Plan:
${booking.meal_plan}

Phone:
${booking.phone_number}`;

  sendWhatsApp(
    CONFIG.OWNER_PHONE,
    msg
  );

}

// =====================================
// SUCCESS TOAST
// =====================================

function showSuccessToast(
  message
){

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
    "success",
    "show"
  );

  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  },2500);

}

// =====================================
// PRESELECT ROOM
// =====================================

function preselectRoom(
  roomName
){

  openCheckinModal();

  const room =
    document.getElementById(
      "roomSelect"
    );

  if(room){

    room.value =
      roomName;

  }

}

// =====================================
// START
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeCheckin();

  }
);
