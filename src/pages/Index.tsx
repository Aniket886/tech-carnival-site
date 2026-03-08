import { useState, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import SponsorsSection from "@/components/home/SponsorsSection";
import EventsSection from "@/components/events/EventsSection";
import ScheduleSection from "@/components/schedule/ScheduleSection";
import Leaderboard from "@/components/home/Leaderboard";
import FAQSection from "@/components/home/FAQSection";
import ContactSection from "@/components/home/ContactSection";
import OrganizingCommittee from "@/components/home/OrganizingCommittee";
import CoreTeam from "@/components/home/CoreTeam";
import Footer from "@/components/layout/Footer";

import CarniBotWidget from "@/components/chatbot/CarniBotWidget";
import PageLoader from "@/components/layout/PageLoader";
import CustomCursor from "@/components/layout/CustomCursor";
import ScrollAnimate from "@/components/layout/ScrollAnimate";
import MaintenancePage from "@/components/home/MaintenancePage";
import { useSiteVisibility } from "@/hooks/useSiteVisibility";

const Index = () => {
  const { isSectionVisible, maintenanceMode, loading } = useSiteVisibility();

  if (maintenanceMode) return <MaintenancePage />;

  return (
    <div className="min-h-screen bg-background">
      <PageLoader />
      <CustomCursor />
      <Navbar />
      {isSectionVisible("hero") && <Hero />}
      {isSectionVisible("about") && <ScrollAnimate><About /></ScrollAnimate>}
      {isSectionVisible("sponsors") && <ScrollAnimate><SponsorsSection /></ScrollAnimate>}
      {isSectionVisible("events") && <ScrollAnimate><EventsSection /></ScrollAnimate>}
      {isSectionVisible("schedule") && <ScrollAnimate><ScheduleSection /></ScrollAnimate>}
      {isSectionVisible("leaderboard") && <ScrollAnimate><Leaderboard /></ScrollAnimate>}
      {isSectionVisible("faq") && <ScrollAnimate><FAQSection /></ScrollAnimate>}
      {isSectionVisible("contact") && <ScrollAnimate><ContactSection /></ScrollAnimate>}
      <ScrollAnimate><OrganizingCommittee /></ScrollAnimate>
      <ScrollAnimate><CoreTeam /></ScrollAnimate>
      {isSectionVisible("footer") && <Footer />}
      <ScrollToTop />
      <CarniBotWidget />
    </div>
  );
};

export default Index;
