// Firebase is initialized in index.html
let app = window.firebaseApp;
let database = window.database;
let { ref, push, set, onValue, remove, update, off } = window.firebaseRefs;

if (!app || !database) {
    console.error("❌ Firebase 초기화 실패: Firebase가 로드되지 않았습니다.");
    alert("Firebase 초기화에 실패했습니다. 페이지를 새로고침해주세요.");
}

// 할일 데이터 저장
let todos = [];
let currentFilter = 'all';
let currentPage = 'today'; // 'today', 'week', 'month', 'year', or custom category id
let editingId = null;
let deletingId = null;
let deletingCategoryId = null;
let editingCategoryId = null;
let currentListener = null;
let customCategories = [];
let categoriesListener = null;
let selectedEmoji = '📁';
let isEditCategoryMode = false;

// DOM 요소
let todoInput;
let addBtn;
let todoList;
let emptyState;
let editModal;
let editInput;
let saveBtn;
let cancelBtn;
let closeBtn;
let filterBtns;
let deleteModal;
let deleteItemText;
let confirmDeleteBtn;
let cancelDeleteBtn;
let deleteCloseBtn;

// 카테고리 관련 DOM 요소
let categoryModal;
let categoryName;
let saveCategoryBtn;
let cancelCategoryBtn;
let categoryCloseBtn;
let customCategoriesList;
let addCategoryBtn;
let editCategoryBtn;
let emojiPicker;
let deleteCategoryModal;
let deleteCategoryName;
let confirmDeleteCategoryBtn;
let cancelDeleteCategoryBtn;
let deleteCategoryCloseBtn;

// 기본 페이지 설정
const defaultPageConfig = {
    today: {
        title: '오늘의 할일',
        subtitle: '오늘 해야 할 일을 기록하세요',
        dbPath: 'todos/today'
    },
    week: {
        title: '이번 주 할일',
        subtitle: '이번 주 해야 할 일을 기록하세요',
        dbPath: 'todos/week'
    },
    month: {
        title: '이번 달 할일',
        subtitle: '이번 달 해야 할 일을 기록하세요',
        dbPath: 'todos/month'
    },
    year: {
        title: '올해의 할일',
        subtitle: '올해 해야 할 일을 기록하세요',
        dbPath: 'todos/year'
    }
};

// 페이지 설정 가져오기 (기본 + 커스텀 카테고리)
function getPageConfig(page) {
    if (defaultPageConfig[page]) {
        return defaultPageConfig[page];
    }
    // 커스텀 카테고리 찾기
    const category = customCategories.find(c => c.id === page);
    if (category) {
        return {
            title: category.name,
            subtitle: `${category.name} 카테고리의 할일을 기록하세요`,
            dbPath: `todos/custom/${category.id}`
        };
    }
    return defaultPageConfig.today;
}

// 현재 페이지의 Firebase 참조 가져오기
function getCurrentTodosRef() {
    return ref(database, getPageConfig(currentPage).dbPath);
}

// Firebase에서 할일 불러오기
function loadTodos() {
    if (!database) {
        console.error("❌ 데이터베이스가 초기화되지 않았습니다.");
        return;
    }

    // 기존 리스너 제거
    if (currentListener) {
        off(currentListener);
    }

    const todosRef = getCurrentTodosRef();
    currentListener = todosRef;

    try {
        console.log(`📥 ${currentPage} 할일 목록 불러오는 중...`);
        onValue(todosRef, (snapshot) => {
            todos = [];
            const data = snapshot.val();
            
            if (data) {
                todos = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a, b) => {
                    const aTime = a.createdAt || 0;
                    const bTime = b.createdAt || 0;
                    return bTime - aTime;
                });
                console.log(`✅ ${currentPage} 할일 로드 완료: ${todos.length}개`);
            } else {
                console.log(`ℹ️ ${currentPage} 할일 데이터가 없습니다.`);
            }
            renderTodos();
        }, (error) => {
            console.error("❌ 할일 불러오기 실패:", error);
            alert("할일을 불러오는 중 오류가 발생했습니다: " + error.message);
        });
    } catch (error) {
        console.error("❌ 할일 불러오기 실패:", error);
        alert("할일을 불러오는 중 오류가 발생했습니다: " + error.message);
    }
}

