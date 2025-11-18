// app.js - обновленная версия с улучшенной обработкой ошибок

// ============================================
// НАСТРОЙКА ПУТИ К API
// ============================================
// Измените этот путь под ваш сервер!
// 
// Примеры:
// - XAMPP в htdocs: 'http://localhost/korochnik/backend/api'
// - В корне htdocs: 'http://localhost/backend/api'
// - Виртуальный хост: 'http://korochnik.local/backend/api'
// - Другой порт: 'http://localhost:8080/korochnik/backend/api'
//
// Автоматическое определение (раскомментируйте, если нужно):
// const getBasePath = () => {
//     const protocol = window.location.protocol;
//     const host = window.location.host;
//     const pathname = window.location.pathname;
//     const basePath = pathname.split('/frontend')[0];
//     return `${protocol}//${host}${basePath}/backend/api`;
// };
// const API_BASE = getBasePath();

const API_BASE = 'http://localhost/korochnik/backend/api';

// Глобальные переменные
let currentUser = null;

// Улучшенная функция для выполнения fetch запросов
async function apiFetch(endpoint, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const config = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, config);
        
        console.log(`apiFetch: ${endpoint} - статус ${response.status}, ok=${response.ok}`); // Отладка
        
        // Проверяем, есть ли содержимое в ответе
        const contentType = response.headers.get('content-type');
        let data = null;
        
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
                console.log(`apiFetch: ${endpoint} - ответ`, data); // Отладка
            } catch (jsonError) {
                console.error('Ошибка парсинга JSON:', jsonError);
                throw new Error('Неверный формат ответа от сервера');
            }
        } else {
            const text = await response.text();
            if (text) {
                throw new Error(`Сервер вернул не JSON: ${text.substring(0, 100)}`);
            }
        }
        
        if (!response.ok) {
            const errorMessage = data?.error || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('API Error:', error);
        return { 
            success: false, 
            error: error.message || 'Ошибка соединения с сервером' 
        };
    }
}

// Навигация между формами
function showLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('authModalTitle');
    
    if (loginForm) loginForm.classList.add('active');
    if (registerForm) registerForm.classList.remove('active');
    if (modalTitle) modalTitle.textContent = 'Вход в систему';
    clearMessages();
}

function showRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('authModalTitle');
    
    if (loginForm) loginForm.classList.remove('active');
    if (registerForm) registerForm.classList.add('active');
    if (modalTitle) modalTitle.textContent = 'Регистрация';
    clearMessages();
}

// Показать модальное окно авторизации
function showAuthModal(showRegisterForm = false) {
    const modal = document.getElementById('authModal');
    if (modal) {
        if (showRegisterForm) {
            showRegister();
        } else {
            showLogin(); // Показываем форму входа по умолчанию
        }
        modal.classList.add('active');
        // Фокус на первое поле
        setTimeout(() => {
            const loginInput = document.getElementById('login');
            const regLoginInput = document.getElementById('regLogin');
            const inputToFocus = showRegisterForm && regLoginInput ? regLoginInput : loginInput;
            if (inputToFocus) inputToFocus.focus();
        }, 100);
    }
}

// Скрыть модальное окно авторизации
function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
        clearMessages();
    }
}

function clearMessages() {
    const messages = document.querySelectorAll('.error, .success');
    messages.forEach(el => {
        el.textContent = '';
    });
}

// Валидация форм
function validateLogin(login) {
    const regex = /^[a-zA-Z0-9]{6,}$/;
    return regex.test(login);
}

function validatePassword(password) {
    return password.length >= 8;
}

function validateFullName(name) {
    const regex = /^[а-яА-ЯёЁ\s]+$/u;
    return regex.test(name);
}

function validatePhone(phone) {
    const regex = /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
    return regex.test(phone);
}

function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

