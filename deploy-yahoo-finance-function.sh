#!/bin/bash

# Yahoo Finance Edge Function部署脚本
# 用于快速部署get-yahoo-finance-data函数到Supabase

echo "========================================="
echo "Yahoo Finance Edge Function 部署脚本"
echo "========================================="
echo ""

# 检查是否安装了Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装"
    echo ""
    echo "请先安装 Supabase CLI:"
    echo "  npm install -g supabase"
    echo ""
    echo "或使用 homebrew (Mac):"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI 已安装"
echo ""

# 检查是否已登录
if ! supabase projects list &> /dev/null; then
    echo "⚠️  未登录 Supabase"
    echo ""
    echo "正在打开登录页面..."
    supabase login
    
    if [ $? -ne 0 ]; then
        echo "❌ 登录失败"
        exit 1
    fi
    echo ""
fi

echo "✅ 已登录 Supabase"
echo ""

# 检查是否已链接项目
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  项目未链接"
    echo ""
    echo "请输入您的 Supabase 项目 Reference ID:"
    echo "(可以在 Supabase Dashboard → Settings → General 中找到)"
    read -p "Project Ref: " PROJECT_REF
    
    if [ -z "$PROJECT_REF" ]; then
        echo "❌ 未提供 Project Ref"
        exit 1
    fi
    
    echo ""
    echo "正在链接项目..."
    supabase link --project-ref "$PROJECT_REF"
    
    if [ $? -ne 0 ]; then
        echo "❌ 链接项目失败"
        exit 1
    fi
    echo ""
fi

echo "✅ 项目已链接"
echo ""

# 部署函数
echo "========================================="
echo "开始部署 get-yahoo-finance-data 函数..."
echo "========================================="
echo ""

supabase functions deploy get-yahoo-finance-data

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 部署失败"
    echo ""
    echo "可能的原因:"
    echo "  1. 网络连接问题"
    echo "  2. 函数代码有语法错误"
    echo "  3. 项目权限不足"
    echo ""
    echo "请检查错误信息并重试"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ 部署成功!"
echo "========================================="
echo ""
echo "下一步:"
echo "  1. 在浏览器中测试回测功能"
echo "  2. 查看函数日志: supabase functions logs get-yahoo-finance-data"
echo "  3. 监控函数调用: 访问 Supabase Dashboard → Functions"
echo ""
echo "提示:"
echo "  - 如果遇到问题，请查看 YAHOO_FINANCE_EDGE_FUNCTION.md"
echo "  - 函数URL: https://你的项目ref.supabase.co/functions/v1/get-yahoo-finance-data"
echo ""