// 통계 업데이트
function updateStats() {
    const totalCount = document.getElementById('totalCount');
    const completedCount = document.getElementById('completedCount');
    const remainingCount = document.getElementById('remainingCount');

    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const remaining = total - completed;

    if (totalCount) totalCount.textContent = total;
    if (completedCount) completedCount.textContent = completed;
    if (remainingCount) remainingCount.textContent = remaining;
}

// 할일 추가
async function addTodo() {
    if (!todoInput) {
        todoInput = document.getElementById('todoInput');
        if (!todoInput) {
            alert("입력 필드를 찾을 수 없습니다.");
            return;
        }
    }

    const text = todoInput.value.trim();
    
    if (text === '') {
        alert('할일을 입력해주세요!');
        return;
    }

    if (!database) {
        alert("데이터베이스 연결에 문제가 있습니다. 페이지를 새로고침해주세요.");
        return;
    }

    try {
        const todosRef = getCurrentTodosRef();
        const newTodoRef = push(todosRef);
        const todoData = {
            text: text,
            completed: false,
            createdAt: Date.now()
        };
        
        await set(newTodoRef, todoData);
        console.log(`✅ ${currentPage}에 할일 추가 완료!`);
        
        todoInput.value = '';
        todoInput.focus();
    } catch (error) {
        console.error("❌ 할일 추가 실패:", error);
        alert("할일 추가 중 오류가 발생했습니다: " + error.message);
    }
}

// 삭제 모달 열기
function openDeleteModal(id) {
    const todo = todos.find(t => t.id === id);
    if (todo && deleteModal && deleteItemText) {
        deletingId = id;
        deleteItemText.textContent = `"${todo.text}"`;
        deleteModal.classList.add('show');
    }
}

// 삭제 모달 닫기
function closeDeleteModal() {
    if (deleteModal) {
        deleteModal.classList.remove('show');
    }
    deletingId = null;
}

// 할일 삭제 실행
async function confirmDelete() {
    if (!deletingId) return;
    
    try {
        const todoRef = ref(database, `${getPageConfig(currentPage).dbPath}/${deletingId}`);
        await remove(todoRef);
        console.log("✅ 할일 삭제 완료!");
        closeDeleteModal();
    } catch (error) {
        console.error("❌ 할일 삭제 실패:", error);
        alert("할일 삭제 중 오류가 발생했습니다: " + error.message);
    }
}

// 할일 삭제 (모달 열기)
function deleteTodo(id) {
    openDeleteModal(id);
}

// 할일 완료 토글
async function toggleTodo(id) {
    try {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            const todoRef = ref(database, `${getPageConfig(currentPage).dbPath}/${id}`);
            await update(todoRef, {
                completed: !todo.completed
            });
            console.log("✅ 할일 상태 변경 완료!");
        }
    } catch (error) {
        console.error("❌ 할일 상태 변경 실패:", error);
        alert("할일 상태 변경 중 오류가 발생했습니다: " + error.message);
    }
}

// 편집 모달 열기
function openEditModal(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        editingId = id;
        if (editInput) {
            editInput.value = todo.text;
            editModal.classList.add('show');
            editInput.focus();
            editInput.select();
        }
    }
}

// 편집 모달 닫기
function closeEditModal() {
    if (editModal) {
        editModal.classList.remove('show');
    }
    editingId = null;
    if (editInput) {
        editInput.value = '';
    }
}

// 할일 수정 저장
async function saveEdit() {
    if (!editInput) return;
    
    const text = editInput.value.trim();
    if (text === '') {
        alert('할일을 입력해주세요!');
        return;
    }

    try {
        const todoRef = ref(database, `${getPageConfig(currentPage).dbPath}/${editingId}`);
        await update(todoRef, {
            text: text
        });
        closeEditModal();
        console.log("✅ 할일 수정 완료!");
    } catch (error) {
        console.error("❌ 할일 수정 실패:", error);
        alert("할일 수정 중 오류가 발생했습니다: " + error.message);
    }
}

// ========== 커스텀 카테고리 관리 ==========

