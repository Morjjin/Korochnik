// dashboard.js - функционал личного кабинета с улучшенной обработкой ошибок
let currentUserData = null;

// Пагинация для заявок и обращений пользователя
let userApplications = [];
let userApplicationsCurrentPage = 1;
let userSupportTickets = [];
let userSupportCurrentPage = 1;
const userItemsPerPage = 6;

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    if (!localStorage.getItem('userToken')) {
        window.location.href = 'index.html';
        return;
    }

    // Загружаем данные
    loadProfile();
    loadApplications();
    loadSupportTickets();
    
    // Настройка минимальной даты
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.min = today;
    }

    // Обработчики для формы заявки
    const courseSelect = document.getElementById('courseSelect');
    const customCourseInput = document.getElementById('customCourseName');
    
    if (courseSelect && customCourseInput) {
        courseSelect.addEventListener('change', function() {
            customCourseInput.disabled = !!this.value;
            if (this.value) customCourseInput.value = '';
        });

        customCourseInput.addEventListener('input', function() {
            courseSelect.disabled = !!this.value;
            if (this.value) courseSelect.value = '';
        });
    }

    // Обработчик формы заявки
    const applicationForm = document.getElementById('newApplicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', handleApplicationSubmit);
    }
});

// Загрузка заявок пользователя
async function loadApplications() {
    try {
        showLoadingState();
        
        const result = await apiFetch('applications.php');
        
        if (result.success) {
            userApplications = result.data || [];
            userApplicationsCurrentPage = 1;
            displayApplications(userApplications);
            updateStats(userApplications);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        showErrorState('Не удалось загрузить заявки: ' + error.message);
    }
}

// Отображение заявок
function displayApplications(applications) {
    const applicationsList = document.getElementById('applicationsList');
    
    if (!applicationsList) return;
    
    const apps = applications || [];
    const totalPages = Math.ceil(apps.length / userItemsPerPage);
    const startIndex = (userApplicationsCurrentPage - 1) * userItemsPerPage;
    const endIndex = startIndex + userItemsPerPage;
    const paginatedApplications = apps.slice(startIndex, endIndex);

    if (!apps.length) {
        applicationsList.innerHTML = `
            <div class="empty-state">
                <h3 class="text-muted mb-2">У вас пока нет заявок</h3>
                <p class="text-muted mb-2">Создайте первую заявку на обучение!</p>
                <button class="btn btn-primary mt-2" onclick="showApplicationForm()">
                    Создать заявку
                </button>
            </div>
        `;
        // очищаем пагинацию
        const paginationContainer = document.getElementById('applicationsPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    applicationsList.innerHTML = paginatedApplications.map(app => `
        <div class="application-card">
            <div class="application-header">
                <div>
                    <div class="application-title">${escapeHtml(app.course_name)}</div>
                    <div class="text-muted">Подана: ${new Date(app.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
                <span class="status status-${getStatusClass(app.status)}">${escapeHtml(app.status)}</span>
            </div>
            
            <div class="application-meta">
                <div class="meta-item">
                    <span aria-hidden="true">📅</span>
                    <span>Начало: ${new Date(app.start_date).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="meta-item">
                    <span aria-hidden="true">💳</span>
                    <span>Оплата: ${escapeHtml(app.payment_method)}</span>
                </div>
            </div>
            
            ${app.feedback ? `
                <div class="mt-2">
                    <strong>Ваш отзыв:</strong>
                    <p class="text-muted mt-1">${escapeHtml(app.feedback)}</p>
                </div>
            ` : ''}
            
            ${app.status === 'Идет обучение' ? `
                <div class="user-actions mt-2">
                    <button class="btn btn-success btn-sm" onclick="markAsCompleted(${app.id})">
                        ✓ Завершить обучение
                    </button>
                </div>
            ` : ''}
            
            ${app.status === 'Обучение завершено' && !app.feedback ? `
                <div class="user-actions mt-2">
                    <button class="btn btn-secondary btn-sm" onclick="showFeedbackModal(${app.id})">
                        Оставить отзыв
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // пагинация
    displayApplicationsPagination(apps.length, totalPages);
}

// Пагинация заявок пользователя
function displayApplicationsPagination(totalItems, totalPages) {
    const paginationContainer = document.getElementById('applicationsPagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';

    html += `
        <button class="pagination-btn" onclick="changeApplicationsPage(${userApplicationsCurrentPage - 1})"
                ${userApplicationsCurrentPage === 1 ? 'disabled' : ''}>
            ‹ Предыдущая
        </button>
    `;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, userApplicationsCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="changeApplicationsPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-info">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === userApplicationsCurrentPage ? 'active' : ''}"
                    onclick="changeApplicationsPage(${i})">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-info">...</span>`;
        }
        html += `<button class="pagination-btn" onclick="changeApplicationsPage(${totalPages})">${totalPages}</button>`;
    }

    html += `
        <button class="pagination-btn" onclick="changeApplicationsPage(${userApplicationsCurrentPage + 1})"
                ${userApplicationsCurrentPage === totalPages ? 'disabled' : ''}>
            Следующая ›
        </button>
    `;

    const startItem = (userApplicationsCurrentPage - 1) * userItemsPerPage + 1;
    const endItem = Math.min(userApplicationsCurrentPage * userItemsPerPage, totalItems);
    html += `
        <span class="pagination-info">
            Показано ${startItem}-${endItem} из ${totalItems}
        </span>
    `;

    paginationContainer.innerHTML = html;
}

function changeApplicationsPage(page) {
    const totalPages = Math.ceil(userApplications.length / userItemsPerPage);
    if (page < 1 || page > totalPages) return;

    userApplicationsCurrentPage = page;
    displayApplications(userApplications);

    const card = document.querySelector('.card h2.mb-3:nth-of-type(2)');
    if (card && card.scrollIntoView) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Получение класса для статуса
function getStatusClass(status) {
    const statusMap = {
        'Новая': 'new',
        'Идет обучение': 'in-progress', 
        'Обучение завершено': 'completed'
    };
    return statusMap[status] || 'new';
}

// Обновление статистики
function updateStats(applications) {
    if (!applications) return;
    
    const total = applications.length;
    const active = applications.filter(app => app.status === 'Идет обучение').length;
    const completed = applications.filter(app => app.status === 'Обучение завершено').length;
    
    const totalEl = document.getElementById('totalApplications');
    const activeEl = document.getElementById('activeApplications');
    const completedEl = document.getElementById('completedApplications');
    
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (completedEl) completedEl.textContent = completed;
}

// Показать форму заявки
function showApplicationForm() {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.classList.add('active');
        populateCourseSelect('courseSelect');
        
        // Фокус на первом поле
        setTimeout(() => {
            const courseSelect = document.getElementById('courseSelect');
            if (courseSelect) courseSelect.focus();
        }, 100);
    }
}

// Скрыть форму заявки
function hideApplicationForm() {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('newApplicationForm');
        if (form) form.reset();
        const message = document.getElementById('applicationMessage');
        if (message) message.textContent = '';
    }
}

// Обработчик отправки заявки
async function handleApplicationSubmit(e) {
    e.preventDefault();
    
    const courseSelect = document.getElementById('courseSelect');
    const customCourse = document.getElementById('customCourseName');
    const startDate = document.getElementById('startDate');
    const paymentMethod = document.getElementById('paymentMethod');
    
    if (!courseSelect || !customCourse || !startDate || !paymentMethod) {
        showApplicationMessage('Ошибка формы', 'error');
        return;
    }
    
    let courseName = '';
    if (courseSelect.value) {
        courseName = courseSelect.value;
    } else if (customCourse.value) {
        courseName = customCourse.value;
    } else {
        showApplicationMessage('Выберите или введите название курса', 'error');
        return;
    }
    
    if (!startDate.value) {
        showApplicationMessage('Укажите дату начала обучения', 'error');
        return;
    }
    
    if (!paymentMethod.value) {
        showApplicationMessage('Выберите способ оплаты', 'error');
        return;
    }
    
    const formData = {
        course_name: courseName,
        start_date: startDate.value,
        payment_method: paymentMethod.value
    };
    
    try {
        showApplicationMessage('Отправка заявки...', 'info');
        
        const result = await apiFetch('applications.php', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (result.success) {
            showApplicationMessage('Заявка успешно создана!', 'success');
            
            setTimeout(() => {
                hideApplicationForm();
                loadApplications();
            }, 1500);
        } else {
            showApplicationMessage(result.error || 'Ошибка при создании заявки', 'error');
        }
    } catch (error) {
        showApplicationMessage('Ошибка соединения с сервером', 'error');
    }
}

// Показать сообщение в форме заявки
function showApplicationMessage(text, type) {
    const messageEl = document.getElementById('applicationMessage');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = type === 'success' ? 'text-success' : 
                            type === 'info' ? 'text-muted' : 'text-error';
    }
}

// Состояния загрузки
function showLoadingState() {
    const applicationsList = document.getElementById('applicationsList');
    if (applicationsList) {
        applicationsList.innerHTML = '<div class="empty-state"><p class="text-muted">Загрузка заявок...</p></div>';
    }
}

function showErrorState(message) {
    const applicationsList = document.getElementById('applicationsList');
    if (applicationsList) {
        applicationsList.innerHTML = `
            <div class="error-state">
                <p class="text-error">${escapeHtml(message)}</p>
                <button class="btn btn-primary mt-2" onclick="loadApplications()">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

// Модальное окно для отзыва
function showFeedbackModal(applicationId) {
    const modal = document.getElementById('feedbackModal');
    if (!modal) {
        // Создаем модальное окно, если его нет
        createFeedbackModal();
    }
    
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackForm = document.getElementById('feedbackForm');
    const applicationIdInput = document.getElementById('feedbackApplicationId');
    
    if (applicationIdInput) {
        applicationIdInput.value = applicationId;
    }
    
    if (feedbackForm) {
        feedbackForm.reset();
    }
    
    if (feedbackModal) {
        feedbackModal.classList.add('active');
        const textarea = document.getElementById('feedbackText');
        if (textarea) {
            setTimeout(() => textarea.focus(), 100);
        }
    }
}

// Создание модального окна для отзыва
function createFeedbackModal() {
    const modalHTML = `
        <div class="modal" id="feedbackModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Оставить отзыв</h3>
                    <button class="modal-close" onclick="hideFeedbackModal()" aria-label="Закрыть окно">×</button>
                </div>
                <form id="feedbackForm">
                    <input type="hidden" id="feedbackApplicationId" name="application_id">
                    <div class="form-group">
                        <label for="feedbackText" class="form-label">Ваш отзыв о качестве образовательных услуг</label>
                        <textarea class="form-input" id="feedbackText" name="feedback" rows="5" 
                                  placeholder="Поделитесь своими впечатлениями о пройденном курсе..." 
                                  required aria-required="true"></textarea>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary btn-full">
                            Отправить отзыв
                        </button>
                        <button type="button" class="btn btn-secondary btn-full mt-1" 
                                onclick="hideFeedbackModal()">
                            Отмена
                        </button>
                    </div>
                    <div id="feedbackMessage" class="text-center"></div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Обработчик формы отзыва
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }
}

// Скрыть модальное окно отзыва
function hideFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('feedbackForm');
        if (form) form.reset();
        const message = document.getElementById('feedbackMessage');
        if (message) message.textContent = '';
    }
}

// Обработчик отправки отзыва
async function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const applicationId = document.getElementById('feedbackApplicationId').value;
    const feedbackText = document.getElementById('feedbackText').value;
    
    if (!feedbackText.trim()) {
        showFeedbackMessage('Пожалуйста, введите текст отзыва', 'error');
        return;
    }
    
    try {
        showFeedbackMessage('Отправка отзыва...', 'info');
        
        const result = await apiFetch('applications.php', {
            method: 'PATCH',
            body: JSON.stringify({
                id: parseInt(applicationId),
                feedback: feedbackText
            })
        });
        
        if (result.success) {
            showFeedbackMessage('Отзыв успешно отправлен!', 'success');
            
            setTimeout(() => {
                hideFeedbackModal();
                loadApplications(); // Перезагружаем заявки для обновления интерфейса
            }, 1500);
        } else {
            showFeedbackMessage(result.error || 'Ошибка при отправке отзыва', 'error');
        }
    } catch (error) {
        showFeedbackMessage('Ошибка соединения с сервером', 'error');
    }
}

// Показать сообщение в форме отзыва
function showFeedbackMessage(text, type) {
    const messageEl = document.getElementById('feedbackMessage');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = type === 'success' ? 'text-success' : 
                            type === 'info' ? 'text-muted' : 'text-error';
    }
}