// Форматирование телефона
function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 0) {
        value = value.replace(/^(\d{1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/, (match, p1, p2, p3, p4, p5) => {
            let result = '8';
            if (p2) result += '(' + p2;
            if (p3) result += ')' + p3;
            if (p4) result += '-' + p4;
            if (p5) result += '-' + p5;
            return result;
        });
    }
    input.value = value;
}

// Обработчики форм
document.addEventListener('DOMContentLoaded', function() {
    // Форматирование телефона в реальном времени
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhone(this);
        });
    }

    // Обработчик формы входа
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Обработчик формы регистрации
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Проверка авторизации при загрузке страниц
    checkAuth();
});

// Обработчик входа
async function handleLogin(e) {
    e.preventDefault();
    
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    
    // Получаем текущую страницу для редиректа
    const currentPage = window.location.pathname.split('/').pop();
    const redirectTo = currentPage === 'courses.html' ? 'courses' : '';
    
    const formData = {
        login: login,
        password: password,
        action: 'login',
        redirect_to: redirectTo
    };
    
    console.log('handleLogin: отправляю запрос', formData);
    
    const result = await apiFetch('auth.php', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
    
    console.log('handleLogin: ответ сервера', result);
    
    if (result.success) {
        // Сохраняем данные пользователя
        localStorage.setItem('userToken', 'authenticated');
        localStorage.setItem('userName', result.data.full_name || login);
        localStorage.setItem('isAdmin', result.data.is_admin ? 'true' : 'false');
        if (result.data.avatar) {
            localStorage.setItem('userAvatar', result.data.avatar);
        } else {
            localStorage.removeItem('userAvatar');
        }
        
        console.log('handleLogin: данные сохранены в localStorage');
        
        // Закрываем модальное окно
        hideAuthModal();
        
        // Обрабатываем редирект
        if (result.data.redirect_to === 'courses') {
            // Если мы уже на странице курсов - просто обновляем интерфейс
            if (currentPage === 'courses.html') {
                window.location.reload();
            } else {
                window.location.href = 'courses.html';
            }
            return;
        }
        
        // Стандартная логика редиректа
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'index.html' || currentPage === '') {
            checkAuth();
            return;
        }
        
        if (result.data.is_admin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } else {
        showError('password', result.error);
    }
}

// Обработчик регистрации
async function handleRegister(e) {
    e.preventDefault();
    
    // Валидация формы регистрации (новая система)
    if (!validateFormFields(true)) {
        console.log('Форма регистрации невалидна');
        return;
    }
    
    const formData = {
        login: document.getElementById('regLogin').value,
        password: document.getElementById('regPassword').value,
        full_name: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('regEmail').value,
        action: 'register'
    };
    
    // Проверка телефона остаётся для дополнительной безопасности
    if (formData.phone && !validatePhone(formData.phone)) {
        showError('phoneErrorMsg', 'Телефон должен быть в формате 8(XXX)XXX-XX-XX');
        return;
    }
    
    const result = await apiFetch('auth.php', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
    
    if (result.success) {
        showSuccess('registerSuccess', 'Регистрация прошла успешно! Выполняется вход...');
        // Автоматически входим после регистрации
        setTimeout(async () => {
            const loginFormData = {
                login: formData.login,
                password: formData.password,
                action: 'login'
            };
            
            const loginResult = await apiFetch('auth.php', {
                method: 'POST',
                body: JSON.stringify(loginFormData)
            });
            
            if (loginResult.success) {
                // Сохраняем данные пользователя
                localStorage.setItem('userToken', 'authenticated');
                localStorage.setItem('userName', loginResult.data.full_name || formData.login);
                localStorage.setItem('isAdmin', loginResult.data.is_admin ? 'true' : 'false');
                if (loginResult.data.avatar) {
                    localStorage.setItem('userAvatar', loginResult.data.avatar);
                } else {
                    localStorage.removeItem('userAvatar');
                }
                
                // Закрываем модальное окно
                hideAuthModal();
                
                // Если на главной странице - обновляем интерфейс
                const currentPage = window.location.pathname.split('/').pop();
                if (currentPage === 'index.html') {
                    checkAuth();
                    return;
                }
                
                // Иначе перенаправляем
                if (loginResult.data.is_admin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                showError('registerError', 'Регистрация прошла успешно, но не удалось войти. Пожалуйста, войдите вручную.');
                showLogin();
            }
        }, 1000);
    } else {
        showError('regPasswordError', result.error);
    }
}

// Выход из системы
async function logout() {
    try {
        await apiFetch('auth.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'logout' })
        });
    } catch (error) {
        console.error('Ошибка при выходе:', error);
    } finally {
        // Очищаем localStorage
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userAvatar');
        
        // Если на главной странице - обновляем интерфейс без перезагрузки
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'index.html' || currentPage === '') {
            // Очищаем интерфейс шапки
            const authButton = document.getElementById('authButton');
            const headerUserInfo = document.getElementById('headerUserInfo');
            const startLearningBtn = document.getElementById('startLearningBtn');
            
            if (authButton) authButton.style.display = 'block';
            if (headerUserInfo) headerUserInfo.style.display = 'none';
            
            // Восстанавливаем кнопку "Записаться"
            if (startLearningBtn) {
                startLearningBtn.textContent = 'Записаться';
                startLearningBtn.onclick = function() {
                    showAuthModal();
                };
            }
            
            // Закрываем модальное окно если оно открыто
            hideAuthModal();
            
            return;
        }
        
        window.location.href = 'index.html';
    }
}

// Проверка авторизации
function checkAuth() {
    const userToken = localStorage.getItem('userToken');
    const currentPage = window.location.pathname.split('/').pop();
    
    // Страницы, требующие авторизации
    const protectedPages = ['dashboard.html', 'admin.html', 'application.html'];
    
    if (protectedPages.includes(currentPage) && !userToken) {
        window.location.href = 'index.html';
        return;
    }
    
    // Если на главной странице и пользователь авторизован - показываем информацию пользователя
    if (currentPage === 'index.html' && userToken) {
        const authButton = document.getElementById('authButton');
        const headerUserInfo = document.getElementById('headerUserInfo');
        const userName = localStorage.getItem('userName');
        const userAvatar = localStorage.getItem('userAvatar');
        
        if (authButton) {
            authButton.style.display = 'none';
        }
        
        if (headerUserInfo && userName) {
            headerUserInfo.style.display = 'flex';
            const userNameEl = document.getElementById('userNameIndex');
            if (userNameEl) userNameEl.textContent = userName;
            
            // Обновляем аватар
            const headerAvatar = document.getElementById('headerAvatarIndex');
            const headerAvatarPlaceholder = document.querySelector('#headerUserInfo .header-avatar-placeholder');
            const headerAvatarInitial = document.getElementById('headerAvatarInitialIndex');
            
            if (userAvatar) {
                if (headerAvatar) {
                    const avatarPath = userAvatar.startsWith('http') ? userAvatar : 
                                      `${API_BASE.replace('/api', '')}/${userAvatar}`;
                    headerAvatar.src = avatarPath;
                    headerAvatar.style.display = 'block';
                }
                if (headerAvatarPlaceholder) {
                    headerAvatarPlaceholder.style.display = 'none';
                }
            } else {
                if (headerAvatar) {
                    headerAvatar.style.display = 'none';
                }
                if (headerAvatarPlaceholder && headerAvatarInitial) {
                    const initial = userName ? userName.charAt(0).toUpperCase() : 'П';
                    headerAvatarInitial.textContent = initial;
                    headerAvatarPlaceholder.style.display = 'flex';
                }
            }
        }
        
        // Обновляем кнопку "Начать обучение"
        const startLearningBtn = document.getElementById('startLearningBtn');
        if (startLearningBtn) {
            startLearningBtn.textContent = 'Перейти в личный кабинет';
            // НЕ переопределяем onclick, используем обработчик события вместо инлайн-атрибута
        }
        
        return;
    }
    
    // Обновляем имя пользователя на страницах
    const userName = localStorage.getItem('userName');
    if (userName) {
        const userNameElements = document.querySelectorAll('#userName');
        userNameElements.forEach(element => {
            element.textContent = userName;
        });
    }
    
    // Обновляем аватар в шапке (если есть) для страниц dashboard и admin
    const userAvatar = localStorage.getItem('userAvatar');
    if (userAvatar) {
        const headerAvatar = document.getElementById('headerAvatar');
        const headerAvatarPlaceholder = document.querySelector('.header-avatar-placeholder');
        if (headerAvatar) {
            const avatarPath = userAvatar.startsWith('http') ? userAvatar : 
                              `${API_BASE.replace('/api', '')}/${userAvatar}`;
            headerAvatar.src = avatarPath;
            headerAvatar.style.display = 'block';
        }
        if (headerAvatarPlaceholder) {
            headerAvatarPlaceholder.style.display = 'none';
        }
    }
}

// Обработка кнопки "Начать обучение"
function handleStartLearning() {
    console.log('handleStartLearning вызвана');
    const userToken = localStorage.getItem('userToken');
    console.log('userToken:', userToken);
    
    if (userToken) {
        // Если пользователь авторизован - переходим в личный кабинет
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        console.log('isAdmin:', isAdmin);
        const redirectUrl = isAdmin ? 'admin.html' : 'dashboard.html';
        console.log('Перенаправляю на:', redirectUrl);
        window.location.href = redirectUrl;
    } else {
        // Если не авторизован - показываем форму регистрации
        console.log('Пользователь не авторизован, открываю модалку');
        showAuthModal(false); // false = показать форму входа, можно переключиться на регистрацию
    }
}

// Вспомогательные функции для сообщений
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = 'error';
    }
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = 'success';
    }
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
    }
}

