import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export default function PrescriptionScreen({ user }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [content, setContent] = useState('');
  const [consultationId, setConsultationId] = useState('1');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get(`${API_URL}/prescriptions`);
      setPrescriptions(res.data);
    } catch (err) {
      console.error('获取处方列表失败');
    }
  };

  const handleCreatePrescription = async () => {
    try {
      await axios.post(`${API_URL}/prescriptions`, {
        consultation_id: parseInt(consultationId),
        doctor_id: user.id,
        content
      });
      setContent('');
      fetchPrescriptions();
    } catch (err) {
      console.error('创建处方失败');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>处方管理</h2>
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="问诊ID"
          value={consultationId}
          onChange={(e) => setConsultationId(e.target.value)}
          style={{ display: 'block', marginBottom: 10, padding: 8 }}
        />
        <textarea
          placeholder="处方内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ display: 'block', marginBottom: 10, padding: 8, width: '100%', height: 100 }}
        />
        <button onClick={handleCreatePrescription} style={{ padding: 8, cursor: 'pointer' }}>
          开具处方
        </button>
      </div>
      <h3>处方列表</h3>
      {prescriptions.map((p) => (
        <div key={p.id} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
          <p>内容: {p.content} | 状态: {p.status}</p>
        </div>
      ))}
    </div>
  );
}