// Отметить обучение как завершенное (пользователь)
async function markAsCompleted(applicationId) {
    if (!confirm('Вы уверены, что хотите отметить обучение как завершенное?')) {
        return;
    }
    
    try {
        const result = await apiFetch('applications.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: applicationId,
                status: 'Обучение завершено'
            })
        });
        
        if (result.success) {
            showNotification('Обучение успешно отмечено как завершенное!', 'success');
            loadApplications(); // Перезагружаем заявки
        } else {
            showNotification(result.error || 'Ошибка при обновлении статуса', 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

// Показать уведомление (для пользователя)
function showNotification(message, type = 'info') {
    // Удаляем существующие уведомления
    const existingNotifications = document.querySelectorAll('.popup-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `popup-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Загрузка профиля пользователя
async function loadProfile() {
    try {
        const result = await apiFetch('profile.php');
        
        if (result.success) {
            currentUserData = result.data;
            displayProfile(result.data);
            updateHeaderAvatar(result.data);
        } else {
            console.error('Ошибка загрузки профиля:', result.error);
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

// Отображение профиля
function displayProfile(userData) {
    if (!userData) return;
    
    const avatarImg = document.getElementById('profileAvatar');
    const fullNameEl = document.getElementById('profileFullName');
    const loginEl = document.getElementById('profileLogin');
    const phoneEl = document.getElementById('profilePhone');
    const emailEl = document.getElementById('profileEmail');
    
    if (avatarImg) {
        if (userData.avatar) {
            // Путь к аватару относительно корня проекта
            const avatarPath = userData.avatar.startsWith('http') ? userData.avatar : 
                              `${API_BASE.replace('/api', '')}/${userData.avatar}`;
            avatarImg.src = avatarPath;
        } else {
            avatarImg.src = '';
        }
    }
    
    if (fullNameEl) fullNameEl.textContent = userData.full_name || 'Не указано';
    if (loginEl) loginEl.textContent = userData.login || 'Не указано';
    if (phoneEl) phoneEl.textContent = userData.phone || 'Не указано';
    if (emailEl) emailEl.textContent = userData.email || 'Не указано';
}

// Обновление аватара в шапке
function updateHeaderAvatar(userData) {
    const headerAvatar = document.getElementById('headerAvatar');
    const headerAvatarPlaceholder = document.querySelector('.header-avatar-placeholder');
    const headerAvatarInitial = document.getElementById('headerAvatarInitial');
    
    if (userData && userData.avatar) {
        if (headerAvatar) {
            // Путь к аватару относительно корня проекта
            const avatarPath = userData.avatar.startsWith('http') ? userData.avatar : 
                              `${API_BASE.replace('/api', '')}/${userData.avatar}`;
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
            const initial = userData && userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'П';
            headerAvatarInitial.textContent = initial;
            headerAvatarPlaceholder.style.display = 'flex';
        }
    }
}

// Показать форму редактирования профиля
function showProfileEdit() {
    if (!currentUserData) {
        loadProfile().then(() => {
            if (currentUserData) {
                showProfileEditForm();
            }
        });
        return;
    }
    showProfileEditForm();
}

function showProfileEditForm() {
    const modal = document.getElementById('profileEditModal');
    if (!modal) return;
    
    // Заполняем форму текущими данными
    document.getElementById('editFullName').value = currentUserData.full_name || '';
    document.getElementById('editPhone').value = currentUserData.phone || '';
    document.getElementById('editEmail').value = currentUserData.email || '';
    
    // Устанавливаем превью аватара
    const avatarPreview = document.getElementById('avatarPreview');
    if (avatarPreview && currentUserData.avatar) {
        const avatarPath = currentUserData.avatar.startsWith('http') ? currentUserData.avatar : 
                          `${API_BASE.replace('/api', '')}/${currentUserData.avatar}`;
        avatarPreview.src = avatarPath;
    }
    
    const removeBtn = document.getElementById('removeAvatarBtn');
    if (removeBtn) {
        removeBtn.style.display = currentUserData.avatar ? 'inline-block' : 'none';
    }
    
    modal.classList.add('active');
    
    // Фокус на первое поле
    setTimeout(() => {
        document.getElementById('editFullName').focus();
    }, 100);
}

// Скрыть форму редактирования профиля
function hideProfileEdit() {
    const modal = document.getElementById('profileEditModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('profileEditForm');
        if (form) form.reset();
        clearProfileMessages();
    }
}

// Обработка выбора аватара
function handleAvatarSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showProfileMessage('Недопустимый тип файла. Разрешены: JPEG, PNG, GIF, WebP', 'error');
        return;
    }
    
    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showProfileMessage('Файл слишком большой. Максимум 5MB', 'error');
        return;
    }
    
    // Показываем превью
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarPreview = document.getElementById('avatarPreview');
        if (avatarPreview) {
            avatarPreview.src = e.target.result;
        }
        const removeBtn = document.getElementById('removeAvatarBtn');
        if (removeBtn) removeBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
    
    // Загружаем аватар
    uploadAvatar(file);
}

// Загрузка аватара
async function uploadAvatar(file) {
    try {
        showProfileMessage('Загрузка аватара...', 'info');
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch(`${API_BASE}/profile.php`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showProfileMessage('Аватар успешно загружен!', 'success');
            // Обновляем данные профиля
            if (currentUserData) {
                currentUserData.avatar = data.avatar;
            }
            updateHeaderAvatar(currentUserData);
            // Обновляем превью в форме
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarPreview && data.avatar) {
                const avatarPath = data.avatar.startsWith('http') ? data.avatar : 
                                  `${API_BASE.replace('/api', '')}/${data.avatar}`;
                avatarPreview.src = avatarPath;
            }
        } else {
            showProfileMessage(data.error || 'Ошибка загрузки аватара', 'error');
        }
    } catch (error) {
        showProfileMessage('Ошибка соединения с сервером', 'error');
    }
}

// Удаление аватара
async function removeAvatar() {
    if (!confirm('Вы уверены, что хотите удалить аватар?')) {
        return;
    }
    
    try {
        showProfileMessage('Удаление аватара...', 'info');
        
        // Удаляем файл на сервере
        if (currentUserData && currentUserData.avatar) {
            // В реальном проекте нужно добавить endpoint для удаления
            // Пока просто обновим профиль без аватара
            currentUserData.avatar = null;
        }
        
        // Обновляем превью
        const avatarPreview = document.getElementById('avatarPreview');
        if (avatarPreview) {
            avatarPreview.src = '';
        }
        
        const removeBtn = document.getElementById('removeAvatarBtn');
        if (removeBtn) removeBtn.style.display = 'none';
        
        showProfileMessage('Аватар удален', 'success');
        updateHeaderAvatar(currentUserData);
    } catch (error) {
        showProfileMessage('Ошибка удаления аватара', 'error');
    }
}

// Обработчик формы редактирования профиля
document.addEventListener('DOMContentLoaded', function() {
    const profileEditForm = document.getElementById('profileEditForm');
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Форматирование телефона
    const editPhoneInput = document.getElementById('editPhone');
    if (editPhoneInput) {
        editPhoneInput.addEventListener('input', function() {
            if (typeof formatPhone === 'function') {
                formatPhone(this);
            }
        });
    }
    
    // Закрытие модального окна профиля по клику на фон
    const profileModal = document.getElementById('profileEditModal');
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === profileModal) {
                hideProfileEdit();
            }
        });
    }
    
    // Закрытие модального окна профиля по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const profileModal = document.getElementById('profileEditModal');
            if (profileModal && profileModal.classList.contains('active')) {
                hideProfileEdit();
            }
        }
    });
});

