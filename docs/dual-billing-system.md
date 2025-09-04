# HOA Connect - Dual Billing System Architecture

## 🎯 Overview
This document outlines the comprehensive dual billing system for HOA Connect:
1. **Platform Billing**: HOA Connect billing management companies for platform usage
2. **HOA Fee Billing**: Management companies billing homeowners for HOA fees through our platform

## 💳 Dual Billing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOA Connect Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  Platform Billing              │  HOA Fee Billing              │
│  ┌─────────────────────────┐   │  ┌─────────────────────────┐   │
│  │ HOA Connect             │   │  │ Management Company      │   │
│  │        ↓                │   │  │        ↓                │   │
│  │ Management Companies    │   │  │ Homeowners              │   │
│  │                         │   │  │                         │   │
│  │ • Usage-based pricing   │   │  │ • Monthly HOA fees      │   │
│  │ • Per homeowner fees    │   │  │ • Special assessments   │   │
│  │ • Communication costs   │   │  │ • Late fees             │   │
│  │ • Platform features     │   │  │ • Payment processing    │   │
│  └─────────────────────────┘   │  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🏢 Platform Billing System (B2B)

### **Pricing Model**

```javascript
const PLATFORM_PRICING = {
  // Base platform fee per management company
  BASE_FEE: {
    starter: 99,    // Up to 100 homeowners
    professional: 199, // Up to 500 homeowners
    enterprise: 399,   // Up to 2000 homeowners
    unlimited: 799     // Unlimited homeowners
  },
  
  // Per homeowner monthly fee
  PER_HOMEOWNER: {
    starter: 2.50,
    professional: 2.25,
    enterprise: 2.00,
    unlimited: 1.75
  },
  
  // Communication costs (pass-through + markup)
  COMMUNICATIONS: {
    email: 0.002,      // $0.002 per email (SendGrid + 100% markup)
    sms: 0.015,        // $0.015 per SMS (Twilio + 100% markup)
    voice: 0.05        // $0.05 per voice call (future)
  },
  
  // Feature add-ons
  ADDONS: {
    advanced_analytics: 49,
    custom_branding: 99,
    api_access: 149,
    priority_support: 199,
    white_label: 499
  },
  
  // Setup and professional services
  SERVICES: {
    setup_fee: 500,
    data_migration: 1000,
    custom_integration: 2500,
    training_session: 300
  }
};
```

### **Usage Tracking & Metering**

