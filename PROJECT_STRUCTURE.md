# 项目结构总结

## 目录树
```
hospital/
├── README.md                          # 项目说明
├── .gitignore                         # Git忽略文件
├── hospital.code-workspace            # VSCode工作区配置
│
├── backend/                           # 后台管理系统
│   ├── package.json
│   ├── jest.config.js
│   ├── .env
│   ├── src/
│   │   ├── server.js                 # Express服务器
│   │   └── server.test.js            # 单元测试
│   └── data/                         # 数据库目录
│
├── patient-app/                       # 患者端APP
│   ├── package.json
│   └── src/
│       ├── LoginScreen.js            # 登录页面
│       └── ConsultationScreen.js     # 问诊页面
│
├── doctor-app/                        # 医生端APP
│   ├── package.json
│   └── src/
│       └── PrescriptionScreen.js     # 处方管理页面
│
└── docs/                              # 文档
    ├── TEST_PLAN.md                  # 测试计划
    └── API.md                        # API文档
```

## 快速开始

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 启动后台服务
```bash
npm run dev
```

### 3. 运行测试
```bash
npm test
```

## 核心功能

- **用户认证**: 注册、登录
- **问诊管理**: 创建问诊、查询列表
- **处方管理**: 开具处方、查询列表
- **数据持久化**: SQLite数据库

## 用于测试学习的特点

- 代码简洁，易于理解
- 包含基础API和单元测试
- 支持多端应用架构演示
- 完整的文档和测试计划
