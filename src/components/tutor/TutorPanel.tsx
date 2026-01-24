/**
 * TutorPanel - Main AI Tutor Panel Component
 * 
 * Challenge-aware, detection-reactive SOC mentor interface.
 */

import { useCallback } from "react";
import { MessageSquareText, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTutorSession } from "@/hooks/useTutorSession";
import { TutorHeader } from "./TutorHeader";
import { TutorContextBar } from "./TutorContextBar";
import { TutorModeToggle } from "./TutorModeToggle";
import { TutorChat } from "./TutorChat";
import { TutorInput } from "./TutorInput";
import { TutorSuggestions } from "./TutorSuggestions";

export function TutorPanel() {
  const {
    messages,
    sendMessage,
    telemetry,
    challenge,
    mode,
    setMode,
    isOpen,
    toggleOpen,
    isLoading,
    suggestedQuestions,
  } = useTutorSession();

  const isMobile = useIsMobile();

  const handleSuggestedPrompt = useCallback(
    (prompt: string) => {
      if (!isLoading) {
        sendMessage(prompt);
      }
    },
    [isLoading, sendMessage]
  );

  // Context object for TutorHeader
  const headerContext = {
    challengeId: challenge.challengeId,
    challengeName: challenge.challengeName,
    sessionId: `sess-${Date.now().toString(36).slice(-6)}`,
    category: challenge.category,
    difficulty: challenge.difficulty,
  };

  // Panel content shared between desktop and mobile
  const PanelContent = (
    <div className="flex flex-col h-full">
      <TutorHeader context={headerContext} onClose={toggleOpen} />
      <TutorContextBar telemetry={telemetry} />
      <TutorModeToggle mode={mode} onModeChange={setMode} />
      
      <TutorChat messages={messages} isLoading={isLoading} />

      <TutorSuggestions 
        suggestions={suggestedQuestions}
        onSelect={handleSuggestedPrompt}
        isLoading={isLoading}
      />

      <TutorInput 
        onSend={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <>
        <Button
          onClick={toggleOpen}
          size="icon"
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
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
                "flex flex-col items-center justify-center gap-2"
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

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleOpen}
              className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed right-0 top-0 z-50 h-full w-[400px]",
                "glass border-l border-border/50 flex flex-col"
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

export default TutorPanel;
