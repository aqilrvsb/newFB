// Campaign templates for MCP server Facebook Ads

export const prompts = {
  // System prompt for campaign creation
  campaignCreation: {
    name: 'campaign_creation',
    description: 'Template for creating new Facebook advertising campaign',
    arguments: [
      { name: 'product', description: 'Product or service name', required: true },
      { name: 'target_audience', description: 'Target audience for campaign', required: true },
      { name: 'budget', description: 'Campaign budget', required: true },
      { name: 'goal', description: 'Campaign goal (conversions, traffic, awareness)', required: true }
    ],
    messages: (args: Record<string, string>) => [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `I'm ready to help you create a new Facebook advertising campaign for product "${args.product}" with the following parameters:

Target audience: ${args.target_audience}
Budget: ${args.budget}
Campaign goal: ${args.goal}

To create an effective campaign, I need to get several details:

1. What is the main campaign objective? (increase sales, generate leads, increase website traffic)
2. What is the target demographic group? (age, gender, interests)
3. What is the planned daily budget?
4. How long should the campaign run?
5. What are the key benefits of your product that you'd like to highlight in the ad?

After answering these questions, I can help you create a campaign, set up targeting, and recommend optimal strategy to achieve your marketing goals.`
        }
      }
    ]
  }
};

// Export types for working with prompts
export type PromptName = keyof typeof prompts;
export type PromptArgs = Record<string, string>;

// Helper function to get template by name
export const getPromptTemplate = (name: string) => {
  const promptName = name as PromptName;
  return prompts[promptName] || null;
};

// Function to fill template with specific arguments
export const fillPromptTemplate = (name: string, args: PromptArgs) => {
  const template = getPromptTemplate(name);
  if (!template) {
    throw new Error(`Template with name "${name}" does not exist`);
  }
  
  // Check if all required arguments are provided
  const missingArgs = (template.arguments || [])
    .filter(arg => arg.required && !args[arg.name])
    .map(arg => arg.name);
  
  if (missingArgs.length > 0) {
    throw new Error(`Missing required arguments: ${missingArgs.join(', ')}`);
  }
  
  // Fill template with arguments
  return template.messages(args);
};