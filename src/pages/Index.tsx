import { useSiteVisibility } from "@/hooks/useSiteVisibility";
import MaintenancePage from "@/components/MaintenancePage";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Sponsors from "@/components/Sponsors";
import Events from "@/components/Events";
import EventFlow from "@/components/EventFlow";
import Registration from "@/components/Registration";
import Leaderboard from "@/components/Leaderboard";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const sectionComponents: { key: string; Component: React.ComponentType }[] = [
  { key: "hero", Component: Hero },
  { key: "about", Component: About },
  { key: "sponsors", Component: Sponsors },
  { key: "events", Component: Events },
  { key: "schedule", Component: EventFlow },
  { key: "registration", Component: Registration },
  { key: "leaderboard", Component: Leaderboard },
  { key: "faq", Component: FAQ },
  { key: "contact", Component: Contact },
  { key: "footer", Component: Footer },
];

const Index = () => {
  const { maintenanceMode, isSectionVisible, loading } = useSiteVisibility();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (maintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {sectionComponents.map(({ key, Component }) =>
        isSectionVisible(key) ? <Component key={key} /> : null
      )}
    </div>
  );
};

export default Index;
