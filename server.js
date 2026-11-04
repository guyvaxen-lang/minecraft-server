const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const dbFile = path.join(__dirname, 'users.db');

// חיבור למסד הנתונים בצורה סינכרונית ובטוחה ללינוקס
const db = new Database(dbFile);
console.log('Connected to SQLite database.');

// יצירת טבלת המשתמשים
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
`).run();

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ success: false, message: 'Имя пользователя и пароль обязательны' });
    }

    try {
        const stmt = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`);
        stmt.run(username, password);
        res.json({ success: { success: true, message: 'Регистрация успешна!' } });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.json({ success: false, message: 'Пользователь уже существует' });
        }
        console.error('Registration error:', err.message);
        return res.json({ success: false, message: 'Ошибка сервера' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ success: false, message: 'Заполните все поля' });
    }

    try {
        const stmt = db.prepare(`SELECT * FROM users WHERE username = ? AND password = ?`);
        const row = stmt.get(username, password);

        if (row) {
            res.json({ success: true, message: 'Успешный вход!', username: row.username });
        } else {
            res.json({ success: false, message: 'Неверное имя пользователя или пароль' });
        }
    } catch (err) {
        console.error('Login error:', err.message);
        return res.json({ success: false, message: 'Ошибка сервера' });
    }
});

// Protect index.html route explicitly on server or fallback
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});