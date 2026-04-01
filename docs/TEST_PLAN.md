# 测试计划

## 功能测试

### 用户认证模块
- [ ] 患者注册功能
- [ ] 医生注册功能
- [ ] 用户登录功能
- [ ] 密码验证
- [ ] 用户角色验证

### 问诊管理模块
- [ ] 创建专家问诊
- [ ] 创建快速问诊
- [ ] 创建开药问诊
- [ ] 问诊列表查询
- [ ] 问诊状态更新

### 处方管理模块
- [ ] 医生开具处方
- [ ] 药师审核处方
- [ ] 处方列表查询
- [ ] 处方状态更新

## API测试用例

### 登录接口
```
POST /api/login
请求: { username, password }
响应: { success, user }
```

### 问诊接口
```
POST /api/consultations
请求: { patient_id, doctor_id, type, fee }
响应: { success, id }

GET /api/consultations
响应: [{ id, patient_id, doctor_id, type, status, fee }]
```

### 处方接口
```
POST /api/prescriptions
请求: { consultation_id, doctor_id, content }
响应: { success, id }

GET /api/prescriptions
响应: [{ id, consultation_id, doctor_id, content, status }]
```
