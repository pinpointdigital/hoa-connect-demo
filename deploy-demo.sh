#!/bin/bash

# HOA Connect Demo - Simple Deployment Script
# This script helps you deploy your demo to various platforms

echo "🚀 HOA Connect Demo Deployment Helper"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the hoa-connect-demo root directory"
    exit 1
fi

echo "📦 Building the frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built successfully!"
echo ""
echo "🌐 Ready to deploy! Choose your platform:"
echo ""
echo "1. Railway (Recommended - Easiest)"
echo "   - Go to railway.app"
echo "   - Connect GitHub and deploy this repo"
echo "   - Automatic detection and deployment"
echo ""
echo "2. Vercel (Frontend) + Railway (Backend)"
echo "   - Deploy backend to railway.app"
echo "   - Deploy frontend to vercel.com"
echo "   - Set REACT_APP_API_URL environment variable"
echo ""
echo "3. Netlify (Static hosting)"
echo "   - Upload the 'build' folder to netlify.com"
echo "   - For demo purposes (backend won't work)"
echo ""
echo "📁 Your built files are in the 'build' directory"
echo "🔗 Make sure to set these environment variables:"
echo "   - REACT_APP_API_URL=https://your-backend-url"
echo "   - NODE_ENV=production"
echo ""
echo "✨ Demo will be live in 5-10 minutes!"
