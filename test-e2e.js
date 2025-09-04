#!/usr/bin/env node

/**
 * HOA Connect End-to-End Testing Script
 * Automated testing for API endpoints and basic functionality
 */

const axios = require('axios');
const colors = require('colors');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

class E2ETestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`🧪 Running: ${testName}`.yellow);
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
      console.log(`✅ PASSED: ${testName}`.green);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName}`.red);
      console.log(`   Error: ${error.message}`.red);
    }
    console.log('');
  }

  async testBackendHealth() {
    const response = await axios.get(`${BACKEND_URL}/health`);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.status || response.data.status !== 'healthy') {
      throw new Error(`Expected healthy status, got ${response.data.status}`);
    }
  }

  async testFrontendHealth() {
    const response = await axios.get(FRONTEND_URL);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.includes('HOA Connect')) {
      throw new Error('Frontend does not contain expected content');
    }
  }

  async testSingleNotification() {
    const notificationData = {
      type: 'email',
      recipient: 'test@example.com',
      template: 'request_status_update',
      data: {
        homeowner_name: 'Jason Abustan',
        request_title: 'Test Request',
        old_status: 'submitted',
        new_status: 'approved'
      }
    };

    const response = await axios.post(`${BACKEND_URL}/api/notifications/send`, notificationData);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Notification failed: ${response.data.error}`);
    }
    
    if (!response.data.messageId) {
      throw new Error('No messageId returned');
    }
  }

  async testBulkNotifications() {
    const bulkData = {
      notifications: [
        {
          type: 'email',
          recipient: 'user1@example.com',
          template: 'form_distribution',
          data: {
            recipient_name: 'John Doe',
            form_title: 'Test Form',
            due_date: '2024-12-31'
          }
        },
        {
          type: 'sms',
          recipient: '+15551234567',
          template: 'form_reminder_sms',
          data: {
            recipient_name: 'Jane',
            form_title: 'Test Form'
          }
        }
      ]
    };

    const response = await axios.post(`${BACKEND_URL}/api/notifications/send-bulk`, bulkData);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Bulk notification failed: ${response.data.error}`);
    }
    
    if (!response.data.results || response.data.results.length !== 2) {
      throw new Error(`Expected 2 results, got ${response.data.results?.length || 0}`);
    }
  }

  async testNotificationStats() {
    const response = await axios.get(`${BACKEND_URL}/api/notifications/stats`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const requiredFields = ['total_sent', 'total_delivered', 'total_failed', 'delivery_rate'];
    for (const field of requiredFields) {
      if (response.data[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  async testInvalidNotification() {
    try {
      await axios.post(`${BACKEND_URL}/api/notifications/send`, {
        // Missing required fields
        type: 'email'
      });
      throw new Error('Should have failed with invalid data');
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        // Expected error response
        return;
      }
      throw error;
    }
  }

  async testNonExistentEndpoint() {
    try {
      await axios.get(`${BACKEND_URL}/api/nonexistent`);
      throw new Error('Should have returned 404');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Expected 404 response
        return;
      }
      throw error;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting HOA Connect End-to-End Tests\n'.cyan.bold);

    // Infrastructure Tests
    console.log('📡 Infrastructure Tests'.blue.bold);
    await this.runTest('Backend Health Check', () => this.testBackendHealth());
    await this.runTest('Frontend Health Check', () => this.testFrontendHealth());

    // Notification API Tests
    console.log('📧 Notification API Tests'.blue.bold);
    await this.runTest('Single Notification', () => this.testSingleNotification());
    await this.runTest('Bulk Notifications', () => this.testBulkNotifications());
    await this.runTest('Notification Statistics', () => this.testNotificationStats());

    // Error Handling Tests
    console.log('🚨 Error Handling Tests'.blue.bold);
    await this.runTest('Invalid Notification Data', () => this.testInvalidNotification());
    await this.runTest('Non-existent Endpoint', () => this.testNonExistentEndpoint());

    // Results Summary
    console.log('📊 Test Results Summary'.cyan.bold);
    console.log(`✅ Passed: ${this.results.passed}`.green);
    console.log(`❌ Failed: ${this.results.failed}`.red);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n🚨 Failed Tests:'.red.bold);
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   ❌ ${test.name}: ${test.error}`.red);
        });
    }

    console.log('\n🎯 Next Steps:'.cyan.bold);
    if (this.results.failed === 0) {
      console.log('✅ All automated tests passed! Ready for manual UI testing.'.green);
      console.log('🔗 Open http://localhost:3000 to begin manual testing workflow.'.blue);
    } else {
      console.log('🔧 Fix the failed tests before proceeding to manual testing.'.yellow);
    }

    return this.results.failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner crashed:'.red.bold, error.message);
      process.exit(1);
    });
}

module.exports = E2ETestRunner;








