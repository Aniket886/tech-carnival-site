import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => (
  <section id="contact" className="py-24">
    <div className="container mx-auto px-4 max-w-2xl">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-bold text-gradient text-center mb-12"
      >
        Contact Us
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid sm:grid-cols-3 gap-6"
      >
        {[
          { icon: Mail, label: "Email", value: "techcarnival@college.edu" },
          { icon: Phone, label: "Phone", value: "+91 98765 43210" },
          { icon: MapPin, label: "Venue", value: "Main Auditorium, XYZ College" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card/50"
          >
            <item.icon className="h-8 w-8 text-primary mb-3" />
            <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
            <p className="text-sm text-foreground font-medium">{item.value}</p>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default Contact;
