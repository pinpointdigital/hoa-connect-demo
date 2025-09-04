const { Pool } = require('pg');
const logger = require('./logger');

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'hoa_connect',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        max: parseInt(process.env.DB_POOL_MAX) || 20,
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      };

      this.pool = new Pool(config);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      logger.info('Database connected successfully');

      // Set up event listeners
      this.pool.on('error', (err) => {
        logger.error('Unexpected error on idle client:', err);
        this.isConnected = false;
      });

      this.pool.on('connect', () => {
        logger.debug('New client connected to database');
      });

      this.pool.on('remove', () => {
        logger.debug('Client removed from pool');
      });

    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async query(text, params = []) {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`);

      return result;

    } catch (error) {
      logger.error('Database query error:', {
        error: error.message,
        query: text.substring(0, 200),
        params: params
      });
      throw error;
    }
  }

  async getClient() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      return await this.pool.connect();

    } catch (error) {
      logger.error('Failed to get database client:', error);
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back:', error);
      throw error;

    } finally {
      client.release();
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.isConnected = false;
        logger.info('Database connection closed');
      }

    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as healthy');
      return {
        status: 'healthy',
        timestamp: new Date(),
        response_time: Date.now(),
        connected: this.isConnected
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
        connected: false
      };
    }
  }

  // Get connection pool stats
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;








