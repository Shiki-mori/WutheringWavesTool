# 项目协作指南

本文件适用于整个仓库。若子目录新增 `AGENTS.md`，该目录内的工作同时遵循其具体约定；用户当前明确指示优先于本文。

## 项目定位与开发方向

- 这是鸣潮抽卡记录工具，主要流程是：解析官方记录链接 → 获取记录 → 预处理并保存数据库 → 查询和分析 → 前端展示统计与图表。
- **当前以 Node.js 后端为主，Java 后端仅作实验。** 默认将业务功能和修复落在 `backend_node/`；只有任务明确涉及 Java 时才修改 `backend_java/`。不要自行迁移接口、切换前端后端地址或移除 Node.js 实现。
- `developmentLog/6_Java重构.md` 中的迁移目标属于历史计划，不覆盖上述当前方向。若任务需要改变后端方向，先询问用户。
- 默认使用中文沟通、说明和必要的注释；代码标识符沿用所在模块的命名方式。

## 目录与职责

| 路径 | 职责与现状 |
| --- | --- |
| `frontend/` | Vue 3、TypeScript、Vite 前端，图表使用 ECharts / vue-echarts。 |
| `frontend/src/App.vue` | 当前页面入口、操作流程和统计展示。 |
| `frontend/src/api/` | Axios 请求配置、接口调用和现有响应类型。 |
| `frontend/src/components/` | 可复用组件，包含卡池总览和详情图表。 |
| `frontend/src/utils/`、`types/`、`views/` | 分别用于数据转换、共享类型和页面组件，目前主要是目录说明。 |
| `backend_node/index.js` | Express 服务入口与路由挂载，监听 3000 端口。 |
| `backend_node/api/` | HTTP 请求和响应处理。 |
| `backend_node/service/` | 业务流程编排，例如 `fetchAndSave.js`。 |
| `backend_node/utils/` | 链接解析、官方请求、预处理、数据库访问、入库和统计计算。 |
| `backend_node/config/` | 业务配置，例如常驻角色 ID 列表。 |
| `backend_java/` | Java 17、Spring Boot 4.0.5、Maven Wrapper 实验工程；当前可构建源码位于 `src/`，只有基础启动与 `/hello` 接口。 |
| `backend_java/gacha-common/`、`gacha-pojo/`、`gacha-server/` | 实验目录，尚未在根 `pom.xml` 中配置为 Maven 模块；现有测试不代表完整实现。 |
| `database/` | 数据库相关预留目录，当前没有可复用的建表或迁移脚本。 |
| `developmentLog/` | 开发过程、问题记录和设计思路；包含历史版本及未实现方案，使用前与现有代码核对。 |

## 安装、运行与验证

以下命令均从仓库根目录执行，npm 子项目使用各自的 `package-lock.json`。

```bash
# 首次安装依赖，或依赖发生变化时
(cd frontend && npm ci)
(cd backend_node && npm ci)

# 分别在两个终端启动
(cd backend_node && node index.js)
(cd frontend && npm run dev)

# 前端类型检查与生产构建
(cd frontend && npm run build)

# Node.js 单文件语法检查，按实际改动替换路径
node --check backend_node/index.js

# 仅当任务涉及 Java 实验工程时
(cd backend_java && ./mvnw test)
(cd backend_java && ./mvnw spring-boot:run)
```

- 前端 API 地址目前写在 `frontend/src/api/request.ts`，为 `http://localhost:3000`；Java 实验服务默认端口为 8080。Vite 的实际访问地址以启动输出为准。
- Node.js 后端使用 MySQL，连接配置位于 `backend_node/utils/db.js`；现有数据库名为 `analyzer`，核心表为 `analyzer_records`。安装 npm 依赖不会自动创建数据库或表。
- `run_node.sh` 依赖 GNOME Console 的 `kgx`，其他环境优先使用上述直接启动命令。根目录 `run.sh` 只有 Maven 启动命令，不能视为整个项目的可靠启动入口。
- 前端目前没有独立测试或 lint 脚本。Node.js 的 `npm test` 是明确返回失败的占位脚本，不是有效测试入口。
- `backend_java/` 下的 Maven 测试只覆盖根 `pom.xml` 对应的源码，不能验证尚未接入 Maven 的实验目录。

## 实现约定

