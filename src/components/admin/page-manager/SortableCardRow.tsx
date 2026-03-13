import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "./types";

interface SortableCardRowProps {
  card: Card;
  onToggleCard: (c: Card) => void;
}

const SortableCardRow = forwardRef<HTMLDivElement, SortableCardRowProps>(
  ({ card, onToggleCard }, _ref) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: card.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            aria-label="Reorder card"
            className="group cursor-grab active:cursor-grabbing text-foreground flex-shrink-0 touch-none rounded-md border border-border/60 bg-muted/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-1.5"
          >
            <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="h-1 w-1 rounded-full bg-muted-foreground/90 group-hover:bg-foreground transition-colors" />
              ))}
            </span>
          </button>
          <span className={`text-sm ${card.is_visible ? "text-foreground" : "text-muted-foreground"}`}>
            {card.card_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={card.is_visible ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
            {card.is_visible ? "Visible" : "Hidden"}
          </Badge>
          <Switch checked={card.is_visible} onCheckedChange={() => onToggleCard(card)} />
        </div>
      </div>
    );
  }
);

SortableCardRow.displayName = "SortableCardRow";

export default SortableCardRow;
