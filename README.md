# Welcome to your Lovable project

## 🔥 **紧急修复** - Edge Function致命Bug (2025年10月10日)

### ⚠️ **必须立即部署！**

发现并修复了导致Edge Function崩溃的两个关键Bug：
1. **Promise链错误** - `supabase.from(...).upsert(...).catch is not a function` ⚠️ 致命
2. **指标识别失败** - `Unknown indicator: Bollinger Bands` ⚠️ 严重

**立即部署修复：**
```powershell
# 方法1: PowerShell脚本（如果已安装Supabase CLI）
.\deploy-monitor-fix.ps1

# 方法2: 使用Supabase Dashboard（推荐 - 无需CLI）
# 详细步骤请查看 CRITICAL_BUG_FIX.md
```

📄 **完整修复说明**：[CRITICAL_BUG_FIX.md](./CRITICAL_BUG_FIX.md)

---

## ⚠️ 之前的更新 (2025年10月10日)

**信号数据计算逻辑已修复！**

之前的系统使用随机数模拟信号生成，现已修复为真实的技术指标计算。详细信息请查看：
- 📄 [信号数据计算修复说明](./SIGNAL_CALCULATION_FIX.md)

**关键改进：**
- ✅ 真实调用 TAAPI API 计算25个技术指标
- ✅ 正确使用 FMP API 的实时价格和成交量数据
- ✅ 完整实现规则评估逻辑（AND/OR/AT_LEAST N）
- ✅ 支持所有条件类型（>, <, >=, <=, ==, !=, 穿越等）

---

## Project info

**URL**: https://lovable.dev/projects/8cf29a9b-3abe-448d-955a-8ba6975986c3

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8cf29a9b-3abe-448d-955a-8ba6975986c3) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8cf29a9b-3abe-448d-955a-8ba6975986c3) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## 部署到 GitHub + Netlify（生产）

> 说明：本仓库已是 Vite + React（构建输出 `dist/`），Netlify 只需执行 `npm run build` 并发布 `dist` 目录。路由已通过 `public/_redirects` 配置 200 重写，避免刷新 404。

### 1) 推送到 GitHub

```bash
# 如本地还未初始化 git（若已初始化可跳过）
git init

git add .

git commit -m "chore: initial project"

# 关联远程并推送（将下方 URL 替换为你的仓库地址）
git remote add origin https://github.com/ran0xiaoxuan/market-mind-display.git

git branch -M main

git push -u origin main
```

### 2) 连接 Netlify 并构建

- 在 Netlify 仪表盘选择 “Add new site” → “Import an existing project” → 选择 GitHub 并授权仓库 `market-mind-display`。
- 构建设置：
  - Build command: `npm run build`
  - Publish directory: `dist`
- 环境变量（在 Netlify → Site settings → Environment variables 设置）：
  - Supabase URL 和 ANON_KEY 已在代码中配置，无需额外设置
  - 其他前端用到的 `VITE_*` 变量（如果你迁移为环境注入）
- 连接完成后点击 “Deploy site”。

### 3) Supabase（Edge Functions）与密钥

- 本项目所有敏感密钥（Stripe/Resend/Turnstile 等）放在 Supabase Functions Secrets 中，前端只用 `anon` key。
- Stripe 当前使用测试 Key；上线后你可在 Supabase 中替换为正式 Key，无需改前端。

---

## 本地使用测试 Stripe 环境变量（不影响线上）

目标：在本地复用“测试用”的 Stripe 密钥，而不改动 Supabase 线上 Secrets。

关键点：
- 前端已支持通过环境变量覆盖 Supabase URL、Anon Key、以及 Functions URL。
- 本地启动 Supabase Edge Functions（`supabase functions serve`）时，可以读取本地 `.env` 或 `--env-file`，从而与线上隔离。

### 1) 前端环境变量覆盖（可选）
在项目根目录创建 `.env.local`（不会提交到 git）：

