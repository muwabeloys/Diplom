import { Router } from 'express';
import db from '../config/database.js';
import { auth, adminAuth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// ============================================================
// СТРАНИЦЫ АДМИНКИ (HTML)
// ============================================================

// GET /admin — главная страница (с проверкой роли через JS)
router.get('/', (req, res) => {
    res.send(getAdminHTML());
});

// GET /admin/login — страница входа
router.get('/login', (req, res) => {
    res.send(getLoginHTML());
});

// ============================================================
// API ДЛЯ АДМИНКИ
// ============================================================

// Статистика
router.get('/api/stats', auth, adminAuth, (req, res) => {
    try {
        const stats = {
            users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
            words: db.prepare('SELECT COUNT(*) as count FROM words').get().count,
            admins: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin').count,
            byCategory: db.prepare(`
        SELECT category, COUNT(*) as count 
        FROM words GROUP BY category
      `).all(),
            topUsers: db.prepare(`
        SELECT u.username, COUNT(w.id) as total,
               SUM(CASE WHEN w.level >= 3 THEN 1 ELSE 0 END) as learned
        FROM users u LEFT JOIN words w ON u.id = w.user_id
        GROUP BY u.id ORDER BY learned DESC LIMIT 10
      `).all()
        };
        res.json({ stats });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Список пользователей
router.get('/api/users', auth, adminAuth, (req, res) => {
    const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.role, u.created_at,
           COUNT(w.id) as total_words,
           SUM(CASE WHEN w.level >= 3 THEN 1 ELSE 0 END) as learned_words
    FROM users u LEFT JOIN words w ON u.id = w.user_id
    GROUP BY u.id ORDER BY u.id
  `).all();
    res.json({ users });
});

// Удалить пользователя
router.delete('/api/users/:id', auth, adminAuth, (req, res) => {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Не найден' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Нельзя удалить админа' });

    db.prepare('DELETE FROM words WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'Пользователь удалён' });
});

// Сменить роль
router.put('/api/users/:id/role', auth, adminAuth, (req, res) => {
    const { role } = req.body;
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    res.json({ message: 'Роль обновлена' });
});

// Слова пользователя
router.get('/api/users/:id/words', auth, adminAuth, (req, res) => {
    const words = db.prepare('SELECT * FROM words WHERE user_id = ?').all(req.params.id);
    res.json({ words });
});

// ============================================================
// HTML-ШАБЛОНЫ
// ============================================================

function getLoginHTML() {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .login-card { background: white; padding: 40px; border-radius: 16px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    h1 { text-align: center; margin-bottom: 8px; }
    p { text-align: center; color: #666; margin-bottom: 24px; }
    input { width: 100%; padding: 14px; margin-bottom: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; }
    input:focus { outline: none; border-color: #667eea; }
    button { width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
    button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102,126,234,0.4); }
    .error { background: #ffe0e0; color: #d32f2f; padding: 10px; border-radius: 8px; margin-bottom: 12px; display: none; }
  </style>
</head>
<body>
  <div class="login-card">
    <h1>⚙️ Admin Panel</h1>
    <p>Вход для администраторов</p>
    <div class="error" id="error"></div>
    <form id="loginForm">
      <input type="email" name="email" placeholder="Email" required>
      <input type="password" name="password" placeholder="Пароль" required>
      <button type="submit">Войти</button>
    </form>
  </div>
  <script>
    document.getElementById('loginForm').onsubmit = async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('error');
        errorEl.style.display = 'none';
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: e.target.email.value,
                    password: e.target.password.value
                })
            });
            
            const data = await res.json();
            
            if (data.token) {
                localStorage.setItem('admin_token', data.token);
                window.location.href = '/admin';
            } else {
                errorEl.textContent = data.error || 'Ошибка входа';
                errorEl.style.display = 'block';
            }
        } catch(err) {
            errorEl.textContent = 'Ошибка соединения с сервером';
            errorEl.style.display = 'block';
        }
    };
</script>
</body>
</html>`;
}

function getAdminHTML() {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel — Language Learning</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; }
    
    .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 250px; background: #1a1a2e; color: white; padding: 20px; }
    .sidebar h2 { margin-bottom: 30px; font-size: 20px; }
    .sidebar nav a { display: block; padding: 12px 15px; color: #ccc; text-decoration: none; border-radius: 8px; margin-bottom: 5px; cursor: pointer; }
    .sidebar nav a:hover, .sidebar nav a.active { background: rgba(255,255,255,0.1); color: white; }
    .sidebar .logout { margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.1); border: none; color: #ff6b6b; width: 100%; border-radius: 8px; cursor: pointer; }
    
    .main { margin-left: 250px; padding: 30px; }
    .header { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 24px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .stat-card h3 { font-size: 13px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .stat-card .value { font-size: 32px; font-weight: bold; color: #667eea; }
    
    .card { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .card h3 { margin-bottom: 15px; }
    
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 13px; color: #666; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #f0f0f0; }
    tr:hover { background: #f8f9fa; }
    
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; color: white; }
    .badge-admin { background: #e74c3c; }
    .badge-user { background: #27ae60; }
    
    .btn { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .btn-danger { background: #e74c3c; color: white; }
    .btn-info { background: #3498db; color: white; }
    .btn-sm { padding: 4px 8px; font-size: 11px; }
    
    .hidden { display: none; }

    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000; }
    .modal.show { display: flex; }
    .modal-content { background: white; padding: 30px; border-radius: 16px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
    .modal-close { position: absolute; top: 15px; right: 15px; background: #f0f0f0; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; }
  </style>
</head>
<body>
  <div class="sidebar">
    <h2>⚙️ Admin Panel</h2>
    <nav>
      <a onclick="showTab('dashboard')" class="active" id="nav-dashboard">📊 Дашборд</a>
      <a onclick="showTab('users')" id="nav-users">👥 Пользователи</a>
    </nav>
    <button class="logout" onclick="logout()">🚪 Выйти</button>
  </div>

  <div class="main">
    <div id="tab-dashboard">
      <div class="header">
        <h1>Дашборд</h1>
        <span id="adminName"></span>
      </div>
      <div class="stats-grid" id="statsGrid"></div>
      <div class="card">
        <h3>🏆 Топ пользователей</h3>
        <table id="topUsersTable"><tbody></tbody></table>
      </div>
    </div>

    <div id="tab-users" class="hidden">
      <div class="header">
        <h1>Пользователи</h1>
      </div>
      <div class="card">
        <table id="usersTable"><tbody></tbody></table>
      </div>
    </div>
  </div>

  <div class="modal" id="wordsModal">
    <div class="modal-content">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <h3>📚 Слова пользователя</h3>
      <table id="wordsTable"><tbody></tbody></table>
    </div>
  </div>

  <script>
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = '/admin/login';
    }

    // Проверяем, что токен валидный и пользователь — админ
    async function checkAccess() {
        try {
            const res = await fetch('/api/auth/profile', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) {
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                return false;
            }
            const data = await res.json();
            document.getElementById('adminName').textContent = '👤 ' + data.user.username;
            
            // Проверяем роль через запрос к админскому API
            const adminCheck = await fetch('/admin/api/stats', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!adminCheck.ok) {
                alert('У вас нет прав администратора!');
                window.location.href = '/';
                return false;
            }
            return true;
        } catch(e) {
            localStorage.removeItem('admin_token');
            window.location.href = '/admin/login';
            return false;
        }
    }

    const categoryNames = { basics: '📝 Основы', food: '🍽️ Еда', travel: '✈️ Путешествия', work: '💼 Работа', hobbies: '🎨 Хобби' };

    async function api(url, method = 'GET', body = null) {
        const opts = { 
            method, 
            headers: { 
                'Authorization': 'Bearer ' + token, 
                'Content-Type': 'application/json' 
            } 
        };
        if (body) opts.body = JSON.stringify(body);
        
        try {
            const res = await fetch(url, opts);
            if (res.status === 403) { 
                alert('Доступ запрещён! Только для администратора.');
                logout(); 
                return null; 
            }
            if (res.status === 401) {
                logout();
                return null;
            }
            return res.json();
        } catch(e) {
            console.error('API Error:', e);
            return null;
        }
    }

    async function loadDashboard() {
        const hasAccess = await checkAccess();
        if (!hasAccess) return;
        
        const data = await api('/admin/api/stats');
        if (!data) return;
        
        const s = data.stats;
        document.getElementById('statsGrid').innerHTML = 
            '<div class="stat-card"><h3>Пользователи</h3><div class="value">'+s.users+'</div></div>' +
            '<div class="stat-card"><h3>Слова</h3><div class="value">'+s.words+'</div></div>' +
            '<div class="stat-card"><h3>Админы</h3><div class="value">'+s.admins+'</div></div>' +
            '<div class="stat-card"><h3>Категорий</h3><div class="value">'+s.byCategory.length+'</div></div>';

        let html = '';
        if (s.topUsers && s.topUsers.length > 0) {
            s.topUsers.forEach(u => {
                html += '<tr><td>'+u.username+'</td><td>'+u.total+' слов</td><td>'+u.learned+' изучено</td></tr>';
            });
        } else {
            html = '<tr><td colspan="3">Нет данных</td></tr>';
        }
        document.querySelector('#topUsersTable tbody').innerHTML = html;
    }

    async function loadUsers() {
        const data = await api('/admin/api/users');
        if (!data) return;
        
        let html = '';
        if (data.users && data.users.length > 0) {
            data.users.forEach(u => {
                html += '<tr>' +
                    '<td>'+u.id+'</td>' +
                    '<td><strong>'+u.username+'</strong></td>' +
                    '<td>'+u.email+'</td>' +
                    '<td><span class="badge badge-'+(u.role === 'admin' ? 'admin' : 'user')+'">'+u.role+'</span></td>' +
                    '<td>'+u.total_words+' / '+u.learned_words+'</td>' +
                    '<td>'+new Date(u.created_at).toLocaleDateString()+'</td>' +
                    '<td>' +
                        '<button class="btn btn-info btn-sm" onclick="viewWords('+u.id+', \''+u.username+'\')">📚</button> ' +
                        (u.role !== 'admin' ? '<button class="btn btn-danger btn-sm" onclick="deleteUser('+u.id+')">🗑</button>' : '') +
                    '</td>' +
                '</tr>';
            });
        } else {
            html = '<tr><td colspan="7">Нет пользователей</td></tr>';
        }
        document.querySelector('#usersTable tbody').innerHTML = html;
    }

    function showTab(name) {
        document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));
        
        document.getElementById('tab-'+name).classList.remove('hidden');
        document.getElementById('nav-'+name).classList.add('active');
        
        if (name === 'dashboard') loadDashboard();
        if (name === 'users') loadUsers();
    }

    async function viewWords(id, name) {
        const data = await api('/admin/api/users/'+id+'/words');
        if (!data) return;
        
        let html = '';
        if (data.words && data.words.length > 0) {
            data.words.forEach(w => {
                html += '<tr><td><strong>'+w.word+'</strong></td><td>'+w.translation+'</td><td>'+(categoryNames[w.category]||w.category)+'</td><td>'+'⭐'.repeat(Math.min(w.level,5))+'</td><td>'+w.review_count+'</td></tr>';
            });
        } else {
            html = '<tr><td colspan="5">Нет слов</td></tr>';
        }
        document.querySelector('#wordsTable tbody').innerHTML = html;
        document.getElementById('wordsModal').classList.add('show');
    }

    function closeModal() {
        document.getElementById('wordsModal').classList.remove('show');
    }

    async function deleteUser(id) {
        if (!confirm('Удалить пользователя и все его слова?')) return;
        await api('/admin/api/users/'+id, 'DELETE');
        loadUsers();
    }

    function logout() {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
    }

    // Загрузка при старте
    loadDashboard();

    // Закрытие модалки по клику вне
    document.getElementById('wordsModal').onclick = (e) => {
        if (e.target === document.getElementById('wordsModal')) closeModal();
    };
</script>
</body>
</html>`;
}

export default router;