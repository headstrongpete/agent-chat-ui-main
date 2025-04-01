import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { LangGraphLogoSVG, BearHeartIcon } from "../icons/langgraph";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  ArrowDown,
  LoaderCircle,
  PanelRightOpen,
  PanelRightClose,
  SquarePen,
  LogOut,
  Mic,
} from "lucide-react";
import { useAuth } from "@/providers/Auth";
import { BooleanParam, StringParam, useQueryParam } from "use-query-params";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import ThreadHistory from "./history";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { StarterQuestions } from "../agents/StarterQuestions";
import { agentApi } from "@/lib/agent-api";
import { triggerThreadUpdate } from "@/components/thread/history";

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

export function Thread() {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryParam(
    "chatHistoryOpen",
    BooleanParam,
  );
  const [hideToolCalls, setHideToolCalls] = useQueryParam(
    "hideToolCalls",
    BooleanParam,
  );
  const [agentName] = useQueryParam("agentName", StringParam);
  const [assistantId] = useQueryParam("assistantId", StringParam);
  const [agentDescription, setAgentDescription] = useState<string>("");
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const { logout } = useAuth();
  
  // Fetch agent description when assistantId changes
  useEffect(() => {
    if (assistantId) {
      const fetchAgentDetails = async () => {
        try {
          const agent = await agentApi.getAgentByAssistantId(assistantId);
          if (agent && agent.description) {
            setAgentDescription(agent.description);
          }
        } catch (error) {
          console.error("Error fetching agent description:", error);
        }
      };
      
      fetchAgentDetails();
    }
  }, [assistantId]);
  
  // Set hideToolCalls to true by default if not already set
  useEffect(() => {
    if (hideToolCalls === null || hideToolCalls === undefined) {
      setHideToolCalls(true);
    }
  }, [hideToolCalls, setHideToolCalls]);

  // Use try-catch to handle potential Stream context errors
  let streamContext;
  try {
    streamContext = useStreamContext();
  } catch (error) {
    console.error("Error accessing StreamContext:", error);
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Error</h2>
          <p className="mb-4">There was a problem connecting to the LangGraph server. Please check your configuration.</p>
          <Button onClick={() => window.location.href = "/config"}>
            Go to Configuration
          </Button>
        </div>
      </div>
    );
  }
  
  const stream = streamContext;
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  // Add this new effect to trigger updates when new messages arrive
  useEffect(() => {
    // Check if messages have increased (new response received)
    if (
      prevMessageLength.current > 0 && 
      messages.length > prevMessageLength.current && 
      !isLoading
    ) {
      // Only trigger update when streaming is complete and we've received AI or tool messages
      triggerThreadUpdate();
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      { messages: [...toolMessages, newHumanMessage] },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    setInput("");
    
    // Trigger thread update to refresh the thread list
    // This ensures the thread moves to the "Today" group after interaction
    triggerThreadUpdate();
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const chatStarted = !!threadId || !!messages.length;

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <div className="relative lg:flex hidden">
        <motion.div
          className="absolute h-full border-r bg-white overflow-hidden z-20"
          style={{ width: 300 }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -300 }
              : { x: chatHistoryOpen ? 0 : -300 }
          }
          initial={{ x: -300 }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div className="relative h-full" style={{ width: 300 }}>
            <ThreadHistory />
          </div>
        </motion.div>
      </div>
      <motion.div
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden relative",
          !chatStarted && "grid-rows-[1fr]",
        )}
        layout={isLargeScreen}
        animate={{
          marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
          width: chatHistoryOpen
            ? isLargeScreen
              ? "calc(100% - 300px)"
              : "100%"
            : "100%",
        }}
        transition={
          isLargeScreen
            ? { type: "spring", stiffness: 300, damping: 30 }
            : { duration: 0 }
        }
      >
        {!chatStarted && (
          <div className="absolute top-0 left-0 w-full flex items-center justify-between gap-3 p-2 pl-4 z-10">
            {(!chatHistoryOpen || !isLargeScreen) && (
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
            )}
          </div>
        )}
        {chatStarted && (
          <div className="flex items-center justify-between gap-3 p-2 pl-4 z-10 relative">
            <div className="flex items-center justify-start gap-2 relative">
              <div className="absolute left-0 z-10">
                {(!chatHistoryOpen || !isLargeScreen) && (
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
                )}
              </div>
              <motion.button
                className="flex gap-2 items-center cursor-pointer"
                onClick={() => setThreadId(null)}
                animate={{
                  marginLeft: !chatHistoryOpen ? 48 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <BearHeartIcon className="flex-shrink-0 h-8" />
                <span className="text-xl font-semibold tracking-tight">
                  {agentName || "Agent Chat"}
                </span>
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              <TooltipIconButton
                size="lg"
                className="p-4"
                tooltip="New thread"
                variant="ghost"
                onClick={() => setThreadId(null)}
              >
                <SquarePen className="size-5" />
              </TooltipIconButton>
              
              <TooltipIconButton
                size="lg"
                className="p-4"
                tooltip="Log out"
                variant="ghost"
                onClick={async () => {
                  await logout();
                  window.location.href = "/"; // Force redirect to login page
                }}
              >
                <LogOut className="size-5" />
              </TooltipIconButton>
            </div>

            <div className="absolute inset-x-0 top-full h-5 bg-gradient-to-b from-background to-background/0" />
          </div>
        )}

        <StickToBottom className="relative flex-1 overflow-hidden">
          <StickyToBottomContent
            className={cn(
              "absolute inset-0 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
              !chatStarted && "flex flex-col items-stretch mt-[25vh]",
              chatStarted && "grid grid-rows-[1fr_auto]",
            )}
            contentClassName="pt-8 pb-16  max-w-3xl mx-auto flex flex-col gap-4 w-full"
            content={
              <>
                {messages
                  .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                  .map((message, index) =>
                    message.type === "human" ? (
                      <HumanMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                      />
                    ) : (
                      <AssistantMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                        handleRegenerate={handleRegenerate}
                      />
                    ),
                  )}
                {isLoading && !firstTokenReceived && (
                  <AssistantMessageLoading />
                )}
              </>
            }
            footer={
              <div className="sticky flex flex-col items-center gap-8 bottom-0 px-4 bg-white">
                {!chatStarted && (
                  <>
                    <div className="flex gap-3 items-center">
                      <BearHeartIcon className="flex-shrink-0 h-8" />
                      <h1 className="text-2xl font-semibold tracking-tight">
                        {agentName || "Agent Chat"}
                      </h1>
                    </div>
                    
                    {agentDescription && (
                      <p className="text-gray-600 text-center max-w-2xl mx-auto px-4 text-sm leading-relaxed mt-2 mb-4">
                        {agentDescription}
                      </p>
                    )}
                  </>
                )}

                <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 animate-in fade-in-0 zoom-in-95" />

                {!chatStarted && assistantId && (
                  <StarterQuestions 
                    assistantId={assistantId} 
                    onQuestionClick={(question) => {
                      // Set the input value
                      setInput(question);
                      
                      // Use setTimeout to ensure the input is set before submitting
                      setTimeout(() => {
                        // Find the form and submit it
                        const form = document.querySelector('form');
                        if (form) {
                          form.requestSubmit();
                        }
                      }, 100);
                    }}
                    position="above"
                  />
                )}

                <div className="bg-muted rounded-2xl border shadow-xs mx-auto mb-8 w-full max-w-3xl relative z-10">
                  <form
                    onSubmit={handleSubmit}
                    className="grid grid-rows-[1fr_auto] gap-2 max-w-3xl mx-auto"
                  >
                    <div className="relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim() && !isLoading) {
                              const target = e.target as HTMLTextAreaElement;
                              const form = target.closest("form");
                              form?.requestSubmit();
                            }
                          }
                        }}
                        placeholder="Type your message... (Press Enter to send)"
                        className="p-3.5 pr-12 border-none bg-transparent field-sizing-content shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none w-full"
                        rows={1}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isLoading ? (
                          <LoaderCircle className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                          <TooltipIconButton
                            variant="ghost"
                            tooltip="Voice input (coming soon)"
                            className="opacity-70"
                            onClick={() => {}}
                          >
                            <Mic className="h-5 w-5" />
                          </TooltipIconButton>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center px-3 pb-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="render-tool-calls"
                          checked={hideToolCalls ?? true}
                          onCheckedChange={setHideToolCalls}
                        />
                        <Label
                          htmlFor="render-tool-calls"
                          className="text-sm text-gray-600"
                        >
                          Hide Tool Calls
                        </Label>
                      </div>
                    </div>
                  </form>
                </div>
                
                {chatStarted && assistantId && (
                  <StarterQuestions 
                    assistantId={assistantId} 
                    onQuestionClick={(question) => {
                      // Set the input value
                      setInput(question);
                      
                      // Use setTimeout to ensure the input is set before submitting
                      setTimeout(() => {
                        // Find the form and submit it
                        const form = document.querySelector('form');
                        if (form) {
                          form.requestSubmit();
                        }
                      }, 100);
                    }}
                    position="below"
                  />
                )}
                
              </div>
            }
          />
        </StickToBottom>
      </motion.div>
    </div>
  );
}
