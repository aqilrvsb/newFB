: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'duplicate_ad_set'
          };
        }

      case 'delete_ad_set':
        try {
          const { adSetId } = args;
          const result = await adSetTools.deleteAdSet(userId, adSetId);
          return {
            success: result.success,
            tool: 'delete_ad_set',
            result: result.success ? { message: result.message } : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error deleting ad set: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'delete_ad_set'
          };
        }

      case 'get_ad_set_insights':
        try {
          const { adSetId, dateRange } = args;
          const result = await adSetTools.getAdSetInsights(userId, adSetId, dateRange);
          return {
            success: result.success,
            tool: 'get_ad_set_insights',
            result: result.success ? result : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error getting ad set insights: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_ad_set_insights'
          };
        }

      case 'create_ad':
        try {
          const { adSetId, name, creative } = args;
          const result = await adTools.createAd(userId, adSetId, name, creative);
          return {
            success: result.success,
            tool: 'create_ad',
            result: result.success ? result : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error creating ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'create_ad'
          };
        }

      case 'update_ad':
        try {
          const { adId, name, status, creative } = args;
          const result = await adTools.updateAd(userId, adId, name, status, creative);
          return {
            success: result.success,
            tool: 'update_ad',
            result: result.success ? { message: result.message } : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error updating ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'update_ad'
          };
        }

      case 'duplicate_ad':
        try {
          const { adId, newName } = args;
          const result = await adTools.duplicateAd(userId, adId, newName);
          return {
            success: result.success,
            tool: 'duplicate_ad',
            result: result.success ? result : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error duplicating ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'duplicate_ad'
          };
        }

      case 'delete_ad':
        try {
          const { adId } = args;
          const result = await adTools.deleteAd(userId, adId);
          return {
            success: result.success,
            tool: 'delete_ad',
            result: result.success ? { message: result.message } : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error deleting ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'delete_ad'
          };
        }

      case 'get_ad_insights':
        try {
          const { adId, dateRange } = args;
          const result = await adTools.getAdInsights(userId, adId, dateRange);
          return {
            success: result.success,
            tool: 'get_ad_insights',
            result: result.success ? result : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error getting ad insights: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_ad_insights'
          };
        }

      case 'update_custom_audience':
        try {
          const { audienceId, name, description } = args;
          const result = await audienceTools.updateCustomAudience(userId, audienceId, name, description);
          return {
            success: result.success,
            tool: 'update_custom_audience',
            result: result.success ? { message: result.message } : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error updating custom audience: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'update_custom_audience'
          };
        }
