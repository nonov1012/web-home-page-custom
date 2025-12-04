// Configuration globale
const config = {
    columns: 12,
    rows: 10,
    gap: 8,
    bgColor: '#1a1a2e',
    bgImage: '',
    widgetColor: '#16213e',
    widgetOpacity: 0.9,
    widgetRadius: 8,
    editMode: false,
    widgets: []
};

// État de l'application
let draggedWidget = null;
let resizingWidget = null;
let startX, startY, startWidth, startHeight, startCol, startRow;
let currentEditingWidget = null;
let currentEditingBookmark = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    initializeGrid();
    initializeSettings();
    initializeEventListeners();
    updateGridStyles();
});

// Gestion de la configuration
function loadConfig() {
    const saved = localStorage.getItem('homePageConfig');
    if (saved) {
        try {
            const savedConfig = JSON.parse(saved);
            Object.assign(config, savedConfig);
        } catch (e) {
            console.error('Erreur lors du chargement de la configuration', e);
        }
    }
}

function saveConfig() {
    localStorage.setItem('homePageConfig', JSON.stringify(config));
}

// Initialisation de la grille
function initializeGrid() {
    const container = document.getElementById('gridContainer');
    container.style.gridTemplateColumns = `repeat(${config.columns}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${config.rows}, 1fr)`;
    container.style.gap = `${config.gap}px`;

    // Charger les widgets sauvegardés
    config.widgets.forEach(widgetData => {
        createWidget(widgetData.type, widgetData);
    });
}

// Initialisation des paramètres
function initializeSettings() {
    document.getElementById('columns').value = config.columns;
    document.getElementById('rows').value = config.rows;
    document.getElementById('gap').value = config.gap;
    document.getElementById('bgColor').value = config.bgColor;
    document.getElementById('bgImage').value = config.bgImage;
    document.getElementById('widgetColor').value = config.widgetColor;
    document.getElementById('widgetOpacity').value = config.widgetOpacity * 100;
    document.getElementById('widgetRadius').value = config.widgetRadius;

    updateDisplayValues();
}

function updateDisplayValues() {
    document.getElementById('columnsValue').textContent = config.columns;
    document.getElementById('rowsValue').textContent = config.rows;
    document.getElementById('gapValue').textContent = config.gap;
    document.getElementById('opacityValue').textContent = config.widgetOpacity.toFixed(2);
    document.getElementById('radiusValue').textContent = config.widgetRadius;
}

