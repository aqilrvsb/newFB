import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userSessionManager, getAdAccountForUser } from './config.js';
import * as campaignTools from './tools/campaign-tools.js';
import * as audienceTools from './tools/audience-tools.js';
import * as analyticsTools from './tools/analytics-tools.js';
import * as adSetTools from './tools/adset-tools.js';
import { prompts, fillPromptTemplate } from './prompts/campaign-templates.js';

export const createMcpServer = async (userId: string): Promise<McpServer> => {
  const session = userSessionManager.getSession(userId);
  if (!session) {
    throw new Error(`Invalid user session: ${userId}`);
  }

  const server = new McpServer({
    name: 'dynamic-facebook-ads-mcp-server',
    version: '2.0.0',
  });

  const getUserAdAccount = () => {
    const adAccount = getAdAccountForUser(userId);
    if (!adAccount) {
      throw new Error('No ad account selected. Use get_ad_accounts and select_ad_account first.');
    }
    return adAccount;
  };

  // Tool to get available ad accounts
  server.tool(
    'get_ad_accounts',
    {},
    async () => {
      try {
        const result = await userSessionManager.getAvailableAccounts(userId);
        
        if (!result.success) {
          return {
            content: [{ type: 'text', text: `❌ Error getting ad accounts: ${result.error}` }],
            isError: true
          };
        }

        let responseText = `📋 Available Facebook Ad Accounts (${result.accounts?.length || 0}):\n\n`;
        
        if (!result.accounts || result.accounts.length === 0) {
          responseText += 'No ad accounts found for this user.';
        } else {
          result.accounts.forEach((account: any, index: number) => {
            responseText += `${index + 1}. **${account.name}** (${account.id})\n`;
            responseText += `   - Status: ${account.status}\n`;
            responseText += `   - Currency: ${account.currency}\n`;
            responseText += `   - Timezone: ${account.timezone}\n\n`;
          });
          responseText += `💡 To use an account, call: select_ad_account with the account ID`;
        }

        return {
          content: [{ type: 'text', text: responseText }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }
  );

  // Tool to select an ad account
  server.tool(
    'select_ad_account',
    {
      accountId: {
        type: 'string',
        description: 'Facebook Ad Account ID to select (e.g., act_1234567890)'
      }
    },
    async ({ accountId }) => {
      try {
        const result = await userSessionManager.setSelectedAccount(userId, accountId);
        
        if (!result.success) {
          return {
            content: [{ type: 'text', text: `❌ Error selecting account: ${result.error}` }],
            isError: true
          };
        }

        return {
          content: [{ 
            type: 'text', 
            text: `✅ Successfully selected ad account: ${accountId}\n\nYou can now use campaign management tools!` 
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true
        };
      }
    }
  );

  return server;
};