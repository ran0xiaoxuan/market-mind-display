#!/bin/bash

# 部署 monitor-trading-signals Edge Function
# 使用方法: ./deploy-monitor-trading-signals.sh

echo "=================================================="
echo "部署 monitor-trading-signals Edge Function"
echo "=================================================="

# 检查是否安装了 Supabase CLI
if ! command -v supabase &> /dev/null
then
    echo "❌ 错误: 未找到 Supabase CLI"
    echo "请先安装: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI 已安装"

# 检查是否已登录
echo ""
echo "检查登录状态..."
if ! supabase projects list &> /dev/null
then
    echo "❌ 未登录到 Supabase"
    echo "请先登录: supabase login"
    exit 1
fi

echo "✅ 已登录到 Supabase"

# 部署函数
echo ""
echo "开始部署 monitor-trading-signals 函数..."
echo ""

cd market-mind-display-main
supabase functions deploy monitor-trading-signals

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✅ 部署成功！"
    echo "=================================================="
    echo ""
    echo "下一步："
    echo "1. 查看日志: supabase functions logs monitor-trading-signals --limit 50"
    echo "2. 测试函数: curl -X POST \"https://<your-project>.supabase.co/functions/v1/monitor-trading-signals\" \\"
    echo "              -H \"Authorization: Bearer <your-anon-key>\" \\"
    echo "              -H \"Content-Type: application/json\" \\"
    echo "              -d '{\"optimized\": true, \"parallel_processing\": true}'"
    echo ""
else
    echo ""
    echo "=================================================="
    echo "❌ 部署失败"
    echo "=================================================="
    echo ""
    echo "请检查错误信息并重试"
    exit 1
fi

