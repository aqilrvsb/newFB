import dotenv from 'dotenv';
import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk';
import Joi from 'joi';

dotenv.config();

// Updated interface - no need for facebookAccountId upfront
export interface UserCredentials {
  facebookAppId: string;
  facebookAppSecret: string;
  facebookAccessToken: string;
  userId: string;
  selectedAccountId?: string; // Optional, can be set later
}

interface ServerConfig {
  port: number;
  maxConnections: number;
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  sessionTimeout: number;
  environment: 'development' | 'production';
}

export const serverConfig: ServerConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  maxConnections: process.env.MAX_CONNECTIONS ? parseInt(process.env.MAX_CONNECTIONS, 10) : 200,
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 10000
  },
  sessionTimeout: process.env.SESSION_TIMEOUT ? parseInt(process.env.SESSION_TIMEOUT, 10) : 0, // 0 = no timeout
  environment: (process.env.NODE_ENV as 'development' | 'production') || 'development'
};

// Updated validation schema - no facebookAccountId required initially
const credentialsSchema = Joi.object({
  facebookAppId: Joi.string().required().min(1),
  facebookAppSecret: Joi.string().required().min(1),
  facebookAccessToken: Joi.string().required().min(1),
  userId: Joi.string().required().min(1),
  selectedAccountId: Joi.string().optional()
});

export const validateUserCredentials = (credentials: Partial<UserCredentials>): { isValid: boolean; error?: string } => {
  const { error } = credentialsSchema.validate(credentials);
  if (error) {
    return { isValid: false, error: error.details[0].message };
  }
  return { isValid: true };
};
export const getUserAdAccounts = async (accessToken: string): Promise<{success: boolean; accounts?: any[]; error?: string}> => {
  try {
    FacebookAdsApi.init(accessToken);
    
    // Use SDK instead of fetch
    const { User } = require('facebook-nodejs-business-sdk');
    const user = new User('me');
    const accountsData = await user.getAdAccounts(
      ['id', 'name', 'account_status', 'currency', 'timezone_name'],
      { limit: 100 }
    );
    const result = { data: accountsData };
    
    // Check if accountsData is empty or has error
    if (!accountsData || accountsData.length === 0) {
      return { success: false, error: 'No ad accounts found' };
    }
    
    if (result.data && result.data.length > 0) {
      return { 
        success: true, 
        accounts: result.data.map((account: any) => ({
          id: account.id,
          name: account.name,
          status: account.account_status,
          currency: account.currency,
          timezone: account.timezone_name
        }))
      };
    } else {
      return { success: false, error: 'No ad accounts found for this user' };
    }
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to fetch ad accounts: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

class UserSessionManager {
  private sessions: Map<string, {
    credentials: UserCredentials;
    lastActivity: number;
    adAccount?: AdAccount;
    availableAccounts?: any[];
  }> = new Map();

  createSession(credentials: UserCredentials): { success: boolean; error?: string } {
    const validation = validateUserCredentials(credentials);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    try {
      FacebookAdsApi.init(credentials.facebookAccessToken);
      
      this.sessions.set(credentials.userId, {
        credentials,
        lastActivity: Date.now(),
        // AdAccount will be set when user selects an account
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to initialize Facebook SDK: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async setSelectedAccount(userId: string, accountId: string): Promise<{success: boolean; error?: string}> {
    const session = this.sessions.get(userId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    try {
      const adAccount = new AdAccount(accountId);
      session.credentials.selectedAccountId = accountId;
      session.adAccount = adAccount;
      session.lastActivity = Date.now();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to set account: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
  getSession(userId: string): { credentials: UserCredentials; adAccount?: AdAccount } | null {
    const session = this.sessions.get(userId);
    if (!session) {
      return null;
    }

    // Only check timeout if sessionTimeout is configured (> 0)
    if (serverConfig.sessionTimeout > 0 && Date.now() - session.lastActivity > serverConfig.sessionTimeout) {
      this.sessions.delete(userId);
      return null;
    }

    session.lastActivity = Date.now();
    return {
      credentials: session.credentials,
      adAccount: session.adAccount
    };
  }

  removeSession(userId: string): boolean {
    return this.sessions.delete(userId);
  }

  cleanupExpiredSessions(): void {
    // Only cleanup if sessionTimeout is configured (> 0)
    if (serverConfig.sessionTimeout <= 0) {
      return; // No timeout configured, sessions don't expire
    }
    
    const now = Date.now();
    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > serverConfig.sessionTimeout) {
        this.sessions.delete(userId);
      }
    }
  }

  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  async getAvailableAccounts(userId: string): Promise<{success: boolean; accounts?: any[]; error?: string}> {
    const session = this.sessions.get(userId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.availableAccounts) {
      return { success: true, accounts: session.availableAccounts };
    }

    const result = await getUserAdAccounts(session.credentials.facebookAccessToken);
    if (result.success && result.accounts) {
      session.availableAccounts = result.accounts;
    }
    
    return result;
  }
}

export const userSessionManager = new UserSessionManager();

setInterval(() => {
  userSessionManager.cleanupExpiredSessions();
}, 10 * 60 * 1000);

export const getAdAccountForUser = (userId: string): AdAccount | null => {
  const session = userSessionManager.getSession(userId);
  return session?.adAccount || null;
};