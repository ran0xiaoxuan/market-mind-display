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

### 4) 自定义域名（可选）

- 在 Netlify → Domain management 绑定你的域名，设置好 DNS 记录即可启用 HTTPS。

### 5) 故障排查

- 刷新 404：确认 `public/_redirects` 已生效，或在 Netlify 的 Redirects 页面检查。
- 空白页：检查构建是否成功、控制台是否有错误。
- Supabase 连接失败：核对 `SUPABASE_URL` 与 `anon key`，以及浏览器网络面板返回的错误。
