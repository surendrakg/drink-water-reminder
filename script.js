const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let startButton   = document.getElementById('start');
let stopButton    = document.getElementById('stop');
let minutesInput  = document.getElementById('minutes');
let secondsInput  = document.getElementById('seconds');

let reminderTimeout;
let interval = 0;
let reminderActive = false;
let isPopupOpen = false;

const settingsFilePath = path.join(__dirname, 'reminder-settings.json');

/*------------------------------------------------------
  Polling: Force-enable inputs every 100ms to clear any disabled/readonly state.
------------------------------------------------------*/
setInterval(() => {
  minutesInput.disabled = false;
  secondsInput.disabled = false;
  minutesInput.readOnly = false;
  secondsInput.readOnly = false;
}, 100);

/*------------------------------------------------------
  When the user presses the mouse down on an input,
  immediately focus that input (so the caret appears).
------------------------------------------------------*/
minutesInput.addEventListener('mousedown', () => {
  minutesInput.focus();
});
secondsInput.addEventListener('mousedown', () => {
  secondsInput.focus();
});

/*------------------------------------------------------
  On blur, ensure the input’s value becomes a valid integer.
------------------------------------------------------*/
minutesInput.addEventListener('blur', () => {
  let num = parseInt(minutesInput.value);
  minutesInput.value = isNaN(num) ? "0" : num;
});
secondsInput.addEventListener('blur', () => {
  let num = parseInt(secondsInput.value);
  secondsInput.value = isNaN(num) ? "0" : num;
});

/*------------------------------------------------------
  Save current input settings to disk.
------------------------------------------------------*/
function saveSettings(minutes, seconds) {
  const settings = { minutes, seconds };
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
}

/*------------------------------------------------------
  Load saved settings and update the inputs.
------------------------------------------------------*/
function loadSettings() {
  if (fs.existsSync(settingsFilePath)) {
    const data = fs.readFileSync(settingsFilePath, 'utf-8');
    const settings = JSON.parse(data);
    minutesInput.value = settings.minutes || "0";
    secondsInput.value = settings.seconds || "0";
  } else {
    const defaultSettings = { minutes: "0", seconds: "30" };
    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
    minutesInput.value = defaultSettings.minutes;
    secondsInput.value = defaultSettings.seconds;
  }
}

window.onload = loadSettings;

/*------------------------------------------------------
  Update the timer. This function fires on the "change" event,
  meaning it updates only once the user has finished editing.
------------------------------------------------------*/
function dynamicUpdate() {
  if (reminderActive) {
    if (reminderTimeout) {
      clearTimeout(reminderTimeout);
    }
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    saveSettings(minutes, seconds);
    interval = (minutes * 60 + seconds) * 1000;
    reminderTimeout = setTimeout(() => {
      openPopup();
    }, interval);
    console.log(`Timer updated: Next popup in ${minutes} minutes and ${seconds} seconds.`);
  }
}

/*------------------------------------------------------
  Start Reminder: commit current settings and start the timer.
  (Alerts are removed to prevent blocking focus.)
------------------------------------------------------*/
startButton.addEventListener('click', () => {
  // Commit changes
  minutesInput.blur();
  secondsInput.blur();

  const minutes = parseInt(minutesInput.value) || 0;
  const seconds = parseInt(secondsInput.value) || 0;
  
  if (minutes < 0 || seconds < 0) {
    console.log("Invalid numbers entered!");
    return;
  }
  
  interval = (minutes * 60 + seconds) * 1000;
  reminderActive = true;
  saveSettings(minutes, seconds);
  
  if (reminderTimeout) clearTimeout(reminderTimeout);
  
  reminderTimeout = setTimeout(() => {
    openPopup();
  }, interval);
  
  console.log(`Reminder started! First popup in ${minutes} minutes and ${seconds} seconds.`);
});

/*------------------------------------------------------
  Stop Reminder: cancel the timer and mark reminder inactive.
------------------------------------------------------*/
stopButton.addEventListener('click', () => {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
  reminderActive = false;
  ipcRenderer.send('stop-popup');
  console.log("Reminder stopped!");
});

/*------------------------------------------------------
  Open the popup window if appropriate.
------------------------------------------------------*/
function openPopup() {
  if (!isPopupOpen && reminderActive) {
    isPopupOpen = true;
    ipcRenderer.send('open-popup');
  }
}

/*------------------------------------------------------
  When the popup closes, reschedule the next popup if needed.
------------------------------------------------------*/
ipcRenderer.on('popup-closed', () => {
  isPopupOpen = false;
  if (reminderActive) {
    reminderTimeout = setTimeout(() => {
      openPopup();
    }, interval);
  }
});

/*------------------------------------------------------
  Update timer when editing is complete.
------------------------------------------------------*/
minutesInput.addEventListener('change', dynamicUpdate);
secondsInput.addEventListener('change', dynamicUpdate);