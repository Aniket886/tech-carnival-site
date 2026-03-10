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
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
    .replace(/• /g, '&bull; ')
    .replace(/(\+91\s?\d{5}\s?\d{5})/g, '<a href="tel:$1" style="color:#00e5ff;text-decoration:underline;">$1</a>');
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
      <div className={`max-w-[80%] ${isBot ? "" : "ml-auto"}`}>
        <div
          className="rounded-xl px-4 py-3"
          style={
            isBot
              ? {
                  background: "rgba(20, 20, 50, 0.9)",
                  borderLeft: "2px solid #00e5ff",
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
            className="text-sm leading-relaxed [&_strong]:font-semibold"
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
