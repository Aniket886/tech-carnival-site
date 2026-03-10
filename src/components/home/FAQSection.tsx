import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  link_url: string | null;
  link_label: string | null;
  display_order: number;
}

const fallbackFaqs = [
  { q: "Who can participate?", a: "Any college student with a valid ID can participate." },
  { q: "Is there a registration fee?", a: "Some events are free while others have a nominal fee. Check event details." },
  { q: "Can I register for multiple events?", a: "Yes! You can register for multiple events as long as they don't have time conflicts." },
  { q: "Will I get a certificate?", a: "All participants will receive participation certificates. Winners get additional merit certificates." },
  { q: "What should I bring?", a: "Your college ID, laptop (for hackathon/coding events), and enthusiasm!" },
  { q: "How will I know my registration is confirmed?", a: "You will receive a confirmation email after admin verification." },
];

const FAQSection = () => {
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchFaqs = async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, link_url, link_label, display_order")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });
      if (!error && data && data.length > 0) {
        setFaqs(data);
      }
      setLoaded(true);
    };
    fetchFaqs();

    const channel = supabase
      .channel("faqs_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "faqs" }, () => fetchFaqs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const useFallback = loaded && faqs.length === 0;

  return (
    <section id="faq" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about Tech Carnival 2K26.
          </p>
        </div>

        <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem} className="space-y-3">
          {useFallback
            ? fallbackFaqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="glass rounded-xl border-none px-5"
                  onMouseEnter={() => setOpenItem(`faq-${i}`)}
                  onMouseLeave={() => setOpenItem(undefined)}
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary py-4 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))
            : faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="glass rounded-xl border-none px-5"
                  onMouseEnter={() => setOpenItem(faq.id)}
                  onMouseLeave={() => setOpenItem(undefined)}
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    <span>{faq.answer}</span>
                    {faq.link_url && (
                      <a
                        href={faq.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
                      >
                        {faq.link_label || "Learn more"} <ExternalLink size={12} />
                      </a>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