// Функция для загрузки курсов (используется в форме заявки)
async function loadCourses() {
    const result = await apiFetch('courses.php');
    
    if (result.success) {
        return result.data;
    } else {
        console.error('Ошибка загрузки курсов:', result.error);
        return [];
    }
}

// Функция для заполнения select курсами
async function populateCourseSelect(selectElementId) {
    const courses = await loadCourses();
    const selectElement = document.getElementById(selectElementId);
    
    if (selectElement && courses.length > 0) {
        // Очищаем существующие options, кроме первого
        selectElement.innerHTML = '<option value="">Выберите курс</option>';
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.name;
            option.textContent = `${course.name} (${course.price ? course.price + ' руб.' : 'цена не указана'})`;
            selectElement.appendChild(option);
        });
    } else if (selectElement) {
        selectElement.innerHTML = '<option value="">Курсы не найдены</option>';
    }
}

// Функция для экранирования HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ================== ВАЛИДАЦИЯ В РЕАЛЬНОМ ВРЕМЕНИ ==================

// Правила валидации
const validationRules = {
    login: {
        pattern: /^[a-zA-Z0-9_-]{6,20}$/,
        message: 'Логин: 6-20 символов, латиница и цифры',
        minLength: 6
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Введите корректный email',
        type: 'email'
    },
    password: {
        minLength: 8,
        requirements: {
            length: { pattern: /.{8,}/, label: 'Минимум 8 символов' }
        },
        message: 'Пароль должен быть минимум 8 символов'
    },
    fio: {
        pattern: /^[а-яА-ЯёЁ\s-]{2,}$/,
        message: 'ФИО: только кириллица, пробелы и дефисы',
        minLength: 2
    }
};

