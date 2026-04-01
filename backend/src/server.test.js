const request = require('supertest');
const app = require('../src/server');

describe('用户认证', () => {
  test('用户注册成功', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'patient1',
        password: '123456',
        role: 'patient',
        name: '张三'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('用户登录成功', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'patient1',
        password: '123456'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('登录失败 - 密码错误', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'patient1',
        password: 'wrong'
      });
    expect(res.status).toBe(401);
  });
});

describe('问诊管理', () => {
  test('创建问诊', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .send({
        patient_id: 1,
        doctor_id: 2,
        type: 'expert',
        fee: 99.99
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('获取问诊列表', async () => {
    const res = await request(app)
      .get('/api/consultations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('处方管理', () => {
  test('创建处方', async () => {
    const res = await request(app)
      .post('/api/prescriptions')
      .send({
        consultation_id: 1,
        doctor_id: 2,
        content: '阿莫西林 500mg'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('获取处方列表', async () => {
    const res = await request(app)
      .get('/api/prescriptions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