```
# Supabase配置已在代码中设置，无需在.env文件中配置
# 指向本地 functions serve（详见下文第 2 步）
VITE_SUPABASE_FUNCTIONS_URL=http://localhost:54321/functions/v1
```

说明：
- 这些变量将覆盖 `src/integrations/supabase/client.ts` 中的默认值。
- 仅用于本地浏览器端构建，不会影响线上环境。

### 2) 本地启动 Supabase + 注入测试用 Stripe 密钥
准备一个专用于本地的 `supabase/.env.test.local`（自行创建，勿提交仓库）：

```
# Supabase Admin，用于服务端函数访问
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
PUBLIC_SITE_URL=http://localhost:5173
SITE_URL=http://localhost:5173

# Stripe（测试环境）
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_MONTHLY=price_xxx
STRIPE_PRICE_ID_YEARLY=price_xxx
STRIPE_COUPON_20_OFF=coupon_xxx
```

启动本地 Edge Functions（读取你的本地 env 文件）：

```bash
# 安装 Supabase CLI（如未安装）
# 参见：https://supabase.com/docs/guides/cli

# 在项目根目录执行
supabase start

# 本地服务 Functions，指定 env 文件
supabase functions serve --env-file supabase/.env.test.local --no-verify-jwt
```

默认本地 Functions 地址为：`http://localhost:54321/functions/v1`

> 若你需要校验 JWT，可移除 `--no-verify-jwt`，此时前端需正常登录后携带 supabase access token。

### 3) 运行前端并测试

```bash
npm run dev
```

- 前端会将 `supabase.functions.invoke()` 的请求指向 `VITE_SUPABASE_FUNCTIONS_URL`（即本地 `serve`）。
- Edge Functions 将读取 `supabase/.env.test.local` 中的 Stripe 测试密钥，不影响线上 Supabase Secrets。

### 4) Stripe Webhook（本地）

如果要测试 Webhook：
- 确保 `STRIPE_WEBHOOK_SECRET` 在你的本地 env 中已设置。
- Stripe CLI 转发事件到本地 Functions：

```bash
stripe login
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

### 5) 常见问题
- 仍然打到线上 Functions：检查 `VITE_SUPABASE_FUNCTIONS_URL` 是否已写入 `.env.local` 且重启 dev 服务器。
- 403/401：若启用了 JWT 校验，请确保前端携带 `Authorization: Bearer <access_token>`。
- ENV 未生效：确认 `--env-file` 指向正确路径，或在 serve 前终端里 `export`/`set` 了变量。

---

## Recommendation 功能

- 入口：登录后导航栏 `Dashboard`、`Strategies` 右侧新增 `Recommendation`。
- 功能：
  - 所有用户都可以在 `/recommendation` 页面浏览被分享的策略，并一键“复制到我的策略”。
  - 复制后，系统会为你创建一份独立副本（含规则组与规则），可在 `Strategies` 页面查看、编辑和删除。
- 分享权限：仅允许策略所有者邮箱为 `ran0xiaoxuan@gmail.com` 的用户，对自己拥有的策略执行“分享”。
- 技术说明：
  - 数据表：`public.recommendations`（RLS：所有人可读）。
  - 分享接口：Supabase Edge Function `share-strategy`（仅限指定邮箱）。
  - 复制接口：Supabase Edge Function `copy-recommended-strategy`（将推荐策略克隆到当前登录用户）。

---

## 密码重置流程（Supabase Recovery）

- 用户在 “忘记密码” 页面提交邮箱后，系统会通过 `supabase.auth.resetPasswordForEmail()` 发送重置邮件，重定向地址为 `https://<你的域名>/auth/reset-password`。
- 用户点击邮件中的“重置密码”按钮后：
  - 若 Supabase 回调先到 `/auth/callback?type=recovery...`，应用会自动将带有完整查询参数与哈希的链接重定向到 `/auth/reset-password`，避免误跳到登录页。
  - `auth/reset-password` 页面会解析 access_token / refresh_token 或 token_hash，并调用 `supabase.auth.setSession()` 或 `verifyOtp({ type: 'recovery' })` 验证链接有效性。
  - 验证通过后，用户可填写新密码并提交，前端会调用 `supabase.auth.updateUser({ password })` 更新。
