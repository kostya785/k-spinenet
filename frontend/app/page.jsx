import Hero from "./sections/Hero";
import TryModel from "./sections/TryModel";
import About from "./sections/About";
import FAQ from "./sections/FAQ";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <section id="hero">
        <Hero />
      </section>
      <section id="try">
        <TryModel />
      </section>
      <section id="about">
        <About />
      </section>
      <section id="faq">
        <FAQ />
      </section>
      <Footer />
    </>
  );
}
