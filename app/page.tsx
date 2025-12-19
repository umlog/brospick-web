import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import Manifesto from './components/sections/Manifesto';
import Project from './components/sections/Project';
import Future from './components/sections/Future';
// import PickerApp from './components/sections/PickerApp';
// import Apparel from './components/sections/Apparel';
// import Contact from './components/sections/Contact';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Manifesto />
        <Project />
        <Future />
        {/* <PickerApp /> */}
        {/* <Apparel /> */}
        {/* <Contact /> */}
      </main>
      <Footer />
    </>
  );
}
