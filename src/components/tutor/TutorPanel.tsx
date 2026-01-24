import { useState, useCallback } from "react";
import { Send, MessageSquareText, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useTutor } from "@/hooks/useTutor";
import { useIsMobile } from "@/hooks/use-mobile";
import { TutorHeader } from "./TutorHeader";
import { TutorContextBar } from "./TutorContextBar";
import { TutorModeToggle } from "./TutorModeToggle";
import { TutorChat } from "./TutorChat";

const SUGGESTED_PROMPTS = [
  "Explain what I'm missing",
  "Why did my last attempt fail?",
  "What would a SOC analyst notice?",
];

export function TutorPanel() {
  const {
    messages,
    sendMessage,
    telemetry,
    context,
    mode,
    setMode,
    isOpen,
    toggleOpen,
    isLoading,
  } = useTutor();

  const [inputValue, setInputValue] = useState("");
  const isMobile = useIsMobile();

  const handleSend = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue("");
    }
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSuggestedPrompt = useCallback(
    (prompt: string) => {
      if (!isLoading) {
        sendMessage(prompt);
      }
    },
    [isLoading, sendMessage]
  );

  // Panel content shared between desktop and mobile
  const PanelContent = (
    <div className="flex flex-col h-full">
      <TutorHeader context={context} onClose={toggleOpen} />
      <TutorContextBar telemetry={telemetry} />
      <TutorModeToggle mode={mode} onModeChange={setMode} />
      
      <TutorChat messages={messages} isLoading={isLoading} />

      {/* Suggested Prompts */}
      <div className="px-4 py-3 border-t border-border/30">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSuggestedPrompt(prompt)}
              disabled={isLoading}
              className={cn(
                "px-2.5 py-1 text-[11px] rounded-md border transition-all duration-200",
                "border-border/50 text-muted-foreground bg-muted/20",
                "hover:border-primary/50 hover:text-primary hover:bg-primary/5",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 bg-card/50">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the tutor..."
            disabled={isLoading}
            className="flex-1 bg-muted/30 border-border/50 focus-visible:ring-primary/50 placeholder:text-muted-foreground/50"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="cyber-button bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile Trigger Button */}
        <Button
          onClick={toggleOpen}
          size="icon"
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg cyber-button bg-primary hover:bg-primary/90"
          style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.4)" }}
        >
          <MessageSquareText className="w-6 h-6" />
        </Button>

        <Drawer open={isOpen} onOpenChange={toggleOpen}>
          <DrawerContent className="h-[85vh] glass">
            {PanelContent}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: Slide-in Panel
  return (
    <>
      {/* Desktop Trigger Button - Fixed on right edge */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40"
          >
            <Button
              onClick={toggleOpen}
              variant="outline"
              className={cn(
                "h-32 w-10 rounded-l-lg rounded-r-none border-r-0",
                "bg-card/80 backdrop-blur-sm border-border/50",
                "hover:bg-primary/10 hover:border-primary/50 hover:text-primary",
                "flex flex-col items-center justify-center gap-2",
                "transition-all duration-200"
              )}
              style={{ boxShadow: "0 0 15px hsl(var(--primary) / 0.2)" }}
            >
              <MessageSquareText className="w-5 h-5" />
              <span className="text-[10px] font-medium writing-vertical">AI Tutor</span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleOpen}
              className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed right-0 top-0 z-50 h-full w-[400px]",
                "glass border-l border-border/50",
                "flex flex-col"
              )}
              style={{ boxShadow: "-4px 0 30px hsl(var(--primary) / 0.1)" }}
            >
              {PanelContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