// Event Listeners
function initializeEventListeners() {
    // Bouton mode édition
    document.getElementById('editModeBtn').addEventListener('click', () => {
        config.editMode = !config.editMode;
        const btn = document.getElementById('editModeBtn');
        const container = document.getElementById('gridContainer');

        if (config.editMode) {
            btn.classList.add('active');
            container.classList.add('edit-mode');
            // Fermer le panneau de paramètres si ouvert
            document.getElementById('settingsPanel').classList.remove('open');
        } else {
            btn.classList.remove('active');
            container.classList.remove('edit-mode');
        }
    });

    // Bouton paramètres
    document.getElementById('settingsBtn').addEventListener('click', () => {
        const panel = document.getElementById('settingsPanel');
        panel.classList.toggle('open');

        // Activer automatiquement le mode édition quand on ouvre le panneau
        if (panel.classList.contains('open')) {
            config.editMode = true;
            document.getElementById('editModeBtn').classList.add('active');
            document.getElementById('gridContainer').classList.add('edit-mode');
        }
    });

    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.remove('open');
    });

    // Paramètres de grille
    document.getElementById('columns').addEventListener('input', (e) => {
        config.columns = parseInt(e.target.value);
        updateDisplayValues();
        updateGridStyles();
        saveConfig();
    });

    document.getElementById('rows').addEventListener('input', (e) => {
        config.rows = parseInt(e.target.value);
        updateDisplayValues();
        updateGridStyles();
        saveConfig();
    });

    document.getElementById('gap').addEventListener('input', (e) => {
        config.gap = parseInt(e.target.value);
        updateDisplayValues();
        updateGridStyles();
        saveConfig();
    });

    // Paramètres d'apparence
    document.getElementById('bgColor').addEventListener('input', (e) => {
        config.bgColor = e.target.value;
        updateGridStyles();
        saveConfig();
    });

    document.getElementById('bgImage').addEventListener('input', (e) => {
        config.bgImage = e.target.value;
        updateGridStyles();
        saveConfig();
    });

    document.getElementById('widgetColor').addEventListener('input', (e) => {
        config.widgetColor = e.target.value;
        updateGridStyles();
        saveConfig();
    });

    document.getElementById('widgetOpacity').addEventListener('input', (e) => {
        config.widgetOpacity = parseInt(e.target.value) / 100;
        updateDisplayValues();
        updateGridStyles();
        saveConfig();
    });

    document.getElementById('widgetRadius').addEventListener('input', (e) => {
        config.widgetRadius = parseInt(e.target.value);
        updateDisplayValues();
        updateGridStyles();
        saveConfig();
    });

    // Boutons d'ajout de widgets
    document.querySelectorAll('.add-widget-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const widgetType = btn.getAttribute('data-widget');
            addNewWidget(widgetType);
        });
    });

    // Bouton de réinitialisation
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser toute la configuration ?')) {
            localStorage.removeItem('homePageConfig');
            location.reload();
        }
    });

    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', exportConfig);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importConfig);

    // Modal couleur
    document.getElementById('saveColorBtn').addEventListener('click', saveWidgetColor);
    document.getElementById('cancelColorBtn').addEventListener('click', () => {
        document.getElementById('colorModal').classList.remove('active');
    });

    // Mise à jour des valeurs du modal couleur
    document.getElementById('modalOpacity').addEventListener('input', (e) => {
        document.getElementById('modalOpacityValue').textContent = (e.target.value / 100).toFixed(2);
    });
    document.getElementById('modalBorderWidth').addEventListener('input', (e) => {
        document.getElementById('modalBorderWidthValue').textContent = e.target.value;
    });

    // Modal favoris
    document.getElementById('saveBookmarkBtn').addEventListener('click', saveBookmark);
    document.getElementById('cancelBookmarkBtn').addEventListener('click', () => {
        document.getElementById('bookmarkModal').classList.remove('active');
    });

    // Modal config favoris
    document.getElementById('saveBookmarkConfigBtn').addEventListener('click', saveBookmarkConfig);
    document.getElementById('cancelBookmarkConfigBtn').addEventListener('click', () => {
        document.getElementById('bookmarkConfigModal').classList.remove('active');
    });

    document.getElementById('bookmarkSize').addEventListener('input', (e) => {
        document.getElementById('bookmarkSizeValue').textContent = e.target.value;
    });

    // Rabattre le panneau si on déplace un widget dessus
    document.addEventListener('mousemove', (e) => {
        if (draggedWidget) {
            const panel = document.getElementById('settingsPanel');

            if (e.clientX > window.innerWidth - 400) {
                panel.classList.add('collapsed');
            } else if (panel.classList.contains('open')) {
                panel.classList.remove('collapsed');
            }
        }
    });
}

// Mise à jour des styles
function updateGridStyles() {
    const container = document.getElementById('gridContainer');
    const body = document.body;

    container.style.gridTemplateColumns = `repeat(${config.columns}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${config.rows}, 1fr)`;
    container.style.gap = `${config.gap}px`;
    container.style.setProperty('--grid-cols', config.columns);
    container.style.setProperty('--grid-rows', config.rows);

    body.style.backgroundColor = config.bgColor;
    if (config.bgImage) {
        body.style.backgroundImage = `url(${config.bgImage})`;
    } else {
        body.style.backgroundImage = 'none';
    }

    document.querySelectorAll('.widget').forEach(widget => {
        const widgetData = config.widgets.find(w => w.id == widget.dataset.id);
        if (widgetData && widgetData.customStyle) {
            applyCustomWidgetStyle(widget, widgetData.customStyle);
        } else {
            widget.style.setProperty('--widget-bg-color', config.widgetColor);
            widget.style.setProperty('--widget-opacity', config.widgetOpacity);
        }
        widget.style.borderRadius = `${config.widgetRadius}px`;
    });
}

