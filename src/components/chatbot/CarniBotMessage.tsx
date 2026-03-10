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
    .replace(/(\+91\s?\d{5}\s?\d{5})/g, '<a href="tel:$1" class="text-primary underline">$1</a>');
};

const CarniBotMessage = memo(({ message }: { message: Message }) => {
  const isBot = message.role === "bot";
  const time = message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-2 ${isBot ? "" : "flex-row-reverse"}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs shrink-0">🤖</div>
      )}
      <div className={`max-w-[80%] ${isBot ? "" : "ml-auto"}`}>
        <div className={isBot ? "glass rounded-2xl rounded-tl-sm px-4 py-3 border border-primary/20" : "bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3"}>
          <div className="text-sm leading-relaxed [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline" dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} />
        </div>
        <p className={`text-[10px] text-muted-foreground mt-1 ${isBot ? "ml-1" : "mr-1 text-right"}`}>{time}</p>
      </div>
    </motion.div>
  );
});

CarniBotMessage.displayName = "CarniBotMessage";
export default CarniBotMessage;
