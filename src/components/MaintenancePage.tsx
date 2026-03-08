import { motion } from "framer-motion";

const MaintenancePage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <motion.div
      className="text-center max-w-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-6xl mb-6">🛠️</div>
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
        We're getting ready for something amazing!
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Tech Carnival – 2K26 is coming soon. Stay tuned!
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        Under Maintenance
      </div>
    </motion.div>
  </div>
);

export default MaintenancePage;