function applyCustomWidgetStyle(widget, style) {
    widget.style.setProperty('--widget-bg-color', style.bgColor);
    widget.style.setProperty('--widget-opacity', style.opacity);
    widget.style.setProperty('--widget-border', `${style.borderWidth}px solid ${style.borderColor}`);
}

// Création de widgets
function addNewWidget(type) {
    const widgetData = {
        type: type,
        id: Date.now(),
        col: 1,
        row: 1,
        width: type === 'search' ? 4 : 2,
        height: type === 'search' ? 2 : 2,
        config: {},
        customStyle: null
    };

    // Demander les configs nécessaires avant de créer
    if (type === 'iframe') {
        const url = prompt('URL de l\'iframe:');
        if (!url) return;
        widgetData.config.url = url;
    }

    createWidget(type, widgetData);
    config.widgets.push(widgetData);
    saveConfig();
}

function createWidget(type, data) {
    const template = document.getElementById('widgetTemplate');
    const widget = template.content.cloneNode(true).querySelector('.widget');

    widget.dataset.id = data.id;
    widget.dataset.type = type;
    widget.style.gridColumn = `${data.col} / span ${data.width}`;
    widget.style.gridRow = `${data.row} / span ${data.height}`;

    if (data.customStyle) {
        applyCustomWidgetStyle(widget, data.customStyle);
    } else {
        widget.style.setProperty('--widget-bg-color', config.widgetColor);
        widget.style.setProperty('--widget-opacity', config.widgetOpacity);
    }
    widget.style.borderRadius = `${config.widgetRadius}px`;

    widget.classList.add(`${type}-widget`);

    const content = widget.querySelector('.widget-content');

    // Configuration selon le type de widget
    switch(type) {
        case 'search':
            content.innerHTML = createSearchWidget(data);
            initSearchWidget(widget, data);
            break;
        case 'bookmarks':
            content.innerHTML = createBookmarksWidget(data);
            initBookmarksWidget(widget, data);
            break;
        case 'weather':
            content.innerHTML = createWeatherWidget(data);
            initWeatherWidget(widget, data);
            break;
        case 'clock':
            content.innerHTML = createClockWidget(data);
            initClockWidget(widget);
            break;
        case 'notes':
            content.innerHTML = createNotesWidget(data);
            initNotesWidget(widget, data);
            break;
        case 'rss':
            content.innerHTML = createRSSWidget(data);
            initRSSWidget(widget, data);
            break;
        case 'iframe':
            content.innerHTML = createIframeWidget(data);
            break;
        case 'calendar':
            content.innerHTML = createCalendarWidget(data);
            initCalendarWidget(widget, data);
            break;
    }

    // Event listeners pour les contrôles
    const deleteBtn = widget.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteWidget(data.id);
    });

    const colorBtn = widget.querySelector('.color-btn');
    colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openColorModal(data.id);
    });

    // Drag & Drop
    widget.addEventListener('mousedown', (e) => {
        if (!config.editMode) return;
        if (e.target.classList.contains('resize-handle')) {
            startResize(e, widget, data);
        } else if (!e.target.closest('.widget-control') && !e.target.closest('input') && !e.target.closest('button') && !e.target.closest('textarea')) {
            startDrag(e, widget, data);
        }
    });

    document.getElementById('gridContainer').appendChild(widget);
}

// Widgets HTML

function createSearchWidget(data) {
    const engine = data.config.engine || 'google';
    return `
        <div class="search-box">
            <select class="search-engine-select" data-widget-id="${data.id}">
                <option value="google" ${engine === 'google' ? 'selected' : ''}>Google</option>
                <option value="bing" ${engine === 'bing' ? 'selected' : ''}>Bing</option>
                <option value="duckduckgo" ${engine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
            </select>
            <input type="text" class="search-input" placeholder="Rechercher..." data-widget-id="${data.id}">
            <button class="search-btn" data-widget-id="${data.id}">🔍</button>
        </div>
    `;
}

