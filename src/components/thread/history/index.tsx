import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect, useCallback } from "react";

import { getContentString } from "../utils";
import { useQueryParam, StringParam, BooleanParam } from "use-query-params";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ExploreAgentsButton } from "@/components/agents/ExploreAgentsButton";
import { groupThreadsByTime } from "@/lib/thread-utils/group-by-time";

// Create an event name for thread updates
export const THREAD_UPDATED_EVENT = "thread-updated";

// Helper function to trigger thread update event
export function triggerThreadUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(THREAD_UPDATED_EVENT));
  }
}

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);
  const groupedThreads = groupThreadsByTime(threads);

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
      {groupedThreads.length === 0 && threads.length > 0 && (
        <div className="w-full px-3 py-2 text-sm text-gray-500">
          No threads found
        </div>
      )}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton key={`skeleton-${i}`} className="w-[280px] h-10" />
      ))}
    </div>
  );
}

export default function ThreadHistory() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryParam(
    "chatHistoryOpen",
    BooleanParam,
  );

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  // Function to refresh threads list from the server
  const refreshThreads = useCallback(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, [getThreads, setThreads, setThreadsLoading]);

  // Initialize threads on component mount
  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  // Listen for thread update events
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleThreadUpdate = () => {
      refreshThreads();
    };
    
    window.addEventListener(THREAD_UPDATED_EVENT, handleThreadUpdate);
    
    return () => {
      window.removeEventListener(THREAD_UPDATED_EVENT, handleThreadUpdate);
    };
  }, [refreshThreads]);

  return (
    <>
      <div className="hidden lg:flex flex-col border-r-[1px] border-slate-300 items-start justify-start gap-6 h-screen w-[300px] shrink-0 shadow-inner-right">
        <div className="flex items-center justify-between w-full pt-1.5 px-4">
          <Button
            className="hover:bg-gray-100"
            variant="ghost"
            onClick={() => setChatHistoryOpen((p) => !p)}
          >
            {chatHistoryOpen ? (
              <PanelRightOpen className="size-5" />
            ) : (
              <PanelRightClose className="size-5" />
            )}
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            Thread History
          </h1>
        </div>
        
        <div className="w-full px-4 mb-2">
          <ExploreAgentsButton />
        </div>
        
        {threadsLoading ? (
          <ThreadHistoryLoading />
        ) : (
          <ThreadList threads={threads} />
        )}
      </div>
      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent side="left" className="lg:hidden flex flex-col">
            <SheetHeader>
              <SheetTitle>Thread History</SheetTitle>
            </SheetHeader>
            
            <div className="w-full px-2 py-4">
              <ExploreAgentsButton />
            </div>
            
            <ThreadList
              threads={threads}
              onThreadClick={() => setChatHistoryOpen((o) => !o)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
