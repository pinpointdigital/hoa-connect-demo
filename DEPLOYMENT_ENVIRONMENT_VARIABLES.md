# 🚀 Deployment Environment Variables Guide

This guide shows you exactly what environment variables to set up when deploying your HOA Connect demo.

## 📋 Required Environment Variables for Railway/Vercel

### **Frontend Environment Variables**
Set these in your deployment platform (Railway/Vercel):

```bash
# API Connection
REACT_APP_API_URL=https://your-backend-url.railway.app

# Environment
NODE_ENV=production
```

### **Backend Environment Variables**
Set these for your backend service:

```bash
# Environment
NODE_ENV=production
PORT=3001

# For demo purposes - these can be placeholder values
SENDGRID_API_KEY=your_sendgrid_key_here
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_here

# Security (generate secure random values)
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
SESSION_SECRET=your_session_secret_here
```

## 🔧 How to Set Environment Variables

### **Railway:**
1. Go to your project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add each variable with its value

### **Vercel:**
1. Go to your project dashboard
2. Go to "Settings" → "Environment Variables"
3. Add each variable with its value

### **Netlify:**
1. Go to your site dashboard
2. Go to "Site settings" → "Environment variables"
3. Add each variable with its value

## 🎯 Quick Setup Commands

After deployment, your URLs will look like:
- **Frontend**: `https://your-app-name.railway.app`
- **Backend**: `https://your-backend-name.railway.app`

**Important**: Replace `https://your-backend-url.railway.app` with your actual backend URL!

## ✅ Testing Your Deployment

After setting environment variables:
1. Your frontend should connect to the backend
2. Forms should submit successfully
3. Real-time notifications should work
4. Socket connections should establish

## 🐛 Troubleshooting

**Problem**: Frontend can't connect to backend
**Solution**: Check that `REACT_APP_API_URL` matches your backend URL exactly

**Problem**: Socket connection fails
**Solution**: Ensure your backend supports WebSocket connections (Railway does by default)

**Problem**: Environment variables not working
**Solution**: Redeploy after setting variables - changes require a new build
