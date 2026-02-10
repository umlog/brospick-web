import Hero from './components/sections/Hero';
import Manifesto from './components/sections/Manifesto';
import Project from './components/sections/Project';
import Blog from './components/sections/Blog';
import Future from './components/sections/Future';
// import PickerApp from './components/sections/PickerApp';
import Sportswear from './components/sections/Sportswear';
// import Contact from './components/sections/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <Sportswear />
      <Blog />
      <Manifesto />
      <Project />
      <Future />
      {/* <PickerApp /> */}
      {/* <Contact /> */}
    </>
  );
}
