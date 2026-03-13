import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSensors } from "@dnd-kit/sortable";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Eye, EyeOff, Search } from "lucide-react";
import { Section, Card, sectionIcons, fmtDate } from "./types";
import SortableCardRow from "./SortableCardRow";

interface SortableSectionRowProps {
  section: Section;
  cards: Card[];
  expanded: string | null;
  onToggleExpand: (key: string) => void;
  onToggleSection: (s: Section) => void;
  onToggleCard: (c: Card) => void;
  onBulkCards: (key: string, visible: boolean) => void;
  cardFilter: string;
  onCardFilterChange: (v: string) => void;
  filteredCards: Card[];
  onReorderCards: (sectionKey: string, event: DragEndEvent) => void;
  cardSensors: ReturnType<typeof useSensors>;
}

const SortableSectionRow = forwardRef<HTMLDivElement, SortableSectionRowProps>(
  ({
    section, cards, expanded, onToggleExpand, onToggleSection,
    onToggleCard, onBulkCards, cardFilter, onCardFilterChange, filteredCards,
    onReorderCards, cardSensors,
  }, _ref) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: section.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : undefined,
    };

    const sectionCards = cards.filter(c => c.section_key === section.section_key);
    const isExpanded = expanded === section.section_key;
    const hasCards = sectionCards.length > 0;

    return (
      <div ref={setNodeRef} style={style} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            {...attributes}
            {...listeners}
            aria-label="Reorder section"
            className="group cursor-grab active:cursor-grabbing text-foreground flex-shrink-0 touch-none rounded-md border border-border/60 bg-muted/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-1.5"
          >
            <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="h-1 w-1 rounded-full bg-muted-foreground/90 group-hover:bg-foreground transition-colors" />
              ))}
            </span>
          </button>
          <span className="text-xl">{sectionIcons[section.section_key] || "📄"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm">{section.section_name}</span>
              <Badge variant={section.is_visible ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                {section.is_visible ? "● Visible" : "● Hidden"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              {hasCards && <span>{sectionCards.length} cards</span>}
              <span>⏱ {fmtDate(section.updated_at)}</span>
            </div>
          </div>
          <Switch checked={section.is_visible} onCheckedChange={() => onToggleSection(section)} />
          {hasCards && (
            <button
              onClick={() => onToggleExpand(section.section_key)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>

        {isExpanded && hasCards && (
          <div className="border-t border-border bg-background/50 px-4 py-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onBulkCards(section.section_key, true)}>
                <Eye size={12} className="mr-1" /> Show All
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onBulkCards(section.section_key, false)}>
                <EyeOff size={12} className="mr-1" /> Hide All
              </Button>
              <div className="relative flex-1 min-w-[160px] max-w-[250px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter cards…"
                  value={cardFilter}
                  onChange={e => onCardFilterChange(e.target.value)}
                  className="h-7 pl-8 text-xs bg-card"
                />
              </div>
            </div>

            <DndContext sensors={cardSensors} collisionDetection={closestCenter} onDragEnd={(e) => onReorderCards(section.section_key, e)}>
              <SortableContext items={filteredCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {filteredCards.map(card => (
                  <SortableCardRow key={card.id} card={card} onToggleCard={onToggleCard} />
                ))}
              </SortableContext>
            </DndContext>

            {filteredCards.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No cards match filter</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

SortableSectionRow.displayName = "SortableSectionRow";

export default SortableSectionRow;
