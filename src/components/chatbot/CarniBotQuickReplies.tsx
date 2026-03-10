import { motion } from "framer-motion";

interface Props {
  suggestions: string[];
  onSelect: (text: string) => void;
}

const CarniBotQuickReplies = ({ suggestions, onSelect }: Props) => (
  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 ml-9">
    {suggestions.map((s) => (
      <button key={s} onClick={() => onSelect(s)} className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/50 hover:shadow-[0_0_10px_hsl(195_100%_50%/0.2)] transition-all">
        {s}
      </button>
    ))}
  </motion.div>
);

export default CarniBotQuickReplies;
