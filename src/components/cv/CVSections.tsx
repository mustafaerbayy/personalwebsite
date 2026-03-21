import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Linkedin, Mail, ExternalLink, ArrowRight, MapPin, Send } from "lucide-react";
import type { CVData } from "@/hooks/useCVContent";
import { useRef } from "react";

/* ─── Reveal wrapper ─── */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   HERO — Full-bleed split layout
   ═══════════════════════════════════════════════ */
export function HeroSection({ data }: { data: CVData }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} id="section-hero" className="relative min-h-[100svh] flex items-center overflow-hidden bg-hero">
      {/* Large gradient accent — top-right */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 3, 0] }}
        transition={{ repeat: Infinity, duration: 24, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-[20%] -right-[15%] h-[800px] w-[800px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, hsl(var(--hero-accent-glow)), transparent 65%)" }}
      />
      {/* Subtle bottom-left glow */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut", delay: 6 }}
        className="pointer-events-none absolute -bottom-[10%] -left-[10%] h-[500px] w-[500px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, hsl(var(--hero-accent)), transparent 60%)" }}
      />

      {/* Fine grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(hsl(var(--hero-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--hero-foreground)) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      <motion.div className="relative z-10 mx-auto w-full max-w-6xl px-6 sm:px-12" style={{ y: textY, opacity }}>
        <div className="flex flex-col gap-8 lg:gap-16">
          {/* Name — oversized display */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" as const }}
          >
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-3.5 w-3.5 text-hero-accent/60" />
              <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-hero-muted/60">{data.location}</span>
              <span className="relative flex h-2 w-2 ml-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50" style={{ animationDuration: "2.5s" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
            </div>
            <h1 className="font-display font-bold text-hero-foreground leading-[0.9] tracking-tight"
              style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}>
              {data.name.split(" ").map((word, i) => (
                <span key={i} className="block">{word}</span>
              ))}
            </h1>
          </motion.div>

          {/* Bottom row — title + summary + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" as const }}
            className="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16"
          >
            <div className="space-y-5 lg:max-w-md">
              <div className="flex items-center gap-3">
                <div className="h-px w-10 bg-hero-accent/40" />
                <span className="font-display text-base font-medium text-hero-accent sm:text-lg tracking-wide">{data.title}</span>
              </div>
              <p className="text-sm leading-[1.9] text-hero-muted/60 sm:text-base">{data.summary}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
              <motion.a
                href={`mailto:${data.email}`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:shadow-primary/35"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">{data.email}</span>
                <span className="sm:hidden">Email</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-0.5" />
              </motion.a>
              <motion.a
                href={data.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 rounded-full border border-hero-border/50 bg-hero-card/20 px-7 py-3.5 text-sm font-semibold text-hero-foreground/90 backdrop-blur-xl transition-all hover:bg-hero-card/40 hover:border-hero-border"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
                <ExternalLink className="h-3 w-3 opacity-30" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator — bottom-left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-6 sm:left-12 z-10 flex items-center gap-3"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="h-12 w-px bg-gradient-to-b from-hero-accent/40 to-transparent"
        />
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-hero-muted/30 [writing-mode:vertical-lr]">scroll</span>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   EXPERIENCE — Alternating editorial cards
   ═══════════════════════════════════════════════ */
export function ExperienceSection({ data, label }: { data: CVData; label: string }) {
  return (
    <section id="section-experience" className="relative min-h-[100svh] sm:min-h-0 flex flex-col justify-center py-20 sm:py-32 overflow-hidden bg-background">
      {/* Subtle noise */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.012]" style={{
        backgroundImage: `radial-gradient(hsl(var(--foreground)) 0.5px, transparent 0.5px)`,
        backgroundSize: "16px 16px",
      }} />

      <div className="relative mx-auto max-w-5xl px-6 sm:px-12 w-full">
        <Reveal>
          <div className="flex items-baseline gap-4 mb-14 sm:mb-20">
            <span className="font-display text-6xl sm:text-8xl font-bold text-primary/[0.07] leading-none select-none">01</span>
            <h2 className="font-display text-sm font-bold tracking-[0.2em] uppercase text-foreground/80">{label}</h2>
          </div>
        </Reveal>

        <div className="space-y-6 sm:space-y-8">
          {data.experience.map((exp, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ x: 6, transition: { duration: 0.3 } }}
                className="group relative flex flex-col sm:flex-row gap-4 sm:gap-8 rounded-2xl border border-border/40 bg-card/60 p-6 sm:p-8 backdrop-blur-sm transition-all duration-500 hover:border-primary/15 hover:bg-card/90 hover:shadow-2xl hover:shadow-primary/[0.03]"
              >
                {/* Period — left accent */}
                <div className="sm:w-36 shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/50 ring-4 ring-primary/10 shrink-0" />
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground/60 sm:text-sm">{exp.period}</span>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground sm:text-xl">{exp.role}</h3>
                    <p className="text-sm font-medium text-primary/60 mt-1">{exp.company}</p>
                  </div>
                  <p className="text-sm leading-[1.8] text-muted-foreground/70">{exp.description}</p>
                </div>

                {/* Hover arrow */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden sm:block">
                  <ArrowRight className="h-4 w-4 text-primary/30" />
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   EDUCATION — Minimal cards with accent borders
   ═══════════════════════════════════════════════ */
export function EducationSection({ data, label }: { data: CVData; label: string }) {
  return (
    <section id="section-education" className="relative min-h-[100svh] sm:min-h-0 flex flex-col justify-center py-20 sm:py-32 overflow-hidden bg-hero">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, hsl(var(--hero-accent-glow)), transparent 60%)" }} />

      <div className="relative mx-auto max-w-5xl px-6 sm:px-12 w-full">
        <Reveal>
          <div className="flex items-baseline gap-4 mb-14 sm:mb-20">
            <span className="font-display text-6xl sm:text-8xl font-bold text-hero-accent/[0.08] leading-none select-none">02</span>
            <h2 className="font-display text-sm font-bold tracking-[0.2em] uppercase text-hero-foreground/80">{label}</h2>
          </div>
        </Reveal>

        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
          {data.education.map((edu, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.35 } }}
                className="group relative rounded-2xl border border-hero-border/40 bg-hero-card/30 p-7 sm:p-9 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-hero-accent/20 hover:bg-hero-card/50"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-hero-accent/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <span className="inline-block text-xs font-bold tracking-[0.15em] uppercase text-hero-accent/50 mb-4">{edu.period}</span>
                <h3 className="font-display text-base font-semibold text-hero-foreground leading-snug sm:text-lg">{edu.degree}</h3>
                <p className="mt-2.5 text-sm text-hero-muted/50">{edu.school}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   SKILLS — Scattered pill cloud
   ═══════════════════════════════════════════════ */
export function SkillsSection({ data, label }: { data: CVData; label: string }) {
  return (
    <section id="section-skills" className="relative min-h-[100svh] sm:min-h-0 flex flex-col justify-center py-20 sm:py-32 overflow-hidden bg-background">
      <div className="relative mx-auto max-w-5xl px-6 sm:px-12 w-full">
        <Reveal>
          <div className="flex items-baseline gap-4 mb-14 sm:mb-20">
            <span className="font-display text-6xl sm:text-8xl font-bold text-primary/[0.07] leading-none select-none">03</span>
            <h2 className="font-display text-sm font-bold tracking-[0.2em] uppercase text-foreground/80">{label}</h2>
          </div>
        </Reveal>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          {data.skills.map((skill, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <motion.span
                whileHover={{ y: -4, scale: 1.06 }}
                transition={{ duration: 0.25, ease: "easeOut" as const }}
                className="cursor-default inline-block rounded-full border border-border/50 bg-card/60 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-foreground/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-primary/[0.04] hover:text-foreground hover:shadow-xl hover:shadow-primary/[0.05]"
              >
                {skill}
              </motion.span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   CONTACT — Centered, dramatic CTA
   ═══════════════════════════════════════════════ */
export function ContactSection({ data, label }: { data: CVData; label: string }) {
  return (
    <section id="section-contact" className="relative min-h-[100svh] sm:min-h-0 flex flex-col justify-center py-20 sm:py-40 overflow-hidden bg-hero">
      {/* Big glow */}
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, hsl(var(--hero-accent)), transparent 50%)" }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-12 text-center w-full">
        <Reveal>
          <span className="font-display text-6xl sm:text-8xl font-bold text-hero-accent/[0.08] leading-none select-none block mb-6">04</span>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="font-display text-3xl font-bold text-hero-foreground sm:text-5xl lg:text-6xl tracking-tight leading-[0.95]">
            {label}
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-6 mx-auto max-w-md text-sm sm:text-base text-hero-muted/50 leading-relaxed">
            {data.contactNote}
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href={`mailto:${data.email}`}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/25 transition-all hover:shadow-primary/40"
            >
              <Send className="h-4 w-4" />
              {data.email}
              <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-1" />
            </motion.a>
            <motion.a
              href={data.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 rounded-full border border-hero-border/50 bg-hero-card/20 px-8 py-4 text-sm font-semibold text-hero-foreground/90 backdrop-blur-xl transition-all hover:bg-hero-card/40"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </motion.a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
