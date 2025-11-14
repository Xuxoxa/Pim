
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

app.use(helmet());
app.use(express.json());


app.use(cors({
  origin: [
    'http://127.0.0.1:5501',
    'http://localhost:5500',
    'http://localhost:3000',
    'https://xuxoxa.github.io/Pim/',    
  ],
  credentials: true
}));


function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  console.log('🟢 [REGISTER] Dados recebidos:', { name, email });

  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  const emailLower = email.trim().toLowerCase();

  db.get('SELECT id FROM users WHERE email = ?', [emailLower], (err, row) => {
    if (err) {
      console.error('❌ [REGISTER] Erro no banco:', err);
      return res.status(500).json({ error: 'Erro no banco' });
    }
    if (row) {
      console.warn('⚠️ [REGISTER] Já existe conta com esse email:', emailLower);
      return res.status(409).json({ error: 'Já existe uma conta com esse e-mail' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name || '', emailLower, hash],
      function (err2) {
        if (err2) {
          console.error('❌ [REGISTER] Erro ao criar usuário:', err2);
          return res.status(500).json({ error: 'Erro ao criar usuário' });
        }
        const userId = this.lastID;
        console.log('✅ [REGISTER] Usuário criado com ID:', userId);
        const token = generateToken({ id: userId, email: emailLower });
        res.json({ id: userId, email: emailLower, token });
      }
    );
  });
});


app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log('🟠 [LOGIN] Tentando login:', email);

  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  const emailLower = email.trim().toLowerCase();

  db.get(
    'SELECT id, name, email, password_hash FROM users WHERE email = ?',
    [emailLower],
    (err, user) => {
      if (err) {
        console.error('❌ [LOGIN] Erro no banco:', err);
        return res.status(500).json({ error: 'Erro no banco' });
      }

      if (!user) {
        console.warn('⚠️ [LOGIN] Usuário não encontrado:', emailLower);
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      console.log('🧩 [LOGIN] Usuário encontrado:', user.email);
      console.log('🔐 [LOGIN] Comparando senha...');

      const match = bcrypt.compareSync(password, user.password_hash);
      console.log('🔍 [LOGIN] Resultado da comparação:', match);

      if (!match) {
        console.warn('⚠️ [LOGIN] Senha incorreta para:', emailLower);
        return res.status(401).json({ error: 'Senha incorreta' });
      }

      const token = generateToken({ id: user.id, email: user.email });
      console.log('✅ [LOGIN] Login bem-sucedido para:', user.email);
      res.json({ id: user.id, email: user.email, name: user.name, token });
    }
  );
});


app.get('/api/me', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Erro no banco' });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ user });
  });
});


app.post('/api/logout', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
