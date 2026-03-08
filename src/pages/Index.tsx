import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Events from "@/components/Events";
import EventFlow from "@/components/EventFlow";
import Sponsors from "@/components/Sponsors";
import Registration from "@/components/Registration";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Hero />
    <About />
    <Events />
    <EventFlow />
    <Sponsors />
    <Registration />
    <FAQ />
    <Contact />
    <Footer />
  </div>
);

export default Index;
