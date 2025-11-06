// admin.js - функционал панели администратора
// 
// ВАЖНО: API_BASE определяется в app.js
// Убедитесь, что app.js подключен перед admin.js в HTML
// Если нужно изменить путь к API, измените его в app.js

let currentPage = 1;
const itemsPerPage = 6;
let allApplications = [];

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию администратора
    if (!localStorage.getItem('userToken') || localStorage.getItem('isAdmin') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    loadApplications();
    loadSupportTickets();
    
    // Обработчик формы ответа на обращение
    const supportResponseForm = document.getElementById('supportResponseForm');
    if (supportResponseForm) {
        supportResponseForm.addEventListener('submit', handleSupportResponse);
    }
    
    // Закрытие модального окна по клику на фон
    const supportResponseModal = document.getElementById('supportResponseModal');
    if (supportResponseModal) {
        supportResponseModal.addEventListener('click', function(e) {
            if (e.target === supportResponseModal) {
                hideSupportResponseModal();
            }
        });
    }
});

// Загрузка всех заявок
async function loadApplications() {
    try {
        showLoadingState();
        const response = await fetch(`${API_BASE}/applications.php`);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки заявок');
        }
        
        allApplications = await response.json();
        currentPage = 1; // Сбрасываем на первую страницу при новой загрузке
        displayApplications(allApplications);
        
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        showErrorState('Не удалось загрузить заявки: ' + error.message);
    }
}

// Отображение заявок
function displayApplications(applications) {
    const applicationsList = document.getElementById('applicationsList');
    const statusFilter = document.getElementById('statusFilter');
    const filterValue = statusFilter ? statusFilter.value : '';
    
    if (!applicationsList) return;
    
    // Фильтрация по статусу
    const filteredApplications = filterValue ? 
        applications.filter(app => app.status === filterValue) : 
        applications;
    
    // Пагинация
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex);
    
    if (filteredApplications.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-state">
                <h3 class="text-muted mb-2">Заявки не найдены</h3>
                <p class="text-muted">${filterValue ? `Нет заявок со статусом "${filterValue}"` : 'Заявок пока нет'}</p>
            </div>
        `;
        // Очищаем пагинацию
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    applicationsList.innerHTML = paginatedApplications.map(app => `
        <div class="application-card">
            <div class="application-header">
                <div>
                    <div class="application-title">${escapeHtml(app.course_name)}</div>
                    <div class="text-muted">
                        ${app.full_name || 'Пользователь'} • ${app.email || ''} • ${app.phone || ''}
                    </div>
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
                    <strong>Отзыв студента:</strong>
                    <p class="text-muted mt-1">${escapeHtml(app.feedback)}</p>
                </div>
            ` : ''}
            
            <div class="admin-actions mt-2">
                <label for="status-${app.id}" class="form-label">Изменить статус:</label>
                <select class="form-select select-admin-action" id="status-${app.id}" 
                        onchange="updateApplicationStatus(${app.id}, this.value)" 
                        aria-label="Выберите новый статус для заявки">
                    <option value="Новая" ${app.status === 'Новая' ? 'selected' : ''}>Новая</option>
                    <option value="Идет обучение" ${app.status === 'Идет обучение' ? 'selected' : ''}>Идет обучение</option>
                    <option value="Обучение завершено" ${app.status === 'Обучение завершено' ? 'selected' : ''}>Обучение завершено</option>
                </select>
            </div>
        </div>
    `).join('');
    
    // Отображение пагинации
    displayPagination(filteredApplications.length, totalPages);
}

// Обновление статуса заявки
async function updateApplicationStatus(applicationId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/applications.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: applicationId,
                status: newStatus
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Показываем уведомление об успехе
            showNotification('Статус заявки успешно обновлен', 'success');
            
            // Обновляем локальный массив
            const appIndex = allApplications.findIndex(app => app.id == applicationId);
            if (appIndex !== -1) {
                allApplications[appIndex].status = newStatus;
            }
            
            // Перезагружаем заявки для обновления интерфейса
            displayApplications(allApplications);
        } else {
            showNotification('Ошибка при обновлении статуса: ' + (data.error || 'Неизвестная ошибка'), 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения при обновлении статуса', 'error');
    }
}

// Фильтрация заявок
function filterApplications() {
    currentPage = 1; // Сбрасываем на первую страницу при фильтрации
    if (allApplications.length > 0) {
        displayApplications(allApplications);
    } else {
        loadApplications();
    }
}

