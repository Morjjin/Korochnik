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
        
        // Проверяем, есть ли содержимое в ответе
        const contentType = response.headers.get('content-type');
        let data = null;
        
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
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
    
    const formData = {
        login: login,
        password: password,
        action: 'login'
    };
    
    const result = await apiFetch('auth.php', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
    
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
        
        // Закрываем модальное окно
        hideAuthModal();
        
        // Если на главной странице - обновляем интерфейс
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'index.html') {
            // Обновляем шапку
            checkAuth();
            // Не перенаправляем, остаемся на главной
            return;
        }
        
        if (result.data.is_admin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } else {
        showError('loginError', result.error);
    }
}

// Обработчик регистрации
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        login: document.getElementById('regLogin').value,
        password: document.getElementById('regPassword').value,
        full_name: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        action: 'register'
    };
    
    // Валидация
    let isValid = true;
    
    if (!validateLogin(formData.login)) {
        showError('loginErrorMsg', 'Логин должен содержать только латиницу и цифры, минимум 6 символов');
        isValid = false;
    } else {
        clearError('loginErrorMsg');
    }
    
    if (!validatePassword(formData.password)) {
        showError('passwordErrorMsg', 'Пароль должен содержать минимум 8 символов');
        isValid = false;
    } else {
        clearError('passwordErrorMsg');
    }
    
    if (!validateFullName(formData.full_name)) {
        showError('nameErrorMsg', 'ФИО должно содержать только кириллицу и пробелы');
        isValid = false;
    } else {
        clearError('nameErrorMsg');
    }
    
    if (!validatePhone(formData.phone)) {
        showError('phoneErrorMsg', 'Телефон должен быть в формате 8(XXX)XXX-XX-XX');
        isValid = false;
    } else {
        clearError('phoneErrorMsg');
    }
    
    if (!validateEmail(formData.email)) {
        showError('emailErrorMsg', 'Некорректный формат email');
        isValid = false;
    } else {
        clearError('emailErrorMsg');
    }
    
    if (!isValid) return;
    
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
        showError('loginErrorMsg', result.error);
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
        if (currentPage === 'index.html') {
            checkAuth();
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
            startLearningBtn.onclick = function() {
                const isAdmin = localStorage.getItem('isAdmin') === 'true';
                window.location.href = isAdmin ? 'admin.html' : 'dashboard.html';
            };
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
    const userToken = localStorage.getItem('userToken');
    
    if (userToken) {
        // Если пользователь авторизован - переходим в личный кабинет
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        window.location.href = isAdmin ? 'admin.html' : 'dashboard.html';
    } else {
        // Если не авторизован - показываем форму регистрации
        showAuthModal(true); // true = показать форму регистрации
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
  
    // Обновляем индекс текущего слайда после анимации
    setTimeout(() => {
      slides[currentSlide].classList.remove('active', outClass);
      slides[nextSlideIdx].classList.remove(inClass);
      slides[nextSlideIdx].classList.add('active');
      currentSlide = nextSlideIdx;
    }, 600); // длительность анимации
  
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
    }, 50);
    
    // Сброс интервала
    clearInterval(slideInterval);
    slideInterval = setInterval(() => changeSlide(1), 3000);
}

// Инициализация слайдера при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
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
});