const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 初始化数据库
const dbPath = path.join(__dirname, '../data/hospital.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
  console.log('数据库连接成功');
});

db.on('error', (err) => {
  console.error('数据库错误:', err);
});

// 创建所有表
db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    avatar TEXT,
    specialty TEXT,
    hospital TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 科室表
  db.run(`CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT,
    icon TEXT
  )`);

  // 问诊表
  db.run(`CREATE TABLE IF NOT EXISTS consultations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    doctor_id INTEGER,
    department_id INTEGER,
    type TEXT,
    status TEXT DEFAULT 'pending',
    complaint TEXT,
    fee REAL,
    payment_status TEXT DEFAULT 'unpaid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    ended_at DATETIME,
    FOREIGN KEY(patient_id) REFERENCES users(id),
    FOREIGN KEY(doctor_id) REFERENCES users(id),
    FOREIGN KEY(department_id) REFERENCES departments(id)
  )`);

  // 处方表
  db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultation_id INTEGER,
    doctor_id INTEGER,
    content TEXT,
    medicines TEXT,
    status TEXT DEFAULT 'pending',
    review_by INTEGER,
    review_status TEXT,
    review_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(consultation_id) REFERENCES consultations(id),
    FOREIGN KEY(doctor_id) REFERENCES users(id),
    FOREIGN KEY(review_by) REFERENCES users(id)
  )`);

  // 订单表
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultation_id INTEGER,
    patient_id INTEGER,
    amount REAL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    FOREIGN KEY(consultation_id) REFERENCES consultations(id),
    FOREIGN KEY(patient_id) REFERENCES users(id)
  )`);

  // 聊天消息表
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultation_id INTEGER,
    sender_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(consultation_id) REFERENCES consultations(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  )`);

  // 医生时间表
  db.run(`CREATE TABLE IF NOT EXISTS doctor_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER,
    date TEXT,
    time_slot TEXT,
    status TEXT DEFAULT 'available',
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  )`);
});

// API路由

// 初始化数据 - 添加默认科室和用户
app.get('/api/init', (req, res) => {
  db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
    if (rows && rows[0].count > 0) {
      return res.json({ message: '数据已存在' });
    }

    // 添加默认科室
    const departments = ['内科', '外科', '妇产科', '儿科', '皮肤科', '心内科'];
    departments.forEach(dept => {
      db.run('INSERT INTO departments (name, description) VALUES (?, ?)',
        [dept, dept + '专家']);
    });

    // 添加默认用户
    const defaultUsers = [
      { username: 'admin', password: 'admin123', role: 'admin', name: '管理员' },
      { username: 'patient1', password: 'patient123', role: 'patient', name: '王患者' },
      { username: 'patient2', password: 'patient123', role: 'patient', name: '李患者' },
      { username: 'doctor1', password: 'doctor123', role: 'doctor', name: '张医生', specialty: '内科' },
      { username: 'doctor2', password: 'doctor123', role: 'doctor', name: '李医生', specialty: '外科' },
      { username: 'pharmacist1', password: 'pharmacist123', role: 'pharmacist', name: '王药师' }
    ];

    defaultUsers.forEach(user => {
      db.run(
        'INSERT INTO users (username, password, role, name, specialty) VALUES (?, ?, ?, ?, ?)',
        [user.username, user.password, user.role, user.name, user.specialty || null]
      );
    });

    res.json({ message: '初始化成功' });
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  db.get('SELECT 1 as ok', (err, row) => {
    if (err) {
      console.error('数据库健康检查失败:', err);
      return res.status(500).json({ status: 'error', message: '数据库连接失败' });
    }
    res.json({ status: 'ok', database: 'connected' });
  });
});

// 用户认证
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // 输入验证
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  db.get('SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password], (err, row) => {
    if (err) {
      console.error('登录错误:', err);
      return res.status(500).json({ error: '登录失败，请稍后重试' });
    }
    if (row) {
      res.json({ success: true, user: row });
    } else {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  });
});

app.post('/api/register', (req, res) => {
  const { username, password, role, name } = req.body;

  // 输入验证
  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: '缺少必填字段: username, password, role, name' });
  }

  // 验证角色
  const validRoles = ['patient', 'doctor', 'pharmacist', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: '角色无效，可选值: patient, doctor, pharmacist, admin' });
  }

  db.run('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
    [username, password, role, name], function(err) {
    if (err) {
      // 根据错误类型返回不同消息
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: '用户名已存在' });
      }
      console.error('注册错误:', err);
      return res.status(500).json({ error: '注册失败，请稍后重试' });
    }
    res.json({ success: true, id: this.lastID, user: { id: this.lastID, username, role, name } });
  });
});

// 获取所有用户
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 获取医生列表
app.get('/api/doctors', (req, res) => {
  db.all('SELECT * FROM users WHERE role = ?', ['doctor'], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 获取科室列表
app.get('/api/departments', (req, res) => {
  db.all('SELECT * FROM departments', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 问诊管理
app.post('/api/consultations', (req, res) => {
  const { patient_id, doctor_id, department_id, type, complaint, fee } = req.body;

  // 输入验证
  if (!patient_id || !doctor_id || !type || fee === undefined) {
    return res.status(400).json({ error: '缺少必填字段: patient_id, doctor_id, type, fee' });
  }

  db.run(
    'INSERT INTO consultations (patient_id, doctor_id, department_id, type, complaint, fee) VALUES (?, ?, ?, ?, ?, ?)',
    [patient_id, doctor_id, department_id || null, type, complaint || '', fee],
    function(err) {
      if (err) {
        console.error('创建问诊错误:', err);
        return res.status(500).json({ error: '创建问诊失败，请稍后重试' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get('/api/consultations', (req, res) => {
  const { patient_id, doctor_id, status } = req.query;
  let query = `SELECT c.*,
    p.name as patient_name,
    d.name as doctor_name,
    dept.name as department_name
    FROM consultations c
    LEFT JOIN users p ON c.patient_id = p.id
    LEFT JOIN users d ON c.doctor_id = d.id
    LEFT JOIN departments dept ON c.department_id = dept.id`;
  let params = [];

  if (patient_id) {
    query += ' WHERE c.patient_id = ?';
    params.push(patient_id);
  } else if (doctor_id) {
    query += ' WHERE c.doctor_id = ?';
    params.push(doctor_id);
  } else if (status) {
    query += ' WHERE c.status = ?';
    params.push(status);
  }

  query += ' ORDER BY c.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/consultations/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT c.*,
    p.name as patient_name,
    d.name as doctor_name,
    dept.name as department_name
    FROM consultations c
    LEFT JOIN users p ON c.patient_id = p.id
    LEFT JOIN users d ON c.doctor_id = d.id
    LEFT JOIN departments dept ON c.department_id = dept.id
    WHERE c.id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) res.json(row);
    else res.status(404).json({ error: '问诊不存在' });
  });
});

app.put('/api/consultations/:id', (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;
  let updates = [];
  let params = [];

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (payment_status !== undefined) {
    updates.push('payment_status = ?');
    params.push(payment_status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有更新字段' });
  }

  params.push(id);
  db.run(`UPDATE consultations SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 处方管理
