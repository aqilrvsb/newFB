// Fix for get_ad_accounts to use Facebook SDK instead of fetch
case 'get_ad_accounts':
  try {
    // Use Facebook SDK's built-in methods instead of fetch
    const AdAccount = require('facebook-nodejs-business-sdk').AdAccount;
    const User = require('facebook-nodejs-business-sdk').User;
    
    // Get user's ad accounts using SDK
    const user = new User('me');
    const adAccounts = await user.getAdAccounts(
      ['id', 'name', 'account_status', 'currency', 'timezone_name'],
      { limit: 100 }
    );
    
    if (!adAccounts || adAccounts.length === 0) {
      return {
        success: true,
        tool: 'get_ad_accounts',
        result: {
          accounts: [],
          total: 0,
          message: 'No ad accounts found for this user'
        }
      };
    }

    const accounts = adAccounts.map((account: any) => ({
      id: account.id,
      name: account.name,
      status: account.account_status,
      currency: account.currency,
      timezone: account.timezone_name
    }));

    return {
      success: true,
      tool: 'get_ad_accounts',
      result: {
        accounts: accounts,
        total: accounts.length,
        message: `Found ${accounts.length} ad account(s)`
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Error fetching ad accounts: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: 'get_ad_accounts'
    };
  }
