'use strict';

const products = [
  { id: 'brew', name: 'Coffee House', category: 'business', label: 'Кофейня', price: 220, badge: '', image: 'assets/CoffeHouse1.png', description: 'Сайт кофейни с меню, фотографиями напитков и информацией о заведении.' },
  { id: 'botanica', name: 'Plants', category: 'shop', label: 'Растения и уход за садом', price: 300, badge: 'Новинка', image: 'assets/Plants.png', description: 'Сайт о растениях и уходе за садом с описанием услуг и информацией о команде.' },
  { id: 'mono', name: 'Portfolio', category: 'portfolio', label: 'Портфолио фотографа', price: 180, badge: '', image: 'assets/Portfolio.png', description: 'Портфолио фотографа с примерами работ, навыками, стоимостью услуг и контактами.' },
  { id: 'library', name: 'Library', category: 'business', label: 'Библиотека', price: 250, badge: '', image: 'assets/Library.png', description: 'Сайт библиотеки с каталогом книг и информацией для читателей.' },
  { id: 'singolo', name: 'Singolo', category: 'landing', label: 'Лендинг', price: 250, badge: '', image: 'assets/Singolo.png', description: 'Одностраничный сайт проекта Singolo.' },
  { id: 'shelter', name: 'Shelter', category: 'business', label: 'Приют для животных', price: 280, badge: '', image: 'assets/Shelter.png', description: 'Сайт приюта с информацией о животных и способах помощи.' },
  { id: 'travel', name: 'Travel', category: 'landing', label: 'Путешествия', price: 270, badge: '', image: 'assets/Travel.png', description: 'Сайт о путешествиях с подборкой направлений и поездок.' }
];

// Storage may be unavailable in private mode or when opening a local file.
const storage = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Keep the interface usable without persistence. */ } }
};
let favorites;
try {
  const saved = JSON.parse(storage.get('siteform-favorites', '[]'));
  favorites = new Set(Array.isArray(saved) ? saved.filter(id => products.some(p => p.id === id)) : []);
} catch { favorites = new Set(); }
const state = { category: 'all', query: '', sort: 'default' };
const money = value => new Intl.NumberFormat('ru-BY', {
  style: 'currency',
  currency: 'BYN',
  currencyDisplay: 'code',
  maximumFractionDigits: 0
}).format(value);
const themeButton = document.querySelector('.theme-toggle');

function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton.textContent = dark ? '☀' : '☾';
  themeButton.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
  themeButton.setAttribute('aria-pressed', String(dark));
}
updateThemeButton();
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  storage.set('siteform-theme', theme);
  updateThemeButton();
});

const productGrid = document.querySelector('#products');
const productDots = document.querySelector('#product-dots');
function productsPerPage() {
  if (matchMedia('(max-width: 600px)').matches) return 1;
  if (matchMedia('(max-width: 800px)').matches) return 2;
  return 3;
}
function updateActiveProductDot() {
  if (!productGrid || !productDots) return;
  const activePage = Math.round(productGrid.scrollLeft / (productGrid.clientWidth || 1));
  productDots.querySelectorAll('button').forEach((dot, index) => {
    if (index === activePage) dot.setAttribute('aria-current', 'page');
    else dot.removeAttribute('aria-current');
  });
}
function updateProductDots() {
  if (!productGrid || !productDots) return;
  const pageCount = Math.ceil(productGrid.children.length / productsPerPage());
  productDots.hidden = pageCount <= 1;
  productDots.innerHTML = Array.from({ length: pageCount }, (_, page) => {
    const first = page * productsPerPage() + 1;
    const last = Math.min(first + productsPerPage() - 1, productGrid.children.length);
    return `<button type="button" data-page="${page}" aria-label="Показать сайты ${first}-${last}" ${page === 0 ? 'aria-current="page"' : ''}></button>`;
  }).join('');
}
productGrid?.addEventListener('scroll', updateActiveProductDot);
productDots?.addEventListener('click', event => {
  const dot = event.target.closest('[data-page]');
  if (dot) {
    productGrid.scrollLeft = Number(dot.dataset.page) * productGrid.clientWidth;
    updateActiveProductDot();
  }
});
if (productGrid) {
  new ResizeObserver(updateProductDots).observe(productGrid);
  updateProductDots();
}