// Обработка обновления профиля
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = {
        full_name: document.getElementById('editFullName').value,
        phone: document.getElementById('editPhone').value,
        email: document.getElementById('editEmail').value
    };
    
    // Валидация (используем функции из app.js, если доступны)
    let isValid = true;
    
    const validateFullNameFunc = typeof validateFullName === 'function' ? validateFullName : 
        (name) => /^[а-яА-ЯёЁ\s]+$/u.test(name);
    const validatePhoneFunc = typeof validatePhone === 'function' ? validatePhone : 
        (phone) => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(phone);
    const validateEmailFunc = typeof validateEmail === 'function' ? validateEmail : 
        (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    
    if (!validateFullNameFunc(formData.full_name)) {
        showFieldError('editFullNameError', 'ФИО должно содержать только кириллицу и пробелы');
        isValid = false;
    } else {
        clearFieldError('editFullNameError');
    }
    
    if (!validatePhoneFunc(formData.phone)) {
        showFieldError('editPhoneError', 'Телефон должен быть в формате 8(XXX)XXX-XX-XX');
        isValid = false;
    } else {
        clearFieldError('editPhoneError');
    }
    
    if (!validateEmailFunc(formData.email)) {
        showFieldError('editEmailError', 'Некорректный формат email');
        isValid = false;
    } else {
        clearFieldError('editEmailError');
    }
    
    if (!isValid) return;
    
    try {
        showProfileMessage('Сохранение изменений...', 'info');
        
        const result = await apiFetch('profile.php', {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        if (result.success) {
            showProfileMessage('Профиль успешно обновлен!', 'success');
            
            // Обновляем данные
            currentUserData = result.data.user;
            
            setTimeout(() => {
                hideProfileEdit();
                loadProfile();
                // Обновляем имя в шапке
                const userNameEl = document.getElementById('userName');
                if (userNameEl && currentUserData) {
                    userNameEl.textContent = currentUserData.full_name;
                }
                localStorage.setItem('userName', currentUserData.full_name);
                if (currentUserData.avatar) {
                    localStorage.setItem('userAvatar', currentUserData.avatar);
                }
            }, 1500);
        } else {
            showProfileMessage(result.error || 'Ошибка обновления профиля', 'error');
        }
    } catch (error) {
        showProfileMessage('Ошибка соединения с сервером', 'error');
    }
}

// Вспомогательные функции
function showProfileMessage(text, type) {
    const messageEl = document.getElementById('profileEditMessage');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = type === 'success' ? 'text-success' : 
                            type === 'info' ? 'text-muted' : 'text-error';
    }
}

function clearProfileMessages() {
    showProfileMessage('', '');
    clearFieldError('editFullNameError');
    clearFieldError('editPhoneError');
    clearFieldError('editEmailError');
    const avatarMsg = document.getElementById('avatarUploadMessage');
    if (avatarMsg) avatarMsg.textContent = '';
}

function showFieldError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

function clearFieldError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
    }
}

