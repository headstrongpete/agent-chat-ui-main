# Thread History Chronological Ordering Design

## Overview

This design document outlines the implementation approach for enhancing the Thread History component with chronological grouping of threads. The groups will be organized into specific time periods, with threads appearing only in the most recent category based on their last update timestamp.

## Current Implementation

From examining the codebase and API responses, we can see that:

1. The Thread History component (`src/components/thread/history/index.tsx`) displays a list of threads retrieved from the `useThreads` hook.
2. The `useThreads` hook (`src/providers/Thread.tsx`) provides access to threads via the LangGraph SDK client.
3. The LangGraph API returns thread objects that DO contain timestamp information:
   - `created_at`: ISO timestamp of thread creation (e.g., `2025-03-24T15:12:16.129568+00:00`)
   - `updated_at`: ISO timestamp of last update (e.g., `2025-03-24T15:12:49.379699+00:00`)
4. Currently, the UI displays threads in the order they are returned by the API without any client-side sorting or grouping.

## Requirements

We need to group threads chronologically into the following categories:

1. Today
2. Yesterday
3. Previous 7 Days
4. Previous 30 days
5. Month-specific groups (e.g., February) back to the start of the current year
6. Year-specific groups (e.g., 2024) for older threads

A thread should only appear in one category, based on its most recent activity timestamp (`updated_at` field).

## Implementation Plan

### 1. Type Declaration for Thread with Timestamps

First, we need to update the type declaration to include the timestamp fields that we found in the API response:

```typescript
// Enhanced Thread type with explicit timestamp fields
interface EnhancedThread extends Thread {
  created_at: string; // ISO timestamp of thread creation
  updated_at: string; // ISO timestamp of last update
}
```

### 2. Create Time-Based Grouping Function

Implement a utility function to categorize threads based on timestamps:

```typescript
interface ThreadGroup {
  title: string;
  threads: EnhancedThread[];
}

function groupThreadsByTime(threads: EnhancedThread[]): ThreadGroup[] {
  const now = new Date();
  const groups: ThreadGroup[] = [];
  
  // Create empty groups
  const todayGroup: ThreadGroup = { title: 'Today', threads: [] };
  const yesterdayGroup: ThreadGroup = { title: 'Yesterday', threads: [] };
  const week7Group: ThreadGroup = { title: 'Previous 7 Days', threads: [] };
  const month30Group: ThreadGroup = { title: 'Previous 30 Days', threads: [] };
  
  // Create month groups for current year
  const currentYear = now.getFullYear();
  const monthGroups: Record<number, ThreadGroup> = {};
  for (let month = 0; month < now.getMonth(); month++) {
    const monthName = new Date(currentYear, month, 1).toLocaleString('default', { month: 'long' });
    monthGroups[month] = { title: monthName, threads: [] };
  }
  
  // Create year group for previous years
  const yearGroups: Record<number, ThreadGroup> = {};
  
  // Sort threads by updated_at (most recent first)
  const sortedThreads = [...threads].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at).getTime();
    const bTime = new Date(b.updated_at || b.created_at).getTime();
    return bTime - aTime; // Descending order (newest first)
  });
  
  // Categorize each thread
  sortedThreads.forEach(thread => {
    const timestamp = thread.updated_at || thread.created_at;
    if (!timestamp) return;
    
    const threadDate = new Date(timestamp);
    const timeDiff = now.getTime() - threadDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0) {
      todayGroup.threads.push(thread);
    } else if (dayDiff === 1) {
      yesterdayGroup.threads.push(thread);
    } else if (dayDiff <= 7) {
      week7Group.threads.push(thread);
    } else if (dayDiff <= 30) {
      month30Group.threads.push(thread);
    } else if (threadDate.getFullYear() === currentYear) {
      const month = threadDate.getMonth();
      if (monthGroups[month]) {
        monthGroups[month].threads.push(thread);
      }
    } else {
      const year = threadDate.getFullYear();
      if (!yearGroups[year]) {
        yearGroups[year] = { title: year.toString(), threads: [] };
      }
      yearGroups[year].threads.push(thread);
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
```

### 3. Update ThreadList Component

Modify the ThreadList component to display threads in their respective time-based groups:

```tsx
function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);
  const groupedThreads = groupThreadsByTime(threads as EnhancedThread[]);

  return (
    <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {groupedThreads.map((group) => (
        <div key={group.title} className="w-full">
          <h3 className="text-sm font-medium text-gray-500 px-3 py-2">{group.title}</h3>
          {group.threads.map((t) => {
            let itemText = t.thread_id;
            if (
              typeof t.values === "object" &&
              t.values &&
              "messages" in t.values &&
              Array.isArray(t.values.messages) &&
              t.values.messages?.length > 0
            ) {
              const firstMessage = t.values.messages[0];
              itemText = getContentString(firstMessage.content);
            }
            return (
              <div key={t.thread_id} className="w-full px-1">
                <Button
                  variant="ghost"
                  className={`text-left items-start justify-start font-normal w-[280px] ${
                    t.thread_id === threadId ? "bg-gray-100" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    onThreadClick?.(t.thread_id);
                    if (t.thread_id === threadId) return;
                    setThreadId(t.thread_id);
                  }}
                >
                  <p className="truncate text-ellipsis">{itemText}</p>
                </Button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

## UI Considerations

1. **Group Headers**: Each time-based group has a clearly visible header with proper typography.
2. **Collapsible Groups**: Consider making groups collapsible to save space (future enhancement).
3. **Empty States**: Handle cases where no threads exist in certain time periods by not displaying those groups at all.

## Implementation Steps

1. Create a time-based grouping utility in a separate file such as `src/lib/thread-utils/group-by-time.ts`.
2. Update the ThreadList component to use this grouping utility.
3. Add group header styling to visually separate the groups.
4. Test with various scenarios (threads from different time periods).

## Future Enhancements

1. **Collapsible Groups**: Allow users to collapse/expand groups to save space.
2. **Preferences**: Let users choose which groups to display or how to group threads (e.g., by day/week/month only).
3. **Search and Filter**: Add ability to search within a specific time period.
4. **Customizable Grouping**: Allow users to customize the time ranges for grouping.

## Conclusion

With the confirmed timestamp information from the LangGraph API, we can implement chronological grouping of threads as specified in the requirements. The implementation should be straightforward since the timestamp data is already available in the API response. 