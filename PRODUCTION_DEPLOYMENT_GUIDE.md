# 🚀 HOA Connect Production Deployment Guide

## 🎯 **Quick Start for Seabreeze Deployment**

This guide will get HOA Connect running in production for Seabreeze Management with their 8 communities and 2000+ homeowners.

---

## 📋 **Prerequisites**

### **Required Accounts & Services**
- [ ] **SendGrid Account** - For email notifications
- [ ] **Twilio Account** - For SMS notifications  
- [ ] **Cloud Provider** - AWS, Google Cloud, or Azure
- [ ] **Domain Name** - For custom branding (e.g., app.seabreezemanagement.com)
- [ ] **SSL Certificate** - For HTTPS (Let's Encrypt or purchased)

### **Required Software**
- [ ] **Docker & Docker Compose** - For containerized deployment
- [ ] **Git** - For code deployment
- [ ] **Node.js 18+** - For local development (optional)

---

## 🔧 **Step 1: Server Setup**

### **Option A: Cloud Deployment (Recommended)**

**AWS Setup**:
```bash
# Launch EC2 instance (t3.large or larger for 2000+ users)
# - Ubuntu 22.04 LTS
# - 4 vCPU, 8GB RAM minimum
# - 100GB SSD storage
# - Security groups: 80, 443, 22

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

**Database Setup**:
```bash
# Use AWS RDS PostgreSQL (recommended)
# - Instance: db.t3.medium or larger
# - Multi-AZ deployment for high availability
# - Automated backups enabled
# - Security group: PostgreSQL (5432) from app servers only
```

### **Option B: Local/VPS Deployment**

```bash
# Clone the repository
git clone https://github.com/your-org/hoa-connect.git
cd hoa-connect

# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 🔑 **Step 2: Configure Environment Variables**

### **Create Production Environment File**
```bash
# Copy template and edit with real values
cp infrastructure/env.production.template .env.production

# Edit the file with your actual credentials
nano .env.production
```

### **Required Configurations**

**SendGrid Setup**:
1. Create SendGrid account at https://sendgrid.com
2. Generate API key with "Mail Send" permissions
3. Set up domain authentication for seabreezemanagement.com
4. Update `.env.production`:
   ```bash
   SENDGRID_API_KEY=SG.your_real_api_key_here
   SENDGRID_FROM_EMAIL=noreply@seabreezemanagement.com
   SENDGRID_FROM_NAME=Seabreeze Management
   ```

**Twilio Setup**:
1. Create Twilio account at https://twilio.com
2. Purchase a phone number
3. Get Account SID and Auth Token
4. Update `.env.production`:
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

**Database Setup**:
```bash
# For AWS RDS
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/hoa_connect_prod

# For local PostgreSQL
DATABASE_URL=postgresql://hoa_connect_user:strong_password@database:5432/hoa_connect_prod
```

**Security Keys** (Generate strong, unique keys):
```bash
# Generate JWT secret (64+ characters)
JWT_SECRET=$(openssl rand -base64 64)

# Generate encryption key (32 characters)
ENCRYPTION_KEY=$(openssl rand -base64 32 | head -c 32)

# Generate session secret (64+ characters)  
SESSION_SECRET=$(openssl rand -base64 64)
```

---

## 🚀 **Step 3: Deploy the Application**

### **Production Deployment**
```bash
# Make deployment script executable
chmod +x infrastructure/deploy.sh

# Deploy to production
./infrastructure/deploy.sh production deploy
```

### **Manual Deployment Steps**
```bash
# Build and start services
docker-compose -f infrastructure/docker-compose.production.yml --env-file .env.production up -d

# Check service status
docker-compose -f infrastructure/docker-compose.production.yml ps

# View logs
docker-compose -f infrastructure/docker-compose.production.yml logs -f
```

---

## 🔒 **Step 4: SSL & Domain Setup**

### **Option A: Let's Encrypt (Free SSL)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d app.seabreezemanagement.com -d api.seabreezemanagement.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Option B: Custom SSL Certificate**
```bash
# Copy your SSL certificate files
cp your-certificate.crt infrastructure/ssl/cert.pem
cp your-private-key.key infrastructure/ssl/key.pem

# Set proper permissions
chmod 600 infrastructure/ssl/key.pem
chmod 644 infrastructure/ssl/cert.pem
```

### **DNS Configuration**
```bash
# Point your domain to the server
# A record: app.seabreezemanagement.com -> YOUR_SERVER_IP
# A record: api.seabreezemanagement.com -> YOUR_SERVER_IP
```

---

## 📊 **Step 5: Load Seabreeze Data**

### **Import Communities & Users**
```bash
# Access the database
docker-compose -f infrastructure/docker-compose.production.yml exec database psql -U hoa_connect_user -d hoa_connect_prod

# The 8 Seabreeze communities are already created by init-db.sql:
# 1. Rancho Madrina (250 homeowners)
# 2. Seabreeze Estates (300 homeowners)  
# 3. Pacific Heights (200 homeowners)
# 4. Marina Village (275 homeowners)
# 5. Sunset Ridge (225 homeowners)
# 6. Coastal Breeze (350 homeowners)
# 7. Garden Grove HOA (180 homeowners)
# 8. Vista Del Mar (320 homeowners)
```

### **Create Management Users**
```bash
# Create HOA management team accounts
# This should be done through the admin interface or API
curl -X POST https://api.seabreezemanagement.com/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "allan.chua@seabreezemanagement.com",
    "first_name": "Allan",
    "last_name": "Chua", 
    "role": "management",
    "community_id": "rancho-madrina-id"
  }'
```

---

## 🔍 **Step 6: Testing & Validation**

### **Health Checks**
```bash
# Check all services are running
./infrastructure/deploy.sh production health

# Test API endpoints
curl https://api.seabreezemanagement.com/health
curl https://app.seabreezemanagement.com

# Test notifications
curl -X POST https://api.seabreezemanagement.com/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"type": "email", "recipient": "test@seabreezemanagement.com"}'
```

### **Load Testing**
```bash
# Install Apache Bench for load testing
sudo apt install apache2-utils

# Test with 100 concurrent users
ab -n 1000 -c 100 https://app.seabreezemanagement.com/

# Test API endpoints
ab -n 500 -c 50 https://api.seabreezemanagement.com/health
```

### **End-to-End Testing**
1. **Create test homeowner account**
2. **Submit a test ARC request**  
3. **Process through management review**
4. **Complete board voting**
5. **Verify all notifications sent**

---

## 📈 **Step 7: Monitoring & Maintenance**

### **Set Up Monitoring**
```bash
# Application monitoring (included in Docker Compose)
# Access Prometheus: http://your-server:9090

# Set up alerts for:
# - High CPU/memory usage
# - Database connection issues  
# - Failed notifications
# - API response time > 2 seconds
```

### **Backup Strategy**
```bash
# Automated daily backups
./infrastructure/deploy.sh production backup

# Set up automated backup schedule
sudo crontab -e
# Add: 0 2 * * * /path/to/hoa-connect/infrastructure/deploy.sh production backup
```

### **Log Management**
```bash
# View application logs
docker-compose -f infrastructure/docker-compose.production.yml logs backend

# Set up log rotation
sudo nano /etc/logrotate.d/hoa-connect
```

---

## 🚨 **Step 8: Security Hardening**

### **Firewall Configuration**
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### **Security Updates**
```bash
# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### **Database Security**
```bash
# Restrict database access
# - Use strong passwords
# - Enable SSL connections
# - Whitelist only application servers
# - Regular security patches
```

---

## 📋 **Step 9: Go-Live Checklist**

### **Pre-Launch**
- [ ] All services health checks passing
- [ ] SSL certificate installed and valid
- [ ] Domain DNS configured correctly
- [ ] SendGrid domain authentication verified
- [ ] Twilio phone number tested
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Load testing completed successfully
- [ ] Security hardening applied

### **Launch Day**
- [ ] Final backup created
- [ ] All team members notified
- [ ] Support channels ready
- [ ] Performance monitoring active
- [ ] Rollback plan prepared

### **Post-Launch**
- [ ] User adoption tracking
- [ ] Performance metrics monitoring
- [ ] Error rate monitoring
- [ ] Notification delivery rates
- [ ] User feedback collection

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Services won't start**:
```bash
# Check Docker logs
docker-compose -f infrastructure/docker-compose.production.yml logs

# Check system resources
docker system df
free -h
df -h
```

**Database connection issues**:
```bash
# Test database connection
docker-compose -f infrastructure/docker-compose.production.yml exec database pg_isready

# Check database logs
docker-compose -f infrastructure/docker-compose.production.yml logs database
```

**Notification failures**:
```bash
# Check SendGrid API key
curl -X GET https://api.sendgrid.com/v3/user/profile \
  -H "Authorization: Bearer YOUR_API_KEY"

# Check Twilio credentials
curl -X GET https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID.json \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

**High memory usage**:
```bash
# Check container resource usage
docker stats

# Optimize database connections
# Reduce connection pool size in .env.production
```

### **Emergency Procedures**

**Rollback Deployment**:
```bash
# Stop current services
./infrastructure/deploy.sh production stop

# Restore from backup
# (Restore database from latest backup)

# Deploy previous version
git checkout previous-stable-tag
./infrastructure/deploy.sh production deploy
```

**Scale Up for High Load**:
```bash
# Increase backend replicas
docker-compose -f infrastructure/docker-compose.production.yml up -d --scale backend=3

# Monitor performance
docker stats
```

---

## 📞 **Support & Maintenance**

### **Regular Maintenance Tasks**
- **Daily**: Check service health and logs
- **Weekly**: Review performance metrics and user feedback
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Capacity planning and performance optimization

### **Support Contacts**
- **Technical Issues**: [Your support email]
- **Emergency Escalation**: [Your emergency contact]
- **Seabreeze Management**: allan.chua@seabreezemanagement.com

---

## 🎯 **Success Metrics**

### **Technical KPIs**
- **Uptime**: >99.9%
- **API Response Time**: <2 seconds
- **Notification Delivery**: >95%
- **Error Rate**: <0.1%

### **Business KPIs**
- **User Adoption**: >80% in 30 days
- **Request Processing Time**: 50% reduction
- **Manual Communication**: 90% reduction
- **Client Satisfaction**: >4.5/5

---

**🎉 Congratulations! HOA Connect is now running in production for Seabreeze Management.**

**Next Steps**: Monitor the system closely for the first 48 hours, gather user feedback, and iterate based on real-world usage patterns.








