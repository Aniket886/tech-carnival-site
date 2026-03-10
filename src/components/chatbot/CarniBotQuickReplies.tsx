import { motion } from "framer-motion";

interface Props {
  suggestions: string[];
  onSelect: (text: string) => void;
}

const CarniBotQuickReplies = ({ suggestions, onSelect }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-wrap gap-2 ml-9"
  >
    {suggestions.map((s) => (
      <button
        key={s}
        onClick={() => onSelect(s)}
        className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
        style={{
          background: "transparent",
          border: "1px solid rgba(0, 229, 255, 0.35)",
          color: "rgba(255, 255, 255, 0.85)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0, 229, 255, 0.15)";
          e.currentTarget.style.borderColor = "rgba(0, 229, 255, 0.6)";
          e.currentTarget.style.color = "#00e5ff";
          e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 229, 255, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "rgba(0, 229, 255, 0.35)";
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {s}
      </button>
    ))}
  </motion.div>
);

export default CarniBotQuickReplies;
