# 🔧 HOA Connect Production Configuration

## 📝 **Manual Configuration Guide**

Since you prefer to enter the values directly, here's exactly what you need to update in your `.env.production` file:

---

## 🔑 **Step 1: Generate Secure Keys**

First, let's generate secure keys for your production environment:

```bash
# Generate JWT Secret (64 characters)
openssl rand -base64 64

# Generate Encryption Key (32 characters)
openssl rand -base64 32 | head -c 32

# Generate Session Secret (64 characters)  
openssl rand -base64 64
```

---

## 📧 **Step 2: SendGrid Configuration**

Update these values in `.env.production`:

```bash
# SendGrid Configuration (Production)
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY_HERE
SENDGRID_FROM_EMAIL=noreply@tryhoaconnect.com
SENDGRID_FROM_NAME=HOA Connect
```

**Replace with your actual values:**
- `YOUR_SENDGRID_API_KEY_HERE` → Your actual SendGrid API key (starts with `SG.`)

---

## 📱 **Step 3: Twilio Configuration**

Update these values in `.env.production`:

```bash
# Twilio Configuration (Production)
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN_HERE
TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER_HERE
```

**Replace with your actual values:**
- `YOUR_TWILIO_ACCOUNT_SID_HERE` → Your Twilio Account SID
- `YOUR_TWILIO_AUTH_TOKEN_HERE` → Your Twilio Auth Token  
- `YOUR_TWILIO_PHONE_NUMBER_HERE` → Your Twilio phone number (format: +1234567890)

---

## 🔒 **Step 4: Security Keys**

Update these values with the generated keys from Step 1:

```bash
# Security (Generate strong, unique keys)
JWT_SECRET=PASTE_GENERATED_JWT_SECRET_HERE
ENCRYPTION_KEY=PASTE_GENERATED_ENCRYPTION_KEY_HERE
SESSION_SECRET=PASTE_GENERATED_SESSION_SECRET_HERE
```

---

## 🌐 **Step 5: Domain Configuration**

Update these values for your domain:

```bash
# Frontend Configuration
REACT_APP_API_URL=https://api.tryhoaconnect.com
CORS_ORIGIN=https://app.tryhoaconnect.com
```

---

## 🗄️ **Step 6: Database Configuration**

For now, you can leave the database settings as they are (they'll work with Docker):

```bash
# Database Configuration (Use managed database service in production)
DB_USER=hoa_connect_prod_user
DB_PASSWORD=CHANGE_TO_STRONG_DATABASE_PASSWORD
DATABASE_URL=postgresql://hoa_connect_prod_user:CHANGE_TO_STRONG_DATABASE_PASSWORD@database:5432/hoa_connect_prod
```

**Update the password** to something strong and secure.

---

## ✅ **Quick Configuration Checklist**

- [ ] Generated and set JWT_SECRET
- [ ] Generated and set ENCRYPTION_KEY  
- [ ] Generated and set SESSION_SECRET
- [ ] Set SENDGRID_API_KEY (starts with SG.)
- [ ] Set SENDGRID_FROM_EMAIL to noreply@tryhoaconnect.com
- [ ] Set SENDGRID_FROM_NAME to "HOA Connect"
- [ ] Set TWILIO_ACCOUNT_SID
- [ ] Set TWILIO_AUTH_TOKEN
- [ ] Set TWILIO_PHONE_NUMBER (format: +1234567890)
- [ ] Set strong DB_PASSWORD
- [ ] Updated domain URLs to tryhoaconnect.com

---

## 🧪 **Step 7: Test Your Configuration**

After updating the values, test your configuration:

```bash
./test-notifications.sh
```

This will verify:
- ✅ SendGrid API connection
- ✅ Twilio API connection  
- ✅ Send test email
- ✅ Send test SMS

---

**Please provide your credentials and I'll help you verify the configuration is correct!**

**What you need to share:**
1. **SendGrid API Key** (starts with SG.)
2. **Twilio Account SID** 
3. **Twilio Auth Token**
4. **Twilio Phone Number** (format: +1234567890)
5. **Preferred database password** (I'll generate secure keys for you)