```javascript
// Usage tracking service
class UsageTracker {
  async trackUsage(tenantId, usageType, quantity, metadata = {}) {
    try {
      await db.query(`
        INSERT INTO usage_records (
          tenant_id, usage_type, quantity, unit_cost, 
          metadata, recorded_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        tenantId,
        usageType, // 'homeowner_count', 'email_sent', 'sms_sent', 'storage_gb'
        quantity,
        this.getUnitCost(usageType),
        JSON.stringify(metadata)
      ]);
      
      // Update real-time usage counters
      await this.updateUsageCounters(tenantId, usageType, quantity);
      
    } catch (error) {
      logger.error('Failed to track usage:', error);
      throw error;
    }
  }
  
  async getMonthlyUsage(tenantId, year, month) {
    const query = `
      SELECT 
        usage_type,
        SUM(quantity) as total_quantity,
        AVG(unit_cost) as avg_unit_cost,
        SUM(quantity * unit_cost) as total_cost
      FROM usage_records
      WHERE tenant_id = $1
      AND EXTRACT(YEAR FROM recorded_at) = $2
      AND EXTRACT(MONTH FROM recorded_at) = $3
      GROUP BY usage_type
    `;
    
    const result = await db.query(query, [tenantId, year, month]);
    return result.rows;
  }
}
```

### **Billing Calculation Engine**

```javascript
class PlatformBillingEngine {
  async calculateMonthlyBill(tenantId, billingPeriod) {
    try {
      const tenant = await this.getTenantDetails(tenantId);
      const usage = await this.getUsageForPeriod(tenantId, billingPeriod);
      
      const bill = {
        tenant_id: tenantId,
        billing_period: billingPeriod,
        line_items: [],
        subtotal: 0,
        tax: 0,
        total: 0
      };
      
      // 1. Base platform fee
      const baseFee = PLATFORM_PRICING.BASE_FEE[tenant.plan];
      bill.line_items.push({
        type: 'base_fee',
        description: `${tenant.plan} Plan - Base Fee`,
        quantity: 1,
        unit_price: baseFee,
        total: baseFee
      });
      
      // 2. Per-homeowner fees
      const homeownerCount = usage.find(u => u.usage_type === 'homeowner_count')?.total_quantity || 0;
      const perHomeownerRate = PLATFORM_PRICING.PER_HOMEOWNER[tenant.plan];
      const homeownerFees = homeownerCount * perHomeownerRate;
      
      bill.line_items.push({
        type: 'homeowner_fees',
        description: `Per Homeowner Fee (${homeownerCount} homeowners)`,
        quantity: homeownerCount,
        unit_price: perHomeownerRate,
        total: homeownerFees
      });
      
      // 3. Communication costs
      const emailsSent = usage.find(u => u.usage_type === 'email_sent')?.total_quantity || 0;
      const smsSent = usage.find(u => u.usage_type === 'sms_sent')?.total_quantity || 0;
      
      if (emailsSent > 0) {
        const emailCost = emailsSent * PLATFORM_PRICING.COMMUNICATIONS.email;
        bill.line_items.push({
          type: 'email_usage',
          description: `Email Communications (${emailsSent} emails)`,
          quantity: emailsSent,
          unit_price: PLATFORM_PRICING.COMMUNICATIONS.email,
          total: emailCost
        });
      }
      
      if (smsSent > 0) {
        const smsCost = smsSent * PLATFORM_PRICING.COMMUNICATIONS.sms;
        bill.line_items.push({
          type: 'sms_usage',
          description: `SMS Communications (${smsSent} messages)`,
          quantity: smsSent,
          unit_price: PLATFORM_PRICING.COMMUNICATIONS.sms,
          total: smsCost
        });
      }
      
      // 4. Add-ons
      const activeAddons = await this.getActiveAddons(tenantId);
      for (const addon of activeAddons) {
        bill.line_items.push({
          type: 'addon',
          description: addon.name,
          quantity: 1,
          unit_price: addon.price,
          total: addon.price
        });
      }
      
      // Calculate totals
      bill.subtotal = bill.line_items.reduce((sum, item) => sum + item.total, 0);
      bill.tax = this.calculateTax(bill.subtotal, tenant.tax_rate);
      bill.total = bill.subtotal + bill.tax;
      
      return bill;
      
    } catch (error) {
      logger.error('Failed to calculate platform bill:', error);
      throw error;
    }
  }
}
```

## 🏠 HOA Fee Billing System (B2C)

### **HOA Fee Structure**

```javascript
const HOA_FEE_TYPES = {
  REGULAR: {
    name: 'Regular HOA Fee',
    frequency: 'monthly', // 'monthly', 'quarterly', 'annually'
    auto_charge: true
  },
  
  SPECIAL_ASSESSMENT: {
    name: 'Special Assessment',
    frequency: 'one_time',
    auto_charge: false, // Requires approval
    requires_board_approval: true
  },
  
  LATE_FEE: {
    name: 'Late Fee',
    frequency: 'as_needed',
    auto_charge: true,
    calculation: 'percentage', // 'fixed', 'percentage'
    rate: 0.05 // 5% of outstanding balance
  },
  
  VIOLATION_FINE: {
    name: 'Violation Fine',
    frequency: 'as_needed',
    auto_charge: false,
    requires_approval: true
  },
  
  AMENITY_FEE: {
    name: 'Amenity Fee',
    frequency: 'monthly',
    auto_charge: true,
    optional: true // Homeowner can opt-in/out
  }
};
```

### **Homeowner Billing Engine**

```javascript
class HOABillingEngine {
  async generateHomeownerBill(homeownerId, billingPeriod) {
    try {
      const homeowner = await this.getHomeownerDetails(homeownerId);
      const community = await this.getCommunityDetails(homeowner.community_id);
      
      const bill = {
        homeowner_id: homeownerId,
        community_id: homeowner.community_id,
        billing_period: billingPeriod,
        due_date: this.calculateDueDate(billingPeriod, community.payment_terms),
        line_items: [],
        subtotal: 0,
        total: 0,
        status: 'pending'
      };
      
      // 1. Regular HOA fees
      if (community.hoa_fee_amount > 0) {
        bill.line_items.push({
          type: 'regular_fee',
          description: 'Monthly HOA Fee',
          amount: community.hoa_fee_amount,
          due_date: bill.due_date
        });
      }
      
      // 2. Special assessments
      const specialAssessments = await this.getActiveSpecialAssessments(
        homeowner.community_id,
        homeownerId,
        billingPeriod
      );
      
      for (const assessment of specialAssessments) {
        bill.line_items.push({
          type: 'special_assessment',
          description: assessment.description,
          amount: assessment.amount,
          due_date: assessment.due_date,
          assessment_id: assessment.id
        });
      }
      
      // 3. Late fees (if applicable)
      const outstandingBalance = await this.getOutstandingBalance(homeownerId);
      if (outstandingBalance > 0) {
        const lateFee = this.calculateLateFee(outstandingBalance, community.late_fee_rate);
        if (lateFee > 0) {
          bill.line_items.push({
            type: 'late_fee',
            description: `Late Fee (${community.late_fee_rate * 100}% of outstanding balance)`,
            amount: lateFee,
            due_date: bill.due_date
          });
        }
      }
      
      // 4. Violation fines
      const unpaidViolations = await this.getUnpaidViolations(homeownerId);
      for (const violation of unpaidViolations) {
        bill.line_items.push({
          type: 'violation_fine',
          description: `Violation Fine: ${violation.description}`,
          amount: violation.fine_amount,
          due_date: violation.due_date,
          violation_id: violation.id
        });
      }
      
      // Calculate total
      bill.subtotal = bill.line_items.reduce((sum, item) => sum + item.amount, 0);
      bill.total = bill.subtotal;
      
      return bill;
      
    } catch (error) {
      logger.error('Failed to generate homeowner bill:', error);
      throw error;
    }
  }
  