// Функция валидации одного поля
function validateField(fieldName, value) {
    const rules = validationRules[fieldName];
    if (!rules) return { isValid: true };
    
    // Проверка пустого поля
    if (!value || value.trim() === '') {
        return { 
            isValid: false, 
            message: 'Поле обязательно',
            type: 'error'
        };
    }
    
    // Специальная логика для пароля
    if (fieldName === 'password') {
        const failedRequirements = [];
        
        Object.entries(rules.requirements).forEach(([key, rule]) => {
            if (!rule.pattern.test(value)) {
                failedRequirements.push(rule.label);
            }
        });
        
        if (failedRequirements.length > 0) {
            return {
                isValid: false,
                message: rules.message,
                type: 'error',
                requirements: failedRequirements,
                allRequirements: rules.requirements
            };
        }
        
        return { 
            isValid: true, 
            type: 'success',
            message: 'Пароль надёжный ✓'
        };
    }
    
    // Стандартная валидация по pattern
    if (rules.pattern && !rules.pattern.test(value)) {
        return {
            isValid: false,
            message: rules.message,
            type: 'error'
        };
    }
    
    return { 
        isValid: true, 
        type: 'success',
        message: 'OK ✓'
    };
}

// Функция отображения ошибки/успеха
function showFieldStatus(inputId, validation) {
    const field = document.getElementById(inputId);
    if (!field) return;
    
    const errorDiv = document.getElementById(`${inputId}Error`);
    if (!errorDiv) return;
    
    // Очистить классы
    field.classList.remove('input-valid', 'input-error');
    errorDiv.innerHTML = '';
    
    if (validation.isValid) {
        field.classList.add('input-valid');
        field.setAttribute('aria-invalid', 'false');
        
        if (validation.message) {
            errorDiv.innerHTML = `<span class="text-success">${validation.message}</span>`;
        }
    } else {
        field.classList.add('input-error');
        field.setAttribute('aria-invalid', 'true');
        
        let html = `<span class="text-error">${validation.message}</span>`;
        
        // Для пароля: показать требования
        if (inputId === 'regPassword' && validation.requirements && validation.allRequirements) {
            html += '<div class="password-requirements">';
            
            Object.entries(validation.allRequirements).forEach(([key, req]) => {
                const isMet = req.pattern.test(field.value);
                const icon = isMet ? '✓' : '✗';
                const className = isMet ? 'requirement-met' : 'requirement-not-met';
                html += `<div class="${className}"><span>${icon}</span> ${req.label}</div>`;
            });
            
            html += '</div>';
        }
        
        errorDiv.innerHTML = html;
    }
}