const menu = document.querySelector('.nav');
const menuButton = document.querySelector('.menu-toggle');
function closeMenu() {
  if (!menu || !menuButton) return;
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  menuButton.textContent = '☰';
}
menuButton?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  menuButton.textContent = open ? '×' : '☰';
});
menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
matchMedia('(min-width: 601px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

function renderProducts() {
  const grid = document.querySelector('#products');
  let list = products.filter(p =>
    (state.category === 'all' || (state.category === 'favorites' ? favorites.has(p.id) : p.category === state.category)) &&
    `${p.name} ${p.label} ${p.description}`.toLocaleLowerCase('ru').includes(state.query)
  );
  if (state.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (state.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  // Only the fixed product dataset is inserted as HTML, never the search input.
  grid.innerHTML = list.map(p => `<article class="product-card">
    <button class="preview-button preview-${p.id}" data-product="${p.id}" aria-label="Подробнее о сайте ${p.name}">
      ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
      <img class="site-preview" src="${p.image}" alt="Пример сайта ${p.name}" loading="lazy" decoding="async">
    </button>
    <div class="product-meta"><div><h3 class="product-name">${p.name}</h3><p class="product-category">${p.label}</p></div><span class="price">${money(p.price)}</span></div>
    <div class="product-bottom"><div class="product-tags"><span>HTML / CSS</span><span>Адаптивный</span></div><button class="favorite" data-favorite="${p.id}" aria-pressed="${favorites.has(p.id)}" aria-label="${favorites.has(p.id) ? 'Убрать' : 'Добавить'} ${p.name} ${favorites.has(p.id) ? 'из избранного' : 'в избранное'}">${favorites.has(p.id) ? '♥' : '♡'}</button></div>
  </article>`).join('');
  grid.scrollLeft = 0;
  updateProductDots();
  const count = document.querySelector('#result-count');
  if (count) count.textContent = `Показано: ${list.length} из ${products.length}`;
  const empty = document.querySelector('.empty-state');
  if (empty) empty.hidden = list.length > 0;
}
function updateCategories() {
  document.querySelectorAll('[data-category]').forEach(button => {
    const active = button.dataset.category === state.category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  state.category = button.dataset.category;
  updateCategories();
  renderProducts();
}));
document.querySelector('#search')?.addEventListener('input', event => { state.query = event.target.value.trim().toLocaleLowerCase('ru'); renderProducts(); });
document.querySelector('#sort')?.addEventListener('change', event => { state.sort = event.target.value; renderProducts(); });
document.querySelector('#reset-filters')?.addEventListener('click', () => {
  state.category = 'all'; state.query = ''; state.sort = 'default';
  document.querySelector('#search').value = '';
  document.querySelector('#sort').value = 'default';
  updateCategories(); renderProducts();
  document.querySelector('#search').focus();
});

let toastTimer;
function notify(message) {
  const toast = document.querySelector('.toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}
function toggleFavorite(id) {
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  storage.set('siteform-favorites', JSON.stringify([...favorites]));
  notify(favorites.has(id) ? 'Сайт добавлен в избранное' : 'Сайт убран из избранного');
}
const dialog = document.querySelector('#product-dialog');
let openedProductId;
document.querySelector('#products').addEventListener('click', event => {
  const favorite = event.target.closest('[data-favorite]');
  if (favorite) {
    const id = favorite.dataset.favorite;
    toggleFavorite(id); renderProducts();
    const replacement = document.querySelector(`[data-favorite="${id}"]`) || document.querySelector('[data-category="favorites"]');
    replacement?.focus({ preventScroll: true });
    return;
  }
  const card = event.target.closest('[data-product]');
  if (!card) return;
  const p = products.find(item => item.id === card.dataset.product);
  openedProductId = p.id;
  dialog.innerHTML = `<button class="dialog-close" aria-label="Закрыть окно" autofocus>×</button><img class="dialog-image" data-preview-theme="light" src="${p.image}" alt="Пример сайта ${p.name}"><p class="dialog-category">${p.label}</p><h2 id="dialog-title">${p.name}</h2><p>${p.description}</p><div class="dialog-pages"><label for="page-count">Количество страниц</label><input id="page-count" type="number" min="1" max="20" step="1" value="1"></div><label class="dialog-select-field">Цветовая тема<select id="site-theme"><option value="light">Светлая</option><option value="dark">Тёмная</option><option value="brand">Фирменная</option></select></label><label class="dialog-select-field">Языки сайта<select id="site-language"><option value="ru">Русский</option><option value="ru-en">Русский + English</option></select></label><p class="dialog-language-summary" id="dialog-language-summary" aria-live="polite">Состав сайта: русская версия</p><label class="dialog-checkbox"><input id="turnkey-site" type="checkbox">Сайт под ключ</label><p class="dialog-features">Адаптивная вёрстка и исходный код входят в шаблон.</p><div class="dialog-price" id="dialog-price" aria-live="polite">${money(p.price)}</div><button class="button button-dark dialog-favorite" data-id="${p.id}" aria-pressed="${favorites.has(p.id)}">${favorites.has(p.id) ? 'Убрать из избранного ♥' : 'Добавить в избранное ♡'}</button><p class="demo-note">Учебный каталог. Цена приведена для примера. Покупка и скачивание шаблонов недоступны.</p>`;
  const pageInput = dialog.querySelector('#page-count');
  const languageSelect = dialog.querySelector('#site-language');
  const themeSelect = dialog.querySelector('#site-theme');
  const turnkeyInput = dialog.querySelector('#turnkey-site');
  const updateOptions = () => {
    const pages = Number(pageInput.value);
    if (!Number.isInteger(pages) || pages < 1 || pages > 20) return;
    const languageExtra = languageSelect.value === 'ru-en' ? 0.15 : 0;
    const subtotal = p.price * (1 + (pages - 1) * 0.15 + languageExtra);
    dialog.querySelector('#dialog-price').textContent = money(subtotal * (turnkeyInput.checked ? 1.2 : 1));
    dialog.querySelector('#dialog-language-summary').textContent = languageSelect.value === 'ru-en'
      ? 'Состав сайта: русская и английская версии'
      : 'Состав сайта: русская версия';
  };
  pageInput.addEventListener('input', updateOptions);
  pageInput.addEventListener('change', () => {
    pageInput.value = Math.min(20, Math.max(1, Math.trunc(Number(pageInput.value) || 1)));
    updateOptions();
  });
  languageSelect.addEventListener('change', updateOptions);
  turnkeyInput.addEventListener('change', updateOptions);
  themeSelect.addEventListener('change', () => {
    dialog.querySelector('.dialog-image').dataset.previewTheme = themeSelect.value;
  });
  dialog.showModal();
  document.body.style.overflow = 'hidden';
});
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  const outside = event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
  if (event.target.closest('.dialog-close') || outside) dialog.close();
  const button = event.target.closest('.dialog-favorite');
  if (button) {
    toggleFavorite(button.dataset.id);
    const selected = favorites.has(button.dataset.id);
    button.textContent = selected ? 'Убрать из избранного ♥' : 'Добавить в избранное ♡';
    button.setAttribute('aria-pressed', String(selected));
  }
});
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  renderProducts();
  const target = document.querySelector(`[data-product="${openedProductId}"]`) || document.querySelector('[data-category="favorites"]');
  target?.focus({ preventScroll: true });
});
window.addEventListener('storage', event => {
  if (event.key === 'siteform-theme') {
    document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
    updateThemeButton();
  }
});
renderProducts();