function initSearchWidget(widget, data) {
    const input = widget.querySelector('.search-input');
    const searchBtn = widget.querySelector('.search-btn');
    const engineSelect = widget.querySelector('.search-engine-select');

    const performSearch = () => {
        const query = input.value.trim();
        if (!query) return;

        const engine = data.config.engine || 'google';
        const urls = {
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
        };

        window.location.href = urls[engine];
        input.value = '';
    };

    searchBtn.addEventListener('click', performSearch);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    engineSelect.addEventListener('change', (e) => {
        data.config.engine = e.target.value;
        saveConfig();
    });
}

function createBookmarksWidget(data) {
    const bookmarks = data.config.bookmarks || [];
    const iconSize = data.config.iconSize || 48;

    // Calculer le nombre de colonnes en fonction de la taille du widget
    const widgetWidth = data.width;
    const cols = Math.max(2, Math.floor(widgetWidth * 1.5));

    let html = '<div class="bookmarks-container">';
    html += `<div class="bookmarks-grid" style="grid-template-columns: repeat(${cols}, 1fr);">`;

    bookmarks.forEach((bookmark, index) => {
        html += `
            <div class="bookmark-item-wrapper">
                <a href="${bookmark.url}" class="bookmark-item">
                    <div class="bookmark-icon" style="width: ${iconSize}px; height: ${iconSize}px;">
                        ${bookmark.icon ? (bookmark.icon.startsWith('http') ? `<img src="${bookmark.icon}" alt="${bookmark.name}">` : bookmark.icon) : bookmark.name.charAt(0).toUpperCase()}
                    </div>
                    <span class="bookmark-name">${bookmark.name}</span>
                </a>
                <div class="bookmark-controls">
                    <button class="bookmark-control-btn edit" data-index="${index}" data-widget-id="${data.id}">✏️</button>
                    <button class="bookmark-control-btn delete" data-index="${index}" data-widget-id="${data.id}">✕</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += '<div class="bookmarks-footer">';
    html += `<button class="add-bookmark-btn" data-widget-id="${data.id}">+ Ajouter</button>`;
    html += `<button class="config-bookmark-btn" data-widget-id="${data.id}">⚙️ Config</button>`;
    html += '</div>';
    html += '</div>';

    return html;
}

function initBookmarksWidget(widget, data) {
    const addBtn = widget.querySelector('.add-bookmark-btn');
    const configBtn = widget.querySelector('.config-bookmark-btn');

    addBtn.addEventListener('click', () => {
        openBookmarkModal(data.id);
    });

    configBtn.addEventListener('click', () => {
        openBookmarkConfigModal(data.id);
    });

    widget.querySelectorAll('.bookmark-control-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            openBookmarkModal(data.id, index);
        });
    });

    widget.querySelectorAll('.bookmark-control-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Supprimer ce favori ?')) {
                const index = parseInt(btn.dataset.index);
                data.config.bookmarks.splice(index, 1);
                saveConfig();
                refreshWidget(data.id);
            }
        });
    });
}

function createWeatherWidget(data) {
    return `
        <div class="weather-location" id="weather-location-${data.id}">Chargement...</div>
        <div class="weather-main">
            <div class="weather-icon" id="weather-icon-${data.id}">🌤️</div>
            <div class="weather-temp" id="weather-temp-${data.id}">--°</div>
        </div>
        <div class="weather-description" id="weather-desc-${data.id}">--</div>
        <div class="weather-details">
            <div class="weather-detail">
                <div class="weather-detail-label">Humidité</div>
                <div class="weather-detail-value" id="weather-humidity-${data.id}">--%</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Vent</div>
                <div class="weather-detail-value" id="weather-wind-${data.id}">-- km/h</div>
            </div>
        </div>
    `;
}

function initWeatherWidget(widget, data) {
    const location = data.config.location || 'Paris';
    fetchWeather(data.id, location);
    setInterval(() => fetchWeather(data.id, location), 600000);
}

function fetchWeather(widgetId, location) {
    // Simulation
    const mockData = {
        location: location,
        temp: Math.round(Math.random() * 15 + 10),
        description: 'Partiellement nuageux',
        icon: '🌤️',
        humidity: Math.round(Math.random() * 30 + 50),
        wind: Math.round(Math.random() * 20 + 5)
    };

    const locationEl = document.getElementById(`weather-location-${widgetId}`);
    if (locationEl) {
        locationEl.textContent = mockData.location;
        document.getElementById(`weather-temp-${widgetId}`).textContent = `${mockData.temp}°C`;
        document.getElementById(`weather-desc-${widgetId}`).textContent = mockData.description;
        document.getElementById(`weather-icon-${widgetId}`).textContent = mockData.icon;
        document.getElementById(`weather-humidity-${widgetId}`).textContent = `${mockData.humidity}%`;
        document.getElementById(`weather-wind-${widgetId}`).textContent = `${mockData.wind} km/h`;
    }
}

function createClockWidget(data) {
    return `
        <div class="clock-time" id="clock-time-${data.id}">00:00:00</div>
        <div class="clock-date" id="clock-date-${data.id}">--</div>
    `;
}

function initClockWidget(widget) {
    const id = widget.dataset.id;

    function updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('fr-FR');
        const date = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const timeEl = document.getElementById(`clock-time-${id}`);
        const dateEl = document.getElementById(`clock-date-${id}`);
        if (timeEl) timeEl.textContent = time;
        if (dateEl) dateEl.textContent = date;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

function createNotesWidget(data) {
    const notes = data.config.notes || '';
    return `<textarea class="notes-textarea" data-widget-id="${data.id}" placeholder="Écrivez vos notes ici...">${notes}</textarea>`;
}

function initNotesWidget(widget, data) {
    const textarea = widget.querySelector('.notes-textarea');
    textarea.addEventListener('input', (e) => {
        data.config.notes = e.target.value;
        saveConfig();
    });
}

function createRSSWidget(data) {
    return `<div class="rss-feed" id="rss-feed-${data.id}">
        <div style="text-align: center; padding: 20px;">Chargement du flux RSS...</div>
    </div>`;
}

function initRSSWidget(widget, data) {
    const feedUrl = data.config.feedUrl || 'https://www.lemonde.fr/rss/une.xml';
    const mockItems = [
        { title: 'Article 1', description: 'Description de l\'article 1...', date: new Date() },
        { title: 'Article 2', description: 'Description de l\'article 2...', date: new Date() },
        { title: 'Article 3', description: 'Description de l\'article 3...', date: new Date() }
    ];

    let html = '';
    mockItems.forEach(item => {
        html += `
            <div class="rss-item">
                <div class="rss-item-title">${item.title}</div>
                <div class="rss-item-description">${item.description}</div>
                <div class="rss-item-date">${item.date.toLocaleDateString('fr-FR')}</div>
            </div>
        `;
    });

    const feed = document.getElementById(`rss-feed-${data.id}`);
    if (feed) feed.innerHTML = html;
}

function createIframeWidget(data) {
    const url = data.config.url || '';
    return `<iframe class="iframe-content" src="${url}" id="iframe-${data.id}"></iframe>`;
}

function createCalendarWidget(data) {
    return `
        <div class="calendar-header">
            <button class="calendar-nav-btn" data-widget-id="${data.id}" data-direction="-1">◀</button>
            <span class="calendar-month-year" id="calendar-month-${data.id}">--</span>
            <button class="calendar-nav-btn" data-widget-id="${data.id}" data-direction="1">▶</button>
        </div>
        <div class="calendar-grid" id="calendar-grid-${data.id}"></div>
    `;
}

function initCalendarWidget(widget, data) {
    if (!data.config.currentDate) {
        data.config.currentDate = new Date().toISOString();
    }

    // Attendre que le DOM soit prêt
    setTimeout(() => {
        renderCalendar(data.id);

        widget.querySelectorAll('.calendar-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const direction = parseInt(btn.dataset.direction);
                const currentDate = new Date(data.config.currentDate);
                currentDate.setMonth(currentDate.getMonth() + direction);
                data.config.currentDate = currentDate.toISOString();
                saveConfig();
                renderCalendar(data.id);
            });
        });
    }, 0);
}

function renderCalendar(widgetId) {
    const widgetData = config.widgets.find(w => w.id == widgetId);
    const date = new Date(widgetData.config.currentDate);

    const year = date.getFullYear();
    const month = date.getMonth();

    const monthEl = document.getElementById(`calendar-month-${widgetId}`);
    if (monthEl) {
        monthEl.textContent = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let html = '';
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = startDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        html += `<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
    }

    const remainingCells = 42 - (startDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month">${day}</div>`;
    }

    const gridEl = document.getElementById(`calendar-grid-${widgetId}`);
    if (gridEl) gridEl.innerHTML = html;
}

// Gestion des modals

function openColorModal(widgetId) {
    const widgetData = config.widgets.find(w => w.id === widgetId);
    currentEditingWidget = widgetId;

    const modal = document.getElementById('colorModal');
    const style = widgetData.customStyle || {
        bgColor: config.widgetColor,
        opacity: config.widgetOpacity,
        borderColor: '#ffffff',
        borderWidth: 0
    };

    document.getElementById('modalBgColor').value = style.bgColor;
    document.getElementById('modalOpacity').value = style.opacity * 100;
    document.getElementById('modalOpacityValue').textContent = style.opacity.toFixed(2);
    document.getElementById('modalBorderColor').value = style.borderColor;
    document.getElementById('modalBorderWidth').value = style.borderWidth;
    document.getElementById('modalBorderWidthValue').textContent = style.borderWidth;

    modal.classList.add('active');
}

function saveWidgetColor() {
    const widgetData = config.widgets.find(w => w.id === currentEditingWidget);

    widgetData.customStyle = {
        bgColor: document.getElementById('modalBgColor').value,
        opacity: parseFloat(document.getElementById('modalOpacity').value) / 100,
        borderColor: document.getElementById('modalBorderColor').value,
        borderWidth: parseInt(document.getElementById('modalBorderWidth').value)
    };

    saveConfig();

    const widget = document.querySelector(`[data-id="${currentEditingWidget}"]`);
    if (widget) {
        applyCustomWidgetStyle(widget, widgetData.customStyle);
    }

    document.getElementById('colorModal').classList.remove('active');
}

function openBookmarkModal(widgetId, bookmarkIndex = null) {
    const widgetData = config.widgets.find(w => w.id === widgetId);
    currentEditingWidget = widgetId;
    currentEditingBookmark = bookmarkIndex;

    const modal = document.getElementById('bookmarkModal');
    const title = document.getElementById('bookmarkModalTitle');

    if (bookmarkIndex !== null) {
        const bookmark = widgetData.config.bookmarks[bookmarkIndex];
        title.textContent = 'Modifier le favori';
        document.getElementById('bookmarkName').value = bookmark.name;
        document.getElementById('bookmarkUrl').value = bookmark.url;
        document.getElementById('bookmarkIcon').value = bookmark.icon || '';
    } else {
        title.textContent = 'Ajouter un favori';
        document.getElementById('bookmarkName').value = '';
        document.getElementById('bookmarkUrl').value = '';
        document.getElementById('bookmarkIcon').value = '';
    }

    modal.classList.add('active');
}

function saveBookmark() {
    const widgetData = config.widgets.find(w => w.id === currentEditingWidget);
    const name = document.getElementById('bookmarkName').value.trim();
    const url = document.getElementById('bookmarkUrl').value.trim();
    let icon = document.getElementById('bookmarkIcon').value.trim();

    if (!name || !url) {
        alert('Le nom et l\'URL sont obligatoires');
        return;
    }

    if (!icon) {
        icon = `https://www.google.com/s2/favicons?domain=${url}&sz=64`;
    }

    if (!widgetData.config.bookmarks) {
        widgetData.config.bookmarks = [];
    }

    const bookmark = { name, url, icon };

    if (currentEditingBookmark !== null) {
        widgetData.config.bookmarks[currentEditingBookmark] = bookmark;
    } else {
        widgetData.config.bookmarks.push(bookmark);
    }

    saveConfig();
    refreshWidget(currentEditingWidget);
    document.getElementById('bookmarkModal').classList.remove('active');
}

function openBookmarkConfigModal(widgetId) {
    const widgetData = config.widgets.find(w => w.id === widgetId);
    currentEditingWidget = widgetId;

    const iconSize = widgetData.config.iconSize || 48;
    document.getElementById('bookmarkSize').value = iconSize;
    document.getElementById('bookmarkSizeValue').textContent = iconSize;

    document.getElementById('bookmarkConfigModal').classList.add('active');
}

function saveBookmarkConfig() {
    const widgetData = config.widgets.find(w => w.id === currentEditingWidget);
    widgetData.config.iconSize = parseInt(document.getElementById('bookmarkSize').value);

    saveConfig();
    refreshWidget(currentEditingWidget);
    document.getElementById('bookmarkConfigModal').classList.remove('active');
}

function refreshWidget(widgetId) {
    const widgetData = config.widgets.find(w => w.id === widgetId);
    const widget = document.querySelector(`[data-id="${widgetId}"]`);
    if (widget && widgetData) {
        widget.remove();
        createWidget(widgetData.type, widgetData);
    }
}

// Gestion du drag & drop avec détection de collision

function checkCollision(col, row, width, height, excludeId) {
    return config.widgets.some(w => {
        if (w.id === excludeId) return false;

        const horizontalOverlap = col < w.col + w.width && col + width > w.col;
        const verticalOverlap = row < w.row + w.height && row + height > w.row;

        return horizontalOverlap && verticalOverlap;
    });
}

function startDrag(e, widget, data) {
    if (!config.editMode) return;

    draggedWidget = { widget, data };
    widget.classList.add('dragging');

    startX = e.clientX;
    startY = e.clientY;
    startCol = data.col;
    startRow = data.row;

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
}

function onDragMove(e) {
    if (!draggedWidget) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const container = document.getElementById('gridContainer');
    const containerRect = container.getBoundingClientRect();

    const cellWidth = (containerRect.width - (config.columns - 1) * config.gap) / config.columns;
    const cellHeight = (containerRect.height - (config.rows - 1) * config.gap) / config.rows;

    const colOffset = Math.round(deltaX / (cellWidth + config.gap));
    const rowOffset = Math.round(deltaY / (cellHeight + config.gap));

    let newCol = Math.max(1, Math.min(config.columns - draggedWidget.data.width + 1, startCol + colOffset));
    let newRow = Math.max(1, Math.min(config.rows - draggedWidget.data.height + 1, startRow + rowOffset));

    // Vérifier la collision
    const hasCollision = checkCollision(newCol, newRow, draggedWidget.data.width, draggedWidget.data.height, draggedWidget.data.id);

    if (hasCollision) {
        draggedWidget.widget.classList.add('occupied-position');
    } else {
        draggedWidget.widget.classList.remove('occupied-position');
    }

    draggedWidget.widget.style.gridColumn = `${newCol} / span ${draggedWidget.data.width}`;
    draggedWidget.widget.style.gridRow = `${newRow} / span ${draggedWidget.data.height}`;
}

function onDragEnd(e) {
    if (!draggedWidget) return;

    draggedWidget.widget.classList.remove('dragging');

    const container = document.getElementById('gridContainer');
    const containerRect = container.getBoundingClientRect();
    const cellWidth = (containerRect.width - (config.columns - 1) * config.gap) / config.columns;
    const cellHeight = (containerRect.height - (config.rows - 1) * config.gap) / config.rows;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const colOffset = Math.round(deltaX / (cellWidth + config.gap));
    const rowOffset = Math.round(deltaY / (cellHeight + config.gap));

    let newCol = Math.max(1, Math.min(config.columns - draggedWidget.data.width + 1, startCol + colOffset));
    let newRow = Math.max(1, Math.min(config.rows - draggedWidget.data.height + 1, startRow + rowOffset));

    // Vérifier la collision finale
    const hasCollision = checkCollision(newCol, newRow, draggedWidget.data.width, draggedWidget.data.height, draggedWidget.data.id);

    if (hasCollision) {
        // Revenir à la position d'origine
        newCol = startCol;
        newRow = startRow;
        draggedWidget.widget.style.gridColumn = `${newCol} / span ${draggedWidget.data.width}`;
        draggedWidget.widget.style.gridRow = `${newRow} / span ${draggedWidget.data.height}`;
    }

    draggedWidget.widget.classList.remove('occupied-position');
    draggedWidget.data.col = newCol;
    draggedWidget.data.row = newRow;

    saveConfig();

    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    draggedWidget = null;
}

// Gestion du redimensionnement avec détection de collision

function startResize(e, widget, data) {
    e.stopPropagation();
    resizingWidget = { widget, data };

    startX = e.clientX;
    startY = e.clientY;
    startWidth = data.width;
    startHeight = data.height;

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
}

function onResizeMove(e) {
    if (!resizingWidget) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const container = document.getElementById('gridContainer');
    const containerRect = container.getBoundingClientRect();

    const cellWidth = (containerRect.width - (config.columns - 1) * config.gap) / config.columns;
    const cellHeight = (containerRect.height - (config.rows - 1) * config.gap) / config.rows;

    const widthOffset = Math.round(deltaX / (cellWidth + config.gap));
    const heightOffset = Math.round(deltaY / (cellHeight + config.gap));

    let newWidth = Math.max(1, Math.min(config.columns - resizingWidget.data.col + 1, startWidth + widthOffset));
    let newHeight = Math.max(1, Math.min(config.rows - resizingWidget.data.row + 1, startHeight + heightOffset));

    // Vérifier la collision
    const hasCollision = checkCollision(
        resizingWidget.data.col,
        resizingWidget.data.row,
        newWidth,
        newHeight,
        resizingWidget.data.id
    );

    if (hasCollision) {
        resizingWidget.widget.classList.add('occupied-position');
    } else {
        resizingWidget.widget.classList.remove('occupied-position');
    }

    resizingWidget.widget.style.gridColumn = `${resizingWidget.data.col} / span ${newWidth}`;
    resizingWidget.widget.style.gridRow = `${resizingWidget.data.row} / span ${newHeight}`;
}

function onResizeEnd(e) {
    if (!resizingWidget) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const container = document.getElementById('gridContainer');
    const containerRect = container.getBoundingClientRect();
    const cellWidth = (containerRect.width - (config.columns - 1) * config.gap) / config.columns;
    const cellHeight = (containerRect.height - (config.rows - 1) * config.gap) / config.rows;

    const widthOffset = Math.round(deltaX / (cellWidth + config.gap));
    const heightOffset = Math.round(deltaY / (cellHeight + config.gap));

    let newWidth = Math.max(1, Math.min(config.columns - resizingWidget.data.col + 1, startWidth + widthOffset));
    let newHeight = Math.max(1, Math.min(config.rows - resizingWidget.data.row + 1, startHeight + heightOffset));

    // Vérifier la collision finale
    const hasCollision = checkCollision(
        resizingWidget.data.col,
        resizingWidget.data.row,
        newWidth,
        newHeight,
        resizingWidget.data.id
    );

    if (hasCollision) {
        // Revenir à la taille d'origine
        newWidth = startWidth;
        newHeight = startHeight;
        resizingWidget.widget.style.gridColumn = `${resizingWidget.data.col} / span ${newWidth}`;
        resizingWidget.widget.style.gridRow = `${resizingWidget.data.row} / span ${newHeight}`;
    }

    resizingWidget.widget.classList.remove('occupied-position');
    resizingWidget.data.width = newWidth;
    resizingWidget.data.height = newHeight;

    // Si c'est un widget favoris, on le rafraîchit pour ajuster la grille
    if (resizingWidget.data.type === 'bookmarks') {
        refreshWidget(resizingWidget.data.id);
    }

    saveConfig();

    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    resizingWidget = null;
}

// Suppression de widgets

function deleteWidget(widgetId) {
    if (!confirm('Supprimer ce widget ?')) return;

    const widget = document.querySelector(`[data-id="${widgetId}"]`);
    if (widget) widget.remove();

    config.widgets = config.widgets.filter(w => w.id !== widgetId);
    saveConfig();
}

// Export/Import de configuration

function exportConfig() {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'home-page-config.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importConfig(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedConfig = JSON.parse(event.target.result);
            if (confirm('Importer cette configuration ? Cela écrasera la configuration actuelle.')) {
                Object.assign(config, importedConfig);
                saveConfig();
                location.reload();
            }
        } catch (error) {
            alert('Erreur lors de l\'import du fichier.');
        }
    };
    reader.readAsText(file);
}
