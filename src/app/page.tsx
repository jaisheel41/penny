'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

// ── Demo entries ────────────────────────────────────────────────────────
const DEMOS = [
  { input: 'Deliveroo £18', icon: '🍕', cat: 'Food & Drink', merchant: 'Deliveroo', amount: '£18.00' },
  { input: 'Spotify 9.99', icon: '🎵', cat: 'Subscriptions', merchant: 'Spotify', amount: '£9.99' },
  { input: 'Tesco 43.20', icon: '🛒', cat: 'Groceries', merchant: 'Tesco', amount: '£43.20' },
  { input: 'Coffee 4.80', icon: '☕', cat: 'Eating out', merchant: 'Café Nero', amount: '£4.80' },
  { input: 'Netflix £15.99', icon: '📺', cat: 'Entertainment', merchant: 'Netflix', amount: '£15.99' },
]

// ── Live typewriter demo widget ─────────────────────────────────────────
function TypewriterDemo() {
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [show, setShow] = useState(false)
  const [phase, setPhase] = useState<'type' | 'show' | 'clear'>('type')

  useEffect(() => {
    const d = DEMOS[idx]
    let t: ReturnType<typeof setTimeout>
    if (phase === 'type') {
      if (typed.length < d.input.length) {
        t = setTimeout(() => setTyped(d.input.slice(0, typed.length + 1)), 70 + Math.random() * 55)
      } else {
        t = setTimeout(() => { setShow(true); setPhase('show') }, 350)
      }
    } else if (phase === 'show') {
      t = setTimeout(() => setPhase('clear'), 2600)
    } else {
      t = setTimeout(() => {
        setShow(false)
        setTyped('')
        setIdx(i => (i + 1) % DEMOS.length)
        setPhase('type')
      }, 450)
    }
    return () => clearTimeout(t)
  }, [phase, typed, idx])

  const d = DEMOS[idx]

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '1.25rem',
      padding: 'clamp(1.25rem,3vw,2rem)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.4)',
      fontFamily: 'var(--font-geist-mono), monospace',
    }}>
      {/* Window chrome dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
        {['#ff5f57', '#ffbd2e', '#28c840'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
        ))}
      </div>
      <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,239,233,0.3)', marginBottom: '0.6rem' }}>
        Quick add
      </div>
      {/* Typing line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'clamp(0.95rem,2vw,1.1rem)', color: '#f0efe9', minHeight: '2.2rem' }}>
        <span style={{ color: '#22c55e', fontWeight: 700 }}>›</span>
        <span>{typed}</span>
        <span style={{
          display: 'inline-block', width: 2, height: '1.1em',
          background: '#22c55e', verticalAlign: 'middle',
          animation: 'blink 0.9s step-end infinite',
        }} />
      </div>
      {/* Parsed result */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.35s cubic-bezier(0.23,1,0.32,1), transform 0.35s cubic-bezier(0.23,1,0.32,1)',
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: '1.6rem' }}>{d.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f0efe9', fontWeight: 500, fontSize: '0.9rem' }}>{d.merchant}</div>
          <div style={{ color: 'rgba(240,239,233,0.35)', fontSize: '0.72rem', marginTop: 2, fontFamily: 'var(--font-geist-sans)' }}>{d.cat}</div>
        </div>
        <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', fontFamily: 'var(--font-geist-sans)' }}>{d.amount}</div>
      </div>
    </div>
  )
}

