import { Nav } from './sections/Nav';
import { Hero } from './sections/Hero';
import { Demo } from './sections/Demo';
import { Features } from './sections/Features';
import { HowItWorks } from './sections/HowItWorks';
import { Stats } from './sections/Stats';
import { Pricing } from './sections/Pricing';
import { Testimonials } from './sections/Testimonials';
import { FinalCTA } from './sections/FinalCTA';
import { Footer } from './sections/Footer';

export default function App() {
  return (
    <div className="relative min-h-screen">
      {/* Dot pattern background */}
      <div className="dot-pattern fixed inset-0 pointer-events-none" />

      <Nav />
      <main>
        <Hero />
        <Demo />
        <Features />
        <HowItWorks />
        <Stats />
        <Pricing />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
