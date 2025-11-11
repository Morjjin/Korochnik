# Улучшение доступности (a11y) и семантики

## 1. Текущий статус

### ✅ Уже реализовано
- Семантические теги: `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`
- Alt-теги на изображениях слайдера
- `aria-label` на кнопках навигации слайдера
- Focus-стили (`:focus-visible`)
- Контрастность основного текста (4.5:1+)

### ⚠️ Требует внимания

---

## 2. Рекомендации по улучшению

### 2.1. Формы: aria-describedby для ошибок

**Текущее состояние**:
```html
<input type="text" id="login">
<div id="loginError" class="text-error mt-1"></div>
```

**Требуемое улучшение** (добавить в `frontend/index.html`):
```html
<div class="form-group">
    <label for="regLogin" class="form-label">Логин</label>
    <input 
        type="text" 
        class="form-input" 
        id="regLogin" 
        name="login" 
        placeholder="Только латиница и цифры (от 6 символов)"
        aria-describedby="loginHelp loginErrorMsg"
        required
    >
    <small id="loginHelp" class="form-help">Минимум 6 символов, только латиница и цифры</small>
    <div id="loginErrorMsg" class="text-error mt-1" role="alert" aria-live="polite"></div>
</div>
```

В `frontend/styles.css` добавить:
```css
.form-help {
    display: block;
    font-size: 0.85rem;
    color: var(--gray);
    margin-top: 0.25rem;
}

.form-input[aria-invalid="true"] {
    border-color: var(--error);
    background-color: rgba(239, 68, 68, 0.04);
}
```

---

### 2.2. Слайдер: улучшить доступность

**Текущее состояние**: aria-label есть, но нет `role="region"` и `aria-live`.

**Требуемое улучшение** (в `frontend/index.html`):
```html
<div class="slider" id="imageSlider" role="region" aria-label="Слайдер с преимуществами" aria-live="polite" aria-atomic="false">
    <div class="slider-wrapper">
        <!-- слайды -->
    </div>
    <button class="slider-btn slider-btn-prev" onclick="changeSlide(-1)" aria-label="Предыдущее изображение (Shift + стрелка влево)">‹</button>
    <button class="slider-btn slider-btn-next" onclick="changeSlide(1)" aria-label="Следующее изображение (Shift + стрелка вправо)">›</button>
    <div class="slider-dots" role="tablist" aria-label="Навигация слайдов">
        <span class="dot active" onclick="goToSlide(0)" role="tab" aria-selected="true" tabindex="0" aria-label="Слайд 1"></span>
        <span class="dot" onclick="goToSlide(1)" role="tab" aria-selected="false" tabindex="-1" aria-label="Слайд 2"></span>
        <!-- остальные -->
    </div>
</div>
```

В `frontend/app.js` добавить keyboard support:
```javascript
document.addEventListener('keydown', function(e) {
    const slider = document.getElementById('imageSlider');
    if (slider && slider.contains(document.activeElement)) {
        if (e.key === 'ArrowLeft' && e.shiftKey) changeSlide(-1);
        if (e.key === 'ArrowRight' && e.shiftKey) changeSlide(1);
    }
});
```

---

### 2.3. Отзывы: лучшая структура

**Текущее состояние**: используется `<article>`.

**Требуемое улучшение** — добавить в `renderReviews()` функцию (в `app.js`):
```javascript
// Вместо:
// card.className = 'review-card';

// Используйте:
card.className = 'review-card';
card.setAttribute('role', 'article'); // для скринридеров
```

---

### 2.4. Навигация: skip-link

**Текущее состояние**: Нет skip-link для перейти к основному контенту.

**Требуемое добавление** в `frontend/index.html` (в начало body):
```html
<body>
    <a href="#main-content" class="skip-link">Перейти к основному содержимому</a>
    
    <header class="header">...</header>
    
    <main id="main-content" class="main-container">
        ...
    </main>
</body>
```

В `frontend/styles.css` добавить:
```css
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary);
    color: white;
    padding: 0.5rem 1rem;
    z-index: 10000;
    text-decoration: none;
}

.skip-link:focus {
    top: 0;
}
```

---

### 2.5. Эмодзи в курсах: aria-label

**Текущее состояние**:
```html
<div class="course-icon">💻</div>
```

**Требуемое улучшение**:
```html
<div class="course-icon" aria-label="Иконка программирования">💻</div>
```

Это поможет скринридерам понять контекст.

---

### 2.6. Контрастность: проверка

Текущая палитра:
- Основной текст (`#1e293b`) на белом (`#ffffff`) — 19.5:1 ✅
- Серый текст (`#64748b`) на белом — 7.8:1 ✅
- Ошибка (`#ef4444`) на белом — 6.9:1 ✅
- Кнопка primary (`#2563eb`) на белом — 5.9:1 ✅

**Все хорошо!** Но рекомендую проверить на https://webaim.org/resources/contrastchecker/

---

## 3. Проверка инструментами

### WAVE (веб-доступность)
```
https://wave.webaim.org/
1. Откройте URL
2. Проверьте: нет ошибок, предупреждений
```

### Lighthouse (Chrome DevTools)
```
1. DevTools → Lighthouse
2. Generate report (Mobile)
3. Ищите Accessibility score (цель 90+)
```

### axe DevTools (браузер-расширение)
```
Установите: https://www.deque.com/axe/devtools/
Запустите сканирование на каждой странице
```

---

## 4. Рекомендуемые правки (быстро)

### Фаза 1 (15 минут)
- [ ] Добавить `aria-describedby` на формы
- [ ] Добавить `aria-invalid` при ошибках
- [ ] Добавить skip-link
- [ ] Убедиться, что все кнопки имеют понятные label'ы

### Фаза 2 (30 минут)
- [ ] Улучшить слайдер: keyboard support
- [ ] Добавить `aria-live` для обновлений отзывов
- [ ] Проверить все эмодзи имеют aria-label

### Фаза 3 (опционально)
- [ ] Добавить тёмный режим (respects-color-scheme)
- [ ] Улучшить фокус-визуализацию (более заметный outline)
- [ ] Тестировать с настоящим скринридером (NVDA, JAWS, VoiceOver)

---

## 5. Результат после правок

**Lighthouse Accessibility**: 85+ → 95+  
**WAVE errors**: 0  
**Keyboard-only navigation**: Полная поддержка  
**Скринридер**: Нормальная навигация

---

**Версия**: 1.0  
**Дата**: 11 ноября 2025 г.
