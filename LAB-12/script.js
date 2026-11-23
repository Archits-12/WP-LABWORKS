const CART_KEY = "lab12_shopxml_cart";
const USERS_KEY = "lab12_shopxml_users";
const SESSION_KEY = "lab12_shopxml_current_user";

// ==========================================
// 1. XML Catalog Loader & Parser
// ==========================================
let cachedProducts = null;

async function loadProductsFromXML() {
  if (cachedProducts) return cachedProducts;

  const response = await fetch("./products.xml");
  if (!response.ok) {
    throw new Error("Unable to fetch products.xml");
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");

  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Invalid XML structure in products.xml");
  }

  const getText = (node, tag) => node.querySelector(tag)?.textContent.trim() || "";

  cachedProducts = Array.from(xmlDoc.querySelectorAll("product")).map((node) => ({
    id: node.getAttribute("id"),
    name: getText(node, "name"),
    category: getText(node, "category"),
    price: Number(getText(node, "price")),
    rating: Number(getText(node, "rating")),
    stock: Number(getText(node, "stock")),
    badge: getText(node, "badge"),
    icon: getText(node, "icon"),
    color: getText(node, "color") || "#eef2ff",
    shortDesc: getText(node, "shortDesc"),
    description: getText(node, "description"),
    specs: Array.from(node.querySelectorAll("specs > spec")).map((s) => s.textContent.trim())
  }));

  return cachedProducts;
}

function formatINR(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

// Inline SVG illustrations so product visuals never break offline or on GitHub Pages
function getProductSVG(icon, size = 72) {
  const svgs = {
    laptop: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="#4338ca" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="14" width="44" height="28" rx="3" fill="#ffffff"/><path d="M6 48h52l-4-6H10l-4 6z" fill="#c7d2fe"/></svg>`,
    headphones: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="#0e7490" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 36v-4a20 20 0 0 1 40 0v4"/><rect x="10" y="34" width="10" height="18" rx="4" fill="#cffafe"/><rect x="44" y="34" width="10" height="18" rx="4" fill="#cffafe"/></svg>`,
    watch: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="#15803d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8h16l2 10H22l2-10zM22 46h20l-2 10H24l-2-10z" fill="#bbf7d0"/><rect x="18" y="18" width="28" height="28" rx="7" fill="#ffffff"/><path d="M32 25v7l5 3"/></svg>`,
    keyboard: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="18" width="52" height="28" rx="4" fill="#ffffff"/><path d="M14 26h4M24 26h4M34 26h4M44 26h6M14 33h6M26 33h6M38 33h12M20 40h24"/></svg>`,
    backpack: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="#be185d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 16v-4a8 8 0 0 1 16 0v4"/><rect x="14" y="16" width="36" height="40" rx="8" fill="#ffffff"/><rect x="20" y="34" width="24" height="16" rx="4" fill="#fce7f3"/><path d="M22 25h20"/></svg>`,
    lamp: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="#6d28d9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 14h20l6 14H16l6-14z" fill="#ede9fe"/><path d="M32 28v24M20 52h24"/></svg>`
  };
  return svgs[icon] || svgs.laptop;
}

// ==========================================
// 2. Cart & Auth State Helpers
// ==========================================
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateNavbarState();
}

function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  saveCart(cart);
  showToast("Added to shopping cart");
}

