import { memo } from "react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: "bot" | "user";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  type?: string;
}

const formatContent = (content: string) => {
  let html = content
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Horizontal rules / separators
    .replace(/^─+$/gm, '<div class="carnibot-separator"></div>')
    .replace(/^---+$/gm, '<div class="carnibot-separator"></div>')
    // Headers (### → h4, ## → h3)
    .replace(/^### (.+)$/gm, '<div class="carnibot-heading-sm">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="carnibot-heading">$1</div>')
    // Phone numbers — clickable tel: links
    .replace(/(\+91\s?)(\d{10}|\d{5}\s?\d{5})/g, (_, prefix, num) => {
      const clean = num.replace(/\s/g, "");
      return `<a href="tel:+91${clean}" class="carnibot-phone">📱 +91 ${clean}</a>`;
    })
    // Standalone phone without +91 prefix (10 digits after 📱)
    .replace(/📱\s*(\d{10})/g, (_, num) => {
      return `<a href="tel:+91${num}" class="carnibot-phone">📱 +91 ${num}</a>`;
    })
    // Email addresses — clickable mailto: links
    .replace(/✉️\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g,
      (_, email) => `<a href="mailto:${email}" class="carnibot-email">✉️ ${email}</a>`
    )
    // Also catch emails without ✉️ prefix
    .replace(/(?<!mailto:)(?<!">)([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})(?!<\/a>)/g,
      (email) => `<a href="mailto:${email}" class="carnibot-email">${email}</a>`
    )
    // Bullet points
    .replace(/^[•\-]\s+/gm, '<span class="carnibot-bullet">•</span> ')
    // Newlines
    .replace(/\n/g, "<br/>");

  // Wrap sections that look like contact cards
  // Core Team card
  html = html.replace(
    /(🌟\s*(?:<strong>)?CORE TEAM(?:<\/strong>)?(?:.*?))(?=🎪\s*(?:<strong>)?EVENT|$)/s,
    '<div class="carnibot-card carnibot-card-gold">$1</div>'
  );
  // Event Coordinators card
  html = html.replace(
    /(🎪\s*(?:<strong>)?EVENT COORDINATORS(?:<\/strong>)?(?:.*?))((?:<br\/>)*💡|$)/s,
    '<div class="carnibot-card carnibot-card-cyan">$1</div>$2'
  );

  return html;
};

const CarniBotMessage = memo(({ message }: { message: Message }) => {
  const isBot = message.role === "bot";
  const time = message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-2 ${isBot ? "" : "flex-row-reverse"}`}
    >
      {isBot && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(139, 92, 246, 0.15))",
            border: "1px solid rgba(0, 229, 255, 0.2)",
          }}
        >
          🤖
        </div>
      )}
      <div className={`max-w-[85%] ${isBot ? "" : "ml-auto"}`}>
        <div
          className="rounded-xl px-4 py-3"
          style={
            isBot
              ? {
                  background: "rgba(20, 20, 50, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderLeftColor: "#00e5ff",
                  borderLeftWidth: "2px",
                }
              : {
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                }
          }
        >
          <div
            className="carnibot-content text-sm leading-relaxed [&_strong]:font-semibold"
            style={{ color: isBot ? "rgba(255, 255, 255, 0.85)" : "#fff" }}
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
        </div>
        <p
          className={`text-[10px] mt-1 ${isBot ? "ml-1" : "mr-1 text-right"}`}
          style={{ color: "rgba(255, 255, 255, 0.3)" }}
        >
          {time}
        </p>
      </div>
    </motion.div>
  );
});

CarniBotMessage.displayName = "CarniBotMessage";
export default CarniBotMessage;