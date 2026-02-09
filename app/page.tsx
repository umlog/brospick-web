import Hero from './components/sections/Hero';
import Manifesto from './components/sections/Manifesto';
import Project from './components/sections/Project';
import Blog from './components/sections/Blog';
import Future from './components/sections/Future';
// import PickerApp from './components/sections/PickerApp';
// import Apparel from './components/sections/Apparel';
// import Contact from './components/sections/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Blog />
      <Project />
      <Future />
      {/* <PickerApp /> */}
      {/* <Apparel /> */}
      {/* <Contact /> */}
    </>
  );
}