// 커스텀 카테고리 불러오기
function loadCustomCategories() {
    if (!database) {
        console.error("❌ 데이터베이스가 초기화되지 않았습니다.");
        return;
    }

    const categoriesRef = ref(database, 'categories');
    
    try {
        console.log("📂 커스텀 카테고리 불러오는 중...");
        onValue(categoriesRef, (snapshot) => {
            customCategories = [];
            const data = snapshot.val();
            
            if (data) {
                customCategories = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a, b) => {
                    const aTime = a.createdAt || 0;
                    const bTime = b.createdAt || 0;
                    return aTime - bTime;
                });
                console.log(`✅ 카테고리 로드 완료: ${customCategories.length}개`);
            } else {
                console.log("ℹ️ 커스텀 카테고리가 없습니다.");
            }
            renderCustomCategories();
        }, (error) => {
            console.error("❌ 카테고리 불러오기 실패:", error);
        });
    } catch (error) {
        console.error("❌ 카테고리 불러오기 실패:", error);
    }
}

// 커스텀 카테고리 렌더링
function renderCustomCategories() {
    if (!customCategoriesList) return;

    if (customCategories.length === 0) {
        customCategoriesList.innerHTML = '<li class="empty-categories">카테고리가 없습니다</li>';
        return;
    }

    customCategoriesList.innerHTML = customCategories.map(cat => `
        <li class="custom-category-item">
            <a href="#" class="custom-category-link ${currentPage === cat.id ? 'active' : ''}" data-page="${cat.id}">
                <span class="custom-category-icon">${cat.icon || '📁'}</span>
                <span class="custom-category-name">${escapeHtml(cat.name)}</span>
            </a>
            <button class="btn-delete-category" onclick="window.openDeleteCategoryModal('${cat.id}')" title="카테고리 삭제">×</button>
        </li>
    `).join('');

    // 카테고리 클릭 이벤트 추가
    customCategoriesList.querySelectorAll('.custom-category-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page) {
                if (isEditCategoryMode) {
                    // 수정 모드일 때는 수정 모달 열기
                    openEditCategoryModal(page);
                } else {
                    // 일반 모드일 때는 페이지 전환
                    switchPage(page);
                }
            }
        });
    });
}

// 카테고리 추가 모달 열기
function openCategoryModal() {
    if (categoryModal && categoryName) {
        editingCategoryId = null; // 추가 모드
        categoryName.value = '';
        selectedEmoji = '📁';

        // 이모지 선택 초기화
        if (emojiPicker) {
            emojiPicker.querySelectorAll('.emoji-option').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.emoji === '📁');
            });
        }

        // 모달 제목 설정
        const modalTitle = categoryModal.querySelector('h2');
        if (modalTitle) modalTitle.textContent = '카테고리 추가';

        categoryModal.classList.add('show');
        categoryName.focus();
    }
}

// 카테고리 추가 모달 닫기
function closeCategoryModal() {
    if (categoryModal) {
        categoryModal.classList.remove('show');
    }
    categoryName.value = '';
    selectedEmoji = '📁';
    editingCategoryId = null;
}

// 카테고리 저장 (추가 또는 수정)
async function saveCategory() {
    if (editingCategoryId) {
        // 수정 모드
        await saveEditCategory();
    } else {
        // 추가 모드
        await addNewCategory();
    }
}

// 새로운 카테고리 추가
async function addNewCategory() {
    if (!categoryName) return;

    const name = categoryName.value.trim();
    if (name === '') {
        alert('카테고리 이름을 입력해주세요!');
        return;
    }

    if (!database) {
        alert("데이터베이스 연결에 문제가 있습니다.");
        return;
    }

    try {
        const categoriesRef = ref(database, 'categories');
        const newCategoryRef = push(categoriesRef);
        const categoryData = {
            name: name,
            icon: selectedEmoji,
            createdAt: Date.now()
        };

        await set(newCategoryRef, categoryData);
        console.log("✅ 카테고리 추가 완료!");

        closeCategoryModal();
    } catch (error) {
        console.error("❌ 카테고리 추가 실패:", error);
        alert("카테고리 추가 중 오류가 발생했습니다: " + error.message);
    }
}

// 카테고리 삭제 모달 열기
function openDeleteCategoryModal(id) {
    const category = customCategories.find(c => c.id === id);
    if (category && deleteCategoryModal && deleteCategoryName) {
        deletingCategoryId = id;
        deleteCategoryName.textContent = `"${category.icon} ${category.name}"`;
        deleteCategoryModal.classList.add('show');
    }
}

