import { Thread } from "@langchain/langgraph-sdk";

// Enhanced Thread type with timestamp fields
export interface ThreadWithTimestamps {
  created_at?: string; // ISO timestamp of thread creation
  updated_at?: string; // ISO timestamp of last update
  // Add other possible timestamp fields based on what's available in the actual API response
  created_time?: string;
  updated_time?: string;
  timestamp?: string;
}

// Use type intersection instead of extending
export type EnhancedThread = Thread & ThreadWithTimestamps;

export interface ThreadGroup {
  title: string;
  threads: EnhancedThread[];
}

/**
 * Gets the most recent timestamp from a thread
 */
function getThreadTimestamp(thread: EnhancedThread): Date {
  // Try different possible timestamp fields
  const timestamp = 
    thread.updated_at || 
    thread.updated_time || 
    thread.created_at || 
    thread.created_time || 
    thread.timestamp;
  
  // If we found a timestamp, parse it
  if (timestamp) {
    try {
      return new Date(timestamp);
    } catch (e) {
      console.error("Failed to parse timestamp:", timestamp);
    }
  }
  
  // Check if thread_id contains timestamp information
  if (thread.thread_id) {
    const timestampMatches = thread.thread_id.match(/(\d{10,13})/);
    if (timestampMatches && timestampMatches[1]) {
      return new Date(parseInt(timestampMatches[1]));
    }
  }
  
  // Check for timestamps in messages
  if (thread.values && 
      typeof thread.values === 'object' && 
      'messages' in thread.values && 
      Array.isArray(thread.values.messages) && 
      thread.values.messages.length > 0
  ) {
    const lastMessage = thread.values.messages[thread.values.messages.length - 1];
    
    if (lastMessage && typeof lastMessage === 'object' && 'timestamp' in lastMessage) {
      try {
        return new Date(lastMessage.timestamp as string);
      } catch (e) {
        console.error("Failed to parse message timestamp");
      }
    }
  }
  
  // Fallback: use current time
  return new Date();
}

/**
 * Group threads by time periods (Today, Yesterday, Previous 7 Days, etc.)
 */
export function groupThreadsByTime(threads: Thread[]): ThreadGroup[] {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  const week7Start = new Date(todayStart);
  week7Start.setDate(week7Start.getDate() - 7);
  
  const month30Start = new Date(todayStart);
  month30Start.setDate(month30Start.getDate() - 30);
  
  const currentYearStart = new Date(now.getFullYear(), 0, 1);
  
  const groups: ThreadGroup[] = [];
  
  // Create empty groups
  const todayGroup: ThreadGroup = { title: 'Today', threads: [] };
  const yesterdayGroup: ThreadGroup = { title: 'Yesterday', threads: [] };
  const week7Group: ThreadGroup = { title: 'Previous 7 Days', threads: [] };
  const month30Group: ThreadGroup = { title: 'Previous 30 Days', threads: [] };
  
  // Create month groups for current year
  const monthGroups: Record<number, ThreadGroup> = {};
  for (let month = 0; month < now.getMonth(); month++) {
    const monthName = new Date(now.getFullYear(), month, 1).toLocaleString('default', { month: 'long' });
    monthGroups[month] = { title: monthName, threads: [] };
  }
  
  // Create year group for previous years
  const yearGroups: Record<number, ThreadGroup> = {};
  
  // Sort threads by timestamp (most recent first)
  const sortedThreads = [...threads].sort((a, b) => {
    const aTime = getThreadTimestamp(a as EnhancedThread).getTime();
    const bTime = getThreadTimestamp(b as EnhancedThread).getTime();
    return bTime - aTime; // Descending order (newest first)
  });
  
  // Categorize each thread
  sortedThreads.forEach(thread => {
    const threadDate = getThreadTimestamp(thread as EnhancedThread);
    
    // Today
    if (threadDate >= todayStart) {
      todayGroup.threads.push(thread as EnhancedThread);
    } 
    // Yesterday
    else if (threadDate >= yesterdayStart) {
      yesterdayGroup.threads.push(thread as EnhancedThread);
    } 
    // Previous 7 Days
    else if (threadDate >= week7Start) {
      week7Group.threads.push(thread as EnhancedThread);
    } 
    // Previous 30 Days
    else if (threadDate >= month30Start) {
      month30Group.threads.push(thread as EnhancedThread);
    } 
    // Current year - by month
    else if (threadDate >= currentYearStart) {
      const month = threadDate.getMonth();
      if (monthGroups[month]) {
        monthGroups[month].threads.push(thread as EnhancedThread);
      }
    } 
    // Previous years
    else {
      const year = threadDate.getFullYear();
      if (!yearGroups[year]) {
        yearGroups[year] = { title: year.toString(), threads: [] };
      }
      yearGroups[year].threads.push(thread as EnhancedThread);
    }
  });
  
  // Add non-empty groups to result
  if (todayGroup.threads.length > 0) groups.push(todayGroup);
  if (yesterdayGroup.threads.length > 0) groups.push(yesterdayGroup);
  if (week7Group.threads.length > 0) groups.push(week7Group);
  if (month30Group.threads.length > 0) groups.push(month30Group);
  
  // Add month groups (current year)
  Object.values(monthGroups)
    .filter(group => group.threads.length > 0)
    .forEach(group => groups.push(group));
  
  // Add year groups (previous years)
  Object.values(yearGroups)
    .filter(group => group.threads.length > 0)
    .sort((a, b) => parseInt(b.title) - parseInt(a.title))
    .forEach(group => groups.push(group));
  
  return groups;
} 