- 常见问题：
  - 链接过期或已使用：页面会提示并提供重新申请重置链接的入口。
  - 浏览器剥离哈希：页面同时支持从 query 与 hash 读取令牌参数。

### 新增规则
- 忘记密码页面仅允许"已注册邮箱"发送重置邮件。
- 前端在提交前会调用 Edge Function `check-user-by-email` 校验邮箱是否存在；
- 若邮箱不存在,将在页面以英文提示：`This email is not registered. Please sign up first.`

---

## 技术指标库 (TAAPI Integration)

本项目集成了 TAAPI.IO 作为技术指标数据源，支持多种常用技术指标用于策略构建和回测。

### 当前支持的25个指标

#### 📈 移动平均线 (7个)
- **SMA** - 简单移动平均线 (Simple Moving Average)
  - 参数: period (周期), source (数据源)
  - 默认: period=14
  
- **EMA** - 指数移动平均线 (Exponential Moving Average)
  - 参数: period, source
  - 默认: period=14
  
- **WMA** - 加权移动平均线 (Weighted Moving Average)
  - 参数: period, source
  - 默认: period=14
  
- **DEMA** - 双指数移动平均线 (Double Exponential Moving Average)
  - 参数: period, source
  - 默认: period=14
  
- **TEMA** - 三指数移动平均线 (Triple Exponential Moving Average)
  - 参数: period, source
  - 默认: period=14
  
- **HMA** - 赫尔移动平均线 (Hull Moving Average)
  - 参数: period, source
  - 默认: period=14
  
- **VWAP** - 成交量加权平均价 (Volume Weighted Average Price)
  - 参数: source
  - 说明: 常用于日内交易

#### 📊 振荡器指标 (9个)
- **RSI** - 相对强弱指标 (Relative Strength Index)
  - 参数: period, source
  - 默认: period=14
  - 范围: 0-100，常用阈值 30/70
  
- **Stochastic** - 随机指标
  - 参数: k (K周期), d (D周期), slowing (平滑)
  - 默认: k=14, d=3, slowing=3
  - 值类型: K Value, D Value
  
- **Stochastic RSI** - 随机相对强弱指标
  - 参数: rsiPeriod, stochasticLength, k, d
  - 默认: rsiPeriod=14, stochasticLength=14, k=14, d=3
  - 值类型: K Value, D Value
  
- **CCI** - 商品通道指标 (Commodity Channel Index)
  - 参数: period, source
  - 默认: period=20
  
- **MACD** - 异同移动平均线 (Moving Average Convergence Divergence)
  - 参数: fast, slow, signal, source
  - 默认: fast=12, slow=26, signal=9
  - 值类型: MACD Value, Signal Value, Histogram Value
  
- **MFI** - 资金流量指标 (Money Flow Index)
  - 参数: period
  - 默认: period=14
  
- **ROC** - 变动率 (Rate of Change)
  - 参数: period, source
  - 默认: period=14
  
- **Williams %R** - 威廉指标
  - 参数: period
  - 默认: period=14
  - 范围: -100 到 0
  
- **CMO** - 钱德动量摆动指标 (Chande Momentum Oscillator)
  - 参数: period, source
  - 默认: period=14

#### 📉 趋势指标 (2个)
- **ADX** - 平均趋向指标 (Average Directional Index)
  - 参数: adxSmoothing, diLength
  - 默认: adxSmoothing=14, diLength=14
  - 说明: 值>25表示强趋势
  
