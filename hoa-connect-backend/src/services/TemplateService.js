const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class TemplateService {
  constructor() {
    this.emailTemplates = new Map();
    this.smsTemplates = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await this.loadTemplates();
      this.registerHelpers();
      this.isInitialized = true;
      logger.info('TemplateService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize TemplateService:', error);
      throw error;
    }
  }

  async loadTemplates() {
    try {
      // Load email templates
      await this.loadEmailTemplates();
      
      // Load SMS templates
      await this.loadSMSTemplates();
      
      logger.info(`Loaded ${this.emailTemplates.size} email templates and ${this.smsTemplates.size} SMS templates`);
    } catch (error) {
      logger.error('Failed to load templates:', error);
      throw error;
    }
  }

  async loadEmailTemplates() {
    const emailTemplatesDir = path.join(__dirname, '../templates/email');
    
    try {
      const templateFiles = await fs.readdir(emailTemplatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.json')) {
          const templateName = path.basename(file, '.json');
          const templatePath = path.join(emailTemplatesDir, file);
          const templateData = JSON.parse(await fs.readFile(templatePath, 'utf8'));
          
          // Compile Handlebars templates
          templateData.subject = Handlebars.compile(templateData.subject);
          templateData.html = Handlebars.compile(templateData.html);
          templateData.text = Handlebars.compile(templateData.text);
          
          this.emailTemplates.set(templateName, templateData);
        }
      }
    } catch (error) {
      // If templates directory doesn't exist, create default templates
      if (error.code === 'ENOENT') {
        await this.createDefaultEmailTemplates();
      } else {
        throw error;
      }
    }
  }

  async loadSMSTemplates() {
    const smsTemplatesDir = path.join(__dirname, '../templates/sms');
    
    try {
      const templateFiles = await fs.readdir(smsTemplatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.json')) {
          const templateName = path.basename(file, '.json');
          const templatePath = path.join(smsTemplatesDir, file);
          const templateData = JSON.parse(await fs.readFile(templatePath, 'utf8'));
          
          // Compile Handlebars template
          templateData.text = Handlebars.compile(templateData.text);
          
          this.smsTemplates.set(templateName, templateData);
        }
      }
    } catch (error) {
      // If templates directory doesn't exist, create default templates
      if (error.code === 'ENOENT') {
        await this.createDefaultSMSTemplates();
      } else {
        throw error;
      }
    }
  }

  async createDefaultEmailTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    await fs.mkdir(templatesDir, { recursive: true });

    // Load templates from our new template files
    const emailTemplates = require('../templates/emailTemplates');

    // Save templates to files
    for (const [templateName, templateData] of Object.entries(emailTemplates)) {
      const templatePath = path.join(templatesDir, `${templateName}.json`);
      await fs.writeFile(templatePath, JSON.stringify(templateData, null, 2));
    }

    // Load the templates into memory
    await this.loadEmailTemplates();
  }

  async createDefaultSMSTemplates() {
    const templatesDir = path.join(__dirname, '../templates/sms');
    await fs.mkdir(templatesDir, { recursive: true });

    // Load templates from our new template files
    const smsTemplates = require('../templates/smsTemplates');

    // Save templates to files
    for (const [templateName, templateData] of Object.entries(smsTemplates)) {
      const templatePath = path.join(templatesDir, `${templateName}.json`);
      await fs.writeFile(templatePath, JSON.stringify(templateData, null, 2));
    }

    // Load the templates into memory
    await this.loadSMSTemplates();
  }

  registerHelpers() {
    // Register Handlebars helpers
    Handlebars.registerHelper('formatDate', function(date) {
      return new Date(date).toLocaleDateString();
    });

    Handlebars.registerHelper('formatDateTime', function(date) {
      return new Date(date).toLocaleString();
    });

    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    Handlebars.registerHelper('gt', function(a, b) {
      return a > b;
    });

    Handlebars.registerHelper('pluralize', function(count, singular, plural) {
      return count === 1 ? singular : plural;
    });
  }

  async getEmailTemplate(templateName, data) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const template = this.emailTemplates.get(templateName);
    if (!template) {
      throw new Error(`Email template not found: ${templateName}`);
    }

    return {
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data)
    };
  }

  async getSMSTemplate(templateName, data) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const template = this.smsTemplates.get(templateName);
    if (!template) {
      throw new Error(`SMS template not found: ${templateName}`);
    }

    return {
      text: template.text(data)
    };
  }

  getAvailableTemplates() {
    return {
      email: Array.from(this.emailTemplates.keys()),
      sms: Array.from(this.smsTemplates.keys())
    };
  }
}

module.exports = new TemplateService();