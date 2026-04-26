import { Router } from 'express';
import db from '../config/database.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = Router();

// ============================================================
// API
// ============================================================

router.get('/api/stats', auth, adminAuth, (req, res) => {
    try {
        const stats = {
            users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
            words: db.prepare('SELECT COUNT(*) as count FROM words').get().count,
            admins: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count,
        };
        res.json({ stats });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

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

router.delete('/api/users/:id', auth, adminAuth, (req, res) => {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Не найден' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Нельзя удалить админа' });

    db.prepare('DELETE FROM words WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'Пользователь удалён' });
});

router.get('/api/users/:id/words', auth, adminAuth, (req, res) => {
    const words = db.prepare('SELECT * FROM words WHERE user_id = ?').all(req.params.id);
    res.json({ words });
});

// ============================================================
// HTML СТРАНИЦЫ
// ============================================================

router.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Admin Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e, #16213e); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .login-card { background: white; padding: 40px; border-radius: 16px; width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    h1 { text-align: center; margin-bottom: 8px; }
    p { text-align: center; color: #666; margin-bottom: 24px; }
    input { width: 100%; padding: 14px; margin-bottom: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; }
    button { width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
    .error { color: #d32f2f; text-align: center; margin-top: 10px; display: none; }
  </style>
</head>
<body>
  <div class="login-card">
    <h1>⚙️ Admin Panel</h1>
    <p>Вход для администраторов</p>
    <div class="error" id="error"></div>
    <form id="loginForm">
      <input type="email" id="email" placeholder="Email" required>
      <input type="password" id="password" placeholder="Пароль" required>
      <button type="submit">Войти</button>
    </form>
  </div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const errorEl = document.getElementById('error');
      errorEl.style.display = 'none';
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
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
        errorEl.textContent = 'Ошибка сервера';
        errorEl.style.display = 'block';
      }
    });
  </script>
</body>
</html>`);
});

router.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Admin Panel</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; min-height: 100vh; }
    
    .sidebar { width: 250px; background: #1a1a2e; color: white; padding: 20px; position: fixed; top: 0; left: 0; bottom: 0; }
    .sidebar h2 { margin-bottom: 30px; }
    .sidebar a { display: block; padding: 12px; color: #ccc; text-decoration: none; border-radius: 8px; margin-bottom: 5px; cursor: pointer; }
    .sidebar a:hover, .sidebar a.active { background: rgba(255,255,255,0.1); color: white; }
    .sidebar button { margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.1); border: none; color: #ff6b6b; width: 100%; border-radius: 8px; cursor: pointer; }
    
    .main { margin-left: 250px; padding: 30px; flex: 1; }
    .header { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 24px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; }
    .stat-card h3 { font-size: 13px; color: #888; margin-bottom: 8px; }
    .stat-card .value { font-size: 32px; font-weight: bold; color: #667eea; }
    
    .card { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
    .card h3 { margin-bottom: 15px; }
    
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 13px; color: #666; }
    td { padding: 12px; border-bottom: 1px solid #f0f0f0; }
    tr:hover { background: #f8f9fa; }
    
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; color: white; }
    .badge-admin { background: #e74c3c; }
    .badge-user { background: #27ae60; }
    
    .btn { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; color: white; }
    .btn-danger { background: #e74c3c; }
    .btn-info { background: #3498db; }
    
    .hidden { display: none; }
    
    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000; }
    .modal.show { display: flex; }
    .modal-content { background: white; padding: 30px; border-radius: 16px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto; }
    .modal-close { float: right; background: #f0f0f0; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; }
  </style>
</head>
<body>
  <div class="sidebar">
    <h2>⚙️ Admin Panel</h2>
    <a class="active" id="nav-dashboard" onclick="showTab('dashboard')">📊 Дашборд</a>
    <a id="nav-users" onclick="showTab('users')">👥 Пользователи</a>
    <button onclick="logout()">🚪 Выйти</button>
  </div>

  <div class="main">
    <div class="header"><h1 id="pageTitle">Дашборд</h1></div>

    <div id="tab-dashboard">
      <div class="stats-grid">
        <div class="stat-card"><h3>Пользователи</h3><div class="value" id="statUsers">-</div></div>
        <div class="stat-card"><h3>Слова</h3><div class="value" id="statWords">-</div></div>
        <div class="stat-card"><h3>Админы</h3><div class="value" id="statAdmins">-</div></div>
      </div>
      <div class="card">
        <h3>📋 Последние пользователи</h3>
        <table id="usersTable"><tbody><tr><td>Загрузка...</td></tr></tbody></table>
      </div>
    </div>

    <div id="tab-users" class="hidden">
      <div class="card">
        <table id="allUsersTable"><tbody><tr><td>Загрузка...</td></tr></tbody></table>
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

    const catNames = { 
      basics: '📝 Основы', 
      food: '🍽️ Еда', 
      travel: '✈️ Путешествия', 
      work: '💼 Работа', 
      hobbies: '🎨 Хобби' 
    };

    // API хелпер
    async function api(url, method = 'GET', body = null) {
      const opts = { 
        method, 
        headers: { 
          'Authorization': 'Bearer ' + token, 
          'Content-Type': 'application/json' 
        } 
      };
      if (body) opts.body = JSON.stringify(body);
      
      const res = await fetch(url, opts);
      
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return null;
      }
      
      return res.json();
    }

    // Загрузка дашборда
    async function loadDashboard() {
      const data = await api('/admin/api/stats');
      if (!data) return;
      
      document.getElementById('statUsers').textContent = data.stats.users;
      document.getElementById('statWords').textContent = data.stats.words;
      document.getElementById('statAdmins').textContent = data.stats.admins;

      const usersData = await api('/admin/api/users');
      if (!usersData) return;
      
      // Рендер таблицы на дашборде
      let dashboardHtml = '';
      usersData.users.slice(0, 5).forEach(u => {
        dashboardHtml += renderUserRow(u);
      });
      document.querySelector('#usersTable tbody').innerHTML = dashboardHtml || '<tr><td>Нет пользователей</td></tr>';
      
      // Рендер таблицы на странице пользователей
      let allUsersHtml = '';
      usersData.users.forEach(u => {
        allUsersHtml += renderUserRow(u);
      });
      document.querySelector('#allUsersTable tbody').innerHTML = allUsersHtml || '<tr><td>Нет пользователей</td></tr>';
    }

    // Рендер строки пользователя
    function renderUserRow(u) {
      const deleteBtn = u.role !== 'admin' 
        ? '<button class="btn btn-danger" onclick="deleteUser(' + u.id + ', \'' + u.username + '\')">🗑️ Удалить</button>' 
        : '<span style="color:#999;font-size:12px;">Админ</span>';
      
      return '<tr>' +
        '<td><strong>' + u.username + '</strong></td>' +
        '<td>' + u.email + '</td>' +
        '<td><span class="badge ' + (u.role === 'admin' ? 'badge-admin' : 'badge-user') + '">' + u.role + '</span></td>' +
        '<td>' + u.total_words + ' / ' + u.learned_words + ' изучено</td>' +
        '<td>' +
          '<button class="btn btn-info" onclick="viewWords(' + u.id + ', \'' + u.username + '\')">📚 Слова</button> ' +
          deleteBtn +
        '</td>' +
      '</tr>';
    }

    // Переключение вкладок
    function showTab(name) {
      document.getElementById('tab-dashboard').classList.add('hidden');
      document.getElementById('tab-users').classList.add('hidden');
      document.getElementById('nav-dashboard').classList.remove('active');
      document.getElementById('nav-users').classList.remove('active');
      
      document.getElementById('tab-' + name).classList.remove('hidden');
      document.getElementById('nav-' + name).classList.add('active');
      document.getElementById('pageTitle').textContent = name === 'dashboard' ? 'Дашборд' : 'Пользователи';
    }

    // Просмотр слов пользователя
    async function viewWords(id, username) {
      const data = await api('/admin/api/users/' + id + '/words');
      if (!data) return;
      
      let html = '';
      if (data.words && data.words.length > 0) {
        data.words.forEach(w => {
          html += '<tr>' +
            '<td><strong>' + w.word + '</strong></td>' +
            '<td>' + w.translation + '</td>' +
            '<td>' + (catNames[w.category] || w.category) + '</td>' +
            '<td>' + '⭐'.repeat(Math.min(w.level, 5)) + '</td>' +
            '<td>' + w.review_count + ' повт.</td>' +
          '</tr>';
        });
      } else {
        html = '<tr><td colspan="5">У пользователя нет слов</td></tr>';
      }
      
      document.querySelector('#wordsTable tbody').innerHTML = html;
      document.getElementById('wordsModal').classList.add('show');
    }

    // Закрытие модалки
    function closeModal() {
      document.getElementById('wordsModal').classList.remove('show');
    }

    // Удаление пользователя
    async function deleteUser(id, username) {
      const confirmed = confirm('Вы уверены, что хотите удалить пользователя "' + username + '" и все его слова?');
      
      if (!confirmed) return;
      
      const result = await api('/admin/api/users/' + id, 'DELETE');
      
      if (result && result.message) {
        alert(result.message);
        loadDashboard(); // Перезагружаем список
      } else if (result && result.error) {
        alert('Ошибка: ' + result.error);
      }
    }

    // Выход
    function logout() {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }

    // Закрытие модалки по клику на фон
    document.getElementById('wordsModal').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });

    // Загрузка при старте
    loadDashboard();
</script>
</body>
</html>`);
});

export default router;