// 카테고리 삭제 모달 닫기
function closeDeleteCategoryModal() {
    if (deleteCategoryModal) {
        deleteCategoryModal.classList.remove('show');
    }
    deletingCategoryId = null;
}

// 카테고리 삭제 실행
async function confirmDeleteCategory() {
    if (!deletingCategoryId) return;

    try {
        // 카테고리 삭제
        const categoryRef = ref(database, `categories/${deletingCategoryId}`);
        await remove(categoryRef);

        // 해당 카테고리의 할일도 삭제
        const todosRef = ref(database, `todos/custom/${deletingCategoryId}`);
        await remove(todosRef);

        console.log("✅ 카테고리 삭제 완료!");

        // 현재 페이지가 삭제된 카테고리면 today로 이동
        if (currentPage === deletingCategoryId) {
            switchPage('today');
        }

        closeDeleteCategoryModal();
    } catch (error) {
        console.error("❌ 카테고리 삭제 실패:", error);
        alert("카테고리 삭제 중 오류가 발생했습니다: " + error.message);
    }
}

// 카테고리 수정 모드 토글
function toggleEditCategoryMode() {
    isEditCategoryMode = !isEditCategoryMode;

    if (editCategoryBtn) {
        editCategoryBtn.classList.toggle('active', isEditCategoryMode);
        editCategoryBtn.textContent = isEditCategoryMode ? '✓' : '✎';
        editCategoryBtn.title = isEditCategoryMode ? '수정 완료' : '카테고리 수정';
    }

    // 모든 카테고리 링크에 수정 모드 클래스 토글
    document.querySelectorAll('.custom-category-link').forEach(link => {
        link.classList.toggle('edit-mode', isEditCategoryMode);
    });

    // 수정 모드일 때는 삭제 버튼 숨기기
    document.querySelectorAll('.btn-delete-category').forEach(btn => {
        btn.style.opacity = isEditCategoryMode ? '0' : '';
    });

    console.log(`카테고리 수정 모드: ${isEditCategoryMode ? '활성화' : '비활성화'}`);
}

// 카테고리 수정 모달 열기
function openEditCategoryModal(id) {
    if (!isEditCategoryMode) return;

    const category = customCategories.find(c => c.id === id);
    if (category && categoryModal && categoryName) {
        editingCategoryId = id;
        categoryName.value = category.name;
        selectedEmoji = category.icon || '📁';

        // 이모지 선택 초기화
        if (emojiPicker) {
            emojiPicker.querySelectorAll('.emoji-option').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.emoji === selectedEmoji);
            });
        }

        // 모달 제목 변경
        const modalTitle = categoryModal.querySelector('h2');
        if (modalTitle) modalTitle.textContent = '카테고리 수정';

        categoryModal.classList.add('show');
        categoryName.focus();
        categoryName.select();
    }
}

// 카테고리 수정 저장
async function saveEditCategory() {
    if (!editingCategoryId) return;

    const name = categoryName.value.trim();
    if (name === '') {
        alert('카테고리 이름을 입력해주세요!');
        return;
    }

    try {
        const categoryRef = ref(database, `categories/${editingCategoryId}`);
        await update(categoryRef, {
            name: name,
            icon: selectedEmoji
        });

        console.log("✅ 카테고리 수정 완료!");
        closeCategoryModal();
        toggleEditCategoryMode(); // 수정 모드 종료
    } catch (error) {
        console.error("❌ 카테고리 수정 실패:", error);
        alert("카테고리 수정 중 오류가 발생했습니다: " + error.message);
    }
}

// 필터링된 할일 목록 가져오기 (완료된 항목은 맨 아래로)
function getFilteredTodos() {
    let filtered;
    switch (currentFilter) {
        case 'active':
            filtered = todos.filter(todo => !todo.completed);
            break;
        case 'completed':
            filtered = todos.filter(todo => todo.completed);
            break;
        default:
            filtered = [...todos];
            break;
    }
    
    // 완료된 항목을 맨 아래로 정렬
    return filtered.sort((a, b) => {
        if (a.completed === b.completed) {
            // 같은 상태면 생성 시간순 (최신이 위로)
            return (b.createdAt || 0) - (a.createdAt || 0);
        }
        // 미완료가 위로, 완료가 아래로
        return a.completed ? 1 : -1;
    });
}

