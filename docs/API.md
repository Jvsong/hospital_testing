# API 文档

## 基础信息
- 基础URL: `http://localhost:3000/api`
- 请求格式: JSON
- 响应格式: JSON

## 认证接口

### 用户注册
```
POST /register
Content-Type: application/json

{
  "username": "patient1",
  "password": "123456",
  "role": "patient",
  "name": "张三"
}

响应:
{
  "success": true,
  "id": 1
}
```

### 用户登录
```
POST /login
Content-Type: application/json

{
  "username": "patient1",
  "password": "123456"
}

响应:
{
  "success": true,
  "user": {
    "id": 1,
    "username": "patient1",
    "role": "patient",
    "name": "张三"
  }
}
```

## 问诊接口

### 创建问诊
```
POST /consultations
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": 2,
  "type": "expert",
  "fee": 99.99
}

响应:
{
  "success": true,
  "id": 1
}
```

### 获取问诊列表
```
GET /consultations

响应:
[
  {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 2,
    "type": "expert",
    "status": "pending",
    "fee": 99.99
  }
]
```

## 处方接口

### 创建处方
```
POST /prescriptions
Content-Type: application/json

{
  "consultation_id": 1,
  "doctor_id": 2,
  "content": "阿莫西林 500mg"
}

响应:
{
  "success": true,
  "id": 1
}
```

### 获取处方列表
```
GET /prescriptions

响应:
[
  {
    "id": 1,
    "consultation_id": 1,
    "doctor_id": 2,
    "content": "阿莫西林 500mg",
    "status": "pending"
  }
]
```
