import { Nav } from './sections/Nav';
import { Footer } from './sections/Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="dot-pattern fixed inset-0 pointer-events-none" />
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