- **SuperTrend** - 超级趋势
  - 参数: atrPeriod, multiplier
  - 默认: atrPeriod=10, multiplier=3
  - 说明: 动态支撑阻力指标

#### 📏 波动性指标 (5个)
- **Bollinger Bands** - 布林带
  - 参数: period, deviation, source
  - 默认: period=20, deviation=2
  - 值类型: Upper Band, Middle Band, Lower Band
  
- **ATR** - 平均真实波幅 (Average True Range)
  - 参数: period
  - 默认: period=14
  
- **NATR** - 标准化平均真实波幅 (Normalized ATR)
  - 参数: period, source
  - 默认: period=14
  - 说明: 百分比表示的ATR
  
- **Keltner Channel** - 肯特纳通道
  - 参数: period, atrPeriod, multiplier
  - 默认: period=20, atrPeriod=20, multiplier=2
  - 值类型: Upper Band, Middle Band, Lower Band
  
- **Donchian Channel** - 唐奇安通道
  - 参数: period
  - 默认: period=20
  - 值类型: Upper Band, Middle Band, Lower Band

#### 📦 成交量指标 (2个)
- **OBV** - 能量潮 (On Balance Volume)
  - 无参数
  - 说明: 累积成交量指标
  
- **CMF** - 蔡金资金流量 (Chaikin Money Flow)
  - 参数: period
  - 默认: period=20

### 指标使用说明

1. **在策略中使用指标**
   - 进入策略编辑页面
   - 在交易规则中选择"指标"类型
   - 从下拉菜单选择所需指标
   - 配置指标参数（或使用默认值）
   - 选择值类型（对于多值指标如MACD、布林带等）

2. **参数说明**
   - `period`: 计算周期，数值越大越平滑但滞后性越强
   - `source`: 价格数据源 (open/high/low/close/hl2/hlc3/ohlc4)
   - 所有参数都有合理的默认值，新手可直接使用默认配置

3. **指标组合建议**
   - 趋势 + 振荡器: 如 EMA + RSI
   - 趋势 + 波动性: 如 SMA + Bollinger Bands
   - 多重确认: 如 MACD + RSI + ADX

### 扩展性

项目已集成 TAAPI.IO 服务，理论上支持100+指标。当前展示的25个指标是经过精心挑选的最常用指标。如需添加更多指标：

1. 在 `src/components/strategy-detail/AvailableIndicators.tsx` 中添加指标名称
2. 在 `src/components/strategy-detail/components/InequalitySide.tsx` 中配置参数
3. 在 `src/services/taapiService.ts` 中添加参数映射
4. 如需多值支持，在 `src/components/strategy-detail/IndicatorValueSelector.tsx` 中配置

### 相关文件
- `src/services/taapiService.ts` - TAAPI API 集成服务
- `src/services/technicalIndicators.ts` - 本地指标计算（备用）
- `src/components/strategy-detail/AvailableIndicators.tsx` - 指标选择器UI
- `src/components/strategy-detail/IndicatorParameter.tsx` - 参数输入组件

---

## 交易信号生成 - 智能 Timeframe 调度

### 功能说明

系统现在会根据每个策略的 **timeframe（时间周期）** 来智能决定检测频率，而不是对所有策略都每分钟检测一次。这样可以：
- ✅ 减少不必要的计算和API调用
- ✅ 提高系统性能和响应速度
- ✅ 更符合实际交易逻辑
- ✅ 降低服务器成本

### 工作原理

**举例说明（用通俗的话解释）：**

假设你有三个交易策略：
1. **策略A**：使用 `5分钟` (5m) 的timeframe
2. **策略B**：使用 `1小时` (1h) 的timeframe
3. **策略C**：使用 `每日` (Daily) 的timeframe

**以前的做法（问题）：**
- 每分钟都检测所有策略，看是否该发送交易信号
- 策略A每5分钟才需要检测一次，却被检测了5次（浪费4次）
- 策略B每60分钟才需要检测一次，却被检测了60次（浪费59次）
- 策略C每天只需检测一次，却被检测了1440次（浪费1439次！）