// Привязать валидацию к полям в реальном времени
function setupRealtimeValidation() {
    const validationFields = [
        { id: 'regLogin', fieldName: 'login' },
        { id: 'regEmail', fieldName: 'email' },
        { id: 'regPassword', fieldName: 'password' },
        { id: 'fullName', fieldName: 'fio' },
        { id: 'email', fieldName: 'email' },
        { id: 'login', fieldName: 'login' },
        { id: 'password', fieldName: 'password' }
    ];
    
    validationFields.forEach(({ id, fieldName }) => {
        const field = document.getElementById(id);
        if (!field) return;
        
        // Валидация при вводе
        field.addEventListener('input', function() {
            const validation = validateField(fieldName, this.value);
            showFieldStatus(id, validation);
        });
        
        // Валидация при blur (потеря фокуса)
        field.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                const validation = validateField(fieldName, this.value);
                showFieldStatus(id, validation);
            }
        });
    });
}

// Улучшенная валидация формы перед отправкой
function validateFormFields(isRegister = false) {
    const fieldMapping = isRegister 
        ? { regLogin: 'login', regEmail: 'email', regPassword: 'password', fullName: 'fio' }
        : { login: 'login', password: 'password' };
    
    let isValid = true;
    
    Object.entries(fieldMapping).forEach(([inputId, fieldName]) => {
        const field = document.getElementById(inputId);
        if (!field) return;
        
        const validation = validateField(fieldName, field.value);
        showFieldStatus(inputId, validation);
        
        if (!validation.isValid) isValid = false;
    });
    
    return isValid;
}

// Image Slider functionality
let currentSlide = 0;
let slideInterval;

