import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { About } from '../sections/About';
import { Booking } from '../sections/Booking';
import { BrandsStats } from '../sections/BrandsStats';
import { Contact } from '../sections/Contact';
import { Faq } from '../sections/Faq';
import { Gallery } from '../sections/Gallery';
import { Hero } from '../sections/Hero';
import { Process } from '../sections/Process';
import { Services } from '../sections/Services';
import { Testimonials } from '../sections/Testimonials';

export function HomePage() {
  const { hash } = useLocation();
  // Al llegar con /#seccion desde otra página, baja hasta esa sección.
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 100);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <>
      <Hero />
      <BrandsStats />
      <Services />
      <Process />
      <Gallery />
      <About />
      <Testimonials />
      <Booking />
      <Faq />
      <Contact />
    </>
  );
}
