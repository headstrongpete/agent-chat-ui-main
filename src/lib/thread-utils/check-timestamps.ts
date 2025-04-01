import { Thread } from "@langchain/langgraph-sdk";

/**
 * Checks if a thread object has timestamp information directly or in its metadata
 * @param thread The thread object to check
 * @returns An object containing any timestamp information found
 */
export function checkThreadTimestamps(thread: Thread): Record<string, string | null> {
  const result: Record<string, string | null> = {
    created_at: null,
    updated_at: null,
    created_time: null, 
    updated_time: null,
    created: null,
    updated: null,
    timestamp: null,
  };
  
  // Check direct properties
  Object.keys(result).forEach(key => {
    // Using 'any' temporarily to check for properties that might not be in the interface
    if (key in (thread as any)) {
      result[key] = (thread as any)[key];
    }
  });
  
  // Check metadata
  if ('metadata' in thread && thread.metadata && typeof thread.metadata === 'object') {
    Object.keys(result).forEach(key => {
      if (key in thread.metadata!) {
        result[key] = (thread.metadata as any)[key];
      }
    });
  }
  
  // Check if thread_id contains timestamp information (some systems use timestamp-based IDs)
  if (thread.thread_id) {
    // Extract potential UNIX timestamp or ISO date from ID
    const timestampMatches = thread.thread_id.match(/(\d{10,13})/); // UNIX timestamp
    const isoDateMatches = thread.thread_id.match(/(\d{4}-\d{2}-\d{2})/); // ISO date
    
    if (timestampMatches && timestampMatches[1]) {
      result.id_timestamp = new Date(parseInt(timestampMatches[1])).toISOString();
    } else if (isoDateMatches && isoDateMatches[1]) {
      result.id_date = isoDateMatches[1];
    }
  }
  
  // Check for timestamps in messages
  if (thread.values && 
      typeof thread.values === 'object' && 
      'messages' in thread.values && 
      Array.isArray(thread.values.messages) && 
      thread.values.messages.length > 0
  ) {
    const firstMessage = thread.values.messages[0];
    const lastMessage = thread.values.messages[thread.values.messages.length - 1];
    
    if (firstMessage && typeof firstMessage === 'object') {
      ['timestamp', 'created_at', 'time', 'date'].forEach(key => {
        if (key in firstMessage) {
          result[`first_message_${key}`] = (firstMessage as any)[key];
        }
      });
    }
    
    if (lastMessage && typeof lastMessage === 'object') {
      ['timestamp', 'created_at', 'time', 'date'].forEach(key => {
        if (key in lastMessage) {
          result[`last_message_${key}`] = (lastMessage as any)[key];
        }
      });
    }
  }
  
  return result;
}

/**
 * Check all threads in an array for timestamp information
 * @param threads Array of threads to check
 * @returns Summary of timestamp information found
 */
export function analyzeThreadsForTimestamps(threads: Thread[]): {
  hasTimestamps: boolean;
  sampleThread: Record<string, string | null> | null;
  availableTimestampFields: string[];
} {
  if (!threads || threads.length === 0) {
    return {
      hasTimestamps: false,
      sampleThread: null,
      availableTimestampFields: [],
    };
  }
  
  const sampleThread = checkThreadTimestamps(threads[0]);
  const availableTimestampFields = Object.keys(sampleThread).filter(
    key => sampleThread[key] !== null
  );
  
  return {
    hasTimestamps: availableTimestampFields.length > 0,
    sampleThread,
    availableTimestampFields,
  };
}
