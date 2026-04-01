import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export default function ConsultationScreen({ user }) {
  const [consultations, setConsultations] = useState([]);
  const [type, setType] = useState('expert');
  const [fee, setFee] = useState('99.99');

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await axios.get(`${API_URL}/consultations`);
      setConsultations(res.data);
    } catch (err) {
      console.error('获取问诊列表失败');
    }
  };

  const handleCreateConsultation = async () => {
    try {
      await axios.post(`${API_URL}/consultations`, {
        patient_id: user.id,
        doctor_id: 1,
        type,
        fee: parseFloat(fee)
      });
      fetchConsultations();
    } catch (err) {
      console.error('创建问诊失败');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>问诊服务</h2>
      <div style={{ marginBottom: 20 }}>
        <label>
          问诊类型：
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expert">专家问诊</option>
            <option value="quick">快速问诊</option>
            <option value="prescription">开药问诊</option>
          </select>
        </label>
        <label style={{ marginLeft: 20 }}>
          费用：
          <input value={fee} onChange={(e) => setFee(e.target.value)} />
        </label>
        <button onClick={handleCreateConsultation} style={{ marginLeft: 20 }}>
          创建问诊
        </button>
      </div>
      <h3>我的问诊</h3>
      {consultations.map((c) => (
        <div key={c.id} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
          <p>类型: {c.type} | 状态: {c.status} | 费用: ¥{c.fee}</p>
        </div>
      ))}
    </div>
  );
}
