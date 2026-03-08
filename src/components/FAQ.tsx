import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Who can participate in Tech Carnival 2K26?",
    a: "Tech Carnival is open to all college students across the country. Whether you're a beginner or an experienced developer, there's something for everyone!",
  },
  {
    q: "Is there a registration fee?",
    a: "Registration is completely free for all events. However, some workshops may have limited seats, so early registration is recommended.",
  },
  {
    q: "Can I participate in multiple events?",
    a: "Yes! You can register for multiple events as long as their schedules don't overlap. Check the schedule section for timings.",
  },
  {
    q: "Is accommodation provided for outstation participants?",
    a: "Yes, we provide free accommodation for outstation participants on a first-come, first-served basis. Please mention your requirement during registration.",
  },
  {
    q: "What should I bring for the Hackathon?",
    a: "Bring your laptop, charger, and any hardware you might need. We'll provide Wi-Fi, power strips, snacks, and meals throughout the 24-hour event.",
  },
  {
    q: "Will certificates be provided?",
    a: "Yes, all participants will receive digital certificates of participation. Winners will receive special merit certificates along with prizes.",
  },
];

const FAQ = () => (
  <section id="faq" className="py-24">
    <div className="container mx-auto px-4 max-w-3xl">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-bold text-gradient text-center mb-12"
      >
        Frequently Asked Questions
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
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
