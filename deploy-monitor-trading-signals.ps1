# 部署 monitor-trading-signals Edge Function (PowerShell 版本)
# 使用方法: .\deploy-monitor-trading-signals.ps1

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "部署 monitor-trading-signals Edge Function" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了 Supabase CLI
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ 错误: 未找到 Supabase CLI" -ForegroundColor Red
    Write-Host "请先安装: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI 已安装" -ForegroundColor Green

# 检查是否已登录
Write-Host ""
Write-Host "检查登录状态..." -ForegroundColor Cyan
$loginCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 未登录到 Supabase" -ForegroundColor Red
    Write-Host "请先登录: supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 已登录到 Supabase" -ForegroundColor Green

# 部署函数
Write-Host ""
Write-Host "开始部署 monitor-trading-signals 函数..." -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "market-mind-display-main"
supabase functions deploy monitor-trading-signals

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "✅ 部署成功！" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Cyan
    Write-Host "1. 查看日志: supabase functions logs monitor-trading-signals --limit 50" -ForegroundColor Yellow
    Write-Host "2. 测试函数（替换 <your-project> 和 <your-anon-key>）:" -ForegroundColor Yellow
    Write-Host '   curl -X POST "https://<your-project>.supabase.co/functions/v1/monitor-trading-signals" \' -ForegroundColor Gray
    Write-Host '        -H "Authorization: Bearer <your-anon-key>" \' -ForegroundColor Gray
    Write-Host '        -H "Content-Type: application/json" \' -ForegroundColor Gray
    Write-Host '        -d "{\"optimized\": true, \"parallel_processing\": true}"' -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host "❌ 部署失败" -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查错误信息并重试" -ForegroundColor Yellow
    exit 1
}

