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
  // First, find and extract emails to protect them from HTML escaping
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emails: string[] = [];
  let safeContent = content.replace(emailRegex, (match) => {
    emails.push(match);
    return `__EMAIL_${emails.length - 1}__`;
  });

  // Find and extract phone numbers
  const phoneRegex = /(\+91\s?)(\d{10}|\d{5}\s?\d{5})/g;
  const phones: { prefix: string; num: string }[] = [];
  safeContent = safeContent.replace(phoneRegex, (_, prefix, num) => {
    phones.push({ prefix, num: num.replace(/\s/g, "") });
    return `__PHONE_${phones.length - 1}__`;
  });
  // Also standalone 📱 + 10 digits
  safeContent = safeContent.replace(/📱\s*(\d{10})/g, (_, num) => {
    phones.push({ prefix: "+91 ", num });
    return `__PHONE_${phones.length - 1}__`;
  });

  let html = safeContent
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Horizontal rules / separators
    .replace(/^─+$/gm, '<div class="carnibot-separator"></div>')
    .replace(/^---+$/gm, '<div class="carnibot-separator"></div>')
    // Headers
    .replace(/^### (.+)$/gm, '<div class="carnibot-heading-sm">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="carnibot-heading">$1</div>')
    // Bullet points
    .replace(/^[•\-]\s+/gm, '<span class="carnibot-bullet">•</span> ')
    // Newlines
    .replace(/\n/g, "<br/>");

  // Restore phone placeholders as clickable links
  phones.forEach((p, i) => {
    html = html.replace(
      `__PHONE_${i}__`,
      `<a href="tel:+91${p.num}" class="carnibot-phone">📱 +91 ${p.num}</a>`
    );
  });

  // Restore email placeholders as clickable links
  emails.forEach((email, i) => {
    html = html.replace(
      `__EMAIL_${i}__`,
      `<a href="mailto:${email}" class="carnibot-email">✉️ ${email}</a>`
    );
  });

  // Remove duplicate ✉️ emoji (since we add one in the replacement)
  html = html.replace(/✉️\s*(<a [^>]*class="carnibot-email"[^>]*>)✉️/g, '$1✉️');

  // Wrap sections that look like contact cards
  html = html.replace(
    /(🌟\s*(?:<strong>)?CORE TEAM(?:<\/strong>)?(?:.*?))(?=🎪\s*(?:<strong>)?EVENT|$)/s,
    '<div class="carnibot-card carnibot-card-gold">$1</div>'
  );
  html = html.replace(
    /(🎪\s*(?:<strong>)?EVENT COORDINATORS(?:<\/strong>)?(?:.*?))((?:<br\/>)*💡|$)/s,
    '<div class="carnibot-card carnibot-card-cyan">$1</div>$2'
  );

  return html;
};

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