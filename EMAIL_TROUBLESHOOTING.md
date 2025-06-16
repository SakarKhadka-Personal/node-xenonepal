# Email Troubleshooting Guide for XenoNepal Production

## 🚨 Email Not Working in Production?

This guide will help you diagnose and fix email issues when deploying XenoNepal to production (https://xenonepal.com).

## 📋 Quick Diagnosis Checklist

### 1. Check Email Service Status
```bash
# Check if email service initialized
pm2 logs xenonepal-server | grep -i email

# Look for these success messages:
# ✅ Email service initialized successfully!
# 📧 Email user: xenonepal@gmail.com
```

### 2. Test Email Configuration
```bash
# Run the email test script
npm run test-email

# Or test with a specific email
node test-email.js your-email@example.com
```

### 3. Check Environment Variables
```bash
# Verify PM2 environment
pm2 show xenonepal-server

# Should show EMAIL_USER, EMAIL_PASSWORD, etc.
```

## 🔧 Common Issues & Solutions

### Issue 1: Authentication Error (EAUTH)
```
❌ AUTHENTICATION ERROR:
- Make sure you are using Gmail App Password, not regular password
```

**Solution:**
1. Enable 2-Factor Authentication on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Generate a 16-character App Password
4. Use that password in your environment variables

### Issue 2: Missing Environment Variables
```
❌ MISSING EMAIL CREDENTIALS:
hasEmailUser: false
hasEmailPassword: false
```

**Solution:**
Check `ecosystem.config.js` has correct `env_production` section:
```javascript
env_production: {
  EMAIL_USER: 'xenonepal@gmail.com',
  EMAIL_PASSWORD: 'your-16-char-app-password',
  EMAIL_FROM_NAME: 'XenoNepal',
  SUPPORT_EMAIL: 'support@xenonepal.com'
}
```

### Issue 3: Network/Firewall Issues
```
❌ NETWORK ERROR:
- Check internet connection
- Verify firewall/proxy settings
```

**Solution:**
1. Test connectivity: `telnet smtp.gmail.com 587`
2. Check server firewall allows outbound SMTP (port 587)
3. Verify no proxy blocking Gmail SMTP

### Issue 4: Email Service Not Initializing
```
Email service not initialized, skipping email send
```

**Solution:**
1. Check server logs: `pm2 logs xenonepal-server`
2. Restart the service: `pm2 restart xenonepal-server`
3. Redeploy: `npm run deploy`

## 🚀 Production Deployment Steps

### 1. Deploy with Enhanced Logging
```bash
# Use the new deployment script
npm run deploy

# This will:
# - Check environment variables
# - Test email configuration  
# - Deploy with proper PM2 settings
# - Show deployment status
```

### 2. Verify Email Service After Deployment
```bash
# Check logs for email initialization
pm2 logs xenonepal-server --lines 50 | grep -i email

# Test email sending
npm run test-email support@xenonepal.com
```

### 3. Monitor Email Performance
```bash
# Real-time logs
pm2 logs xenonepal-server --lines 0

# Look for email-related messages:
# 🚀 SENDING EMAIL: order_completion to user@example.com
# ✅ EMAIL SENT SUCCESSFULLY to user@example.com
```

## 📊 Email Configuration Details

### Current Setup
- **SMTP Service:** Gmail
- **Host:** smtp.gmail.com
- **Port:** 587 (TLS)
- **Authentication:** App Password required
- **From Address:** xenonepal@gmail.com

### Environment Variables Required
```bash
EMAIL_USER=xenonepal@gmail.com
EMAIL_PASSWORD=kjjphtcoduqslwgt  # 16-char Gmail App Password
EMAIL_FROM_NAME=XenoNepal
SUPPORT_EMAIL=support@xenonepal.com
```

## 🔍 Debugging Commands

### Check Email Service Status
```bash
# View email-related logs
pm2 logs xenonepal-server | grep -E "(email|EMAIL|SMTP)"

# Check process environment
pm2 show xenonepal-server | grep -A 20 "env:"
```

### Manual Email Test
```bash
# Test with enhanced logging
NODE_ENV=production node test-email.js

# Test specific email template
curl -X POST http://localhost:5000/api/email/test-html \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

### Database Email Templates
```bash
# Check if email templates exist
# Connect to MongoDB and run:
db.emailtemplates.find({isActive: true}).count()
```

## 🚨 Emergency Fixes

### If emails still not working:

1. **Restart everything:**
   ```bash
   pm2 restart xenonepal-server
   ```

2. **Clear PM2 and redeploy:**
   ```bash
   pm2 delete xenonepal-server
   npm run deploy
   ```

3. **Check Gmail account:**
   - Verify 2FA is enabled
   - Generate new App Password
   - Update environment variables

4. **Alternative SMTP (if Gmail fails):**
   - Consider using SendGrid, Amazon SES, or other SMTP service
   - Update email service configuration accordingly

## 📞 Support

If email issues persist:
1. Check logs: `pm2 logs xenonepal-server`
2. Test configuration: `npm run test-email`
3. Verify Gmail App Password settings
4. Check server network connectivity

Remember: Gmail App Passwords are 16 characters and look like: `abcd efgh ijkl mnop`
