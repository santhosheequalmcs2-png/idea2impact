import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Check
} from 'lucide-react';
import { soundFx } from '../services/soundFx';

export default function OnboardingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: 'Assemble Your Dream Team',
      subtitle: 'From Prototype to Production',
      desc: 'Connect directly with vetted hardware builders, CAD mechanical specialists, full-stack software engineers, and registered patent attorneys.',
      icon: Users,
      color: 'cyan',
      tag: 'STEP 1 · TALENT NETWORK'
    },
    {
      title: 'Smart AI Ecosystem Match',
      subtitle: 'Synergy-Driven Partnerships',
      desc: 'Our deterministic matchmaking algorithms pair founders with complementary partners based on technical disciplines, seeking capital, and venture sectors.',
      icon: Sparkles,
      color: 'purple',
      tag: 'STEP 2 · AI CO-FOUNDERS'
    },
    {
      title: 'Micro-Backing & Deal Room Capital',
      subtitle: 'Community Pledges & Syndicate Rounds',
      desc: 'Unlock micro-backing from early supporters and execute bilateral Mutual NDAs (v2.4) to share confidential BOM pricing, unit economics, and CAD files.',
      icon: DollarSign,
      color: 'emerald',
      tag: 'STEP 3 · SECURE CAPITAL'
    },
    {
      title: 'Protect & Submit Inventions',
      subtitle: 'Cryptographic IP Registration',
      desc: 'Anchor your inventive disclosure with SHA-256 cryptographic timestamps and publish concepts to a global network of accredited investors and buyers.',
      icon: ShieldCheck,
      color: 'gold',
      tag: 'STEP 4 · PROVABLE OWNERSHIP'
    }
  ];

  if (!isOpen) return null;

  const currentSlide = slides[step];
  const IconComponent = currentSlide.icon;

  const handleNext = () => {
    soundFx.playTap();
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    soundFx.playTap();
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = () => {
    soundFx.playSuccess();
    try {
      localStorage.setItem('i2i_onboarding_done', 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleComplete}>
      <div className="modal-box onboarding-modal-shell" onClick={e => e.stopPropagation()}>
        <button className="onboarding-close-btn" onClick={handleComplete}>
          <X size={18} />
        </button>

        <div className="onboarding-slide-content">
          <div className={`onboarding-icon-crest crest-${currentSlide.color}`}>
            <IconComponent size={38} />
          </div>

          <span className="onboarding-step-tag">{currentSlide.tag}</span>
          <h2 className="onboarding-title">{currentSlide.title}</h2>
          <h3 className="onboarding-subtitle">{currentSlide.subtitle}</h3>
          <p className="onboarding-desc">{currentSlide.desc}</p>

          {/* Stepper Dots */}
          <div className="onboarding-dots-row">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`onboarding-dot ${idx === step ? 'active' : idx < step ? 'passed' : ''}`}
                onClick={() => {
                  soundFx.playTap();
                  setStep(idx);
                }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="onboarding-actions-row">
            {step > 0 ? (
              <button className="btn btn-outline small" onClick={handleBack}>
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <button className="btn btn-ghost small" onClick={handleComplete}>
                Skip intro
              </button>
            )}

            <button className="btn btn-primary small next-step-btn" onClick={handleNext}>
              {step === slides.length - 1 ? (
                <>
                  <span>Get Started</span> <Check size={14} />
                </>
              ) : (
                <>
                  <span>Continue</span> <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
