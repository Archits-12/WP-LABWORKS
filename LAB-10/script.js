// Helper: Format elapsed seconds into human-readable duration
function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts = [];
  if (hrs > 0) parts.push(`${hrs} hr${hrs !== 1 ? "s" : ""}`);
  if (mins > 0) parts.push(`${mins} min${mins !== 1 ? "s" : ""}`);
  parts.push(`${secs} sec${secs !== 1 ? "s" : ""}`);
  return parts.join(" ");
}

// ==========================================
// PART B: Current Date, Time, and Day
// ==========================================
const currentDateEl = document.getElementById("currentDate");
if (currentDateEl) {
  const currentTimeEl = document.getElementById("currentTime");
  const currentDayEl = document.getElementById("currentDay");
  const refreshTimeBtn = document.getElementById("refreshTimeBtn");

  function updateDateTime() {
    const now = new Date();
    currentDateEl.textContent = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    currentTimeEl.textContent = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
    currentDayEl.textContent = now.toLocaleDateString("en-IN", {
      weekday: "long"
    });
  }

  updateDateTime();
  setInterval(updateDateTime, 1000);
  refreshTimeBtn.addEventListener("click", updateDateTime);
}

// ==========================================
// PART A: Hello Page (Session Start & Top-Right Time)
// ==========================================
const helloUserNameEl = document.getElementById("helloUserName");
if (helloUserNameEl) {
  const params = new URLSearchParams(window.location.search);
  const queryName = (params.get("name") || "").trim();

  let activeSession = null;
  try {
    activeSession = JSON.parse(sessionStorage.getItem("lab10_session"));
  } catch {
    activeSession = null;
  }

  // Start a fresh session if submitted with a new name or no active session exists
  if (queryName && (!activeSession || activeSession.name !== queryName)) {
    const now = Date.now();
    activeSession = {
      name: queryName,
      startTimestamp: now,
      startTimeText: new Date(now).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }),
      startFullText: new Date(now).toLocaleString("en-IN")
    };
    sessionStorage.setItem("lab10_session", JSON.stringify(activeSession));
  }

  if (!activeSession) {
    window.location.href = "./index.html";
  } else {
    helloUserNameEl.textContent = activeSession.name;
    document.getElementById("startTimeDisplay").textContent = activeSession.startTimeText;
    document.getElementById("sessionStartFull").textContent = activeSession.startFullText;

    document.getElementById("logoutBtn").addEventListener("click", () => {
      const logoutTimestamp = Date.now();
      const elapsedSeconds = Math.max(
        0,
        Math.floor((logoutTimestamp - activeSession.startTimestamp) / 1000)
      );

      const summary = {
        name: activeSession.name,
        startTimeText: activeSession.startTimeText,
        endTimeText: new Date(logoutTimestamp).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        }),
        durationText: formatDuration(elapsedSeconds)
      };

      sessionStorage.setItem("lab10_logout_summary", JSON.stringify(summary));
      sessionStorage.removeItem("lab10_session");
      window.location.href = "./logout.html";
    });
  }
}

// ==========================================
// PART A: Logout Page (Thank You & Usage Duration)
// ==========================================
const logoutUserNameEl = document.getElementById("logoutUserName");
if (logoutUserNameEl) {
  let summary = null;
  try {
    summary = JSON.parse(sessionStorage.getItem("lab10_logout_summary"));
  } catch {
    summary = null;
  }

  if (!summary) {
    window.location.href = "./index.html";
  } else {
    logoutUserNameEl.textContent = summary.name;
    document.getElementById("usageDuration").textContent = summary.durationText;
    document.getElementById("summaryStartTime").textContent = summary.startTimeText;
    document.getElementById("summaryEndTime").textContent = summary.endTimeText;
  }
}

// ==========================================
// PART C: Age Authorization Result Page
// ==========================================
const ageMessageEl = document.getElementById("ageMessage");
if (ageMessageEl) {
  const params = new URLSearchParams(window.location.search);
  const name = (params.get("name") || "").trim();
  const ageRaw = params.get("age");
  const age = Number(ageRaw);

  if (!name || ageRaw === null || Number.isNaN(age)) {
    window.location.href = "./index.html";
  } else {
    const iconEl = document.getElementById("ageStatusIcon");
    const badgeEl = document.getElementById("ageBadge");
    const headingEl = document.getElementById("ageHeading");

    document.getElementById("summaryAgeName").textContent = name;
    document.getElementById("summaryAgeValue").textContent = `${age} years`;

    if (age < 18) {
      iconEl.textContent = "✕";
      iconEl.classList.add("icon-error");
      badgeEl.textContent = "Access Denied";
      badgeEl.classList.add("badge-error");
      headingEl.textContent = "Not Authorized";
      ageMessageEl.textContent = `Hello ${name}, you are not authorized to visit the site`;
    } else {
      iconEl.textContent = "✓";
      iconEl.classList.add("icon-success");
      badgeEl.textContent = "Access Granted";
      badgeEl.classList.add("badge-success");
      headingEl.textContent = "Welcome!";
      ageMessageEl.textContent = `Welcome ${name} to this site`;
    }
  }
}