- 先查看目标文件、调用方和现有实现，再做与任务直接相关的修改。避免顺手重构无关模块、全文件格式化或升级依赖。
- 前端沿用 Vue 单文件组件与 `<script setup lang="ts">`。保持 TypeScript 严格检查通过，接口和图表数据使用明确类型，避免以 `any` 绕过类型问题。
- 接口请求集中在 `frontend/src/api/`，复用已有 Axios 实例。当前响应拦截器返回完整 Axios response，调用方通过 `res.data` 读取 HTTP 响应体；修改时同步核对类型声明与实际返回值。
- Node.js 后端使用 CommonJS 的 `require` / `module.exports`；不要因为前端使用 ES modules 而直接改写后端模块制式。
- 保持路由处理、流程编排和数据处理的职责边界。新增复杂业务不要全部塞入 `index.js` 或 Vue 模板；优先扩展现有 service、utils 和组件。
- 注释主要解释排序、去重、统计口径等业务原因。保留有用的中文说明，不为显而易见的语句添加逐行解释。
- 修改依赖时同步维护对应 lockfile。生成物如 `node_modules/`、`dist/`、`target/` 不作为源码修改提交。

## 接口与数据规则

- 当前主要接口为 `POST /api/gacha/proxy`（请求体 `{ url }`）、`GET /api/readRecords` 和 `GET /api/analyzeRecords`。两个查询接口还有 `/records` 子路径别名，修改路由时检查兼容性。
- 查询与分析接口当前返回 `{ code, message, data }`；抓取接口直接返回分组数组，其结构不同。以实际路由和调用方为准，不假定所有接口已使用统一响应结构。
- 数据库字段使用 `snake_case`，官方响应及预处理字段多使用 `camelCase`。转换时显式核对 `resourceId` / `resource_id`、`qualityLevel` / `quality_level`、`isUp` / `is_up` 等字段，不直接照搬旧类型中的拼写。
- 官方记录按最新到最旧返回；预处理与入库会转换顺序。同秒顺序由 `in_second_seq` 表示，`draw_order` 是同一用户、同一卡池内持久化的业务序号。不要用数据库自增 `id` 或每次重新计算的数组索引替代业务排序。
- 记录去重需要考虑 `uid`、`pool_type`、`time` 和 `in_second_seq`。修改导入逻辑时检查重复导入、增量更新和同秒多抽，避免丢失记录或改变已有业务顺序。
- 分析必须按抽卡发生顺序进行。`is_up` 是三态值（限定、非限定、未知或不适用），不能把 `null` 自动当成 `false`。
- 当前统计包括出金抽数、平均出金、平均 UP、UP 率、已垫抽数及连续赢/输 50/50。修改算法时核对尾部未出金记录、大保底与小保底的处理；不要把大保底出 UP 自动计为赢一次 50/50。
- 常驻角色列表、卡池编号和 UP 判断目前是代码中的业务假设。扩展角色或卡池时核对适用范围，尤其是武器池，不将角色池判断直接推广到所有卡池。
- 当前数据库查询未按用户隔离，分析主要按卡池分组。涉及多用户功能时需要明确用户筛选与统计范围，不能把跨用户结果当成单个用户历史。
- `developmentLog/7_追加手动导入功能.md` 是设计草案。手动导入、批次、插入位置和 `global_order` 尚未实现，涉及这些功能时先明确数据模型与排序规则。

## 验证与交付

- 根据改动范围验证：前端修改运行构建；Node.js 修改运行相关文件语法检查，并用脱敏样例验证受影响的纯函数；Java 修改运行对应 Maven 测试。
- 导入、去重和统计算法改动应补充能发现业务错误的回归用例，至少考虑空记录、同秒多抽、重复导入、增量导入以及相关保底序列。不要仅测试实现细节，也不要仅为轻微样式或文档修改新增测试体系。
- UI 修改检查加载、空数据、错误提示和卡池切换；图表修改核对数据顺序、标签与数值。缺少可运行环境时明确说明未验证部分。
- 数据库或官方接口相关验证优先使用测试库、脱敏样例或 mock。不要为了验证代码自行清空、重建或批量改写用户现有记录；需要真实数据写入或数据库结构变更时先明确目标环境与范围。
- 交付时简要说明改了什么、验证了什么、哪些检查未运行及原因。不要把语法检查描述为完整业务验证。

## 协作与本地数据

- 开始修改前查看 `git status`，保留用户已有修改、未跟踪文件和本地实验内容。不要擅自覆盖、删除或重置它们；提交时仅包含本次任务文件。
- 未经用户要求，不执行提交、推送或发布操作。
- 不将数据库密码、完整抽卡链接、记录访问参数或真实玩家数据复制到新文档、日志和测试样例。新增配置使用环境变量或脱敏示例；本地忽略的 Java resources 配置不应强制加入版本控制。
- 常规实现细节可按现有风格自行决定。需求不清、统计口径有多种解释、接口兼容性需要取舍、后端方向变化或涉及现有数据破坏时，向用户提出具体问题；能独立完成的部分继续推进。
- 若任务涉及开发日志，追加准确的实现与验证记录，不把计划写成已经完成的功能。项目结构或命令变化时同步修正本文件。
