# Welcome to your Lovable project

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
  - `VITE_SUPABASE_URL`（可选，若不使用硬编码 URL）
  - `VITE_SUPABASE_ANON_KEY`（可选，若不使用硬编码 Key）
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
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
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