  async processAutomaticPayments(billingPeriod) {
    try {
      // Get all homeowners with auto-pay enabled
      const autoPayHomeowners = await db.query(`
        SELECT h.*, pm.* 
        FROM homeowners h
        JOIN payment_methods pm ON h.id = pm.homeowner_id
        WHERE pm.auto_pay_enabled = true
        AND pm.status = 'active'
        AND pm.expires_at > NOW()
      `);
      
      const results = [];
      
      for (const homeowner of autoPayHomeowners.rows) {
        try {
          // Generate bill
          const bill = await this.generateHomeownerBill(homeowner.id, billingPeriod);
          
          // Process payment
          const payment = await this.processPayment({
            homeowner_id: homeowner.id,
            amount: bill.total,
            payment_method_id: homeowner.payment_method_id,
            description: `Auto-pay for ${billingPeriod}`,
            bill_id: bill.id
          });
          
          results.push({
            homeowner_id: homeowner.id,
            status: 'success',
            amount: bill.total,
            payment_id: payment.id
          });
          
        } catch (error) {
          logger.error(`Auto-pay failed for homeowner ${homeowner.id}:`, error);
          
          results.push({
            homeowner_id: homeowner.id,
            status: 'failed',
            error: error.message
          });
          
          // Send payment failure notification
          await this.sendPaymentFailureNotification(homeowner.id, error.message);
        }
      }
      
      return results;
      
    } catch (error) {
      logger.error('Failed to process automatic payments:', error);
      throw error;
    }
  }
}
```

### **Payment Processing Integration**

```javascript
class PaymentProcessor {
  constructor() {
    // Initialize payment providers
    this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    this.plaid = require('plaid'); // For ACH payments
  }
  
