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

    console.log(
      "Rooms Loaded",
      rooms
    );

    const container =
      document.getElementById(
        "roomSelector"
      );

    container.innerHTML = "";

    rooms.forEach(room => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "room-option";

      card.innerHTML = `

        <div class="room-name">
          ${room.room_name}
        </div>

      `;

      card.onclick = () => {

        toggleRoom(
          room.room_name,
          card
        );

      };

      container.appendChild(
        card
      );

    });

  }

  catch(error) {

    console.error(
      "Room Loading Error",
      error
    );

  }

}

function toggleRoom(
  roomName,
  card
) {

  if(
    selectedRooms.includes(
      roomName
    )
  ) {

    selectedRooms =
      selectedRooms.filter(
        room =>
        room !== roomName
      );

    card.classList.remove(
      "selected"
    );

  }
  else {

    selectedRooms.push(
      roomName
    );

    card.classList.add(
      "selected"
    );

  }

  document.getElementById(
    "selectedRoomCount"
  ).innerText =
    selectedRooms.length;

  console.log(
    selectedRooms
  );

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

  if(selectedRooms.length === 0)
{
  showToast(
    "Select at least one room"
  );
  return false;
}

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
  selectedRooms.join(","),

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
