import { userSessionManager } from '../config.js';

// Interfaces for cron job types
interface CronSchedule {
  minutes: number[];
  hours: number[];
}

interface CronJob {
  jobId?: number;
  title: string;
  url: string;
  schedule?: CronSchedule;
  requestMethod?: number; // 0=GET, 1=POST
  postData?: string;
  enabled?: boolean;
}

interface CronJobDetails extends CronJob {
  lastStatus?: number;
  lastExecution?: number;
  nextExecution?: number;
  lastDuration?: number;
}

interface CronHistoryItem {
  jobLogId: number;
  jobId: number;
  identifier: string;
  date: number;
  datePlanned: number;
  jitter: number;
  url: string;
  duration: number;
  status: number;
  statusText: string;
  httpStatus: number;
  headers?: string | null;
  body?: string | null;
}

// Create a new cron job
export const createCronJob = async (
  userId: string,
  apiKey: string,
  title: string,
  url: string,
  schedule?: { minutes?: number[], hours?: number[] },
  requestMethod: number = 0,
  postData?: string
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Set default schedule to every minute if not specified
    const cronSchedule = {
      timezone: 'Asia/Kuala_Lumpur', // Malaysia timezone hardcoded
      expiresAt: 0,
      hours: schedule?.hours || [-1],
      mdays: [-1],
      minutes: schedule?.minutes || [-1],
      months: [-1],
      wdays: [-1]
    };

    const jobData: any = {
      job: {
        title: title,
        url: url,
        enabled: true,
        saveResponses: true,
        schedule: cronSchedule,
        requestMethod: requestMethod
      }
    };

    // Add POST data if provided
    if (requestMethod === 1 && postData) {
      jobData.job.extendedData = {
        body: postData
      };
    }

    const response = await fetch('https://api.cron-job.org/jobs', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      jobId: (result as any).jobId,
      message: `Cron job created successfully with ID: ${(result as any).jobId}`,
      details: {
        title: title,
        url: url,
        timezone: 'Asia/Kuala_Lumpur',
        schedule: cronSchedule,
        requestMethod: requestMethod === 1 ? 'POST' : 'GET'
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Error creating cron job: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get cron job details
export const getCronJobDetails = async (
  userId: string,
  apiKey: string,
  jobId: number
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch(`https://api.cron-job.org/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      jobDetails: (result as any).jobDetails,
      message: 'Cron job details retrieved successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: `Error getting cron job details: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Update an existing cron job
export const updateCronJob = async (
  userId: string,
  apiKey: string,
  jobId: number,
  updates: {
    title?: string;
    url?: string;
    schedule?: { minutes?: number[], hours?: number[] };
  }
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const jobData: any = { job: {} };

    if (updates.title) {
      jobData.job.title = updates.title;
    }

    if (updates.url) {
      jobData.job.url = updates.url;
    }

    if (updates.schedule) {
      jobData.job.schedule = {
        timezone: 'Asia/Kuala_Lumpur',
        expiresAt: 0,
        hours: updates.schedule.hours || [-1],
        mdays: [-1],
        minutes: updates.schedule.minutes || [-1],
        months: [-1],
        wdays: [-1]
      };
    }

    const response = await fetch(`https://api.cron-job.org/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    return {
      success: true,
      message: `Cron job ${jobId} updated successfully`,
      updates: updates
    };

  } catch (error) {
    return {
      success: false,
      message: `Error updating cron job: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Delete a cron job
export const deleteCronJob = async (
  userId: string,
  apiKey: string,
  jobId: number
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch(`https://api.cron-job.org/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    return {
      success: true,
      message: `Cron job ${jobId} deleted successfully`
    };

  } catch (error) {
    return {
      success: false,
      message: `Error deleting cron job: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get cron job execution history
export const getCronJobHistory = async (
  userId: string,
  apiKey: string,
  jobId: number,
  limit: number = 25
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch(`https://api.cron-job.org/jobs/${jobId}/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      history: (result as any).history.slice(0, limit),
      predictions: (result as any).predictions,
      message: 'Cron job history retrieved successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: `Error getting cron job history: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get specific execution details
export const getCronJobHistoryDetails = async (
  userId: string,
  apiKey: string,
  jobId: number,
  identifier: string
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch(`https://api.cron-job.org/jobs/${jobId}/history/${identifier}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      historyDetails: (result as any).jobHistoryDetails,
      message: 'Cron job execution details retrieved successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: `Error getting cron job history details: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// List all cron jobs
export const listCronJobs = async (
  userId: string,
  apiKey: string
) => {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch('https://api.cron-job.org/jobs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      jobs: (result as any).jobs,
      totalJobs: (result as any).jobs.length,
      message: 'Cron jobs retrieved successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: `Error listing cron jobs: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
