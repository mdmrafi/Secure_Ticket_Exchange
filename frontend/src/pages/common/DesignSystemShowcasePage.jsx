import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Palette,
  Type,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Lock,
  ArrowRight,
  Eye,
  Sliders,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, VerificationStatusBadge } from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Stepper } from '../../components/ui/Stepper.jsx';
import { LoadingSkeleton, TicketCardSkeleton } from '../../components/ui/LoadingSkeleton.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export const DesignSystemShowcasePage = () => {
  const [activeTab, setActiveTab] = useState('components');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [sampleInput, setSampleInput] = useState('Passenger Ticket #781920');
  const [samplePassword, setSamplePassword] = useState('SecurePass123!');
  const [copiedToken, setCopiedToken] = useState(null);

  const colors = [
    { name: 'Primary (Deep Navy)', hex: '#0B1120', tailwind: 'bg-[#0B1120]', text: 'text-white' },
    { name: 'Primary Subtle', hex: '#1E293B', tailwind: 'bg-slate-800', text: 'text-white' },
    { name: 'Accent Blue', hex: '#2563EB', tailwind: 'bg-blue-600', text: 'text-white' },
    { name: 'Success / Verified', hex: '#059669', tailwind: 'bg-emerald-600', text: 'text-white' },
    { name: 'Warning / Review', hex: '#D97706', tailwind: 'bg-amber-600', text: 'text-white' },
    { name: 'Danger / Failed', hex: '#E11D48', tailwind: 'bg-rose-600', text: 'text-white' },
    { name: 'Background Canvas', hex: '#080C14', tailwind: 'bg-[#080C14]', text: 'text-slate-200' },
    { name: 'Surface Panel', hex: '#0F172A', tailwind: 'bg-slate-900', text: 'text-slate-200' },
    { name: 'Border Subtle', hex: '#1E293B', tailwind: 'bg-slate-800', text: 'text-slate-300' },
    { name: 'Text Primary', hex: '#F8FAFC', tailwind: 'bg-slate-100', text: 'text-slate-900' },
    { name: 'Text Secondary', hex: '#94A3B8', tailwind: 'bg-slate-400', text: 'text-slate-900' },
    { name: 'Text Muted', hex: '#64748B', tailwind: 'bg-slate-600', text: 'text-white' },
  ];

  const typography = [
    {
      label: 'Display (36px/40px Bold)',
      element: (
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Exchange Digital Tickets With Confidence
        </p>
      ),
    },
    {
      label: 'Heading 1 (30px Bold)',
      element: (
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Enterprise Asset Marketplace
        </h1>
      ),
    },
    {
      label: 'Heading 2 (24px Bold)',
      element: (
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Suborno Express (Dhaka → Chittagong)
        </h2>
      ),
    },
    {
      label: 'Heading 3 (20px SemiBold)',
      element: (
        <h3 className="text-lg sm:text-xl font-semibold text-white">
          Multi-Layer Cryptographic Verification
        </h3>
      ),
    },
    {
      label: 'Heading 4 (16px SemiBold)',
      element: <h4 className="text-base font-semibold text-white">Escrow Settlement Timeline</h4>,
    },
    {
      label: 'Body (14px Regular)',
      element: (
        <p className="text-sm text-slate-300 leading-relaxed">
          Our automated OCR engine extracts and matches PNR codes, ticket dates, and carriage
          allocations against official transit registries to prevent counterfeit secondary
          transfers.
        </p>
      ),
    },
    {
      label: 'Body Small (12px)',
      element: (
        <p className="text-xs text-slate-400">
          All administrative interventions are cryptographically signed and stored in immutable
          audit logs.
        </p>
      ),
    },
    {
      label: 'Caption / Mono (11px)',
      element: (
        <p className="text-[11px] font-mono text-emerald-400">
          SHA256: 7b841fc8d689694e924...b934ca495
        </p>
      ),
    },
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
              DESIGN SYSTEM SPECIFICATION
            </span>
            <Badge variant="blue" size="sm">
              Figma 1:1 Parity
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Palette className="w-8 h-8 text-blue-500" />
            Component Library & Design Tokens
          </h1>
          <p className="text-xs text-slate-400">
            Interactive catalog of tokens, color palettes, atomic components, and accessibility
            guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/edge-states">
            <Button variant="outline" size="sm">
              View Edge States (13)
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button variant="primary" size="sm">
              Open Marketplace
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'components', label: 'Reusable Components' },
          { id: 'colors', label: 'Color System & Tokens' },
          { id: 'typography', label: 'Typography Scale' },
          { id: 'accessibility', label: 'Accessibility Guarantees' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: COMPONENTS */}
      {activeTab === 'components' && (
        <div className="space-y-12">
          {/* Buttons Section */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" /> Button Variants & States
            </h3>
            <p className="text-xs text-slate-400">
              Interactive buttons with subtle tactile feedback, loading spinners, and disabled
              states.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Primary</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm">
                    Default
                  </Button>
                  <Button variant="primary" size="sm" loading>
                    Loading
                  </Button>
                  <Button variant="primary" size="sm" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Secondary</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">
                    Default
                  </Button>
                  <Button variant="secondary" size="sm" loading>
                    Loading
                  </Button>
                  <Button variant="secondary" size="sm" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Outline</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    Default
                  </Button>
                  <Button variant="outline" size="sm" loading>
                    Loading
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Success</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="success" size="sm">
                    Default
                  </Button>
                  <Button variant="success" size="sm" loading>
                    Loading
                  </Button>
                  <Button variant="success" size="sm" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Danger</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="danger" size="sm">
                    Default
                  </Button>
                  <Button variant="danger" size="sm" loading>
                    Loading
                  </Button>
                  <Button variant="danger" size="sm" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Ghost</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm">
                    Default
                  </Button>
                  <Button variant="ghost" size="sm" disabled>
                    Disabled
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Inputs Section */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" /> Inputs, Search & Password Fields
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Standard Text Input"
                placeholder="Enter text..."
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                helperText="Generic input field with helper text"
              />

              <Input
                type="password"
                label="Password with Toggle"
                placeholder="Enter password..."
                value={samplePassword}
                onChange={(e) => setSamplePassword(e.target.value)}
                helperText="Includes visible eye-toggle button"
              />

              <Input
                label="Input with Error State"
                value="invalid_ticket_id"
                error="Ticket ID must match 10-digit format"
              />
            </div>
          </div>

          {/* Status Badges & Indicators */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Verification Status Badges
              (Color + Icon + Label)
            </h3>
            <p className="text-xs text-slate-400">
              Crucial requirement:{' '}
              <strong className="text-slate-200">
                Never communicate status through color alone.
              </strong>{' '}
              Every badge pairs high-contrast tints with clear iconography and text.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <VerificationStatusBadge status="VERIFIED" />
              <VerificationStatusBadge status="NEEDS_REVIEW" />
              <VerificationStatusBadge status="FAILED" />
              <VerificationStatusBadge status="PENDING" />
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-2 self-center">
                Generic Badges:
              </span>
              <Badge variant="blue">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="purple">Admin</Badge>
              <Badge variant="slate">Neutral</Badge>
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Alert Messages
            </h3>
            <div className="space-y-3">
              <Alert variant="info" title="Identity Protection Protocol Active">
                Sensitive KYC documents and National Identity numbers are cryptographically redacted
                before presentation to buyers or public endpoints.
              </Alert>
              <Alert variant="success" title="Escrow Payment Confirmed">
                Funds in the amount of ৳805 have been locked in the escrow vault. The seller cannot
                claim payout until transfer verification.
              </Alert>
              <Alert variant="warning" title="Ticket Near Departure">
                This journey departs in less than 4 hours. Automated transfer guarantees require
                fast counterparty confirmation.
              </Alert>
              <Alert variant="error" title="Potential Duplicate Detected">
                This document hash matches an existing listing on record. The listing has been
                isolated for compliance inspection.
              </Alert>
            </div>
          </div>

          {/* Stepper Demonstration */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Multi-Step Progress Stepper</h3>
            <Stepper
              steps={[
                { title: 'Personal Info', description: 'Contact & Legal Name' },
                { title: 'Document Type', description: 'NID or Passport' },
                { title: 'Live OCR Scan', description: 'Machine Extraction' },
                { title: 'Result', description: 'Instant Clearance' },
              ]}
              currentStep={2}
            />
          </div>

          {/* Modal Trigger Preview */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Accessible Dialog / Modal Window</h4>
              <p className="text-xs text-slate-400">
                Backdrop blur, focus containment, and Escape-key listener.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setDemoModalOpen(true)}>
              Open Sample Modal
            </Button>
          </div>

          {/* Skeletons Preview */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Loading Skeletons</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TicketCardSkeleton />
              <TicketCardSkeleton />
              <TicketCardSkeleton />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COLORS & TOKENS */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="text-base font-bold text-white">Fintech & Security Color Tokens</h3>
            <p className="text-xs text-slate-400">
              Curated palette designed for trust, high contrast, and accessibility. Click any token
              to copy its hex value.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => copyToClipboard(c.hex)}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition flex flex-col justify-between h-36"
              >
                <div className={`w-full h-12 rounded-lg ${c.tailwind} border border-white/10`} />
                <div>
                  <div className="text-xs font-bold text-white">{c.name}</div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between mt-1">
                    <span>{c.hex}</span>
                    <span className="text-blue-400 hover:underline flex items-center gap-0.5">
                      {copiedToken === c.hex ? 'Copied!' : <Copy className="w-3 h-3" />}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TYPOGRAPHY */}
      {activeTab === 'typography' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-8">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-blue-400" /> Typography Hierarchy (Inter & Geist UI)
            </h3>
            <p className="text-xs text-slate-400">
              High legibility system font pairing tuned for tabular numbers, OCR codes, and
              financial disclosures.
            </p>
          </div>

          <div className="space-y-6">
            {typography.map((item, idx) => (
              <div key={idx} className="pb-6 border-b border-slate-800/60 last:border-0 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <div>{item.element}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACCESSIBILITY */}
      {activeTab === 'accessibility' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Accessibility & Compliance
              Standards
            </h3>
            <p className="text-xs text-slate-400">
              WCAG 2.1 AA compliant contrast ratios, keyboard navigability, and multi-modal
              feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Color Independence Rule
              </h4>
              <p>
                Status information is never communicated via color alone. Every verification state,
                alert, and badge includes a distinctive semantic icon (✓, ⚠, ✕) and explicit text
                label.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Focus Rings & Touch Targets
              </h4>
              <p>
                Interactive controls feature visible 2px focus rings (`focus-visible:ring-2
                focus-visible:ring-blue-500`) and meet minimum 44×44px touch targets on mobile
                devices.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Screen Reader ARIA Semantics
              </h4>
              <p>
                Modals trap focus with `role="dialog"`, alerts provide `role="alert"`, and progress
                steppers announce live stage transitions to assistive technology.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Data Privacy Redaction
              </h4>
              <p>
                National IDs and PNRs are masked by default (`•••• 9012`). Sensitive personal
                information is never exposed across unauthenticated or public API payloads.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sample Modal */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Sample Accessible Modal"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            This dialog satisfies all accessibility requirements: aria-modal="true", keyboard trap,
            escape listener, and high contrast backdrop blur.
          </p>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
            Component conforms to the Master Figma Design System specification.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDemoModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => setDemoModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