// 할일 목록 렌더링
function renderTodos() {
    if (!todoList || !emptyState) return;

    const filteredTodos = getFilteredTodos();
    
    if (filteredTodos.length === 0) {
        todoList.style.display = 'none';
        emptyState.classList.add('show');
    } else {
        todoList.style.display = 'block';
        emptyState.classList.remove('show');
        
        todoList.innerHTML = filteredTodos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="btn-icon btn-complete ${todo.completed ? 'is-completed' : ''}" onclick="window.toggleTodo('${todo.id}')" title="${todo.completed ? '완료 취소' : '완료'}">
                        ✓
                    </button>
                    <button class="btn-icon btn-edit" onclick="window.openEditModal('${todo.id}')" title="수정">
                        ✎
                    </button>
                    <button class="btn-icon btn-delete" onclick="window.deleteTodo('${todo.id}')" title="삭제">
                        🗑
                    </button>
                </div>
            </li>
        `).join('');
    }

    updateStats();
}

// XSS 방지를 위한 HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 필터 변경
function setFilter(filter) {
    currentFilter = filter;
    if (filterBtns) {
        filterBtns.forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    renderTodos();
}

// 페이지 전환
function switchPage(page) {
    if (currentPage === page) return;
    
    currentPage = page;
    
    // 기본 사이드바 활성화 업데이트
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // 커스텀 카테고리 활성화 업데이트
    document.querySelectorAll('.custom-category-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // 페이지 제목 업데이트
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const config = getPageConfig(page);
    
    if (pageTitle) pageTitle.textContent = config.title;
    if (pageSubtitle) pageSubtitle.textContent = config.subtitle;
    
    // 필터 리셋
    currentFilter = 'all';
    if (filterBtns) {
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'all');
        });
    }
    
    // 컨테이너 애니메이션
    const container = document.querySelector('.container');
    if (container) {
        container.style.animation = 'none';
        container.offsetHeight; // 리플로우 트리거
        container.style.animation = 'slideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    
    // 새 페이지 데이터 로드
    loadTodos();
}

// 현재 날짜 표시
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'short'
        };
        dateElement.textContent = now.toLocaleDateString('ko-KR', options);
    }
}

// DOM 요소 초기화 및 이벤트 리스너 설정
function initializeAppUI() {
    // DOM 요소 가져오기
    todoInput = document.getElementById('todoInput');
    addBtn = document.getElementById('addBtn');
    todoList = document.getElementById('todoList');
    emptyState = document.getElementById('emptyState');
    editModal = document.getElementById('editModal');
    editInput = document.getElementById('editInput');
    saveBtn = document.getElementById('saveBtn');
    cancelBtn = document.getElementById('cancelBtn');
    closeBtn = document.querySelector('#editModal .close');
    filterBtns = document.querySelectorAll('.filter-btn');
    
    // 삭제 모달 DOM 요소
    deleteModal = document.getElementById('deleteModal');
    deleteItemText = document.getElementById('deleteItemText');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    deleteCloseBtn = document.getElementById('deleteCloseBtn');
    
    // 카테고리 관련 DOM 요소
    categoryModal = document.getElementById('categoryModal');
    categoryName = document.getElementById('categoryName');
    saveCategoryBtn = document.getElementById('saveCategoryBtn');
    cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    categoryCloseBtn = document.getElementById('categoryCloseBtn');
    customCategoriesList = document.getElementById('customCategoriesList');
    addCategoryBtn = document.getElementById('addCategoryBtn');
    editCategoryBtn = document.getElementById('editCategoryBtn');
    emojiPicker = document.getElementById('emojiPicker');
    
    // 카테고리 삭제 모달 DOM 요소
    deleteCategoryModal = document.getElementById('deleteCategoryModal');
    deleteCategoryName = document.getElementById('deleteCategoryName');
    confirmDeleteCategoryBtn = document.getElementById('confirmDeleteCategoryBtn');
    cancelDeleteCategoryBtn = document.getElementById('cancelDeleteCategoryBtn');
    deleteCategoryCloseBtn = document.getElementById('deleteCategoryCloseBtn');

    // DOM 요소 확인
    if (!todoInput || !addBtn) {
        console.error("❌ DOM 요소를 찾을 수 없습니다.");
        return false;
    }

    console.log("✅ DOM 요소 로드 완료");

    // 추가 버튼 클릭 이벤트
    addBtn.addEventListener('click', function(e) {
        e.preventDefault();
        addTodo();
    });

    // 입력 필드 Enter 키 이벤트
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTodo();
        }
    });

    // 모달 이벤트
    if (saveBtn) saveBtn.addEventListener('click', saveEdit);
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
    if (closeBtn) closeBtn.addEventListener('click', closeEditModal);

    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeEditModal();
            }
        });
    }

    if (editInput) {
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            }
        });
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeEditModal();
            }
        });
    }

    // 삭제 모달 이벤트
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteCloseBtn) deleteCloseBtn.addEventListener('click', closeDeleteModal);
    
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                closeDeleteModal();
            }
        });
    }

    // 필터 버튼 클릭 이벤트
    if (filterBtns && filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setFilter(btn.dataset.filter);
            });
        });
    }

    // 사이드바 네비게이션 이벤트
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page) {
                switchPage(page);
            }
        });
    });

    // 카테고리 추가 버튼 이벤트
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', openCategoryModal);
    }

    // 카테고리 수정 버튼 이벤트
    if (editCategoryBtn) {
        editCategoryBtn.addEventListener('click', toggleEditCategoryMode);
    }
    
    // 카테고리 모달 이벤트
    if (saveCategoryBtn) saveCategoryBtn.addEventListener('click', saveCategory);
    if (cancelCategoryBtn) cancelCategoryBtn.addEventListener('click', closeCategoryModal);
    if (categoryCloseBtn) categoryCloseBtn.addEventListener('click', closeCategoryModal);
    
    if (categoryModal) {
        categoryModal.addEventListener('click', (e) => {
            if (e.target === categoryModal) {
                closeCategoryModal();
            }
        });
    }
    
    if (categoryName) {
        categoryName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveCategory();
            }
        });
        categoryName.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeCategoryModal();
            }
        });
    }
    
    // 이모지 선택 이벤트
    if (emojiPicker) {
        emojiPicker.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', () => {
                emojiPicker.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedEmoji = btn.dataset.emoji;
            });
        });
    }
    
    // 카테고리 삭제 모달 이벤트
    if (confirmDeleteCategoryBtn) confirmDeleteCategoryBtn.addEventListener('click', confirmDeleteCategory);
    if (cancelDeleteCategoryBtn) cancelDeleteCategoryBtn.addEventListener('click', closeDeleteCategoryModal);
    if (deleteCategoryCloseBtn) deleteCategoryCloseBtn.addEventListener('click', closeDeleteCategoryModal);
    
    if (deleteCategoryModal) {
        deleteCategoryModal.addEventListener('click', (e) => {
            if (e.target === deleteCategoryModal) {
                closeDeleteCategoryModal();
            }
        });
    }

    // 전역 함수로 export (HTML에서 onclick 사용을 위해)
    window.toggleTodo = toggleTodo;
    window.deleteTodo = deleteTodo;
    window.openEditModal = openEditModal;
    window.addTodo = addTodo;
    window.openDeleteCategoryModal = openDeleteCategoryModal;

    console.log("✅ 이벤트 리스너 설정 완료");
    return true;
}

// 페이지 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM 로드 완료");
    
    if (!initializeAppUI()) {
        console.error("❌ UI 초기화 실패");
        return;
    }

    // 현재 날짜 표시
    updateCurrentDate();

    // Firebase 초기화 확인 및 할일 로드
    if (database) {
        console.log("🚀 앱 초기화 시작...");
        loadCustomCategories(); // 커스텀 카테고리 먼저 로드
        loadTodos();
        if (todoInput) {
            todoInput.focus();
        }
        console.log("✅ 앱 초기화 완료");
    } else {
        console.error("❌ 앱 초기화 실패: 데이터베이스 연결 실패");
        setTimeout(() => {
            if (database) {
                loadCustomCategories();
                loadTodos();
                console.log("✅ Firebase 재연결 성공");
            } else {
                alert("Firebase 데이터베이스 연결에 실패했습니다. 페이지를 새로고침해주세요.");
            }
        }, 1000);
    }
});