app.post('/api/prescriptions', (req, res) => {
  const { consultation_id, doctor_id, content, medicines } = req.body;

  // 输入验证
  if (!consultation_id || !doctor_id) {
    return res.status(400).json({ error: '缺少必填字段: consultation_id, doctor_id' });
  }

  db.run(
    'INSERT INTO prescriptions (consultation_id, doctor_id, content, medicines) VALUES (?, ?, ?, ?)',
    [consultation_id, doctor_id, content || '', medicines || ''],
    function(err) {
      if (err) {
        console.error('创建处方错误:', err);
        return res.status(500).json({ error: '创建处方失败，请稍后重试' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get('/api/prescriptions', (req, res) => {
  const { consultation_id, status } = req.query;
  let query = `SELECT p.*,
    c.id as consultation_id,
    d.name as doctor_name
    FROM prescriptions p
    LEFT JOIN consultations c ON p.consultation_id = c.id
    LEFT JOIN users d ON p.doctor_id = d.id`;
  let params = [];

  if (consultation_id) {
    query += ' WHERE p.consultation_id = ?';
    params.push(consultation_id);
  } else if (status) {
    query += ' WHERE p.status = ?';
    params.push(status);
  }

  query += ' ORDER BY p.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/prescriptions/:id', (req, res) => {
  const { id } = req.params;
  const { status, review_status, review_by } = req.body;
  let updates = [];
  let params = [];

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (review_status !== undefined) {
    updates.push('review_status = ?');
    params.push(review_status);
  }
  if (review_by !== undefined) {
    updates.push('review_by = ?, review_at = CURRENT_TIMESTAMP');
    params.push(review_by);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有更新字段' });
  }

  params.push(id);
  db.run(`UPDATE prescriptions SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 订单管理
app.post('/api/orders', (req, res) => {
  const { consultation_id, patient_id, amount, payment_method } = req.body;

  // 输入验证
  if (!consultation_id || !patient_id || amount === undefined || !payment_method) {
    return res.status(400).json({ error: '缺少必填字段: consultation_id, patient_id, amount, payment_method' });
  }

  db.run(
    'INSERT INTO orders (consultation_id, patient_id, amount, payment_method) VALUES (?, ?, ?, ?)',
    [consultation_id, patient_id, amount, payment_method],
    function(err) {
      if (err) {
        console.error('创建订单错误:', err);
        return res.status(500).json({ error: '创建订单失败，请稍后重试' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get('/api/orders', (req, res) => {
  const { patient_id } = req.query;
  let query = `SELECT o.*, c.type, c.status FROM orders o
    LEFT JOIN consultations c ON o.consultation_id = c.id`;
  let params = [];

  if (patient_id) {
    query += ' WHERE o.patient_id = ?';
    params.push(patient_id);
  }

  query += ' ORDER BY o.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.run('UPDATE orders SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 消息管理
app.post('/api/messages', (req, res) => {
  const { consultation_id, sender_id, content } = req.body;

  // 输入验证
  if (!consultation_id || !sender_id || !content) {
    return res.status(400).json({ error: '缺少必填字段: consultation_id, sender_id, content' });
  }

  db.run(
    'INSERT INTO messages (consultation_id, sender_id, content) VALUES (?, ?, ?)',
    [consultation_id, sender_id, content],
    function(err) {
      if (err) {
        console.error('发送消息错误:', err);
        return res.status(500).json({ error: '发送消息失败，请稍后重试' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get('/api/messages/:consultation_id', (req, res) => {
  const { consultation_id } = req.params;
  db.all(`SELECT m.*, u.name as sender_name FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.consultation_id = ?
    ORDER BY m.created_at ASC`, [consultation_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 统计信息
app.get('/api/stats', (req, res) => {
  const stats = {};
  db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['patient'], (err, row) => {
    stats.patients = row.count;
    db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['doctor'], (err, row) => {
      stats.doctors = row.count;
      db.get('SELECT COUNT(*) as count FROM consultations', (err, row) => {
        stats.consultations = row.count;
        db.get('SELECT COUNT(*) as count FROM consultations WHERE status = ?', ['completed'], (err, row) => {
          stats.completed = row.count;
          db.get('SELECT SUM(fee) as total FROM consultations', (err, row) => {
            stats.revenue = row.total || 0;
            res.json(stats);
          });
        });
      });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
