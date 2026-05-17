# 🏫 校园闲置智能交易平台 (Campus Secondhand)

**技术栈标签**：`Java 17` | `Spring Boot 3.2.5` | `MyBatis-Plus 3.5.7` | `DeepSeek AI`

## 📖 项目简介

**校园闲置智能交易平台** 是一个专为高校师生打造的安全、便捷、纯净的二手物品流转与信息发布社区。

本项目摒弃了传统人工审核的高昂成本与滞后性，创新性地引入了 **图文双重审核系统**。通过结合 DeepSeek 大语言模型与计算机视觉 (CV) 模型，实现商品图文的 AI 智能风控。同时，前端采用前沿的 **玻璃拟态（Glassmorphism）** 响应式 UI 设计，并结合 **WebSocket** 实时通信技术，为校园用户提供极致流畅的交易体验。

---

## ✨ 核心功能特性

### 1. 商品发现与流转

* 支持二手教材、数码外设、寻物启事等多类目的商品发布与分类浏览。
* 提供便捷的个人中心，轻松管理个人“发布记录”与“收藏夹 (`favorite`)”。

### 2. 实时互动与通知

* **私信沟通**：买卖双方可基于 WebSocket 进行极低延迟的实时私信 (`message_type=0`)。
* **系统通知**：当商品因违规被下架等特殊情况发生时，系统会自动下发通知（如：“您的商品审核未通过，已被下架”），确保用户实时获知 (`message_type=1`)。

### 3. AI 图文双重审核系统

系统在文本审核基础上增加了图像维度的合规性校验，按权重计算综合得分（文本占 70%，图像占 30%）：

| 综合得分区间 | 审核动作 | 真实业务场景示例 |
| --- | --- | --- |
| **≥ 80分** | 自动通过 (Auto-Approve) | 描述详尽的“索尼耳机”或“Python教材”，AI 打出 90-95 分，商品直接上架。 |
| **50 - 79分** | 转入人工审核 (Review) | 对于标题仅为“1”的占位贴，系统识别异常并提供具体的改进建议 (`ai_suggestions`)。 |
| **< 50分** | 自动拦截拒绝 (Reject) | 成功识别“代写期末论文”或“违禁品”，打出 10 分极低分并记录详尽判决理由 (`ai_reason`)。 |

---

## 🛡️ 第三方视觉审核 (CV) 接入指南

系统支持对接主流云厂商的 CV 服务进行图像违规检测，请在 `application.properties` 中完成对应配置：

| 平台服务 | 识别场景 | 申请与配置流程 |
| --- | --- | --- |
| **阿里云视觉智能 (推荐)** | 色情、暴恐、广告、二维码、不良场景 | 1. 访问 vision.aliyun.com 登录。 <br>

<br>2. 开通"内容安全"服务。 <br>

<br>3. 创建 AccessKey ID/Secret 并填入配置文件。 |
| **腾讯云内容安全** | 色情 (PORN)、暴恐 (TERRORISM)、政治敏感 (POLITICS) | 1. 访问 [cloud.tencent.com/product/cms](https://cloud.tencent.com/product/cms) 登录。 <br>

<br>2. 开通"内容安全"服务。 <br>

<br>3. 创建 API 密钥并填入配置文件。 |

---

## 🗄️ 核心数据模型

系统由四张核心数据表支撑，业务逻辑与大模型 AI 节点深度融合：

| 数据表名称 | 核心关键字段 | 核心作用与说明 |
| --- | --- | --- |
| **`user` (用户表)** | `id`, `username`, `password`, `role`, `status` | 管理平台的用户权限 (`role`: 0=普通用户, 1=管理员) 与账号安全。 |
| **`item` (商品表)** | `title`, `price`, `type`, `ai_score`, `ai_reason`, `admin_offshelf` | 核心驱动表。包含基础数据与 AI 智能风控字段（审核结论、整改建议等）及管理员下架记录。 |
| **`message` (消息表)** | `from_user_id`, `to_user_id`, `content`, `message_type`, `is_read` | 记录用户间的聊天消息与平台系统提醒。 |
| **`favorite` (收藏表)** | `user_id`, `item_id`, `create_time` | 记录商品的收藏状态。 |

---

## 🛠️ 技术栈详情

* **后端服务**：Java 17, Spring Boot 3.2.5, MyBatis-Plus 3.5.7, MySQL 8.0。
* **异步与并发**：Spring WebFlux (处理高并发 AI 接口调用), WebSocket。
* **AI 基础设施**：DeepSeek API, 阿里云/腾讯云 CV 模型接口。
* **前端渲染**：Thymeleaf, HTML5, 原生 JavaScript, CSS3。
* **UI 交互**：全站玻璃拟态（Glassmorphism）响应式设计，完美适配 PC 与移动端。

---

## 🚀 快速部署与运行

**1. 基础环境准备**

* 安装 JDK 17 及以上版本、Maven 3.6+、MySQL 8.0+。
* 准备有效的 DeepSeek API Key 以及阿里云/腾讯云 CV 密钥。

**2. 数据库初始化**

* 在 MySQL 中创建数据库名为 `campus_secondhand`。
* 导入项目根目录下的 SQL 脚本（例如 `schema.sql`）以初始化数据表结构。

**3. 修改环境配置**

* 进入 `src/main/resources/application.properties`，完成数据库连接、DeepSeek API 以及 CV 服务提供商的参数配置。

**4. 编译与启动服务**
在项目根目录下执行以下命令：

```bash
mvn clean install
mvn spring-boot:run

```

**5. 访问系统**

* 🎓 前端门户：`http://localhost:8080/`
* ⚙️ 后台管理：`http://localhost:8080/admin` (需要使用管理员账号登录)

---

## 📄 开源许可证

本项目采用 [MIT License](https://www.google.com/search?q=LICENSE) 开源协议。
