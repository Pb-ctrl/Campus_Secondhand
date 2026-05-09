# 🏫 校园闲置智能交易平台 (Campus Secondhand)

![Java](https://img.shields.io/badge/Java-17-blue.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)
![MyBatis-Plus](https://img.shields.io/badge/MyBatis--Plus-3.5.7-red.svg)
![AI](https://img.shields.io/badge/AI-DeepSeek-purple.svg)


## 📖 项目简介

**校园闲置智能交易平台** 是一个专为高校师生打造的安全、便捷、纯净的二手物品流转与信息发布社区。
本项目摒弃了传统人工审核的高昂成本与滞后性，创新性地引入了 **DeepSeek 大语言模型** 进行商品图文的 AI 智能审核。结合前沿的 **玻璃拟态（Glassmorphism）** 响应式 UI 设计与 **WebSocket** 实时通信技术，为校园用户提供极致流畅的交易体验。

## ✨ 核心功能与真实场景 (Feature Highlights)
结合平台真实的运行数据，本项目实现了以下核心业务闭环：

* **🛍️ 商品发布与发现**：支持分类浏览（二手教材、数码外设、寻物启事等）。
* **🤖 AI 智能多维审核系统**：
  * **高分自动通过 (Auto-Approve)**：例如描述详尽的“索尼 WH-1000XM4 降噪耳机”或“Python编程教材”，AI 准确识别并给出 90~95 分，商品直接上架。
  * **精准拦截违规 (Reject)**：系统成功识别并拦截了“代写期末论文”、“违禁品(毒品/色情)”等违规发布，打出 10 分极低分并记录详尽的违规判定理由 (`ai_reason`)。
  * **信息规范引导 (Review)**：对于标题只有单个字符“1”的占位贴，AI 识别并给出具体的改进建议 (`ai_suggestions`)。
* **💬 实时互动与系统通知**：
  * 买卖双方基于 WebSocket 进行实时私信 (`message_type=0`)。
  * 若商品因违规被下架，系统会自动下发通知（如：“您的商品‘代写期末论文’审核未通过，已被下架”），确保用户及时获知 (`message_type=1`)。
* **📦 个人中心**：便捷管理个人的“发布记录”与“收藏夹 (`favorite`)”。

## 🗄️ 核心数据模型 (Database Schema)
系统核心由四张数据表支撑，深度融合了业务逻辑与大模型 AI 节点：

1. **`user` (用户表)**
   - 核心字段：`id`, `username`, `password`, `role` (0=普通用户, 1=管理员), `status`
   - 管理平台的用户权限与账号安全。
2. **`item` (商品表 - 核心驱动)**
   - 包含商品基础数据：`title`, `description`, `price`, `type` (1=普通商品, 2=二手教材, 3=数码外设, 4=寻物启事等)。
   - **AI 智能风控字段**：记录了每次发布的 DeepSeek 审核结果，包含 `ai_score` (0-100分), `ai_recommendation` (审核结论), `ai_warnings` (警告), `ai_suggestions` (整改建议), `ai_reason` (详细判决理由)。
   - 管理员管理字段：`admin_offshelf`, `offshelf_reason`。
3. **`message` (消息通知表)**
   - 记录用户间的聊天与平台系统提醒：`from_user_id`, `to_user_id`, `content`, `message_type`, `is_read`。
4. **`favorite` (收藏表)**
   - 记录商品收藏状态：`user_id`, `item_id`, `create_time`。

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