**现在的做法（改进）：**
- 策略A：只在第0、5、10、15...分钟时检测（每5分钟一次）
- 策略B：只在整点时检测（每1小时一次）
- 策略C：只在每天下午4点收盘时检测（每天一次）
- 其他时间这些策略会被跳过，大幅节省资源

### 技术实现

#### 1. 数据库表：`strategy_evaluations`

这个表记录每个策略的评估状态：
- `strategy_id`: 策略ID
- `timeframe`: 时间周期（如 "5m", "1h", "Daily"）
- `last_evaluated_at`: 上次评估的时间
- `next_evaluation_due`: 下次应该评估的时间
- `evaluation_count`: 累计评估次数

#### 2. Timeframe 调度规则

| Timeframe | 检测频率 | 对齐规则 |
|-----------|---------|----------|
| 5m        | 每5分钟 | 对齐到0、5、10、15...分钟 |
| 15m       | 每15分钟 | 对齐到0、15、30、45分钟 |
| 30m       | 每30分钟 | 对齐到0、30分钟 |
| 1h        | 每1小时 | 对齐到整点 |
| 4h        | 每4小时 | 对齐到0、4、8、12、16、20点 |
| Daily     | 每天一次 | 美东时间下午4:00（收盘时） |

#### 3. 核心流程

```
1. Cron Job 每分钟触发 monitor-trading-signals
   ↓
2. 查询所有激活的策略
   ↓
3. 查询 strategy_evaluations 表，获取评估记录
   ↓
4. 过滤：只处理 next_evaluation_due <= 当前时间 的策略
   ↓
5. 处理筛选后的策略，生成交易信号（如果条件满足）
   ↓
6. 更新 strategy_evaluations 表：
   - last_evaluated_at = 当前时间
   - next_evaluation_due = 根据timeframe计算的下次评估时间
   - evaluation_count += 1
```

### 日志示例

当系统运行时，你会看到类似的日志：

```
🚀 Starting OPTIMIZED signal monitoring at: 2025-01-15T14:05:00Z
📋 Found 10 active strategies
✅ Strategy "RSI Breakout 5m": Due for evaluation (5m)
⏭️ Strategy "MACD Cross 1h": Skipping - next check in 25 minutes
⏭️ Strategy "Daily Trend": Skipping - next check in 360 minutes
🎯 Processing 3 strategies (filtered by timeframe schedule)
...
📝 Updated evaluation record for RSI Breakout 5m
```

### 相关文件

**Edge Function:**
- `supabase/functions/monitor-trading-signals/index.ts` - 主函数，包含 TimeframeEvaluationManager 类

**数据库迁移:**
- `supabase/migrations/20250627154858-cc37d108-9240-4a0e-9c86-106237eb0266.sql` - 创建 strategy_evaluations 表

**前端服务:**
- `src/services/timeframeOptimizedMonitoringService.ts` - Timeframe 优化监控服务

### 常见问题

**Q: 新创建的策略什么时候第一次被评估？**
A: 新策略会在下一次 cron job 运行时立即被评估（因为没有评估记录）。

**Q: 如果我修改了策略的 timeframe，会发生什么？**
A: 系统会在下次评估时使用新的 timeframe 计算下次评估时间。

**Q: Daily 策略为什么只在收盘时评估？**
A: Daily 策略基于每日收盘价，只在市场收盘时（美东时间下午4:00）评估才有意义。

**Q: 如果服务器宕机，错过了某个策略的评估时间怎么办？**
A: 系统会在恢复后的下一次运行中检测到该策略已经过期（current_time > next_evaluation_due），并立即评估。

### 性能优化效果

假设你有以下策略分布：
- 5个 5分钟 (5m) 策略
- 3个 1小时 (1h) 策略
- 2个 每日 (Daily) 策略

