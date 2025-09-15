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
