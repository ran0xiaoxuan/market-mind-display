# 部署修复后的 monitor-trading-signals Edge Function
# 用法: .\deploy-monitor-fix.ps1

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "部署 monitor-trading-signals 修复" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了Supabase CLI
Write-Host "检查Supabase CLI..." -ForegroundColor Yellow
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCmd) {
    Write-Host "❌ 未找到Supabase CLI" -ForegroundColor Red
    Write-Host ""
    Write-Host "请选择以下方式之一：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "方法1: 安装Supabase CLI" -ForegroundColor Green
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "方法2: 使用Supabase Dashboard手动部署（推荐）" -ForegroundColor Green
    Write-Host "  1. 访问: https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "  2. 选择项目 > Edge Functions > monitor-trading-signals" -ForegroundColor White
    Write-Host "  3. 点击 'Deploy new version'" -ForegroundColor White
    Write-Host "  4. 复制 supabase/functions/monitor-trading-signals/index.ts 的内容" -ForegroundColor White
    Write-Host "  5. 粘贴并点击 'Deploy'" -ForegroundColor White
    Write-Host ""
    Write-Host "详细步骤请查看: CRITICAL_BUG_FIX.md" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ 找到Supabase CLI" -ForegroundColor Green
Write-Host ""

# 检查是否在正确的目录
if (-not (Test-Path "supabase/functions/monitor-trading-signals/index.ts")) {
    Write-Host "❌ 错误: 未找到 monitor-trading-signals 函数" -ForegroundColor Red
    Write-Host "请确保在项目根目录运行此脚本" -ForegroundColor Yellow
    exit 1
}

Write-Host "准备部署..." -ForegroundColor Yellow
Write-Host ""

# 部署函数
Write-Host "🚀 正在部署 monitor-trading-signals..." -ForegroundColor Cyan
supabase functions deploy monitor-trading-signals

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 部署成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "接下来的步骤：" -ForegroundColor Yellow
    Write-Host "1. 检查Edge Function日志:" -ForegroundColor White
    Write-Host "   Supabase Dashboard > Logs > Edge Functions" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. 验证信号生成:" -ForegroundColor White
    Write-Host "   运行 CHECK_SIGNAL_STATUS.sql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. 查看修复详情:" -ForegroundColor White
    Write-Host "   CRITICAL_BUG_FIX.md" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 部署失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "请尝试:" -ForegroundColor Yellow
    Write-Host "1. 检查网络连接" -ForegroundColor White
    Write-Host "2. 运行: supabase login" -ForegroundColor White
    Write-Host "3. 运行: supabase link --project-ref your-project-ref" -ForegroundColor White
    Write-Host ""
    Write-Host "或使用Dashboard手动部署（详见 CRITICAL_BUG_FIX.md）" -ForegroundColor Cyan
    exit 1
}

