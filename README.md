# Wuthering Waves Tool · 鸣潮抽卡记录分析工具

一个用于本地保存和分析《鸣潮》唤取记录的 Web 工具。粘贴游戏内的唤取记录链接后，由后端获取记录、预处理并写入数据库，再通过前端查看各卡池的抽卡统计与图表。

当前业务后端为 **Node.js + Express**，前端为 **Vue 3 + TypeScript**，数据保存在本地 **MySQL / MariaDB**。仓库中的 Java 工程用于实验，尚未承接抽卡业务。

## 功能

- **链接导入**：解析唤取记录链接，依次请求已配置的卡池并保存记录。
- **本地持久化**：按玩家、卡池、时间和同秒序号识别记录，为新记录分配持久化的抽卡顺序。
- **数据库查询**：显示记录总数、最新记录日期和建议更新时间。
- **卡池分析**：统计总抽数、五星数量、平均出金、平均 UP、UP 率、当前已垫，以及最长连续赢 / 输 50/50 次数。
- **图表展示**：卡池总览柱状图、单卡池出金抽数图，以及角色活动池的五星 UP / 歪 / 未知环形图。

```text
游戏唤取记录链接
    ↓
Vue 页面 → Node.js 后端 → 游戏官方记录接口
                ↓
         预处理、去重与入库
                ↓
         MySQL / MariaDB
                ↓
         查询、分析 → 统计与图表
```

## 技术栈与目录

| 部分 | 技术 / 职责 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite 7、Axios |
| 可视化 | ECharts 6、vue-echarts |
| 业务后端 | Node.js、Express 5、Axios、mysql2（CommonJS） |
| 数据存储 | MySQL / MariaDB |
| Java 实验 | Java 17、Spring Boot 4.0.5、Maven Wrapper |

```text
WutheringWavesTool/
├── frontend/
│   ├── src/App.vue          # 页面入口与操作流程
│   ├── src/api/             # Axios 配置、接口调用与类型
│   ├── src/components/      # 卡池总览与详情图表
│   ├── src/utils/           # 日期、统计展示口径与图表配置
│   └── tests/              # 部分统计展示口径的回归用例
├── backend_node/
│   ├── index.js            # Express 入口，端口 3000
│   ├── api/                # 查询与分析路由
│   ├── service/            # 抓取、预处理、保存流程编排
│   ├── utils/              # 链接解析、请求、数据库与统计算法
│   └── config/             # 常驻角色等业务配置
├── backend_java/           # Java 实验工程
├── scripts/windows-runtime.ps1  # Windows 进程与服务管理
├── developmentLog/         # 开发记录，含历史方案与设计草案
├── run_windows.cmd         # Windows 启动入口
├── stop_windows.cmd        # Windows 停止入口
├── get_gacha_url.cmd       # 获取唤取记录链接的辅助入口
└── AGENTS.md               # 项目协作与验证约定
```

## 本地运行

### 1. 环境准备与依赖安装

- Node.js：当前锁定的 Vite 及 Vue 插件要求 `^20.19.0 || >=22.12.0`。
- npm：分别使用两个子项目的 `package-lock.json` 安装依赖。
- MySQL 或 MariaDB：需要提前准备数据库、表和可用的数据库账户。
- 获取新记录时，后端需要能访问游戏官方记录接口。

在仓库根目录打开 PowerShell：

```powershell
Push-Location frontend
npm ci
Pop-Location

Push-Location backend_node
npm ci
Pop-Location
```

### 2. 配置数据库

默认数据库名为 `analyzer`，核心表为 `analyzer_records`。**安装依赖和启动程序都不会自动建库或建表，仓库目前也没有完整的初始化或迁移脚本。** 新环境需要先准备与当前代码兼容的表；已有数据库应先核对结构，不要直接套用开发日志中的旧版建表语句。

当前入库与查询使用以下核心字段：

| 字段 | 用途 |
| --- | --- |
| `uid` | 玩家标识 |
| `resource_id` / `resource_name` | 角色或武器的资源 ID / 名称 |
| `quality_level` | 星级 |
| `pool_type` | 卡池编号 |
| `time` | 抽卡发生时间 |
| `in_second_seq` | 同一秒内的抽卡序号，从 0 开始 |
| `draw_order` | 同一玩家、同一卡池内持久化的业务顺序 |
| `is_up` | UP 标记，允许 `NULL` |

去重唯一键应覆盖 `(uid, pool_type, time, in_second_seq)`；抽卡分析使用 `draw_order` 确定业务顺序，不能用数据库自增 ID 替代。

将连接参数保存到私有 JSON 文件，例如本机的 `%LOCALAPPDATA%\WutheringWavesTool\db.local.json`。以下仅为占位示例，需替换账户和密码：

```json
{
  "host": "127.0.0.1",
  "port": 3306,
  "user": "your_db_user",
  "password": "your_db_password",
  "database": "analyzer"
}
```

