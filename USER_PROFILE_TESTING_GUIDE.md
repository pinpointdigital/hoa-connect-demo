# 👤 User Profile Management - Testing Guide

## 🎯 **NEW FEATURE: User Profile Management**

You can now update contact information for all demo users to test real email and SMS notifications with your own contact details!

---

## ✅ **What's New**

### **📱 User Profile Button**
- **Location**: Bottom of sidebar (desktop) and mobile menu
- **Icon**: User profile icon with current user name
- **Action**: Click to open profile management modal

### **📝 Profile Management Modal**
- **Contact Information**: Email, phone, address
- **Emergency Contact**: Name and phone number  
- **Notification Preferences**: Email only, SMS only, or both
- **Real-time Editing**: Click "Edit" to modify information
- **Auto-save**: Changes persist across sessions

### **🔄 Demo User Defaults**
Each demo user has realistic default contact information:
- **Jason Abustan**: jason.abustan@example.com, +1-555-0123
- **Allan Chua**: allan.chua@seabreezemanagement.com, +1-949-555-0101  
- **Robert Ferguson**: robert.ferguson@example.com, +1-555-0201
- **Dean Martin**: dean.martin@example.com, +1-555-0301
- **Frank Sinatra**: frank.sinatra@example.com, +1-555-0401

---

## 🧪 **Testing Real Notifications**

### **Step 1: Update Your Contact Information**

1. **Access Profile Management**:
   - Click the user profile button at bottom of sidebar
   - Or open mobile menu and click profile section

2. **Edit Contact Information**:
   - Click "Edit" button
   - Update **Email Address** to your real email
   - Update **Phone Number** to your real phone (format: +1234567890)
   - Set **Notification Preferences** to "Email and SMS"
   - Click "Save Changes"

3. **Verify Changes**:
   - Profile should show "Saved!" confirmation
   - Your updated information should persist

### **Step 2: Test Each Demo User**

**For comprehensive testing, update contact info for all users:**

1. **Jason Abustan (Homeowner)**:
   - Switch to Jason using demo switcher
   - Update his email/phone to your test addresses
   - He'll receive request status notifications

2. **Allan Chua (HOA Management)**:
   - Switch to Allan using demo switcher  
   - Update his contact information
   - He'll receive management notifications

3. **Robert Ferguson (Board President)**:
   - Switch to Robert using demo switcher
   - Update his contact information
   - He'll receive board voting notifications

4. **Dean Martin (Board VP)**:
   - Switch to Dean using demo switcher
   - Update his contact information
   - He'll receive board voting notifications

5. **Frank Sinatra (Board Treasurer)**:
   - Switch to Frank using demo switcher
   - Update his contact information
   - He'll receive board voting notifications

---

## 🔄 **Complete Workflow Testing**

### **Scenario 1: Homeowner Request with Real Notifications**

1. **Submit Request (as Jason)**:
   - Switch to Jason Abustan
   - Update his contact info to your email/phone
   - Submit new ARC request
   - **✅ You should receive**: Email notification about request submission

2. **Management Review (as Allan)**:
   - Switch to Allan Chua
   - Update his contact info to different email/phone
   - Review and approve Jason's request
   - **✅ Allan should receive**: Management notification
   - **✅ Jason should receive**: Status update notification

3. **Board Voting (as Robert, Dean, Frank)**:
   - Switch to each board member
   - Update their contact info to different emails/phones
   - Cast votes on the request
   - **✅ Each board member should receive**: Voting request notifications
   - **✅ Jason should receive**: Final decision notification

### **Scenario 2: Forms Distribution Testing**

1. **Distribute Form (as Allan)**:
   - Switch to Allan Chua (HOA Management)
   - Go to Communications Center
   - Distribute "Owner Notice Disclosure" form
   - **✅ All homeowners should receive**: Form notification

2. **Complete Form (as Jason)**:
   - Switch to Jason Abustan
   - Complete the distributed form
   - **✅ Allan should receive**: Form completion notification

---

## 📧 **Notification Types You'll Receive**

### **Email Notifications**
- **From**: noreply@tryhoaconnect.com
- **Subject Lines**: 
  - "HOA Connect - Request Status Update"
  - "HOA Connect - Board Voting Request"
  - "HOA Connect - Form Distribution"
  - "HOA Connect - Neighbor Approval Request"

### **SMS Notifications**  
- **From**: +18582833204
- **Format**: "Sent from your Twilio trial account - [Message]"
- **Content**: Brief status updates and action items

---

## 🔍 **Troubleshooting**

### **If You Don't Receive Notifications**

1. **Check Email**:
   - Look in spam/junk folder
   - Verify email address is correct in profile
   - Check SendGrid dashboard for delivery status

2. **Check SMS**:
   - Verify phone number format: +1234567890
   - Check if number is verified in Twilio (for trial account)
   - Look for carrier blocking/filtering

3. **Check Profile Settings**:
   - Ensure notification preference is set to "Email and SMS"
   - Verify contact information was saved correctly
   - Try switching users and updating again

### **Common Issues**

- **Phone Number Format**: Must include country code (+1 for US)
- **Twilio Trial Account**: Only sends to verified numbers
- **Email Delivery**: May take 1-2 minutes to arrive
- **Profile Not Saving**: Check browser console for errors

---

## 🎯 **Testing Checklist**

### **Profile Management**
- [ ] Can access profile modal from sidebar
- [ ] Can access profile modal from mobile menu
- [ ] Can edit contact information
- [ ] Changes save and persist
- [ ] Profile shows correct user information
- [ ] Notification preferences work

### **Real Notifications**
- [ ] Email notifications received for Jason (homeowner)
- [ ] Email notifications received for Allan (management)
- [ ] Email notifications received for board members
- [ ] SMS notifications received (if phone verified)
- [ ] Notifications contain correct information
- [ ] Unsubscribe links work in emails

### **Workflow Integration**
- [ ] Request submission triggers notifications
- [ ] Status changes trigger notifications
- [ ] Board voting triggers notifications
- [ ] Form distribution triggers notifications
- [ ] All notification content is accurate

---

## 🚀 **Ready for Production Testing!**

With user profile management, you can now:

✅ **Test with real contact information**  
✅ **Receive actual notifications during workflow testing**  
✅ **Verify notification content and timing**  
✅ **Test different notification preferences**  
✅ **Simulate real-world usage scenarios**  

**Your HOA Connect system is now ready for comprehensive end-to-end testing with real notifications!**

---

## 📱 **Access Your System**

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Profile Management**: Click user profile button in navigation

**Start testing by updating your contact information and running through the complete HOA request workflow!**








