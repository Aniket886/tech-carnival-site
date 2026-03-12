import { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import HowToRegister from "@/components/home/HowToRegister";
import SponsorsSection from "@/components/home/SponsorsSection";
import EventsSection from "@/components/events/EventsSection";
import ScheduleSection from "@/components/schedule/ScheduleSection";
import GallerySection from "@/components/home/GallerySection";
import Leaderboard from "@/components/home/Leaderboard";
import FAQSection from "@/components/home/FAQSection";
import ContactSection from "@/components/home/ContactSection";
import OrganizingCommittee from "@/components/home/OrganizingCommittee";
import CoreTeam from "@/components/home/CoreTeam";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import CarniBotWidget from "@/components/chatbot/CarniBotWidget";
import PageLoader from "@/components/layout/PageLoader";
import CustomCursor from "@/components/layout/CustomCursor";
import ScrollAnimate from "@/components/layout/ScrollAnimate";
import MaintenancePage from "@/components/home/MaintenancePage";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import { useSiteVisibility } from "@/hooks/useSiteVisibility";

/* Map section_key → component (wrapped in ScrollAnimate where appropriate) */
const sectionComponentMap: Record<string, ReactNode> = {
  hero: <Hero />,
  about: <ScrollAnimate><About /></ScrollAnimate>,
  how_to_register: <ScrollAnimate><HowToRegister /></ScrollAnimate>,
  sponsors: <ScrollAnimate><SponsorsSection /></ScrollAnimate>,
  events: <ScrollAnimate><EventsSection /></ScrollAnimate>,
  schedule: <ScrollAnimate><ScheduleSection /></ScrollAnimate>,
  leaderboard: <ScrollAnimate><Leaderboard /></ScrollAnimate>,
  gallery: <ScrollAnimate><GallerySection /></ScrollAnimate>,
  faq: <ScrollAnimate><FAQSection /></ScrollAnimate>,
  contact: <ScrollAnimate><ContactSection /></ScrollAnimate>,
  organizing_committee: <ScrollAnimate><OrganizingCommittee /></ScrollAnimate>,
  core_team: <ScrollAnimate><CoreTeam /></ScrollAnimate>,
  footer: <Footer />,
};

const Index = () => {
  const { isSectionVisible, orderedSectionKeys, maintenanceMode } = useSiteVisibility();

  if (maintenanceMode) return <MaintenancePage />;

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBanner />
      <PageLoader />
      <CustomCursor />
      <Navbar />
      {orderedSectionKeys.map((key) =>
        isSectionVisible(key) && sectionComponentMap[key]
          ? <div key={key}>{sectionComponentMap[key]}</div>
          : null
      )}
      <ScrollToTop />
      <CarniBotWidget />
    </div>
  );
};

export default Index;