手动启动后端时，通过 `WWT_DB_CONFIG` 指定配置文件的绝对路径。未显式指定时，后端会尝试读取上述用户目录中的文件；文件缺失时仍可能使用源码中的历史默认配置，因此应明确准备私有配置。不要将数据库凭据或完整抽卡链接提交到仓库，私有文件应仅允许当前用户和 SYSTEM 访问。

### 3. 启动方式

#### 手动启动（通用）

先确保数据库服务已运行、表结构已准备好，再分别打开两个 PowerShell 终端。

终端一：从仓库根目录启动 Node.js 后端。

```powershell
$env:WWT_DB_CONFIG = Join-Path $env:LOCALAPPDATA 'WutheringWavesTool\db.local.json'
Set-Location backend_node
node index.js
```

终端二：从仓库根目录启动前端。

```powershell
Set-Location frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

访问 [本地前端](http://127.0.0.1:5173/)。前端 API 地址在 [`frontend/src/api/request.ts`](frontend/src/api/request.ts) 中，当前为 `http://localhost:3000`。手动启动的前后端可分别用 `Ctrl+C` 停止，数据库服务需自行管理。

#### Windows 一键启停（当前本机配置）

完成依赖安装与数据库准备后，在仓库根目录运行或直接双击：

```powershell
.\run_windows.cmd
```

