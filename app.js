const state = {
  auth: {
    contractId: "",
    clientId: "",
    clientSecret: "",
    accessToken: "",
  },
  products: [],
  categories: [],
};

const el = {
  contractId: document.getElementById("contractId"),
  clientId: document.getElementById("clientId"),
  clientSecret: document.getElementById("clientSecret"),
  connectBtn: document.getElementById("connectBtn"),
  resetBtn: document.getElementById("resetBtn"),
  authStatus: document.getElementById("authStatus"),
  categoryFilter: document.getElementById("categoryFilter"),
  displayFilter: document.getElementById("displayFilter"),
  loadProductsBtn: document.getElementById("loadProductsBtn"),
  productsBody: document.getElementById("productsBody"),
  applyProductsBtn: document.getElementById("applyProductsBtn"),
  levelFilter: document.getElementById("levelFilter"),
  loadCategoriesBtn: document.getElementById("loadCategoriesBtn"),
  categoriesBody: document.getElementById("categoriesBody"),
  applyCategoriesBtn: document.getElementById("applyCategoriesBtn"),
  logArea: document.getElementById("logArea"),
  clearLogBtn: document.getElementById("clearLogBtn"),
};

function log(message, type = "info") {
  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.textContent = `[${time}] ${message}`;
  line.dataset.type = type;
  el.logArea.prepend(line);
}

function setAuthStatus(text, ok = false) {
  el.authStatus.textContent = text;
  el.authStatus.style.background = ok ? "#dff3ea" : "#f1e7db";
  el.authStatus.style.color = ok ? "#1f5b4b" : "#1c1b19";
}

function getBaseUrl() {
  return `https://api.smaregi.jp/${state.auth.contractId}/pos`;
}

async function fetchToken() {
  const { contractId, clientId, clientSecret } = state.auth;
  if (!contractId || !clientId || !clientSecret) {
    throw new Error("認証情報をすべて入力してください。");
  }

  const tokenUrl = `https://id.smaregi.jp/app/${contractId}/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "pos.products:read pos.products:write",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`トークン取得に失敗しました: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("アクセストークンが取得できませんでした。");
  }

  state.auth.accessToken = data.access_token;
  return data;
}

