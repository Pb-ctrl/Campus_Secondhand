# 🏫 校园闲置智能交易平台 (Campus Secondhand)

![Java](https://img.shields.io/badge/Java-17-blue.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)
![MyBatis-Plus](https://img.shields.io/badge/MyBatis--Plus-3.5.7-red.svg)
![AI](https://img.shields.io/badge/AI-DeepSeek-purple.svg)

##  [github地址](https://github.com/Pb-ctrl/Campus_Secondhand)

## 📖 项目简介

**校园闲置智能交易平台** 是一个专为高校师生打造的安全、便捷、纯净的二手物品流转与信息发布社区。
本项目摒弃了传统人工审核的高昂成本与滞后性，创新性地引入了 **DeepSeek 大语言模型** 进行商品图文的 AI 智能审核。结合前沿的 **玻璃拟态（Glassmorphism）** 响应式 UI 设计与 **WebSocket** 实时通信技术，为校园用户提供极致流畅的交易体验。

## ✨ 核心功能
* **🛍️ 商品发布与发现**：支持分类浏览（二手教材、数码外设、寻物启事等），全站关键字检索。
* **🤖 AI 智能审核系统**：
  * 对用户发布的标题、描述、价格进行 5 大维度打分。
  * **≥80分**：AI 建议通过（Auto-Approve），商品秒级上架。
  * **50-79分**：存在瑕疵或风险，自动进入后台“待复审”池，由管理员人工定夺。
  * **<50分**：严重违规（如违禁品、虚假信息），直接拦截拒绝。
* **💬 实时互动留言**：基于 WebSocket 的站内信系统，买卖双方沟通零延迟，支持未读消息红点提醒。
* **📦 个人中心**：便捷管理“我发布的商品”和“我的收藏”，交易状态一目了然。
* **🛡️ 后台管理端**：提供全局数据看板，管理员可直观查看 AI 审核给出的“扣分理由”及“改进建议”，一键完成人工复审与用户封禁操作。

## 🛠️ 技术栈
### 后端 (Backend)
* **核心框架**：Java 17 + Spring Boot 3.2.5
* **持久层**：MyBatis-Plus 3.5.7 + MySQL 8.0
* **异步与网络**：Spring WebFlux (用于大并发 AI 接口调用) + WebSocket
* **AI 接口**：DeepSeek API

### 前端 (Frontend)
* **页面引擎**：Thymeleaf
* **核心技术**：HTML5 + 原生 JavaScript + CSS3
* **UI 风格**：全站玻璃拟态（Glassmorphism）响应式设计，适配 PC 与移动端。

## 🚀 快速开始

### 1. 环境准备
* JDK 17 及以上
* Maven 3.6+
* MySQL 8.0+
* 拥有一个有效的 DeepSeek API Key

### 2. 数据库配置
1. 在 MySQL 中创建数据库 `campus_secondhand`。
2. 导入项目根目录下的 SQL 脚本（如 `schema.sql`，需自行生成/提供）以初始化表结构。

### 3. 项目配置
修改 `src/main/resources/application.properties` 中的相关配置

### 4. 编译与运行

在项目根目录下执行：

Bash

```
mvn clean install
mvn spring-boot:run
```

启动成功后，在浏览器中访问：

- 前端门户：`http://localhost:8080/`
- 后台管理：`http://localhost:8080/admin` (需配置管理员账号)



## 📄 许可证

本项目采用 [MIT License](https://www.google.com/search?q=LICENSE) 开源协议。