// === ФУНКЦИИ ПОДДЕРЖКИ ===

// Загрузка обращений в поддержку
async function loadSupportTickets() {
    try {
        const result = await apiFetch('support.php');
        
        if (result.success) {
            userSupportTickets = result.data || [];
            userSupportCurrentPage = 1;
            displaySupportTickets(userSupportTickets);
        } else {
            const ticketsList = document.getElementById('supportTicketsList');
            if (ticketsList) {
                ticketsList.innerHTML = '<div class="empty-state"><p class="text-muted">Ошибка загрузки обращений</p></div>';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки обращений:', error);
        const ticketsList = document.getElementById('supportTicketsList');
        if (ticketsList) {
            ticketsList.innerHTML = '<div class="empty-state"><p class="text-muted">Ошибка соединения с сервером</p></div>';
        }
    }
}

// Отображение обращений в поддержку
function displaySupportTickets(tickets) {
    const ticketsList = document.getElementById('supportTicketsList');
    if (!ticketsList) return;

    const allTickets = tickets || [];
    const totalPages = Math.ceil(allTickets.length / userItemsPerPage);
    const startIndex = (userSupportCurrentPage - 1) * userItemsPerPage;
    const endIndex = startIndex + userItemsPerPage;
    const paginatedTickets = allTickets.slice(startIndex, endIndex);
    
    if (!allTickets.length) {
        ticketsList.innerHTML = '<div class="empty-state"><p class="text-muted">У вас пока нет обращений в поддержку</p></div>';
        const paginationContainer = document.getElementById('supportPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    ticketsList.innerHTML = paginatedTickets.map(ticket => {
        const statusClass = {
            'Открыт': 'status-new',
            'В обработке': 'status-processing',
            'Решен': 'status-resolved',
            'Закрыт': 'status-closed'
        }[ticket.status] || '';
        
        const date = new Date(ticket.created_at).toLocaleString('ru-RU');
        
        return `
            <div class="support-ticket-card">
                <div class="ticket-header">
                    <h4 class="ticket-subject">${escapeHtml(ticket.subject)}</h4>
                    <span class="ticket-status ${statusClass}">${ticket.status}</span>
                </div>
                <div class="ticket-message">
                    <p>${escapeHtml(ticket.message)}</p>
                </div>
                ${ticket.admin_response ? `
                    <div class="ticket-response">
                        <strong>Ответ поддержки:</strong>
                        <p>${escapeHtml(ticket.admin_response)}</p>
                    </div>
                ` : ''}
                <div class="ticket-footer">
                    <span class="ticket-date">Создано: ${date}</span>
                </div>
            </div>
        `;
    }).join('');

    displaySupportPagination(allTickets.length, totalPages);
}

// Пагинация обращений поддержки
function displaySupportPagination(totalItems, totalPages) {
    const paginationContainer = document.getElementById('supportPagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';

    html += `
        <button class="pagination-btn" onclick="changeSupportPage(${userSupportCurrentPage - 1})"
                ${userSupportCurrentPage === 1 ? 'disabled' : ''}>
            ‹ Предыдущая
        </button>
    `;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, userSupportCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="changeSupportPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-info">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === userSupportCurrentPage ? 'active' : ''}"
                    onclick="changeSupportPage(${i})">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-info">...</span>`;
        }
        html += `<button class="pagination-btn" onclick="changeSupportPage(${totalPages})">${totalPages}</button>`;
    }

    html += `
        <button class="pagination-btn" onclick="changeSupportPage(${userSupportCurrentPage + 1})"
                ${userSupportCurrentPage === totalPages ? 'disabled' : ''}>
            Следующая ›
        </button>
    `;

    const startItem = (userSupportCurrentPage - 1) * userItemsPerPage + 1;
    const endItem = Math.min(userSupportCurrentPage * userItemsPerPage, totalItems);
    html += `
        <span class="pagination-info">
            Показано ${startItem}-${endItem} из ${totalItems}
        </span>
    `;

    paginationContainer.innerHTML = html;
}

