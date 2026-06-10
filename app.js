// ======================================
// GOOD EARTH APP
// ======================================

const APP = {

  refreshInterval: null,

  initialized: false

};

// ======================================
// START APP
// ======================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await initializeApp();

  }
);

// ======================================
// INITIALIZE
// ======================================

async function initializeApp() {

  if(APP.initialized)
    return;

  APP.initialized = true;

  initializeDate();

  initializeNavigation();

  initializeModals();

  initializeSettings();

  initializePullToRefresh();

  startBackgroundRefresh();

  await loadDashboard();

  lucide.createIcons();

}

// ======================================
// DATE
// ======================================

function initializeDate() {

  const today =
    document.getElementById(
      "todayDate"
    );

  if(!today)
    return;

  const now =
    new Date();

  today.innerText =
    now.toLocaleDateString(
      "en-IN",
      {
        weekday:"long",
        day:"numeric",
        month:"long",
        year:"numeric"
      }
    );

}

// ======================================
// NAVIGATION
// ======================================

function initializeNavigation() {

  const navItems =
    document.querySelectorAll(
      ".nav-item"
    );

  navItems.forEach(
    item => {

      item.addEventListener(
        "click",
        () => {

          navItems.forEach(
            n =>
            n.classList.remove(
              "active"
            )
          );

          item.classList.add(
            "active"
          );

          const page =
            item.dataset.page;

          openPage(page);

        }
      );

    }
  );

}

// ======================================
// OPEN PAGE
// ======================================

function openPage(pageId) {

  document
    .querySelectorAll(
      ".page"
    )
    .forEach(
      page =>
      page.classList.remove(
        "active"
      )
    );

  const page =
    document.getElementById(
      pageId
    );

  if(page){

    page.classList.add(
      "active"
    );

  }

}

// ======================================
// MODALS
// ======================================

function initializeModals() {

  document
    .querySelectorAll(
      "[data-close]"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          const target =
            btn.dataset.close;

          closeModal(
            target
          );

        }
      );

    });

}

// ======================================
// OPEN MODAL
// ======================================

function openModal(id) {

  const modal =
    document.getElementById(
      id
    );

  if(!modal)
    return;

  modal.classList.add(
    "active"
  );

}

// ======================================
// CLOSE MODAL
// ======================================

function closeModal(id) {

  const modal =
    document.getElementById(
      id
    );

  if(!modal)
    return;

  modal.classList.remove(
    "active"
  );

}

// ======================================
// SETTINGS
// ======================================

function initializeSettings() {

  const appScript =
    document.getElementById(
      "settingsAppScript"
    );

  const upi =
    document.getElementById(
      "settingsUpi"
    );

  const owner =
    document.getElementById(
      "settingsOwnerPhone"
    );

  const place =
    document.getElementById(
      "settingsPlaceId"
    );

  if(appScript)
    appScript.value =
      CONFIG.APPS_SCRIPT_URL;

  if(upi)
    upi.value =
      CONFIG.UPI_ID;

  if(owner)
    owner.value =
      CONFIG.OWNER_PHONE;

  if(place)
    place.value =
      CONFIG.PLACE_ID;

}

// ======================================
// SAVE SETTINGS
// ======================================

function saveSettings() {

  CONFIG.APPS_SCRIPT_URL =
    document.getElementById(
      "settingsAppScript"
    ).value.trim();

  CONFIG.UPI_ID =
    document.getElementById(
      "settingsUpi"
    ).value.trim();

  CONFIG.OWNER_PHONE =
    document.getElementById(
      "settingsOwnerPhone"
    ).value.trim();

  CONFIG.PLACE_ID =
    document.getElementById(
      "settingsPlaceId"
    ).value.trim();

  saveConfig();

  showToast(
    "Settings Saved"
  );

}

// ======================================
// AUTO REFRESH
// ======================================

function startBackgroundRefresh() {

  APP.refreshInterval =
    setInterval(
      async () => {

        await loadDashboard();

      },
      30000
    );

}

// ======================================
// MANUAL REFRESH
// ======================================

async function refreshEverything() {

  showLoading();

  await loadDashboard();

  await loadAvailableRooms();

  hideLoading();

  showToast(
    "Updated"
  );

}

// ======================================
// LOADER
// ======================================

function showLoading() {

  let loader =
    document.getElementById(
      "globalLoader"
    );

  if(loader){

    loader.classList.add(
      "active"
    );

  }

}

function hideLoading() {

  let loader =
    document.getElementById(
      "globalLoader"
    );

  if(loader){

    loader.classList.remove(
      "active"
    );

  }

}

// ======================================
// PULL TO REFRESH
// ======================================

function initializePullToRefresh() {

  let startY = 0;

  document.addEventListener(
    "touchstart",
    e => {

      startY =
        e.touches[0].clientY;

    }
  );

  document.addEventListener(
    "touchend",
    e => {

      const endY =
        e.changedTouches[0]
        .clientY;

      if(
        startY < 80 &&
        endY - startY > 120
      ){

        refreshEverything();

      }

    }
  );

}

// ======================================
// NETWORK
// ======================================

window.addEventListener(
  "offline",
  () => {

    showToast(
      "No Internet"
    );

  }
);

window.addEventListener(
  "online",
  () => {

    showToast(
      "Connected"
    );

    refreshEverything();

  }
);

// ======================================
// FORMAT MONEY
// ======================================

function formatMoney(amount) {

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits:0
    }
  ).format(
    Number(amount || 0)
  );

}

// ======================================
// CONFIRM
// ======================================

function confirmAction(message) {

  return confirm(message);

}

// ======================================
// HAPTIC
// ======================================

function vibrate() {

  if(
    navigator.vibrate
  ){

    navigator.vibrate(
      20
    );

  }

}