// ── Scroll reveal wrapper ───────────────────────────────────────────────
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.unobserve(el) } },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      ...style,
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(2.25rem)',
      transition: `opacity 0.85s cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 0.85s cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{ fontFamily: 'var(--font-geist-sans)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(2rem)} to{opacity:1;transform:translateY(0)} }

        /* Nav link — directional underline */
        .nav-link {
          position: relative;
          text-decoration: none;
          color: rgba(240,239,233,0.6);
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 100%; height: 1px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.35s ease;
        }
        .nav-link:hover { color: rgba(240,239,233,0.9); }
        .nav-link:hover::after { transform: scaleX(1); transform-origin: left; }

        /* Primary CTA — pill with glossy inset */
        .cta-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.875rem 1.875rem; border-radius: 999px;
          background: #22c55e; color: #0d0d0c; border: none;
          font-weight: 700; font-size: 0.95rem; text-decoration: none;
          cursor: pointer; letter-spacing: -0.01em;
          font-family: var(--font-geist-sans);
          box-shadow: rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.05) 0px 2px 4px, rgba(255,255,255,0.35) 0px 0.5px 0px 0px inset;
          transition: transform 0.2s cubic-bezier(0.23,1,0.32,1), box-shadow 0.2s cubic-bezier(0.23,1,0.32,1);
        }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,197,94,0.35); }
        .cta-primary:active { transform: translateY(0); }

        /* Ghost CTA */
        .cta-ghost {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.875rem 1.875rem; border-radius: 999px;
          background: transparent; color: rgba(240,239,233,0.65);
          border: 1.5px solid rgba(255,255,255,0.14);
          font-weight: 500; font-size: 0.95rem; text-decoration: none;
          cursor: pointer; letter-spacing: -0.01em;
          font-family: var(--font-geist-sans);
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .cta-ghost:hover { border-color: rgba(255,255,255,0.38); color: rgba(240,239,233,1); }

        /* Feature cards */
        .feat-card {
          border: 1px solid #e4e0d8;
          border-radius: 1.25rem;
          padding: clamp(1.5rem,3vw,2.25rem);
          background: #ffffff;
          height: 100%;
          transition: transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s cubic-bezier(0.23,1,0.32,1);
        }
        .feat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -8px rgba(28,25,23,0.1); }

        /* Responsive breakpoints */
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .feat-grid > * { grid-column: span 1 !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .footer-bar { flex-direction: column; align-items: flex-start !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ─────────────────────────────────────────── NAV */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(13,13,12,0.82)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          maxWidth: '80rem', margin: '0 auto',
          padding: '0 clamp(1.5rem,5vw,4rem)',
          height: '3.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div style={{
              width: '1.75rem', height: '1.75rem', background: '#22c55e',
              borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles style={{ width: '0.875rem', height: '0.875rem', color: '#0d0d0c' }} />
            </div>
            <span style={{ fontWeight: 700, letterSpacing: '-0.03em', color: '#f0efe9', fontSize: '1.05rem' }}>Penny</span>
          </div>
          <Link href="/login" className="nav-link">Sign in</Link>
        </div>
      </header>

      {/* ─────────────────────────────────────────── HERO */}
      <section style={{
        background: '#0d0d0c',
        minHeight: '100vh',
        paddingTop: '3.75rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grain texture */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.35,
        }} />
        {/* Ambient glow — right side */}
        <div aria-hidden style={{
          position: 'absolute', top: '5%', right: '-5%', zIndex: 0,
          width: '55vw', height: '70vh',
          background: 'radial-gradient(ellipse at 65% 30%, rgba(34,197,94,0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: '80rem', margin: '0 auto',
          padding: '0 clamp(1.5rem,5vw,4rem)',
          minHeight: 'calc(100vh - 3.75rem)',
          display: 'flex', alignItems: 'center',
          position: 'relative', zIndex: 1,
        }}>
          <div className="hero-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(2.5rem,7vw,5rem)',
            alignItems: 'center', width: '100%',
            paddingTop: 'clamp(2.5rem,7vh,5rem)',
            paddingBottom: 'clamp(2.5rem,7vh,5rem)',
          }}>

            {/* LEFT — text */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                border: '1px solid rgba(34,197,94,0.3)', borderRadius: '999px',
                padding: '0.3rem 0.875rem', fontSize: '0.7rem', fontWeight: 600,
                color: '#22c55e', letterSpacing: '0.07em', textTransform: 'uppercase',
                marginBottom: '2rem',
                animation: 'fadeUp 0.7s cubic-bezier(0.23,1,0.32,1) 0.1s both',
              }}>
                Personal finance tracker
              </div>

              {/* SIGNATURE HEADLINE — outlined + filled */}
              <h1 style={{
                fontWeight: 800, lineHeight: '0.9',
                letterSpacing: '-0.04em',
                fontSize: 'clamp(3rem,6.5vw,5.75rem)',
                textTransform: 'uppercase',
                marginBottom: '2rem',
                animation: 'fadeUp 0.7s cubic-bezier(0.23,1,0.32,1) 0.2s both',
              }}>
                {/* Outlined words */}
                {(['Know', "where", "you're"] as const).map(word => (
                  <span key={word} style={{
                    display: 'block',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    WebkitTextStroke: '1.5px rgba(240,239,233,0.6)',
                  }}>
                    {word}
                  </span>
                ))}
                {/* Filled accent word — the signature */}
                <span style={{
                  display: 'block',
                  color: '#22c55e',
                  WebkitTextFillColor: '#22c55e',
                  WebkitTextStroke: '0px',
                }}>
                  heading.
                </span>
              </h1>

              <p style={{
                color: 'rgba(240,239,233,0.48)',
                fontSize: 'clamp(1rem,1.5vw,1.1rem)',
                lineHeight: 1.7, maxWidth: '34rem',
                marginBottom: '2.5rem',
                animation: 'fadeUp 0.7s cubic-bezier(0.23,1,0.32,1) 0.3s both',
              }}>
                Log spending in one line. Get a plain-English monthly pulse. See your month-end forecast before it&apos;s too late to adjust.
              </p>

              <div style={{
                display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
                animation: 'fadeUp 0.7s cubic-bezier(0.23,1,0.32,1) 0.4s both',
              }}>
                <Link href="/login" className="cta-primary">
                  Get started <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </Link>
                <Link href="/login" className="cta-ghost">
                  Magic link sign-in
                </Link>
              </div>
            </div>

            {/* RIGHT — typewriter demo */}
            <div style={{ animation: 'fadeUp 0.9s cubic-bezier(0.23,1,0.32,1) 0.35s both' }}>
              <TypewriterDemo />
              {/* Mini stat chips */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                gap: '0.75rem', marginTop: '0.875rem',
              }}>
                {[
                  { label: 'Log time', value: '< 5s' },
                  { label: 'No forms', value: 'Ever' },
                  { label: 'Just type', value: '∞' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '0.875rem', padding: '0.875rem', textAlign: 'center',
                  }}>
                    <div style={{ color: '#f0efe9', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.03em' }}>{s.value}</div>
                    <div style={{ color: 'rgba(240,239,233,0.3)', fontSize: '0.62rem', marginTop: 2, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── FEATURES */}
      <section style={{ background: '#f3f1ec', padding: 'clamp(4rem,10vh,7rem) 0', position: 'relative' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 clamp(1.5rem,5vw,4rem)' }}>
          <Reveal>
            <div style={{ marginBottom: 'clamp(3rem,6vh,4.5rem)' }}>
              <div style={{
                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#6b6560', marginBottom: '1rem',
              }}>
                What Penny does
              </div>
              <h2 style={{
                fontSize: 'clamp(1.9rem,4vw,3.25rem)', fontWeight: 800,
                letterSpacing: '-0.035em', lineHeight: '1.05', color: '#1c1917',
              }}>
                Everything you need.{' '}
                <span style={{
                  color: 'transparent', WebkitTextFillColor: 'transparent',
                  WebkitTextStroke: '1.5px #1c1917',
                }}>
                  Nothing you don&apos;t.
                </span>
              </h2>
            </div>
          </Reveal>

          {/* Asymmetric grid — 7/5 split */}
          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: '1.25rem' }}>

            {/* Feature 1 — large card, 7 cols */}
            <Reveal delay={0} style={{ gridColumn: 'span 7' }}>
              <div className="feat-card">
                <div style={{
                  display: 'inline-flex', padding: '0.35rem 0.875rem', borderRadius: '999px',
                  background: 'rgba(217,119,6,0.1)', color: '#d97706',
                  fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
                  marginBottom: '1.5rem',
                }}>
                  ⚡ Quick add
                </div>
                <h3 style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#1c1917', marginBottom: '0.875rem', lineHeight: 1.15 }}>
                  One line.<br />Done.
                </h3>
                <p style={{ color: '#6b6560', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: '38ch', marginBottom: '2rem' }}>
                  Type &ldquo;Deliveroo £18&rdquo; and Penny parses merchant, amount, and category automatically. No dropdowns. No tapping through forms. Just your words.
                </p>
                {/* Mini entry list */}
                <div style={{
                  background: '#1c1917', borderRadius: '0.875rem', padding: '1.25rem 1.5rem',
                  fontFamily: 'var(--font-geist-mono)',
                }}>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,239,233,0.3)', marginBottom: '0.875rem' }}>
                    Recent entries
                  </div>
                  {[
                    { icon: '🍕', text: 'Deliveroo £18', cat: 'Food', amount: '£18.00' },
                    { icon: '☕', text: 'Coffee 4.80', cat: 'Eating out', amount: '£4.80' },
                    { icon: '🛒', text: 'Tesco 43.20', cat: 'Groceries', amount: '£43.20' },
                  ].map((e, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.55rem 0',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>{e.icon}</span>
                      <span style={{ flex: 1, color: 'rgba(240,239,233,0.7)', fontSize: '0.8rem' }}>{e.text}</span>
                      <span style={{ color: 'rgba(240,239,233,0.3)', fontSize: '0.68rem', fontFamily: 'var(--font-geist-sans)' }}>{e.cat}</span>
                      <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-geist-sans)', marginLeft: '0.75rem' }}>{e.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Features 2 + 3 — stacked, 5 cols */}
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <Reveal delay={90} style={{ flex: 1 }}>
                <div className="feat-card">
                  <div style={{
                    display: 'inline-flex', padding: '0.35rem 0.875rem', borderRadius: '999px',
                    background: 'rgba(22,163,74,0.1)', color: '#16a34a',
                    fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
                    marginBottom: '1.25rem',
                  }}>
                    📈 Forecast
                  </div>
                  <h3 style={{ fontSize: 'clamp(1.1rem,2vw,1.35rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#1c1917', marginBottom: '0.6rem', lineHeight: 1.2 }}>
                    Month forecast
                  </h3>
                  <p style={{ color: '#6b6560', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                    Your projected month-end spend based on pace so far, including upcoming subscriptions.
                  </p>
                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#6b6560', fontSize: '0.72rem' }}>£843 spent</span>
                      <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.72rem' }}>£1,240 projected</span>
                    </div>
                    <div style={{ height: 6, background: '#ebe8e1', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '68%', background: 'linear-gradient(90deg, #16a34a, #22c55e)', borderRadius: 999 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                      <span style={{ color: 'rgba(107,101,96,0.55)', fontSize: '0.65rem' }}>1 Apr</span>
                      <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.65rem' }}>← Day 18</span>
                      <span style={{ color: 'rgba(107,101,96,0.55)', fontSize: '0.65rem' }}>30 Apr</span>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={180} style={{ flex: 1 }}>
                <div className="feat-card">
                  <div style={{
                    display: 'inline-flex', padding: '0.35rem 0.875rem', borderRadius: '999px',
                    background: 'rgba(13,148,136,0.1)', color: '#0d9488',
                    fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
                    marginBottom: '1.25rem',
                  }}>
                    💬 Insights
                  </div>
                  <h3 style={{ fontSize: 'clamp(1.1rem,2vw,1.35rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#1c1917', marginBottom: '0.6rem', lineHeight: 1.2 }}>
                    Plain English pulse
                  </h3>
                  <p style={{ color: '#6b6560', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                    What changed, in plain English — not another wall of charts.
                  </p>
                  {/* Mock pulse */}
                  <div style={{
                    background: '#f8f6f2', border: '1px solid #e4e0d8',
                    borderLeft: '3px solid #0d9488',
                    borderRadius: '0 0.625rem 0.625rem 0',
                    padding: '0.875rem',
                    fontSize: '0.8rem', color: '#44403c', lineHeight: 1.65,
                    fontStyle: 'italic',
                  }}>
                    &ldquo;You&apos;re 12% over budget this week — mostly eating out (£68). Subscriptions renew Sunday.&rdquo;
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── HOW IT WORKS */}
      <section style={{ background: '#ffffff', padding: 'clamp(4rem,10vh,7rem) 0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 clamp(1.5rem,5vw,4rem)' }}>
          <Reveal>
            <div style={{ marginBottom: 'clamp(3rem,6vh,4.5rem)' }}>
              <div style={{
                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#6b6560', marginBottom: '1rem',
              }}>
                How it works
              </div>
              <h2 style={{
                fontSize: 'clamp(1.9rem,4vw,3.25rem)', fontWeight: 800,
                letterSpacing: '-0.035em', lineHeight: '1.05', color: '#1c1917',
              }}>
                Three steps to clarity.
              </h2>
            </div>
          </Reveal>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(2rem,5vw,4rem)' }}>
            {[
              {
                num: '01',
                title: 'Log it',
                desc: 'Type anything natural — "Tesco £43" or "Spotify 9.99". Penny parses merchant, amount, and category from plain text, instantly.',
              },
              {
                num: '02',
                title: 'Read it',
                desc: 'Your weekly and monthly pulse in plain English. What you spent, where it went, what changed from last week. No charts required.',
              },
              {
                num: '03',
                title: 'Plan it',
                desc: "A month-end projection based on your current pace. Know before the month ends if you're on track — not after.",
              },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 85}>
                <div>
                  {/* Big outlined step number */}
                  <div style={{
                    fontSize: 'clamp(3.5rem,7vw,6rem)', fontWeight: 800,
                    letterSpacing: '-0.05em', lineHeight: 1,
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent',
                    WebkitTextStroke: '1.5px #e4e0d8',
                    marginBottom: '1.25rem', display: 'block',
                  }}>
                    {step.num}
                  </div>
                  <h3 style={{
                    fontSize: 'clamp(1.15rem,2vw,1.4rem)', fontWeight: 800,
                    letterSpacing: '-0.03em', color: '#1c1917', marginBottom: '0.65rem',
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#6b6560', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── FOOTER CTA */}
      <section style={{
        background: '#0d0d0c',
        padding: 'clamp(5rem,12vh,9rem) 0',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grain */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.3,
        }} />
        {/* Center glow */}
        <div aria-hidden style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '60vw', height: '60vh', zIndex: 0,
          background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: '64rem', margin: '0 auto',
          padding: '0 clamp(1.5rem,5vw,4rem)',
          textAlign: 'center', position: 'relative', zIndex: 1,
        }}>
          <Reveal>
            <div style={{
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'rgba(34,197,94,0.6)',
              marginBottom: '1.75rem',
            }}>
              Get started today
            </div>

            {/* Giant outlined PENNY wordmark — the signature destination */}
            <div
              aria-hidden
              style={{
                fontSize: 'clamp(4rem,14vw,10rem)', fontWeight: 800,
                letterSpacing: '-0.05em', lineHeight: 0.85,
                textTransform: 'uppercase',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                WebkitTextStroke: '1.5px rgba(240,239,233,0.1)',
                marginBottom: '1.75rem',
                userSelect: 'none',
                display: 'block',
              }}
            >
              PENNY
            </div>

            <p style={{
              color: 'rgba(240,239,233,0.5)',
              fontSize: 'clamp(1rem,2vw,1.2rem)',
              lineHeight: 1.7, maxWidth: '36ch',
              margin: '0 auto 2.75rem',
            }}>
              Your money, finally clear. Start free — no credit card, no friction.
            </p>

            <Link href="/login" className="cta-primary" style={{ fontSize: '1rem', padding: '1rem 2.25rem' }}>
              Start for free <ArrowRight style={{ width: '1.1rem', height: '1.1rem' }} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────── FOOTER */}
      <footer className="footer-bar" style={{
        background: '#0d0d0c',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '1.75rem clamp(1.5rem,5vw,4rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div style={{
            width: '1.25rem', height: '1.25rem', background: '#22c55e',
            borderRadius: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles style={{ width: '0.625rem', height: '0.625rem', color: '#0d0d0c' }} />
          </div>
          <span style={{ color: 'rgba(240,239,233,0.4)', fontSize: '0.82rem', fontWeight: 500, letterSpacing: '-0.01em' }}>Penny</span>
        </div>
        <div style={{ color: 'rgba(240,239,233,0.22)', fontSize: '0.75rem' }}>
          Built with Next.js · Supabase · Resend
        </div>
      </footer>
    </div>
  )
}
