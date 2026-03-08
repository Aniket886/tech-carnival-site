import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Bot, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteVisibility } from "@/hooks/useSiteVisibility";
import { useIsMobile } from "@/hooks/use-mobile";
import CarniBotMessage from "./CarniBotMessage";
import CarniBotQuickReplies from "./CarniBotQuickReplies";

interface Message {
  id: string;
  role: "bot" | "user";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  type?: string;
}

const GREETING = "Hey there! 🎪 I'm CarniBOT — your personal Tech Carnival guide! Ask me anything about events, registration, schedules, or prizes. Let's roll! 🚀";

const INITIAL_SUGGESTIONS = [
  "🎪 Explore Events",
  "📝 How to Register",
  "📅 View Schedule",
  "📞 Contact Team",
];

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/carnibot`;

const CarniBotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isSectionVisible } = useSiteVisibility();
  const isMobile = useIsMobile();

  useEffect(() => {
    const seen = sessionStorage.getItem("carnibot_seen");
    if (!seen) {
      const t = setTimeout(() => setShowTooltip(true), 2000);
      const t2 = setTimeout(() => setShowTooltip(false), 7000);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isStreaming]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setShowTooltip(false);
    sessionStorage.setItem("carnibot_seen", "1");
    if (!hasGreeted) {
      setMessages([{
        id: "greeting",
        role: "bot",
        content: GREETING,
        timestamp: new Date(),
        suggestions: INITIAL_SUGGESTIONS,
      }]);
      setHasGreeted(true);
    }
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [hasGreeted]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const history = updatedMessages
        .filter((m) => m.id !== "greeting")
        .map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content }));

      const resp = await fetch(STREAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ message: text.trim(), sessionId, history }),
      });

      if (!resp.ok) throw new Error("Request failed");

      const contentType = resp.headers.get("Content-Type") || "";

      if (contentType.includes("text/event-stream") && resp.body) {
        setIsTyping(false);
        setIsStreaming(true);

        const streamBotId = crypto.randomUUID();
        setMessages((prev) => [...prev, {
          id: streamBotId,
          role: "bot",
          content: "",
          timestamp: new Date(),
          type: "ai",
        }]);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let contentSoFar = "";
        let streamSuggestions: string[] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.suggestions) {
                streamSuggestions = parsed.suggestions;
                continue;
              }
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                contentSoFar += delta;
                const captured = contentSoFar;
                setMessages((prev) =>
                  prev.map((m) => m.id === streamBotId ? { ...m, content: captured } : m)
                );
              }
            } catch {
              // partial JSON
            }
          }
        }

        if (streamSuggestions) {
          setMessages((prev) =>
            prev.map((m) => m.id === streamBotId ? { ...m, suggestions: streamSuggestions } : m)
          );
        }
        setIsStreaming(false);
      } else {
        const data = await resp.json();
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: "bot",
          content: data.reply || "Sorry, I couldn't process that. Try again!",
          timestamp: new Date(),
          suggestions: data.suggestions,
          type: data.type,
        }]);
      }
    } catch (err) {
      console.error("CarniBOT error:", err);
      setIsTyping(false);
      setIsStreaming(false);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "bot",
        content: "Oops! Something went wrong. Please try again or contact our team directly. 😅",
        timestamp: new Date(),
        suggestions: ["📞 Contact Team", "📋 All Events"],
      }]);
    }
  }, [messages, sessionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isSectionVisible("chatbot")) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-32 right-6 z-50"
          >
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-12 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
              >
                Ask me! 💬
                <div className="absolute -bottom-1 right-5 w-2 h-2 bg-primary rotate-45" />
              </motion.div>
            )}
            <button
              onClick={openChat}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 animate-pulse hover:animate-none"
              aria-label="Open CarniBOT"
            >
              <Bot size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, y: 20 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={
              isMobile
                ? "fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl"
                : "fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-h-[80vh] flex flex-col rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden"
            }
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-purple-500/10 shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-lg">
                🤖
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  CarniBOT
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </h3>
                <p className="text-xs text-muted-foreground">Your Tech Carnival Guide</p>
              </div>
              <button
                onClick={() => {
                  setMessages([{
                    id: "greeting",
                    role: "bot",
                    content: GREETING,
                    timestamp: new Date(),
                    suggestions: INITIAL_SUGGESTIONS,
                  }]);
                }}
                className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <CarniBotMessage key={msg.id} message={msg} />
              ))}
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs shrink-0">
                    🤖
                  </div>
                  <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              {!isTyping && !isStreaming && messages.length > 0 && messages[messages.length - 1].role === "bot" && messages[messages.length - 1].suggestions && (
                <CarniBotQuickReplies
                  suggestions={messages[messages.length - 1].suggestions!}
                  onSelect={sendMessage}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="shrink-0 border-t border-border/50 p-3 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about events, registration..."
                className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isTyping || isStreaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || isStreaming}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center disabled:opacity-40 hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CarniBotWidget;
