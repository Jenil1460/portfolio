import React, { useContext, useEffect, useRef } from 'react';
import { Cpu, Calendar, Shield } from 'lucide-react';
import gsap from 'gsap';
import { SettingsContext } from '../context/SettingsContext';

const About = () => {
  const { settings } = useContext(SettingsContext);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.fade-up-el', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const partnerBrands = [
    'Vogue France', 'Estée Lauder', 'Tiffany & Co.', 'GQ Magazine', 'Nike Labs', 'Universal Films', 'BMW M', 'Balenciaga'
  ];

  const milestones = [
    { year: '2018', title: 'Studio Founded', desc: 'RJ.TwoShot is established as a premium cinematic collective focusing on editorial storytelling.' },
    { year: '2020', title: 'RED Cinema Workflow', desc: 'Transitioned the entire studio capturing pipeline to native RED 8K digital formats.' },
    { year: '2023', title: 'Global Recognition', desc: 'Collaborated with Vogue France and independent creative labels on commercial visual showcases.' },
    { year: '2026', title: 'Visual Expansion', desc: 'Relaunched digital archives, updating visual curation to a minimalist digital aesthetic.' }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0A0A0A] text-white pt-28 pb-20 select-none">
      <div className="max-w-5xl mx-auto px-6 md:px-12 space-y-24">
        
        {/* Large Header Title & Main Narrative */}
        <div className="space-y-8 max-w-3xl">
          <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 font-bold fade-up-el block">The Studio</span>
          <h1 className="text-4xl md:text-6xl uppercase font-extrabold tracking-tight font-sans leading-[1.05] fade-up-el">
            We focus on the raw weight of visual storytelling.
          </h1>
          <p className="text-sm text-neutral-400 font-light leading-relaxed fade-up-el pt-4 border-t border-white/5">
            {settings.aboutStory}
          </p>
        </div>

        {/* Selected Brands worked with */}
        <section className="space-y-6 fade-up-el">
          <h3 className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 font-bold">Collaborators</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 opacity-30 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            {partnerBrands.map((brand, idx) => (
              <span key={idx} className="hover:text-white transition-colors duration-300">
                {brand}
              </span>
            ))}
          </div>
        </section>

        {/* Equipment Setup List */}
        <section className="space-y-8 fade-up-el">
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 font-bold">Rigs & Hardware</span>
            <h2 className="text-xl md:text-2xl uppercase font-extrabold font-sans">Technical Setup</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {settings.aboutEquipment?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-3.5 border border-white/5 bg-[#171717] rounded-[16px] p-5 hover:border-white/10 transition-colors"
              >
                <Cpu className="w-4.5 h-4.5 text-neutral-600 flex-shrink-0" />
                <span className="text-xs text-neutral-300 font-light">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Minimal Timeline logs */}
        <section className="space-y-8 fade-up-el">
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 font-bold">Milestones</span>
            <h2 className="text-xl md:text-2xl uppercase font-extrabold font-sans">History Log</h2>
          </div>

          <div className="relative border-l border-white/5 pl-6 ml-2 space-y-10">
            {milestones.map((m, idx) => (
              <div key={idx} className="relative space-y-1.5" id={`milestone-${m.year}`}>
                {/* Dot */}
                <div className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-white border border-[#0A0A0A]"></div>
                <span className="text-[10px] text-white font-bold tracking-widest font-mono block">
                  {m.year}
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {m.title}
                </h3>
                <p className="text-neutral-400 text-xs font-light leading-relaxed max-w-xl">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Creative Team Members Grid (with Grayscale transitions) */}
        <section className="space-y-10 fade-up-el">
          <div className="space-y-2 border-b border-white/5 pb-4">
            <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 font-bold">The Collective</span>
            <h2 className="text-xl md:text-2xl uppercase font-extrabold font-sans">Creative Crew</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {settings.aboutTeam?.map((member, idx) => (
              <div
                key={idx}
                className="group relative rounded-[16px] overflow-hidden border border-white/5 bg-[#171717] p-4 hover:border-white/10 transition-colors"
                id={`member-card-${idx}`}
              >
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-[#0A0A0A]">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale transition-all duration-700 ease-out group-hover:scale-103 group-hover:grayscale-0"
                    loading="lazy"
                  />
                </div>
                <div className="pt-4 text-center">
                  <h4 className="font-bold text-sm uppercase tracking-wide text-white">{member.name}</h4>
                  <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-semibold block mt-1">{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