// Отображение пагинации
function displayPagination(totalItems, totalPages) {
    let paginationContainer = document.getElementById('paginationContainer');
    
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';
        paginationContainer.className = 'pagination';
        
        const applicationsList = document.getElementById('applicationsList');
        if (applicationsList && applicationsList.parentNode) {
            applicationsList.parentNode.appendChild(paginationContainer);
        }
    }
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Кнопка "Предыдущая"
    paginationHTML += `
        <button class="pagination-btn" onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            ‹ Предыдущая
        </button>
    `;
    
    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-info">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-info">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Кнопка "Следующая"
    paginationHTML += `
        <button class="pagination-btn" onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            Следующая ›
        </button>
    `;
    
    // Информация о странице
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    paginationHTML += `
        <span class="pagination-info">
            Показано ${startItem}-${endItem} из ${totalItems}
        </span>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Смена страницы
function changePage(page) {
    const statusFilter = document.getElementById('statusFilter');
    const filterValue = statusFilter ? statusFilter.value : '';
    const filteredApplications = filterValue ? 
        allApplications.filter(app => app.status === filterValue) : 
        allApplications;
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayApplications(allApplications);
    
    // Прокрутка вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === ФУНКЦИИ ПОДДЕРЖКИ ДЛЯ АДМИНА ===

let allSupportTickets = [];

// Загрузка обращений в поддержку
async function loadSupportTickets() {
    try {
        const result = await apiFetch('support.php');
        
        if (result.success) {
            allSupportTickets = result.data;
            displaySupportTickets(allSupportTickets);
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

// Фильтрация обращений
function filterSupportTickets() {
    const filter = document.getElementById('supportStatusFilter').value;
    
    if (!filter) {
        displaySupportTickets(allSupportTickets);
        return;
    }
    
    const filtered = allSupportTickets.filter(ticket => ticket.status === filter);
    displaySupportTickets(filtered);
}

// Отображение обращений
function displaySupportTickets(tickets) {
    const ticketsList = document.getElementById('supportTicketsList');
    if (!ticketsList) return;
    
    if (!tickets || tickets.length === 0) {
        ticketsList.innerHTML = '<div class="empty-state"><p class="text-muted">Обращений не найдено</p></div>';
        return;
    }
    
    ticketsList.innerHTML = tickets.map(ticket => {
        const statusClass = {
            'Открыт': 'status-new',
            'В обработке': 'status-processing',
            'Решен': 'status-resolved',
            'Закрыт': 'status-closed'
        }[ticket.status] || '';
        
        const date = new Date(ticket.created_at).toLocaleString('ru-RU');
        const userName = ticket.user_name || 'Пользователь';
        const userEmail = ticket.user_email || '';
        
        return `
            <div class="support-ticket-card">
                <div class="ticket-header">
                    <div>
                        <h4 class="ticket-subject">${escapeHtml(ticket.subject)}</h4>
                        <p class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">
                            ${escapeHtml(userName)} ${userEmail ? `(${escapeHtml(userEmail)})` : ''}
                        </p>
                    </div>
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
                    <button class="btn btn-primary btn-sm" onclick="showSupportResponseModal(${ticket.id})">
                        ${ticket.admin_response ? 'Изменить ответ' : 'Ответить'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Показать модальное окно ответа
function showSupportResponseModal(ticketId) {
    const modal = document.getElementById('supportResponseModal');
    const ticket = allSupportTickets.find(t => t.id === ticketId);
    
    if (!modal || !ticket) return;
    
    document.getElementById('responseTicketId').value = ticketId;
    document.getElementById('supportResponseStatus').value = ticket.status;
    document.getElementById('supportResponseText').value = ticket.admin_response || '';
    
    modal.classList.add('active');
    setTimeout(() => {
        document.getElementById('supportResponseText').focus();
    }, 100);
}

// Скрыть модальное окно ответа
function hideSupportResponseModal() {
    const modal = document.getElementById('supportResponseModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('supportResponseForm');
        if (form) form.reset();
        const messageEl = document.getElementById('supportResponseMessage');
        if (messageEl) messageEl.textContent = '';
    }
}

// Обработка ответа на обращение
async function handleSupportResponse(e) {
    e.preventDefault();
    
    const ticketId = document.getElementById('responseTicketId').value;
    const status = document.getElementById('supportResponseStatus').value;
    const response = document.getElementById('supportResponseText').value.trim();
    
    if (!response) {
        const messageEl = document.getElementById('supportResponseMessage');
        if (messageEl) {
            messageEl.textContent = 'Необходимо ввести ответ';
            messageEl.className = 'text-error';
        }
        return;
    }
    
    try {
        const messageEl = document.getElementById('supportResponseMessage');
        if (messageEl) {
            messageEl.textContent = 'Отправка ответа...';
            messageEl.className = 'text-muted';
        }
        
        const result = await apiFetch('support.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: parseInt(ticketId),
                status: status,
                admin_response: response
            })
        });
        
        if (result.success) {
            if (messageEl) {
                messageEl.textContent = 'Ответ успешно отправлен!';
                messageEl.className = 'text-success';
            }
            setTimeout(() => {
                hideSupportResponseModal();
                loadSupportTickets();
            }, 1500);
        } else {
            if (messageEl) {
                messageEl.textContent = result.error || 'Ошибка отправки ответа';
                messageEl.className = 'text-error';
            }
        }
    } catch (error) {
        const messageEl = document.getElementById('supportResponseMessage');
        if (messageEl) {
            messageEl.textContent = 'Ошибка соединения с сервером';
            messageEl.className = 'text-error';
        }
    }
}

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

// Получение класса для статуса
function getStatusClass(status) {
    const statusMap = {
        'Новая': 'new',
        'Идет обучение': 'in-progress', 
        'Обучение завершено': 'completed'
    };
    return statusMap[status] || 'new';
}

// Функция экранирования HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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