function initSlider() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    // Автоматическая смена слайдов каждые 3 секунды
    slideInterval = setInterval(() => {
        changeSlide(1);
    }, 3000);
    
    // Остановка при наведении
    const slider = document.getElementById('imageSlider');
    if (slider) {
        slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
        slider.addEventListener('mouseleave', () => {
            slideInterval = setInterval(() => changeSlide(1), 3000);
        });
        // Make slider focusable for keyboard navigation
        slider.setAttribute('tabindex', '0');
        slider.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); changeSlide(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); changeSlide(1); }
        });
    }
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
  
    const nextSlideIdx = (currentSlide + direction + slides.length) % slides.length;
  
    // Определяем направление анимации
    const outClass = direction === 1 ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 1 ? 'slide-in-right' : 'slide-in-left';
  
    // Удаляем предыдущие анимационные классы у всех слайдов
    slides.forEach(slide =>
      slide.classList.remove('slide-in-right','slide-out-left','slide-in-left','slide-out-right','active')
    );
  
    // Анимируем текущий слайд
    slides[currentSlide].classList.add(outClass);
  
    // Анимируем следующий слайд
    slides[nextSlideIdx].classList.add(inClass, 'active');
    if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
    if (dots[nextSlideIdx]) dots[nextSlideIdx].classList.add('active');
    // update aria-current on dots for screen readers
    if (dots && dots.length) {
        dots.forEach((d, i) => {
            if (i === nextSlideIdx) {
                d.setAttribute('aria-current', 'true');
            } else {
                d.removeAttribute('aria-current');
            }
        });
    }
  
    // Обновляем индекс текущего слайда после анимации (700ms - длительность CSS анимации)
    setTimeout(() => {
      slides[currentSlide].classList.remove('active', outClass);
      slides[nextSlideIdx].classList.remove(inClass);
      slides[nextSlideIdx].classList.add('active');
      currentSlide = nextSlideIdx;
    }, 700);
  
    clearInterval(slideInterval);
    slideInterval = setInterval(() => changeSlide(1), 3000);
  }

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (index < 0 || index >= slides.length || index === currentSlide) return;
    
    // Плавное удаление активного класса
    slides[currentSlide].classList.remove('active');
    if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    
    // Плавное добавление активного класса
    setTimeout(() => {
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
        // aria-current для доступности
        if (dots && dots.length) {
            dots.forEach((d, i) => {
                if (i === currentSlide) d.setAttribute('aria-current', 'true');
                else d.removeAttribute('aria-current');
            });
        }
    }, 50);
    
    // Сброс интервала
    clearInterval(slideInterval);
    slideInterval = setInterval(() => changeSlide(1), 3000);
}

// Инициализация слайдера при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализировать real-time валидацию форм
    setupRealtimeValidation();
    
    if (document.getElementById('imageSlider')) {
        initSlider();
    }
    
    // Закрытие модального окна по клику на фон
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                hideAuthModal();
            }
        });
    }
    
    // Закрытие модального окна по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const authModal = document.getElementById('authModal');
            if (authModal && authModal.classList.contains('active')) {
                hideAuthModal();
            }
        }
    });

    // Инициализация отзывов: сначала рендер из кеша или загрузка, фоновой апдейт кеша каждые 5 минут
    if (document.getElementById('reviewsList')) {
        const REVIEWS_LIMIT = 5;
        initReviews(REVIEWS_LIMIT);
        // Фоновое обновление кеша каждые 5 минут (300000 ms)
        setInterval(() => backgroundUpdateReviews(REVIEWS_LIMIT), 300000);
    }
});

// --- Reviews: cache + rendering (reviews change only on page reload; cache updates in background) ---
const REVIEWS_CACHE_KEY = 'reviews_cache_v1';
const REVIEWS_CACHE_TS = 'reviews_cache_ts_v1';
const REVIEWS_CACHE_TTL = 300000; // 5 минут

