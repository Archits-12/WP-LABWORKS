// Simulated database table of registered users
const USER_DATABASE = [
  { username: "archit", password: "archit123", fullName: "Archit Singhania", role: "Student" },
  { username: "admin", password: "admin123", fullName: "System Administrator", role: "Administrator" },
  { username: "faculty", password: "webprog11", fullName: "Karthikeyan S.", role: "Faculty" }
];

// Simulated server-side validation function
function validateCredentialsOnServer(username, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const matchedUser = USER_DATABASE.find(
        (record) => record.username === username && record.password === password
      );
      resolve(matchedUser || null);
    }, 350);
  });
}

// Handle Login Page (index.html)
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const errorMessage = document.getElementById("errorMessage");
  const loginBtn = document.getElementById("loginBtn");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessage.classList.add("hidden");

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      errorMessage.innerHTML = "<strong>Validation Error:</strong> Please enter both login name and password.";
      errorMessage.classList.remove("hidden");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Validating...";

    const user = await validateCredentialsOnServer(username, password);

    if (user) {
      sessionStorage.setItem(
        "authenticatedUser",
        JSON.stringify({
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          loginTime: new Date().toLocaleString()
        })
      );
      window.location.href = "./success.html";
    } else {
      errorMessage.innerHTML = "<strong>Login Failed:</strong> Invalid login name or password. Please try again.";
      errorMessage.classList.remove("hidden");
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";
    }
  });
}

// Handle Successful Login Page (success.html)
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  const storedUser = sessionStorage.getItem("authenticatedUser");

  if (!storedUser) {
    // Prevent direct access without valid login
    window.location.href = "./index.html";
  } else {
    const user = JSON.parse(storedUser);
    document.getElementById("displayUser").textContent = `${user.fullName} (${user.username})`;
    document.getElementById("displayRole").textContent = user.role;
    document.getElementById("displayTime").textContent = user.loginTime;
  }

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("authenticatedUser");
    window.location.href = "./index.html";
  });
}