async function apiRequest(method, path, { query = {}, body } = {}) {
  if (!state.auth.accessToken) {
    throw new Error("アクセストークンがありません。先に接続してください。");
  }

  const url = new URL(`${getBaseUrl()}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, value);
    }
  });

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${state.auth.accessToken}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), options);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`APIエラー: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

function extractList(data) {
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.categories)) return data.categories;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

async function fetchAll(path, query) {
  const limit = 100;
  let page = 1;
  let all = [];

  while (true) {
    const data = await apiRequest("GET", path, {
      query: { ...query, limit, page },
    });
    const items = extractList(data);
    all = all.concat(items);

    if (items.length < limit) break;
    page += 1;
  }

  return all;
}

function normalizeDisplayFlag(value) {
  if (value === true) return "1";
  if (value === false) return "0";
  return String(value ?? "0");
}

function mapCategory(item) {
  return {
    id: item.categoryId ?? item.category_id ?? item.id,
    name: item.categoryName ?? item.category_name ?? item.name,
    displayFlag: normalizeDisplayFlag(item.displayFlag ?? item.display_flag),
    originalDisplayFlag: normalizeDisplayFlag(item.displayFlag ?? item.display_flag),
    level: String(item.level ?? ""),
    isDirty: false,
  };
}

function mapProduct(item) {
  return {
    id: item.productId ?? item.product_id ?? item.id,
    name: item.productName ?? item.product_name ?? item.name,
    displayFlag: normalizeDisplayFlag(item.displayFlag ?? item.display_flag),
    originalDisplayFlag: normalizeDisplayFlag(item.displayFlag ?? item.display_flag),
    categoryId: item.categoryId ?? item.category_id ?? "",
    isDirty: false,
  };
}

function renderCategories() {
  el.categoriesBody.innerHTML = "";
  for (const category of state.categories) {
    const tr = document.createElement("tr");
    if (category.isDirty) tr.classList.add("is-dirty");

    tr.innerHTML = `
      <td>${category.id ?? ""}</td>
      <td>${category.name ?? ""}</td>
      <td>
        <input type="checkbox" ${category.displayFlag === "1" ? "checked" : ""} data-id="${category.id}" data-type="category" />
      </td>
      <td><span class="state-pill ${category.isDirty ? "is-changed" : ""}">${category.isDirty ? "変更あり" : "未変更"}</span></td>
    `;
    el.categoriesBody.appendChild(tr);
  }
}

function renderProducts() {
  el.productsBody.innerHTML = "";
  for (const product of state.products) {
    const tr = document.createElement("tr");
    if (product.isDirty) tr.classList.add("is-dirty");

    tr.innerHTML = `
      <td>${product.id ?? ""}</td>
      <td>${product.name ?? ""}</td>
      <td>
        <input type="checkbox" ${product.displayFlag === "1" ? "checked" : ""} data-id="${product.id}" data-type="product" />
      </td>
      <td><span class="state-pill ${product.isDirty ? "is-changed" : ""}">${product.isDirty ? "変更あり" : "未変更"}</span></td>
    `;
    el.productsBody.appendChild(tr);
  }
}

function renderCategoryFilter() {
  el.categoryFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "すべて";
  el.categoryFilter.appendChild(allOption);

  for (const category of state.categories) {
    const option = document.createElement("option");
    option.value = category.id ?? "";
    option.textContent = category.name ?? category.id ?? "";
    el.categoryFilter.appendChild(option);
  }
}

async function loadCategories() {
  log("部門一覧を取得中...");
  const level = el.levelFilter.value;
  const fields = "categoryId,categoryName,displayFlag,level";
  const categories = await fetchAll("/categories", {
    fields,
    level,
  });
  state.categories = categories.map(mapCategory);
  renderCategoryFilter();
  renderCategories();
  log(`部門 ${state.categories.length} 件を取得しました。`);
}

async function loadProducts() {
  log("商品一覧を取得中...");
  const categoryId = el.categoryFilter.value;
  const displayFlag = el.displayFilter.value;
  const fields = "productId,productName,displayFlag,categoryId";
  const products = await fetchAll("/products", {
    fields,
    category_id: categoryId,
    display_flag: displayFlag,
  });
  state.products = products.map(mapProduct);
  renderProducts();
  log(`商品 ${state.products.length} 件を取得しました。`);
}

function updateDirtyFlag(list, id, displayFlag) {
  const item = list.find((row) => String(row.id) === String(id));
  if (!item) return;
  item.displayFlag = displayFlag;
  item.isDirty = item.displayFlag !== item.originalDisplayFlag;
}

async function applyChanges(list, type) {
  const dirtyItems = list.filter((item) => item.isDirty);
  if (dirtyItems.length === 0) {
    log("変更がありません。");
    return;
  }

  log(`${type === "product" ? "商品" : "部門"}の変更を反映します (${dirtyItems.length}件)...`);

  for (const item of dirtyItems) {
    try {
      const path = type === "product" ? `/products/${item.id}` : `/categories/${item.id}`;
      await apiRequest("PATCH", path, {
        body: { displayFlag: item.displayFlag },
      });
      item.originalDisplayFlag = item.displayFlag;
      item.isDirty = false;
      log(`${type === "product" ? "商品" : "部門"} ${item.id} を更新しました。`);
    } catch (error) {
      log(`${type === "product" ? "商品" : "部門"} ${item.id} 更新失敗: ${error.message}`, "error");
    }
  }

  type === "product" ? renderProducts() : renderCategories();
}

function attachCheckboxHandler() {
  document.body.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (event.target.type !== "checkbox") return;
    const id = event.target.dataset.id;
    const type = event.target.dataset.type;
    if (!id || !type) return;

    const displayFlag = event.target.checked ? "1" : "0";
    if (type === "product") {
      updateDirtyFlag(state.products, id, displayFlag);
      renderProducts();
    } else {
      updateDirtyFlag(state.categories, id, displayFlag);
      renderCategories();
    }
  });
}

function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.remove("is-active");
      });
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add("is-active");
    });
  });
}

function resetAll() {
  state.auth = { contractId: "", clientId: "", clientSecret: "", accessToken: "" };
  state.products = [];
  state.categories = [];
  el.contractId.value = "";
  el.clientId.value = "";
  el.clientSecret.value = "";
  el.productsBody.innerHTML = "";
  el.categoriesBody.innerHTML = "";
  el.categoryFilter.innerHTML = "";
  setAuthStatus("未接続", false);
  log("リセットしました。", "info");
}

async function connect() {
  state.auth.contractId = el.contractId.value.trim();
  state.auth.clientId = el.clientId.value.trim();
  state.auth.clientSecret = el.clientSecret.value.trim();

  el.connectBtn.disabled = true;
  try {
    await fetchToken();
    setAuthStatus("接続済み", true);
    log("アクセストークンを取得しました。", "success");
    await loadCategories();
    await loadProducts();
  } catch (error) {
    setAuthStatus("未接続", false);
    log(error.message, "error");
  } finally {
    el.connectBtn.disabled = false;
  }
}

function bindEvents() {
  el.connectBtn.addEventListener("click", connect);
  el.resetBtn.addEventListener("click", resetAll);
  el.loadCategoriesBtn.addEventListener("click", loadCategories);
  el.loadProductsBtn.addEventListener("click", loadProducts);
  el.applyProductsBtn.addEventListener("click", () => applyChanges(state.products, "product"));
  el.applyCategoriesBtn.addEventListener("click", () => applyChanges(state.categories, "category"));
  el.clearLogBtn.addEventListener("click", () => (el.logArea.innerHTML = ""));
  el.categoryFilter.addEventListener("change", loadProducts);
  el.displayFilter.addEventListener("change", loadProducts);
  el.levelFilter.addEventListener("change", loadCategories);
}

initTabs();
attachCheckboxHandler();
bindEvents();
setAuthStatus("未接続", false);
log("準備完了。接続情報を入力してください。");
