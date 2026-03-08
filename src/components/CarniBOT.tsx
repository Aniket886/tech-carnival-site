import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const GREETING = "Hey there! 🎪 I'm CarniBOT — your personal Tech Carnival guide! Ask me anything about events, registration, schedules, or prizes. Let's roll! 🚀";

const QUICK_ACTIONS = [
  { label: "🎪 Explore Events", message: "Tell me about all the events" },
  { label: "📝 How to Register", message: "How do I register for events?" },
  { label: "📅 View Schedule", message: "What's the event schedule?" },
  { label: "📞 Contact Team", message: "I need to talk to the coordinators" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/carnibot`;

const CarniBOT = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [hasOpened, setHasOpened] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-hide tooltip after 5s
  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleOpen = () => {
    setOpen(true);
    setShowTooltip(false);
    if (!hasOpened) {
      setHasOpened(true);
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: GREETING,
        timestamp: new Date(),
      }]);
    }
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const streamResponse = useCallback(async (userMessages: Message[]) => {
    setIsStreaming(true);
    const assistantId = crypto.randomUUID();

    // Add empty assistant message
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: userMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = resp.status === 429 || resp.status === 402
          ? "I'm a bit overwhelmed right now! Please try again in a moment. 🤖💤"
          : "Oops! Something went wrong. Try again or contact our team directly! 📞";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: errData } : m));
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              const captured = fullContent;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: captured } : m));
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "Connection lost! Please try again. 🔌" } : m
      ));
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim(), timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    streamResponse(updated);
  };

  const handleQuickAction = (msg: string) => sendMessage(msg);

  const getSuggestions = (): { label: string; message: string }[] => {
    if (messages.length <= 1) return QUICK_ACTIONS;
    const last = messages[messages.length - 1]?.content?.toLowerCase() || "";
    if (last.includes("event") || last.includes("hack") || last.includes("quest"))
      return [
        { label: "📝 Register Now", message: "How do I register?" },
        { label: "📅 Schedule", message: "What's the schedule?" },
        { label: "📞 Contact", message: "Show me coordinator contacts" },
      ];
    if (last.includes("register"))
      return [
        { label: "🎪 All Events", message: "Show me all events" },
        { label: "👥 Team Info", message: "What are the team sizes?" },
        { label: "📞 Contact", message: "Show me coordinator contacts" },
      ];
    return [
      { label: "🎪 Events", message: "Tell me about the events" },
      { label: "📅 Schedule", message: "What's the schedule?" },
      { label: "📝 Register", message: "How to register?" },
      { label: "📞 Contact", message: "Contact the team" },
    ];
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-24 right-6 z-[60]"
          >
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground whitespace-nowrap shadow-lg"
              >
                Ask me! 🤖
                <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-card border-r border-b border-border" />
              </motion.div>
            )}
            <button
              onClick={handleOpen}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110 relative"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                boxShadow: "var(--neon-glow), 0 4px 20px hsl(var(--primary) / 0.3)",
              }}
              aria-label="Open CarniBOT"
            >
              <span className="animate-pulse">🤖</span>
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "hsl(var(--primary))" }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, y: 20 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-[70] flex flex-col ${
              isMobile
                ? "inset-0"
                : "bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh] rounded-2xl"
            }`}
            style={{
              background: isMobile ? "hsl(var(--background))" : "hsl(var(--background) / 0.95)",
              backdropFilter: "blur(20px)",
              border: isMobile ? "none" : "1px solid hsl(var(--border))",
              boxShadow: isMobile ? "none" : "0 0 40px hsl(var(--primary) / 0.15), 0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
              style={{ background: "hsl(var(--card) / 0.8)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--secondary) / 0.2))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                }}
              >
                🤖
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">CarniBOT</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">Your Tech Carnival Guide</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-1" style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                      🤖
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "rounded-bl-md"
                  }`}
                    style={msg.role === "assistant" ? {
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    } : {}}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-primary [&_a]:text-primary">
                        <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    <p className="text-[10px] mt-1.5 opacity-50">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <div className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: "hsl(var(--primary) / 0.15)" }}>🤖</div>
                  <div className="flex gap-1 px-4 py-3 rounded-2xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* Quick suggestions */}
              {!isStreaming && messages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {getSuggestions().map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleQuickAction(s.message)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-primary/50 hover:text-primary"
                      style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about events, registration..."
                  disabled={isStreaming}
                  className="flex-1 bg-card/50 border-border text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isStreaming}
                  className="shrink-0 h-10 w-10"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CarniBOT;