function getUsers() {
  const defaultUsers = [
    { name: "Archit Singhania", email: "archit@shopxml.com", password: "archit123" }
  ];
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY));
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch {
    // ignore
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function updateNavbarState() {
  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) {
    const totalQty = getCart().reduce((sum, item) => sum + item.qty, 0);
    cartCountEl.textContent = totalQty;
  }

  const navAuthLink = document.getElementById("navAuthLink");
  const user = getCurrentUser();
  if (navAuthLink && user) {
    navAuthLink.textContent = `Hi, ${user.name.split(" ")[0]}`;
  }
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

// Shared Product Card HTML
function renderProductCard(product) {
  return `
    <article class="product-card">
      <a href="./product-details.html?id=${encodeURIComponent(product.id)}" class="product-visual" style="background:${product.color}">
        <span class="product-tag">${product.badge}</span>
        ${getProductSVG(product.icon, 74)}
      </a>
      <div class="product-body">
        <div class="product-meta">
          <span>${product.category}</span>
          <span>★ ${product.rating}</span>
        </div>
        <a href="./product-details.html?id=${encodeURIComponent(product.id)}" class="product-title">${product.name}</a>
        <p class="product-desc">${product.shortDesc}</p>
        <div class="product-price">${formatINR(product.price)}</div>
        <div class="product-actions">
          <a href="./product-details.html?id=${encodeURIComponent(product.id)}" class="btn-secondary">Details</a>
          <button type="button" class="btn-primary" data-add-cart="${product.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `;
}

// ==========================================
// 3. Page Initializers
// ==========================================

// Home Page Featured Products
async function initHomePage() {
  const container = document.getElementById("featuredProducts");
  if (!container) return;

  try {
    const products = await loadProductsFromXML();
    container.innerHTML = products.slice(0, 3).map(renderProductCard).join("");
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Could not load <code>products.xml</code>. Deploy to GitHub Pages or run via a local web server (Live Server).</div>`;
  }
}

// Products Page (XML + Search/Filter/Sort)
async function initProductsPage() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortSelect = document.getElementById("sortSelect");
  const countEl = document.getElementById("productCount");
  const statusEl = document.getElementById("xmlStatus");

  try {
    const products = await loadProductsFromXML();
    statusEl.innerHTML = `Successfully parsed <strong>${products.length}</strong> products from <code>products.xml</code>.`;

    const categories = [...new Set(products.map((p) => p.category))];
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });

    function renderFiltered() {
      const query = searchInput.value.trim().toLowerCase();
      const category = categoryFilter.value;
      const sort = sortSelect.value;

      let list = products.filter((p) => {
        const matchesCat = category === "all" || p.category === category;
        const matchesQuery =
          p.name.toLowerCase().includes(query) ||
          p.shortDesc.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query);
        return matchesCat && matchesQuery;
      });

      if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
      if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
      if (sort === "rating-desc") list.sort((a, b) => b.rating - a.rating);

      countEl.textContent = `${list.length} item${list.length !== 1 ? "s" : ""}`;
      grid.innerHTML =
        list.length > 0
          ? list.map(renderProductCard).join("")
          : `<div class="card empty-state"><p class="muted">No products match your search criteria.</p></div>`;
    }

    searchInput.addEventListener("input", renderFiltered);
    categoryFilter.addEventListener("change", renderFiltered);
    sortSelect.addEventListener("change", renderFiltered);
    renderFiltered();
  } catch (err) {
    statusEl.textContent = "Failed to load products.xml";
    grid.innerHTML = `<div class="alert alert-error">Could not fetch <code>products.xml</code>. Open this site on GitHub Pages or via a local server.</div>`;
  }
}

// Product Details Page
async function initProductDetailsPage() {
  const container = document.getElementById("productDetailContainer");
  if (!container) return;

  try {
    const products = await loadProductsFromXML();
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || products[0]?.id;
    const product = products.find((p) => p.id === id);

    if (!product) {
      container.innerHTML = `
        <div class="card empty-state">
          <h2>Product Not Found</h2>
          <p class="subtitle">The requested product ID does not exist in <code>products.xml</code>.</p>
          <br><a href="./products.html" class="btn-primary">Browse Catalog</a>
        </div>`;
      return;
    }

    document.title = `${product.name} - ShopXML`;
    container.innerHTML = `
      <div class="detail-card">
        <div class="detail-visual" style="background:${product.color}">
          ${getProductSVG(product.icon, 140)}
        </div>
        <div class="detail-info">
          <span class="badge">${product.category} • ${product.badge}</span>
          <h1>${product.name}</h1>
          <p class="subtitle">Rating: ★ ${product.rating} / 5.0 &nbsp;|&nbsp; In Stock (${product.stock} available)</p>
          <div class="detail-price">${formatINR(product.price)}</div>
          <p class="subtitle">${product.description}</p>

          <ul class="specs-list">
            ${product.specs.map((spec) => `<li>${spec}</li>`).join("")}
          </ul>

          <div class="qty-row">
            <label for="detailQty" style="margin:0;">Quantity:</label>
            <input type="number" id="detailQty" value="1" min="1" max="${product.stock}">
          </div>

          <div class="product-actions">
            <button type="button" id="detailAddBtn" class="btn-primary">Add to Cart</button>
            <button type="button" id="detailBuyBtn" class="btn-secondary">Buy Now</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("detailAddBtn").addEventListener("click", () => {
      const qty = Math.max(1, Number(document.getElementById("detailQty").value) || 1);
      addToCart(product.id, qty);
    });

    document.getElementById("detailBuyBtn").addEventListener("click", () => {
      const qty = Math.max(1, Number(document.getElementById("detailQty").value) || 1);
      addToCart(product.id, qty);
      window.location.href = "./checkout.html";
    });
  } catch {
    container.innerHTML = `<div class="alert alert-error">Unable to load product details from <code>products.xml</code>.</div>`;
  }
}

// Shopping Cart Page
async function initCartPage() {
  const container = document.getElementById("cartContainer");
  if (!container) return;

  try {
    const products = await loadProductsFromXML();

    function renderCart() {
      const cart = getCart();
      const detailedItems = cart
        .map((entry) => {
          const product = products.find((p) => p.id === entry.id);
          return product ? { ...product, qty: entry.qty } : null;
        })
        .filter(Boolean);

      if (detailedItems.length === 0) {
        container.innerHTML = `
          <div class="card empty-state">
            <h2>Your cart is empty</h2>
            <p class="subtitle">Explore our XML product catalog to add items.</p>
            <br><a href="./products.html" class="btn-primary">Browse Products</a>
          </div>`;
        return;
      }

      const subtotal = detailedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      const shipping = subtotal >= 5000 ? 0 : 199;
      const tax = Math.round(subtotal * 0.18);
      const total = subtotal + shipping + tax;

      container.innerHTML = `
        <div class="two-col-grid">
          <div class="cart-list">
            ${detailedItems
              .map(
                (item) => `
              <div class="cart-item">
                <div class="cart-item-info">
                  <div class="mini-thumb" style="background:${item.color}">
                    ${getProductSVG(item.icon, 36)}
                  </div>
                  <div>
                    <a href="./product-details.html?id=${item.id}" class="product-title" style="font-size:15px;">${item.name}</a>
                    <p class="subtitle">${formatINR(item.price)} each</p>
                  </div>
                </div>
                <div class="qty-controls">
                  <button type="button" data-qty-dec="${item.id}">−</button>
                  <span>${item.qty}</span>
                  <button type="button" data-qty-inc="${item.id}">+</button>
                </div>
                <div style="text-align:right; min-width:95px;">
                  <strong>${formatINR(item.price * item.qty)}</strong><br>
                  <button type="button" class="btn-text-danger" data-remove-item="${item.id}">Remove</button>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <aside class="card">
            <h2>Order Summary</h2>
            <div class="info-box">
              <div class="detail-row"><span>Subtotal</span><strong>${formatINR(subtotal)}</strong></div>
              <div class="detail-row"><span>Shipping</span><strong>${shipping === 0 ? "Free" : formatINR(shipping)}</strong></div>
              <div class="detail-row"><span>GST (18%)</span><strong>${formatINR(tax)}</strong></div>
              <div class="detail-row total-row"><span>Total</span><strong>${formatINR(total)}</strong></div>
            </div>
            <br>
            <a href="./checkout.html" class="btn-primary full-width">Proceed to Checkout</a>
          </aside>
        </div>
      `;
    }

    container.addEventListener("click", (e) => {
      const incId = e.target.getAttribute("data-qty-inc");
      const decId = e.target.getAttribute("data-qty-dec");
      const removeId = e.target.getAttribute("data-remove-item");
      if (!incId && !decId && !removeId) return;

      let cart = getCart();
      if (incId) {
        const item = cart.find((c) => c.id === incId);
        if (item) item.qty += 1;
      } else if (decId) {
        const item = cart.find((c) => c.id === decId);
        if (item) {
          item.qty -= 1;
          if (item.qty <= 0) cart = cart.filter((c) => c.id !== decId);
        }
      } else if (removeId) {
        cart = cart.filter((c) => c.id !== removeId);
      }

      saveCart(cart);
      renderCart();
    });

    renderCart();
  } catch {
    container.innerHTML = `<div class="alert alert-error">Unable to load cart items.</div>`;
  }
}

// Checkout Page
async function initCheckoutPage() {
  const container = document.getElementById("checkoutContainer");
  if (!container) return;

  try {
    const products = await loadProductsFromXML();
    const cart = getCart();
    const detailedItems = cart
      .map((entry) => {
        const product = products.find((p) => p.id === entry.id);
        return product ? { ...product, qty: entry.qty } : null;
      })
      .filter(Boolean);

    if (detailedItems.length === 0) {
      container.innerHTML = `
        <div class="card empty-state">
          <h2>No items to checkout</h2>
          <p class="subtitle">Add products to your shopping cart before checking out.</p>
          <br><a href="./products.html" class="btn-primary">Shop Products</a>
        </div>`;
      return;
    }

    const subtotal = detailedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = subtotal >= 5000 ? 0 : 199;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;
    const user = getCurrentUser();

    container.innerHTML = `
      <div class="two-col-grid">
        <section class="card">
          <h2>Shipping &amp; Payment Details</h2>
          <form id="checkoutForm" class="spaced-form">
            <div class="form-row">
              <div class="form-group">
                <label for="shipName">Full Name</label>
                <input type="text" id="shipName" value="${user ? user.name : ""}" placeholder="Archit Singhania" required>
              </div>
              <div class="form-group">
                <label for="shipEmail">Email</label>
                <input type="email" id="shipEmail" value="${user ? user.email : ""}" placeholder="you@example.com" required>
              </div>
            </div>
            <div class="form-group">
              <label for="shipAddress">Street Address</label>
              <input type="text" id="shipAddress" placeholder="House / Flat No., Street, Area" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="shipCity">City</label>
                <input type="text" id="shipCity" placeholder="Bengaluru" required>
              </div>
              <div class="form-group">
                <label for="shipPin">PIN Code</label>
                <input type="text" id="shipPin" pattern="[0-9]{6}" placeholder="560102" required>
              </div>
            </div>
            <div class="form-group">
              <label for="paymentMethod">Payment Method</label>
              <select id="paymentMethod">
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
              </select>
            </div>
            <button type="submit" class="btn-primary full-width">Place Order (${formatINR(total)})</button>
          </form>
        </section>

        <aside class="card">
          <h2>Items (${detailedItems.reduce((s, i) => s + i.qty, 0)})</h2>
          <div class="info-box">
            ${detailedItems
              .map(
                (i) =>
                  `<div class="detail-row"><span>${i.name} × ${i.qty}</span><strong>${formatINR(i.price * i.qty)}</strong></div>`
              )
              .join("")}
            <div class="detail-row"><span>Shipping</span><strong>${shipping === 0 ? "Free" : formatINR(shipping)}</strong></div>
            <div class="detail-row"><span>GST (18%)</span><strong>${formatINR(tax)}</strong></div>
            <div class="detail-row total-row"><span>Grand Total</span><strong>${formatINR(total)}</strong></div>
          </div>
        </aside>
      </div>
    `;

    document.getElementById("checkoutForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const orderId = `XML-${Math.floor(100000 + Math.random() * 900000)}`;
      const buyerName = document.getElementById("shipName").value.trim();
      const payment = document.getElementById("paymentMethod").value;

      saveCart([]);
      container.innerHTML = `
        <div class="card empty-state" style="max-width:520px; margin:0 auto;">
          <div class="status-icon icon-success">✓</div>
          <span class="badge badge-success">Order Confirmed</span>
          <h2>Thank you, ${buyerName}!</h2>
          <p class="subtitle">Your order has been placed successfully.</p>
          <div class="info-box" style="text-align:left;">
            <div class="detail-row"><span>Order ID</span><strong>${orderId}</strong></div>
            <div class="detail-row"><span>Payment Mode</span><strong>${payment}</strong></div>
            <div class="detail-row"><span>Amount Paid</span><strong>${formatINR(total)}</strong></div>
          </div>
          <br>
          <a href="./products.html" class="btn-primary">Continue Shopping</a>
        </div>
      `;
    });
  } catch {
    container.innerHTML = `<div class="alert alert-error">Unable to load checkout summary.</div>`;
  }
}

// Login / Register Page
function initAuthPage() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const registerForm = document.getElementById("registerForm");
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const alertBox = document.getElementById("authAlert");
  const loggedInPanel = document.getElementById("loggedInPanel");
  const authFormsPanel = document.getElementById("authFormsPanel");

  function showAlert(msg, type) {
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
  }

  function refreshAuthView() {
    const user = getCurrentUser();
    if (user) {
      document.getElementById("profileName").textContent = user.name;
      document.getElementById("profileEmail").textContent = user.email;
      loggedInPanel.classList.remove("hidden");
      authFormsPanel.classList.add("hidden");
    } else {
      loggedInPanel.classList.add("hidden");
      authFormsPanel.classList.remove("hidden");
    }
    updateNavbarState();
  }

  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    alertBox.classList.add("hidden");
  });

  registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    alertBox.classList.add("hidden");
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const users = getUsers();
    const match = users.find((u) => u.email.toLowerCase() === email && u.password === password);
    if (!match) {
      showAlert("Invalid email or password. Try the demo credentials below.", "error");
      return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: match.name, email: match.email }));
    refreshAuthView();
  });

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirm").value;

    if (password !== confirm) {
      showAlert("Passwords do not match.", "error");
      return;
    }

    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      showAlert("An account with this email already exists.", "error");
      return;
    }

    users.push({ name, email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
    refreshAuthView();
  });

  document.getElementById("logoutUserBtn").addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    document.getElementById("navAuthLink").textContent = "Login / Register";
    refreshAuthView();
  });

  refreshAuthView();
}

// Contact Page
function initContactPage() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const alertBox = document.getElementById("contactAlert");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const subject = document.getElementById("contactSubject").value;

    alertBox.textContent = `Thank you, ${name}! Your "${subject}" message has been received. We will reply shortly.`;
    alertBox.className = "alert alert-success";
    form.reset();
  });
}

// Global Add-to-Cart Button Listener & Boot
document.addEventListener("click", (e) => {
  const productId = e.target.getAttribute("data-add-cart");
  if (productId) {
    addToCart(productId, 1);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  updateNavbarState();
  initHomePage();
  initProductsPage();
  initProductDetailsPage();
  initCartPage();
  initCheckoutPage();
  initAuthPage();
  initContactPage();
});