function changeSupportPage(page) {
    const totalPages = Math.ceil(userSupportTickets.length / userItemsPerPage);
    if (page < 1 || page > totalPages) return;

    userSupportCurrentPage = page;
    displaySupportTickets(userSupportTickets);

    const card = Array.from(document.querySelectorAll('.card h2.mb-3'))
        .find(el => el.textContent.includes('Обращения в поддержку'));
    if (card && card.scrollIntoView) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Показать модальное окно поддержки
function showSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.classList.add('active');
        setTimeout(() => {
            document.getElementById('supportSubject').focus();
        }, 100);
    }
}

// Скрыть модальное окно поддержки
function hideSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('supportForm');
        if (form) form.reset();
        clearSupportMessages();
    }
}

// Обработчик формы поддержки
document.addEventListener('DOMContentLoaded', function() {
    const supportForm = document.getElementById('supportForm');
    if (supportForm) {
        supportForm.addEventListener('submit', handleSupportSubmit);
    }
    
    // Закрытие модального окна поддержки по клику на фон
    const supportModal = document.getElementById('supportModal');
    if (supportModal) {
        supportModal.addEventListener('click', function(e) {
            if (e.target === supportModal) {
                hideSupportModal();
            }
        });
    }
});

// Обработка отправки обращения
async function handleSupportSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    let isSuccessfullySubmitted = false;

    // Защита от повторных нажатий: если уже отправляем, выходим
    if (submitBtn && submitBtn.disabled) {
        return;
    }
    if (submitBtn) {
        submitBtn.disabled = true;
    }

    const formData = {
        subject: document.getElementById('supportSubject').value.trim(),
        message: document.getElementById('supportMessageText').value.trim()
    };
    
    // Валидация
    let isValid = true;
    
    if (formData.subject.length < 5) {
        showFieldError('supportSubjectError', 'Тема должна содержать минимум 5 символов');
        isValid = false;
    } else {
        clearFieldError('supportSubjectError');
    }
    
    if (formData.message.length < 10) {
        showFieldError('supportMessageError', 'Сообщение должно содержать минимум 10 символов');
        isValid = false;
    } else {
        clearFieldError('supportMessageError');
    }
    
    if (!isValid) return;
    
    try {
        showSupportMessage('Отправка обращения...', 'info');
        
        const result = await apiFetch('support.php', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (result.success) {
            showSupportMessage('Обращение успешно создано!', 'success');
            isSuccessfullySubmitted = true;
            setTimeout(() => {
                hideSupportModal();
                loadSupportTickets();
            }, 1500);
        } else {
            showSupportMessage(result.error || 'Ошибка создания обращения', 'error');
        }
    } catch (error) {
        showSupportMessage('Ошибка соединения с сервером', 'error');
    } finally {
        if (submitBtn) {
            // Если не удалось создать обращение — даём пользователю повторить попытку
            if (!isSuccessfullySubmitted) {
                submitBtn.disabled = false;
            }
        }
    }
}

// Вспомогательные функции поддержки
function showSupportMessage(text, type) {
    const messageEl = document.getElementById('supportFormMessage');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = type === 'success' ? 'text-success' : 
                            type === 'info' ? 'text-muted' : 'text-error';
    }
}

function clearSupportMessages() {
    showSupportMessage('', '');
    clearFieldError('supportSubjectError');
    clearFieldError('supportMessageError');
}