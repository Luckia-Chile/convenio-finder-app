/**
 * 🔐 SECURE LOGGING UTILITY
 * 
 * Prevents sensitive information from being logged in production
 * while maintaining debugging capabilities in development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface SecureLogOptions {
  level?: LogLevel;
  sanitize?: boolean;
  context?: string;
}

class SecureLogger {
  private isDevelopment: boolean;
  private logLevel: string;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
  }

  /**
   * Sanitizes sensitive data from objects before logging
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sensitiveFields = [
      'password', 'token', 'key', 'secret', 'email', 'phone', 
      'rut', 'id', 'user', 'session', 'auth', 'credential'
    ];

    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field => 
        lowerKey.includes(field)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * Safe debug logging - only in development
   */
  debug(message: string, data?: any, options: SecureLogOptions = {}) {
    if (!this.isDevelopment && this.logLevel !== 'debug') return;

    const sanitizedData = options.sanitize !== false ? this.sanitizeData(data) : data;
    const prefix = options.context ? `[${options.context}]` : '[DEBUG]';
    
    console.log(`🔍 ${prefix} ${message}`, sanitizedData);
  }

  /**
   * Safe info logging - limited in production
   */
  info(message: string, data?: any, options: SecureLogOptions = {}) {
    const sanitizedData = options.sanitize !== false ? this.sanitizeData(data) : data;
    const prefix = options.context ? `[${options.context}]` : '[INFO]';
    
    if (this.isDevelopment) {
      console.log(`ℹ️ ${prefix} ${message}`, sanitizedData);
    } else {
      // In production, only log the message without sensitive data
      console.log(`ℹ️ ${prefix} ${message}`);
    }
  }

  /**
   * Safe warning logging
   */
  warn(message: string, data?: any, options: SecureLogOptions = {}) {
    const sanitizedData = options.sanitize !== false ? this.sanitizeData(data) : data;
    const prefix = options.context ? `[${options.context}]` : '[WARN]';
    
    if (this.isDevelopment) {
      console.warn(`⚠️ ${prefix} ${message}`, sanitizedData);
    } else {
      console.warn(`⚠️ ${prefix} ${message}`);
    }
  }

  /**
   * Safe error logging - always logged but sanitized
   */
  error(message: string, error?: any, options: SecureLogOptions = {}) {
    const prefix = options.context ? `[${options.context}]` : '[ERROR]';
    
    if (this.isDevelopment) {
      console.error(`❌ ${prefix} ${message}`, error);
    } else {
      // In production, log error message but sanitize stack traces
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ ${prefix} ${message}: ${errorMessage}`);
    }
  }

  /**
   * Auth-specific logging with automatic sanitization
   */
  auth(message: string, data?: any, options: SecureLogOptions = {}) {
    this.debug(message, data, { ...options, context: 'AUTH', sanitize: true });
  }

  /**
   * Role-specific logging with automatic sanitization
   */
  role(message: string, data?: any, options: SecureLogOptions = {}) {
    this.debug(message, data, { ...options, context: 'ROLE', sanitize: true });
  }

  /**
   * Route protection logging
   */
  route(message: string, data?: any, options: SecureLogOptions = {}) {
    this.debug(message, data, { ...options, context: 'ROUTE', sanitize: true });
  }

  /**
   * Data processing logging (for Excel uploads, etc.)
   */
  data(message: string, data?: any, options: SecureLogOptions = {}) {
    this.info(message, data, { ...options, context: 'DATA', sanitize: true });
  }
}

// Export singleton instance
export const logger = new SecureLogger();

// Export for backwards compatibility
export const secureLog = logger;

// Export specific loggers for convenience
export const authLog = (message: string, data?: any) => logger.auth(message, data);
export const roleLog = (message: string, data?: any) => logger.role(message, data);
export const routeLog = (message: string, data?: any) => logger.route(message, data);
export const dataLog = (message: string, data?: any) => logger.data(message, data);