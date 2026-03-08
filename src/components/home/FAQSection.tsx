import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Who can participate?", a: "Any college student with a valid ID can participate." },
  { q: "Is there a registration fee?", a: "Some events are free while others have a nominal fee. Check event details." },
  { q: "Can I register for multiple events?", a: "Yes! You can register for multiple events as long as they don't have time conflicts." },
  { q: "Will I get a certificate?", a: "All participants will receive participation certificates. Winners get additional merit certificates." },
  { q: "What should I bring?", a: "Your college ID, laptop (for hackathon/coding events), and enthusiasm!" },
  { q: "How will I know my registration is confirmed?", a: "You will receive a confirmation email after admin verification." },
];

const FAQSection = () => {
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

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="glass rounded-xl border-none px-5"
            >
              <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary py-4 hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