async function initReviews(limit = 5) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    // Показать спиннер
    container.innerHTML = '<div class="loading-state">Загрузка отзывов...</div>';

    try {
        const cached = getCachedReviews();
        const now = Date.now();
        if (cached && (now - cached.ts) < REVIEWS_CACHE_TTL) {
            renderReviews(cached.data);
            // Запуск фоновой загрузки (обновит кеш, но не DOM)
            backgroundUpdateReviews(limit);
            return;
        }

        // Нет актуального кеша — загрузим с сервера и отобразим
        const result = await apiFetch(`reviews.php?limit=${limit}`);
        if (result.success) {
            const reviews = result.data || [];
            renderReviews(reviews);
            saveReviewsToCache(reviews);
        } else {
            container.innerHTML = `<div class="error-state">Не удалось загрузить отзывы. Попробуйте позже.</div>`;
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="error-state">Ошибка загрузки отзывов</div>`;
    }
}

function getCachedReviews() {
    try {
        const raw = localStorage.getItem(REVIEWS_CACHE_KEY);
        const ts = localStorage.getItem(REVIEWS_CACHE_TS);
        if (!raw || !ts) return null;
        return { data: JSON.parse(raw), ts: parseInt(ts, 10) };
    } catch (e) {
        return null;
    }
}

function saveReviewsToCache(reviews) {
    try {
        localStorage.setItem(REVIEWS_CACHE_KEY, JSON.stringify(reviews));
        localStorage.setItem(REVIEWS_CACHE_TS, String(Date.now()));
    } catch (e) {
        console.warn('Не удалось сохранить кеш отзывов', e);
    }
}

async function backgroundUpdateReviews(limit = 5) {
    try {
        const result = await apiFetch(`reviews.php?limit=${limit}`);
        if (result.success) {
            saveReviewsToCache(result.data || []);
        }
    } catch (e) {
        // молча логируем
        console.warn('backgroundUpdateReviews error', e);
    }
}

function renderReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (!reviews || reviews.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>Пока нет отзывов</h3><p>Станьте первым, кто оставит отзыв о курсе.</p></div>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    reviews.forEach(r => {
        const card = document.createElement('article');
        card.className = 'review-card';

        const top = document.createElement('div');
        top.className = 'review-top';

        const avatarWrap = document.createElement('div');
        avatarWrap.className = 'review-avatar-wrap';
        const avatarImg = document.createElement('img');
        avatarImg.className = 'review-avatar';
        if (r.avatar) {
            avatarImg.src = r.avatar.startsWith('http') ? r.avatar : `${API_BASE.replace('/api', '')}/${r.avatar}`;
        } else {
            avatarImg.src = '';
            avatarImg.alt = '';
        }
        avatarImg.loading = 'lazy';
        avatarImg.onerror = function() { this.style.display = 'none'; };

        const avatarPlaceholder = document.createElement('div');
        avatarPlaceholder.className = 'review-avatar-placeholder';
        avatarPlaceholder.textContent = (r.user_name || 'Пользователь').charAt(0).toUpperCase();

        avatarWrap.appendChild(avatarImg);
        avatarWrap.appendChild(avatarPlaceholder);

        const meta = document.createElement('div');
        meta.className = 'review-meta';
        const name = document.createElement('div');
        name.className = 'review-name';
        name.textContent = r.user_name || 'Пользователь';
        const time = document.createElement('div');
        time.className = 'review-time';
        time.textContent = r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : '';

        meta.appendChild(name);
        meta.appendChild(time);

        top.appendChild(avatarWrap);
        top.appendChild(meta);

        const body = document.createElement('blockquote');
        body.className = 'review-body';
        body.innerHTML = escapeHtml(r.feedback || '');

        card.appendChild(top);
        card.appendChild(body);

        fragment.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

// Функция для экранирования HTML (если еще нет)
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Функции для работы с модальными окнами (если еще нет)
function showAuthModal(showRegisterForm = false) {
    const modal = document.getElementById('authModal');
    if (modal) {
        if (showRegisterForm) {
            showRegister();
        } else {
            showLogin();
        }
        modal.classList.add('active');
    }
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('authModalTitle');
    
    if (loginForm) loginForm.classList.add('active');
    if (registerForm) registerForm.classList.remove('active');
    if (modalTitle) modalTitle.textContent = 'Вход в систему';
}

function showRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('authModalTitle');
    
    if (loginForm) loginForm.classList.remove('active');
    if (registerForm) registerForm.classList.add('active');
    if (modalTitle) modalTitle.textContent = 'Регистрация';
}
async function handleRegisterWithRedirect(e) {
    e.preventDefault();
    
    // Валидация формы регистрации
    if (!validateFormFields(true)) {
        console.log('Форма регистрации невалидна');
        return;
    }
    
    const formData = {
        login: document.getElementById('regLogin').value,
        password: document.getElementById('regPassword').value,
        full_name: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('regEmail').value,
        action: 'register',
        redirect_to: 'courses' // Всегда редиректим на курсы после регистрации
    };
    
    // Проверка телефона
    if (formData.phone && !validatePhone(formData.phone)) {
        showError('phoneErrorMsg', 'Телефон должен быть в формате 8(XXX)XXX-XX-XX');
        return;
    }
    
    const result = await apiFetch('auth.php', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
    
    if (result.success) {
        showSuccess('registerSuccess', 'Регистрация прошла успешно! Выполняется вход...');
        
        // Автоматически входим после регистрации
        setTimeout(async () => {
            const loginFormData = {
                login: formData.login,
                password: formData.password,
                action: 'login',
                redirect_to: 'courses'
            };
            
            const loginResult = await apiFetch('auth.php', {
                method: 'POST',
                body: JSON.stringify(loginFormData)
            });
            
            if (loginResult.success) {
                // Сохраняем данные пользователя
                localStorage.setItem('userToken', 'authenticated');
                localStorage.setItem('userName', loginResult.data.full_name || formData.login);
                localStorage.setItem('isAdmin', loginResult.data.is_admin ? 'true' : 'false');
                if (loginResult.data.avatar) {
                    localStorage.setItem('userAvatar', loginResult.data.avatar);
                } else {
                    localStorage.removeItem('userAvatar');
                }
                
                // Закрываем модальное окно
                hideAuthModal();
                
                // Перенаправляем на страницу курсов
                window.location.href = 'courses.html';
            } else {
                showError('registerError', 'Регистрация прошла успешно, но не удалось войти. Пожалуйста, войдите вручную.');
                showLogin();
            }
        }, 1000);
    } else {
        showError('regPasswordError', result.error);
    }
}
// Загрузка популярных курсов
async function loadPopularCourses() {
    try {
        const result = await apiFetch('popular_courses.php');
        
        if (result.success) {
            displayPopularCourses(result.data);
        } else {
            showPopularCoursesError();
        }
    } catch (error) {
        console.error('Ошибка загрузки популярных курсов:', error);
        showPopularCoursesError();
    }
}

// Отображение популярных курсов
function displayPopularCourses(courses) {
    const container = document.getElementById('popularCoursesContainer');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="empty-popular-courses">
                <p class="text-muted">Популярные курсы появятся скоро</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="course-preview-card" onclick="openCourseDetails('${course.name}')">
            <div class="course-preview-header">
                <h3>${escapeHtml(course.name)}</h3>
                <div class="popular-badge">
                    <span class="popular-icon">🔥</span>
                    <span class="popular-count">${course.application_count || 0}</span>
                </div>
            </div>
            <p class="course-preview-description">${escapeHtml(course.description || 'Описание отсутствует')}</p>
            <div class="course-preview-footer">
                <div class="course-preview-meta">
                    <span class="course-duration">${course.duration || 'Не указано'}</span>
                    <span class="course-price">${formatCoursePrice(course.price)}</span>
                </div>
                <button class="btn-course-details">Подробнее →</button>
            </div>
        </div>
    `).join('');
}

// Форматирование цены курса
function formatCoursePrice(price) {
    if (!price || price === '0.00') return 'Бесплатно';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// Обработка ошибки загрузки популярных курсов
function showPopularCoursesError() {
    const container = document.getElementById('popularCoursesContainer');
    container.innerHTML = `
        <div class="empty-popular-courses">
            <p class="text-muted">Не удалось загрузить популярные курсы</p>
            <button class="btn btn-secondary btn-sm mt-2" onclick="loadPopularCourses()">
                Попробовать снова
            </button>
        </div>
    `;
}

// Открытие деталей курса (переход на страницу курсов)
function openCourseDetails(courseName) {
    // Кодируем название курса для URL
    const encodedCourseName = encodeURIComponent(courseName);
    // Перенаправляем на страницу курсов с параметром
    window.location.href = `courses.html?course=${encodedCourseName}`;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли на странице контейнер популярных курсов
    if (document.getElementById('popularCoursesContainer')) {
        loadPopularCourses();
    }
});