**优化前：**
- 每分钟检测：10个策略
- 每小时检测：600次 (10个策略 × 60分钟)
- 每天检测：14,400次 (10个策略 × 1440分钟)

**优化后：**
- 每分钟平均检测：~1.5个策略
- 每小时检测：~63次 (5个×12次 + 3个×1次)
- 每天检测：~1,536次 (5个×288次 + 3个×24次 + 2个×1次)
- **性能提升：约 89% 减少！**

---

## 🚀 Alpaca 实时交易集成 (PRO 功能)

### 功能概述

本系统现已支持与 Alpaca 券商集成，让 PRO 用户可以将交易策略产生的信号**自动执行到真实的交易账户**。

**核心功能：**
- ✅ 安全存储 Alpaca API 密钥（加密存储）
- ✅ 支持纸交易（Paper Trading）和真实交易
- ✅ 自动测试连接和验证 API 密钥
- ✅ 实时查看账户信息和持仓
- ✅ 策略信号自动执行交易
- ✅ 完整的交易历史记录
- ✅ 订单状态实时跟踪

---

### 使用指南

#### 步骤 1：获取 Alpaca API 密钥

1. 访问 [Alpaca Markets](https://alpaca.markets) 注册账号
2. 登录后进入 Dashboard
3. 在左侧菜单选择 **"API Keys"**
4. 点击 **"Generate New Key"** 创建新的 API 密钥
5. 保存 **API Key** 和 **Secret Key**（Secret Key 只显示一次）

**建议：** 初次使用请选择 **Paper Trading（纸交易）** 模式进行测试，避免实际资金风险。

#### 步骤 2：配置 Alpaca 集成

1. 登录系统后，点击右上角头像进入 **Settings（设置）**
2. 选择 **"Live Trading"** 标签页
3. 输入你的 Alpaca API Key 和 API Secret
4. 选择交易模式：
   - **Paper Trading（推荐）**：使用模拟账户测试，无实际资金风险
   - **Live Trading**：使用真实资金交易，请谨慎！
5. 点击 **"Save Configuration"** 保存配置

#### 步骤 3：测试连接

1. 保存配置后，点击 **"Test Connection"** 按钮
2. 系统会验证你的 API 密钥是否有效
3. 验证成功后会显示你的账户信息：
   - 账户总资产（Account Value）
   - 可用购买力（Buying Power）
   - 验证状态

#### 步骤 4：激活自动交易

1. 确认连接测试成功后，打开右上角的 **开关（Switch）**
2. 系统会显示 "Live trading is active"
3. 从现在开始，你的策略产生交易信号时会自动执行到 Alpaca

#### 步骤 5：查看交易历史

- 访问 `/alpaca-trades` 页面查看所有交易记录
- 支持按状态筛选：
  - **Filled**：已成交
  - **Submitted**：已提交
  - **Pending**：等待中
  - **Cancelled**：已取消
  - **Failed**：失败
- 可以查看每笔交易的详细信息：成交价格、数量、时间等

---

### 工作原理

1. **信号生成**：你的策略根据设定的规则评估市场数据
2. **条件满足**：当策略条件满足时，系统自动生成交易信号
3. **自动执行**：如果你开启了 Alpaca 集成，系统会立即调用 Alpaca API 下单
4. **记录保存**：所有交易记录都会保存到数据库，方便追踪和分析

**流程图：**
```
策略评估 → 生成信号 → 检查 Alpaca 配置 → 自动下单 → 记录交易历史
```

---

### 交易执行逻辑

#### Entry 信号（入场）
- 系统会执行 **买入（BUY）** 订单
- 数量根据策略设定的仓位管理计算
- 使用市价单（Market Order）确保快速成交

#### Exit 信号（出场）
- 系统会执行 **卖出（SELL）** 订单
- 自动查询当前持仓并卖出全部数量
- 如果没有持仓，则跳过该信号

---

### 安全性说明

1. **加密存储**：所有 API 密钥都加密存储在数据库中
2. **权限隔离**：每个用户只能访问自己的配置和交易记录
3. **PRO 限制**：只有 PRO 和 Premium 用户可以使用此功能
4. **服务端验证**：所有交易请求都经过服务端验证和授权

---

### 常见问题（FAQ）

**Q: Alpaca 集成是免费的吗？**  
A: Alpaca 集成是 **PRO 专属功能**，需要升级到 PRO 或 Premium 订阅才能使用。Alpaca 本身的账户注册和纸交易是免费的。

**Q: Paper Trading 和 Live Trading 有什么区别？**  
A: 
- **Paper Trading（纸交易）**：使用 Alpaca 提供的模拟环境，不涉及真实资金，用于测试策略
- **Live Trading（实盘交易）**：使用真实资金进行交易，所有盈亏都是真实的

**Q: 如何确保不会意外执行真实交易？**  
A: 
1. 使用 Paper Trading 模式时，系统连接的是 Alpaca 的模拟服务器
2. 即使误操作，也只会在模拟环境执行
3. 只有明确选择 Live Trading 才会连接真实交易服务器

**Q: 我可以随时停止自动交易吗？**  
A: 可以。在 Settings > Live Trading 页面关闭开关即可立即停止自动交易。已提交的订单需要手动到 Alpaca 取消。

**Q: 交易失败了怎么办？**  
A: 
- 所有失败的交易都会记录在交易历史中，包含失败原因
- 常见失败原因：资金不足、股票代码错误、市场休市等
- 检查交易历史页面的错误信息进行排查

**Q: 支持哪些订单类型？**  
A: 目前系统使用 **市价单（Market Order）** 确保快速成交。未来版本会支持限价单、止损单等更多类型。

**Q: 如何删除 Alpaca 配置？**  
A: 在 Settings > Live Trading 页面点击 "Delete" 按钮，确认后即可删除配置。删除后不会影响历史交易记录。

**Q: Alpaca 支持哪些市场？**  
A: Alpaca 主要支持美国股票市场（NYSE、NASDAQ 等）以及部分加密货币。具体支持的资产请查看 [Alpaca 官方文档](https://alpaca.markets/docs/)。

---

### 相关文件和数据库

**前端组件：**
- `src/components/settings/LiveTradingSettings.tsx` - Live Trading 设置页面
- `src/pages/AlpacaTrades.tsx` - 交易历史页面
- `src/services/alpacaService.ts` - Alpaca 服务封装

**Edge Functions：**
- `supabase/functions/alpaca-execute-trade/index.ts` - Alpaca 交易执行函数（手动调用）
- `supabase/functions/alpaca-auto-trade/index.ts` - 自动交易处理函数（系统调用）

**数据库表：**
- `alpaca_configurations` - 存储用户的 Alpaca API 配置
- `alpaca_trade_executions` - 记录所有交易执行历史

**数据库迁移：**
- `supabase/migrations/20251012000000_create_alpaca_integration.sql`

---

### 技术支持

如有任何问题或建议，请通过以下方式联系：
- Settings > Contact Us 页面提交反馈
- 查看交易历史页面的错误信息进行故障排查
- 访问 [Alpaca 官方文档](https://alpaca.markets/docs/) 了解更多 API 信息

---

### 免责声明

⚠️ **重要提示：**
- 交易有风险，投资需谨慎
- 本系统提供的是技术工具，不构成投资建议
- 使用 Live Trading 功能前，请确保你充分理解策略逻辑和风险
- 强烈建议在 Paper Trading 模式下充分测试后再切换到 Live Trading
- 开发团队不对任何交易损失承担责任

**PRO 用户特别提醒：**
- 请定期检查交易历史，确保交易符合预期
- 建议设置合理的仓位管理和风险控制
- 避免在市场波动剧烈时激活自动交易
- 保护好你的 API 密钥，不要分享给他人