  async processPayment(paymentData) {
    try {
      const paymentMethod = await this.getPaymentMethod(paymentData.payment_method_id);
      
      let result;
      
      switch (paymentMethod.type) {
        case 'credit_card':
          result = await this.processCreditCardPayment(paymentData, paymentMethod);
          break;
          
        case 'ach':
          result = await this.processACHPayment(paymentData, paymentMethod);
          break;
          
        case 'bank_transfer':
          result = await this.processBankTransfer(paymentData, paymentMethod);
          break;
          
        default:
          throw new Error(`Unsupported payment method type: ${paymentMethod.type}`);
      }
      
      // Record payment
      const payment = await this.recordPayment({
        homeowner_id: paymentData.homeowner_id,
        amount: paymentData.amount,
        payment_method_id: paymentData.payment_method_id,
        provider_transaction_id: result.transaction_id,
        status: result.status,
        fees: result.fees,
        net_amount: paymentData.amount - result.fees
      });
      
      // Update bill status
      if (paymentData.bill_id) {
        await this.updateBillStatus(paymentData.bill_id, 'paid', payment.id);
      }
      
      return payment;
      
    } catch (error) {
      logger.error('Payment processing failed:', error);
      throw error;
    }
  }
  
  async processCreditCardPayment(paymentData, paymentMethod) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(paymentData.amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethod.stripe_payment_method_id,
      confirm: true,
      description: paymentData.description,
      metadata: {
        homeowner_id: paymentData.homeowner_id,
        bill_id: paymentData.bill_id
      }
    });
    
    return {
      transaction_id: paymentIntent.id,
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      fees: this.calculateCreditCardFees(paymentData.amount)
    };
  }
  
  async processACHPayment(paymentData, paymentMethod) {
    // ACH payments typically take 3-5 business days
    const transfer = await this.plaid.transfer.create({
      access_token: paymentMethod.plaid_access_token,
      account_id: paymentMethod.account_id,
      amount: paymentData.amount,
      description: paymentData.description,
      type: 'debit'
    });
    
    return {
      transaction_id: transfer.id,
      status: 'pending', // ACH payments are not instant
      fees: this.calculateACHFees(paymentData.amount)
    };
  }
}
```

## 📊 Financial Reporting & Analytics

### **Platform Revenue Analytics**

```javascript
class PlatformAnalytics {
  async getRevenueReport(filters = {}) {
    try {
      const query = `
        SELECT 
          DATE_TRUNC('month', billing_period) as month,
          COUNT(DISTINCT tenant_id) as active_tenants,
          SUM(subtotal) as gross_revenue,
          SUM(tax) as tax_collected,
          SUM(total) as net_revenue,
          AVG(total) as avg_revenue_per_tenant
        FROM platform_bills
        WHERE status = 'paid'
        AND ($1::date IS NULL OR billing_period >= $1)
        AND ($2::date IS NULL OR billing_period <= $2)
        GROUP BY DATE_TRUNC('month', billing_period)
        ORDER BY month DESC
      `;
      
      const result = await db.query(query, [filters.startDate, filters.endDate]);
      
      return {
        monthly_revenue: result.rows,
        summary: {
          total_revenue: result.rows.reduce((sum, row) => sum + parseFloat(row.net_revenue), 0),
          total_tenants: Math.max(...result.rows.map(row => row.active_tenants)),
          avg_monthly_revenue: result.rows.reduce((sum, row) => sum + parseFloat(row.net_revenue), 0) / result.rows.length
        }
      };
      
    } catch (error) {
      logger.error('Failed to generate revenue report:', error);
      throw error;
    }
  }
  
