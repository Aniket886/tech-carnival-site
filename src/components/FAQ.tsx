import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Who can participate?",
    a: "Any college student with a valid ID can participate.",
  },
  {
    q: "Is there a registration fee?",
    a: "Some events are free while others have a nominal fee. Check event details.",
  },
  {
    q: "Can I register for multiple events?",
    a: "Yes! You can register for multiple events as long as they don't have time conflicts.",
  },
  {
    q: "Will I get a certificate?",
    a: "All participants will receive participation certificates. Winners get additional merit certificates.",
  },
  {
    q: "What should I bring?",
    a: "Your college ID, laptop (for hackathon/coding events), and enthusiasm!",
  },
  {
    q: "How will I know my registration is confirmed?",
    a: "You will receive a confirmation email after admin verification.",
  },
];

const FAQ = () => (
  <section id="faq" className="py-24">
    <div className="container mx-auto px-4 max-w-3xl">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-bold text-gradient text-center mb-4"
      >
        Frequently Asked Questions
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-center text-muted-foreground mb-12"
      >
        Everything you need to know about Tech Carnival 2K26
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-lg border border-border bg-card/50 px-5 data-[state=open]:border-primary/30"
            >
              <AccordionTrigger className="text-left text-foreground hover:text-primary transition-colors hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FAQ;
