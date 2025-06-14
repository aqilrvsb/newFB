// Optimization goals mapping for different campaign objectives
export const getOptimizationGoalForObjective = (objective: string): { optimizationGoal: string; billingEvent: string } => {
  switch (objective) {
    case 'OUTCOME_AWARENESS':
      return { optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS' };
    
    case 'OUTCOME_TRAFFIC':
      return { optimizationGoal: 'LINK_CLICKS', billingEvent: 'IMPRESSIONS' };
    
    case 'OUTCOME_ENGAGEMENT':
      return { optimizationGoal: 'POST_ENGAGEMENT', billingEvent: 'IMPRESSIONS' };
    
    case 'OUTCOME_LEADS':
      return { optimizationGoal: 'LEAD_GENERATION', billingEvent: 'IMPRESSIONS' };
    
    case 'OUTCOME_APP_PROMOTION':
      return { optimizationGoal: 'APP_INSTALLS', billingEvent: 'IMPRESSIONS' };
    
    case 'OUTCOME_SALES':
      return { optimizationGoal: 'OFFSITE_CONVERSIONS', billingEvent: 'IMPRESSIONS' };
    
    default:
      // Default to engagement if unknown objective
      return { optimizationGoal: 'POST_ENGAGEMENT', billingEvent: 'IMPRESSIONS' };
  }
};

// Valid campaign objectives
export const VALID_CAMPAIGN_OBJECTIVES = [
  'OUTCOME_AWARENESS',
  'OUTCOME_TRAFFIC', 
  'OUTCOME_ENGAGEMENT',
  'OUTCOME_LEADS',
  'OUTCOME_APP_PROMOTION',
  'OUTCOME_SALES'
];