  async getUsageAnalytics(tenantId = null) {
    try {
      const whereClause = tenantId ? 'WHERE tenant_id = $1' : '';
      const params = tenantId ? [tenantId] : [];
      
      const query = `
        SELECT 
          usage_type,
          DATE_TRUNC('month', recorded_at) as month,
          SUM(quantity) as total_usage,
          AVG(quantity) as avg_daily_usage,
          SUM(quantity * unit_cost) as total_cost
        FROM usage_records
        ${whereClause}
        GROUP BY usage_type, DATE_TRUNC('month', recorded_at)
        ORDER BY month DESC, usage_type
      `;
      
      const result = await db.query(query, params);
      return result.rows;
      
    } catch (error) {
      logger.error('Failed to generate usage analytics:', error);
      throw error;
    }
  }
}
```

### **HOA Financial Dashboard**

```javascript
class HOAFinancialDashboard {
  async getCommunityFinancials(communityId, year) {
    try {
      // Revenue from HOA fees
      const revenueQuery = `
        SELECT 
          EXTRACT(MONTH FROM billing_period) as month,
          SUM(total) as total_billed,
          SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_collected,
          COUNT(*) as total_bills,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills
        FROM homeowner_bills
        WHERE community_id = $1
        AND EXTRACT(YEAR FROM billing_period) = $2
        GROUP BY EXTRACT(MONTH FROM billing_period)
        ORDER BY month
      `;
      
      // Outstanding balances
      const outstandingQuery = `
        SELECT 
          h.first_name || ' ' || h.last_name as homeowner_name,
          h.property_address,
          SUM(hb.total) as outstanding_balance,
          MIN(hb.due_date) as oldest_due_date,
          COUNT(*) as unpaid_bills
        FROM homeowner_bills hb
        JOIN homeowners h ON hb.homeowner_id = h.id
        WHERE hb.community_id = $1
        AND hb.status IN ('pending', 'overdue')
        GROUP BY h.id, h.first_name, h.last_name, h.property_address
        HAVING SUM(hb.total) > 0
        ORDER BY outstanding_balance DESC
      `;
      
      // Collection rates
      const collectionQuery = `
        SELECT 
          COUNT(*) as total_homeowners,
          COUNT(CASE WHEN last_payment_date >= NOW() - INTERVAL '30 days' THEN 1 END) as current_payers,
          COUNT(CASE WHEN last_payment_date < NOW() - INTERVAL '30 days' OR last_payment_date IS NULL THEN 1 END) as delinquent_payers
        FROM homeowners
        WHERE community_id = $1
      `;
      
      const [revenueResult, outstandingResult, collectionResult] = await Promise.all([
        db.query(revenueQuery, [communityId, year]),
        db.query(outstandingQuery, [communityId]),
        db.query(collectionQuery, [communityId])
      ]);
      
      return {
        monthly_revenue: revenueResult.rows,
        outstanding_balances: outstandingResult.rows,
        collection_stats: collectionResult.rows[0],
        summary: {
          total_billed: revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.total_billed), 0),
          total_collected: revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.total_collected), 0),
          collection_rate: revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.total_collected), 0) / 
                          revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.total_billed), 0) * 100
        }
      };
      
    } catch (error) {
      logger.error('Failed to generate community financials:', error);
      throw error;
    }
  }
}
```

## 🔄 Automated Billing Workflows

### **Monthly Billing Cycle**

```javascript
const BillingScheduler = {
  // Platform billing (runs on 1st of each month)
  async runPlatformBilling() {
    try {
      logger.info('Starting monthly platform billing cycle');
      
      const tenants = await db.query(`
        SELECT id, name, status 
        FROM tenants 
        WHERE status = 'active'
      `);
      
      const results = [];
      
      for (const tenant of tenants.rows) {
        try {
          // Calculate bill
          const bill = await PlatformBillingEngine.calculateMonthlyBill(
            tenant.id,
            new Date()
          );
          
          // Save bill
          const savedBill = await this.savePlatformBill(bill);
          
          // Send invoice
          await this.sendPlatformInvoice(tenant.id, savedBill.id);
          
          // Process auto-payment (if enabled)
          if (tenant.auto_pay_enabled) {
            await this.processAutoPayment(tenant.id, savedBill.id);
          }
          
          results.push({
            tenant_id: tenant.id,
            status: 'success',
            bill_id: savedBill.id,
            amount: bill.total
          });
          
        } catch (error) {
          logger.error(`Platform billing failed for tenant ${tenant.id}:`, error);
          results.push({
            tenant_id: tenant.id,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      logger.info(`Platform billing completed: ${results.length} tenants processed`);
      return results;
      
    } catch (error) {
      logger.error('Platform billing cycle failed:', error);
      throw error;
    }
  },
  
  // HOA fee billing (configurable per community)
  async runHOAFeeBilling(communityId) {
    try {
      logger.info(`Starting HOA fee billing for community ${communityId}`);
      
      const homeowners = await db.query(`
        SELECT id, first_name, last_name, email
        FROM homeowners
        WHERE community_id = $1
        AND status = 'active'
      `, [communityId]);
      
      const results = [];
      
      for (const homeowner of homeowners.rows) {
        try {
          // Generate bill
          const bill = await HOABillingEngine.generateHomeownerBill(
            homeowner.id,
            new Date()
          );
          
          // Save bill
          const savedBill = await this.saveHomeownerBill(bill);
          
          // Send bill notification
          await this.sendBillNotification(homeowner.id, savedBill.id);
          
          results.push({
            homeowner_id: homeowner.id,
            status: 'success',
            bill_id: savedBill.id,
            amount: bill.total
          });
          
        } catch (error) {
          logger.error(`HOA billing failed for homeowner ${homeowner.id}:`, error);
          results.push({
            homeowner_id: homeowner.id,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      // Process auto-payments
      await HOABillingEngine.processAutomaticPayments(new Date());
      
      logger.info(`HOA fee billing completed: ${results.length} homeowners processed`);
      return results;
      
    } catch (error) {
      logger.error('HOA fee billing cycle failed:', error);
      throw error;
    }
  }
};

// Schedule billing jobs
const cron = require('node-cron');

// Platform billing - 1st of each month at 2 AM
cron.schedule('0 2 1 * *', async () => {
  await BillingScheduler.runPlatformBilling();
});

// HOA fee billing - configurable per community
// This would be set up based on each community's billing schedule
```

## 💳 Payment Gateway Integration

### **Multi-Provider Payment Setup**

```javascript
class PaymentGatewayManager {
  constructor() {
    this.providers = {
      stripe: new StripeProvider(),
      square: new SquareProvider(),
      paypal: new PayPalProvider(),
      ach: new ACHProvider()
    };
  }
  
  async processPayment(paymentData) {
    const provider = this.getProvider(paymentData.payment_method_type);
    
    try {
      const result = await provider.processPayment(paymentData);
      
      // Record transaction
      await this.recordTransaction({
        ...paymentData,
        provider: provider.name,
        transaction_id: result.transaction_id,
        status: result.status,
        fees: result.fees
      });
      
      return result;
      
    } catch (error) {
      // Try backup provider if primary fails
      if (paymentData.allow_fallback) {
        const backupProvider = this.getBackupProvider(paymentData.payment_method_type);
        return await backupProvider.processPayment(paymentData);
      }
      
      throw error;
    }
  }
  
  // Fee calculation for different payment methods
  calculateFees(amount, paymentMethodType) {
    const feeStructures = {
      credit_card: {
        percentage: 0.029, // 2.9%
        fixed: 0.30       // $0.30
      },
      ach: {
        percentage: 0.008, // 0.8%
        fixed: 0.25       // $0.25
      },
      bank_transfer: {
        percentage: 0.005, // 0.5%
        fixed: 0.00       // No fixed fee
      }
    };
    
    const structure = feeStructures[paymentMethodType];
    return (amount * structure.percentage) + structure.fixed;
  }
}
```

## 📋 Database Schema for Billing

### **Platform Billing Tables**

```sql
-- Platform bills (HOA Connect billing management companies)
CREATE TABLE platform_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  billing_period DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- Platform bill line items
CREATE TABLE platform_bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES platform_bills(id),
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);

-- Usage tracking
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  usage_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,4) NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Platform payments
CREATE TABLE platform_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  bill_id UUID REFERENCES platform_bills(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  fees DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW()
);
```

### **HOA Fee Billing Tables**

```sql
-- Homeowner bills
CREATE TABLE homeowner_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID REFERENCES homeowners(id),
  community_id UUID REFERENCES communities(id),
  billing_period DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- Homeowner bill line items
CREATE TABLE homeowner_bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES homeowner_bills(id),
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE
);

-- Payment methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID REFERENCES homeowners(id),
  type VARCHAR(20) NOT NULL, -- 'credit_card', 'ach', 'bank_transfer'
  provider VARCHAR(50) NOT NULL,
  provider_payment_method_id VARCHAR(255),
  last_four VARCHAR(4),
  expires_at DATE,
  auto_pay_enabled BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Homeowner payments
CREATE TABLE homeowner_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID REFERENCES homeowners(id),
  bill_id UUID REFERENCES homeowner_bills(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  amount DECIMAL(10,2) NOT NULL,
  fees DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  processed_at TIMESTAMP DEFAULT NOW()
);

-- Special assessments
CREATE TABLE special_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Implementation Roadmap

### **Phase 1: Platform Billing (Weeks 1-6)**
- [ ] Usage tracking system
- [ ] Platform billing engine
- [ ] Stripe integration for B2B payments
- [ ] Invoice generation and delivery
- [ ] Basic reporting dashboard

### **Phase 2: HOA Fee Billing (Weeks 7-12)**
- [ ] Homeowner billing engine
- [ ] Multiple payment method support
- [ ] Auto-pay functionality
- [ ] Payment processing workflows
- [ ] Homeowner payment portal

### **Phase 3: Advanced Features (Weeks 13-18)**
- [ ] Special assessments management
- [ ] Late fee automation
- [ ] Collection workflows
- [ ] Advanced financial reporting
- [ ] Mobile payment app

### **Phase 4: Integration & Optimization (Weeks 19-24)**
- [ ] Accounting system integration (QuickBooks, etc.)
- [ ] Advanced analytics and forecasting
- [ ] Multi-currency support
- [ ] Tax compliance features
- [ ] API for third-party integrations

---

## 💰 Revenue Projections

### **Platform Revenue Model**
```
Example: 50 Management Companies
- Average 500 homeowners each = 25,000 total homeowners
- Platform fees: $199 base + $2.25/homeowner = $56,449/month per company
- Total monthly platform revenue: $2,822,450
- Annual platform revenue: $33,869,400
```

### **Transaction Revenue (Payment Processing)**
```
HOA Fee Processing Revenue:
- Average HOA fee: $200/month
- 25,000 homeowners × $200 = $5,000,000/month in HOA fees
- Processing fee: 2.5% = $125,000/month additional revenue
- Annual transaction revenue: $1,500,000
```

**Total Annual Revenue Potential: $35+ Million** 🚀

This dual billing system provides:
- ✅ **Scalable B2B platform billing**
- ✅ **Comprehensive HOA fee management**
- ✅ **Multiple payment methods**
- ✅ **Automated billing cycles**
- ✅ **Advanced financial reporting**
- ✅ **Revenue optimization**

Ready for implementation! 💳

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true