按 UAC 提示授予管理员权限。脚本会启动 MariaDB 和前后端，检查数据库连接及 HTTP 就绪状态，前端地址固定为 [http://127.0.0.1:5173/](http://127.0.0.1:5173/)。启动后无需保留终端窗口。

结束使用时运行：

```powershell
.\stop_windows.cmd
```

使用前请注意以下本机约定：

- 数据库服务名固定为 `MariaDB`，服务配置路径要求包含 `D:\DevTools\MariaDB\data\my.ini`；其他机器应核对并调整 [`scripts/windows-runtime.ps1`](scripts/windows-runtime.ps1)，或使用手动启动方式。
- 启动脚本优先读取 `.runtime-windows/db.local.json`，其次读取 `%LOCALAPPDATA%\WutheringWavesTool\db.local.json`；缺少配置会立即报错。
- 状态和前后端标准输出、错误日志保存在已忽略的 `.runtime-windows/` 目录。
- 端口 `3000` 或 `5173` 若被非脚本管理的进程占用，启动会报错；请先结束对应的旧启动方式。
- 停止脚本会核对所管理进程的身份，并停止本项目的前后端及 `MariaDB` 服务；如果其他应用共用该数据库服务，需考虑其影响。
- 若未出现 UAC，可右键以管理员身份运行，或从管理员 PowerShell 执行，无需修改执行策略或服务权限。

根目录 `run_node.sh` 依赖 GNOME Console（`kgx`）；`run.sh` 仅包含 Maven 命令，不能作为整个项目的启动入口。

## 使用步骤

1. 获取游戏内的唤取记录链接。Windows 下可运行 `.\get_gacha_url.cmd` 辅助获取。
2. 在前端“链接分析”输入框粘贴完整链接，点击“开始分析”，等待抓取和保存完成。
3. 点击“查询数据库”，查看记录数量、最新记录日期及建议更新时间。
4. 点击“分析数据库结果”，查看总览并切换卡池详情。导入完成后需手动点击此按钮刷新统计。

已有本地记录时，可以直接查询和分析数据库，无需重新获取链接。查询页面的建议更新时间由最新记录日期加 6 个月生成，只是前端提示，不代表已核实的官方保留期限。

`get_gacha_url.cmd` 会联网下载并执行第三方 WuWa Tracker 的 `import.ps1`，固定提交为 `747a48b1b994baa9c372a4fb933ea7588428bd4b`，结束后保留窗口查看结果。使用前可查看 [WuWa Tracker 导入页面](https://wuwatracker.com/zh-CN/import) 和 [固定版本脚本源码](https://github.com/wuwatracker/wuwatracker/blob/747a48b1b994baa9c372a4fb933ea7588428bd4b/import.ps1)。完整链接包含记录访问参数，请仅在需要的本地流程中使用。

## 统计口径与当前限制

统计基于**已保存的记录**。如果历史缺失，首次出金间隔、平均值、已垫和连续赢 / 输记录都可能与完整游戏历史不同。

| 指标 | 当前计算方式 |
| --- | --- |
| 单池平均出金 | 各次五星出金间隔的平均值，不含最后一次五星后的未出金抽数 |
| 平均 UP 抽数 | 截至最后一次五星的累计抽数 ÷ 标记为 UP 的五星数量；无 UP 时返回 0 |
| UP 率 | 标记为 UP 的五星数量 ÷ 全部五星数量；包含大保底获得的 UP，并非小保底胜率 |
| 当前已垫 | 最后一次五星后的抽数；尚无五星时为该池全部已记录抽数 |
| 连续赢 / 输 50/50 | 返回历史最长连续次数；歪后大保底获得 UP 不额外计为赢一次 |
| 总览“五星总数” | 仅累加角色活动池明确标记为 UP 的五星与武器活动池全部五星 |
| 总览“综合平均出金” | 全部卡池总抽数 ÷ 全部卡池五星数，包含尾部已垫，与单池平均出金口径不同 |

- 总览图与详情指标中，角色活动池的“五星”只计明确为 UP 的五星；角色池环形图仍展示全部五星的 UP / 歪 / 未知构成。其他卡池的单池五星数量计全部五星。
- 后端当前请求卡池编号 `1、2、3、4、5、6、8、9`。前端已命名 `1`（角色活动唤取）、`2`（武器活动唤取）、`3`（常驻角色）、`4`（常驻武器），其他编号显示为“卡池 N”。详情区展示分析结果中按编号排序的前四个卡池。
- UP 判断目前基于五星资源 ID 与常驻角色列表，尚未按各类卡池分别完善规则。武器池、常驻池或新增卡池的 UP 率与 50/50 指标不应直接视为对应游戏机制的准确结论。
- 数据库查询尚未按玩家隔离，分析仅按卡池分组；同库导入多个玩家会混合结果，当前适合单玩家本地使用。
- 手动补录、批次管理、插入历史位置与 `global_order` 尚未实现；相关开发日志属于设计草案。
- 抓取与保存尚不具备完整的业务错误校验；当前保存函数会捕获部分入库异常而不向上传递，页面抓取成功不能单独证明数据完整入库，应结合数据库查询和后端日志核对。
- 当前没有登录鉴权与完善的部署配置，定位为本地工具。

## 主要接口

Node.js 后端默认监听 `3000` 端口。

| 方法 | 路径 | 请求 / 响应 |
| --- | --- | --- |
| `POST` | `/api/gacha/proxy` | 请求体 `{ "url": "<唤取记录链接>" }`；成功直接返回预处理后的分组数组，包含 `playerId`、`cardPoolType`、`records` |
| `GET` | `/api/readRecords` | 返回 `{ code, message, data }`，`data` 为数据库记录数组 |
| `GET` | `/api/analyzeRecords` | 返回 `{ code, message, data }`，`data` 为包含 `poolType`、`totalRecords` 和统计 `data` 的数组 |

查询与分析接口分别兼容 `/api/readRecords/records` 和 `/api/analyzeRecords/records`。抓取接口的响应结构与两个查询接口不同，调用时需分别处理。

## 开发验证

前端类型检查与生产构建：

```powershell
Push-Location frontend
npm run build
Pop-Location
```

Node.js 语法检查示例（按实际改动补充文件）：

```powershell
node --check backend_node/index.js
node --check backend_node/utils/analyzePool.js
```

前端暂无独立的 npm 测试或 lint 脚本，`frontend/tests/` 现有用例仅覆盖部分统计展示口径。Node.js 后端的 `npm test` 是返回失败的占位脚本。构建或语法检查均不能替代导入、去重、数据库读写及真实页面验收。

只有开发 Java 实验工程时才需要 Java 17；可在仓库根目录执行：

```powershell
Push-Location backend_java
.\mvnw.cmd test
# 如需启动实验服务：.\mvnw.cmd spring-boot:run
Pop-Location
```

Java 根工程目前仅有基础启动与 `/hello` 接口，默认端口为 `8080`。`gacha-common/`、`gacha-pojo/`、`gacha-server/` 尚未接入根 Maven 模块配置，上述测试不覆盖这些实验目录，也不能验证 Node.js 业务。

## 常见问题

| 现象 | 排查方向 |
| --- | --- |
| 提示无法连接服务器 | 确认 Node.js 已在 `3000` 端口启动，核对前端 `baseURL` 与后端日志 |
| 抓取耗时后报错 | 当前前端请求超时为 5 秒，而后端依次请求多个卡池；查看日志确认处理状态，先查询数据库再决定是否重试 |
| 提示缺少私有数据库配置 | 创建私有 JSON 文件，并按所选启动方式核对查找路径或 `WWT_DB_CONFIG` |
| 数据库连接或查询失败 | 核对数据库服务、账户权限、库名及表结构；依赖安装不会初始化数据库 |
| Windows 启动提示端口占用 | 结束对应的旧项目启动方式后重试，脚本不会按端口批量结束其他进程 |
| 页面没有分析图表 | 导入或确认已有记录后，手动点击“分析数据库结果” |
| 已有历史与统计不一致 | 核对记录完整性、是否混入其他玩家，以及上文所述统计口径和 UP 判断限制 |

更多协作规则见 [`AGENTS.md`](AGENTS.md)。[`developmentLog/`](developmentLog/) 可用于了解设计演变，其中的历史代码、迁移计划和未实现方案应与当前源码核对后使用。
