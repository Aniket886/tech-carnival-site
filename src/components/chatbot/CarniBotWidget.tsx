import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, MessageCircle, Trash2 } from "lucide-react";
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
  "📋 What events are there?",
  "📅 Show me the schedule",
  "📝 How to register?",
  "💰 What are the prizes?",
  "📞 Contact coordinator",
  "🏆 Leaderboard",
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
        suggestions: ["📞 Contact", "📋 Events"],
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
      {/* Floating Circle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 max-sm:bottom-4 max-sm:right-4"
          >
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 -translate-y-1/2 right-full mr-3 text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
                style={{
                  background: "rgba(0, 229, 255, 0.15)",
                  border: "1px solid rgba(0, 229, 255, 0.3)",
                  color: "#00e5ff",
                }}
              >
                Need help? 💬
                <div
                  className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 rotate-45"
                  style={{ background: "rgba(0, 229, 255, 0.15)" }}
                />
              </motion.div>
            )}
            <motion.button
              onClick={openChat}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-[60px] h-[60px] max-sm:w-[52px] max-sm:h-[52px] rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: "rgba(15, 15, 30, 0.7)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#00e5ff",
                boxShadow: "0 0 12px rgba(0, 200, 255, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.4), 0 0 40px rgba(0, 255, 255, 0.15)";
                e.currentTarget.style.borderColor = "rgba(0, 229, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 12px rgba(0, 200, 255, 0.2)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
              aria-label="Open CarniBOT"
            >
              <MessageCircle size={26} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isMobile ? { y: "100%" } : { opacity: 0, y: 20 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={
              isMobile
                ? "fixed inset-0 z-50 flex flex-col"
                : "fixed bottom-6 right-6 z-50 w-[380px] h-[600px] max-h-[80vh] flex flex-col overflow-hidden"
            }
            style={{
              background: "rgba(10, 10, 30, 0.85)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: isMobile ? "20px 20px 0 0" : "20px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 229, 255, 0.05)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 shrink-0 relative"
              style={{
                background: "linear-gradient(135deg, #0f0f2e, #1a1a4e)",
                borderBottom: "1px solid rgba(0, 229, 255, 0.25)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{
                  background: "linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(139, 92, 246, 0.2))",
                  border: "1px solid rgba(0, 229, 255, 0.3)",
                  boxShadow: "0 0 15px rgba(0, 229, 255, 0.2)",
                }}
              >
                🤖
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  CarniBOT 🤖
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{
                      background: "#22c55e",
                      boxShadow: "0 0 8px rgba(34, 197, 94, 0.6)",
                    }}
                  />
                </h3>
                <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.45)" }}>
                  Ask me anything!
                </p>
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
                className="p-2 rounded-lg transition-all duration-200"
                style={{ color: "rgba(255, 255, 255, 0.5)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#f87171";
                  e.currentTarget.style.background = "rgba(248, 113, 113, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.background = "transparent";
                }}
                title="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg transition-all duration-200"
                style={{ color: "rgba(255, 255, 255, 0.5)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#00e5ff";
                  e.currentTarget.style.background = "rgba(0, 229, 255, 0.1)";
                  e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 229, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 carnibot-scrollbar">
              {messages.map((msg) => (
                <CarniBotMessage key={msg.id} message={msg} />
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(139, 92, 246, 0.15))",
                      border: "1px solid rgba(0, 229, 255, 0.2)",
                    }}
                  >
                    🤖
                  </div>
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: "rgba(20, 20, 50, 0.9)",
                      borderLeft: "2px solid #00e5ff",
                    }}
                  >
                    <div className="flex gap-1.5">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{
                            background: "#00e5ff",
                            boxShadow: "0 0 6px rgba(0, 229, 255, 0.5)",
                            animationDelay: `${delay}ms`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              {!isTyping && !isStreaming && messages.length > 0 && messages[messages.length - 1].role === "bot" && messages[messages.length - 1].suggestions && (
                <CarniBotQuickReplies
                  suggestions={messages[messages.length - 1].suggestions!}
                  onSelect={sendMessage}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="shrink-0 p-3 flex gap-2"
              style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 rounded-full px-4 py-2.5 text-sm text-foreground italic placeholder:not-italic focus:outline-none transition-all duration-200"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "rgba(255, 255, 255, 0.9)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 229, 255, 0.3)";
                  e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 229, 255, 0.1)";
                  e.currentTarget.style.fontStyle = "normal";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.boxShadow = "none";
                  if (!e.currentTarget.value) e.currentTarget.style.fontStyle = "italic";
                }}
                disabled={isTyping || isStreaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || isStreaming}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #00e5ff, #8b5cf6)",
                  boxShadow: "0 0 10px rgba(0, 229, 255, 0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 229, 255, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 229, 255, 0.2)";
                }}
              >
                <Send size={16} className="text-white" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CarniBotWidget;
