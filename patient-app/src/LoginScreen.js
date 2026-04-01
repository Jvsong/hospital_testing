import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      if (res.data.success) {
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setError('登录失败');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>患者登录</h2>
      <input
        placeholder="用户名"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: 'block', marginBottom: 10, padding: 8 }}
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', marginBottom: 10, padding: 8 }}
      />
      <button onClick={handleLogin} style={{ padding: 8, cursor: 'pointer' }}>
        登录
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
