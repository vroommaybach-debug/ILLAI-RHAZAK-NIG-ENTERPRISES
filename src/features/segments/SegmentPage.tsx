import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import { useAppData } from '../../app/storeProvider';
import { Button, Card, Eyebrow, Section } from '../../components/ui';
import { SEGMENT_CONFIGS } from '../../content/segments';
import { formatNgnFromKobo } from '../../lib/money';
import { buildSegmentWhatsAppUrl } from '../../lib/whatsapp';

export const SegmentPage: React.FC<{
  segmentId: 'schools' | 'bulk' | 'delivery' | 'international';
}> = ({ segmentId }) => {
  const { siteSettings, submitSegmentLead } = useAppData();
  const config = SEGMENT_CONFIGS[segmentId];

  const [organizationName, setOrganizationName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState(
    segmentId === 'international' ? 'Ghana' : 'Nigeria'
  );
  const [stateRegion, setStateRegion] = useState('Lagos');
  const [quantities, setQuantities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const whatsappUrl = buildSegmentWhatsAppUrl(
    config.whatsappSegment,
    siteSettings.whatsappNumber
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (contactName.trim().length < 2 || phone.trim().length < 6 || requirements.trim().length < 3) {
      setFormError('Please provide your name, phone number, and hardware requirements.');
      return;
    }

    const created = await submitSegmentLead({
      segment: segmentId,
      organizationName: organizationName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      country: country.trim(),
      state: stateRegion.trim(),
      quantities: quantities.trim(),
      requirements: requirements.trim(),
    });

    setSubmittedLeadId(created.id);
    setOrganizationName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setQuantities('');
    setRequirements('');
  };

  return (
    <div className="space-y-4">
      <Section>
        <div className="space-y-8">
          {/* Segment Hero */}
          <div className="space-y-4 max-w-3xl">
            <Eyebrow>{config.eyebrow}</Eyebrow>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F4F6FB]">
              {config.title}
            </h1>
            <p className="text-base sm:text-lg text-[#9AA3B8] leading-relaxed">
              {config.subtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#2563FF] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#1D4ED8] shadow-[0_0_25px_rgba(37,99,255,0.35)]"
              >
                {config.primaryCtaLabel}
              </a>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-[#0F1524] px-6 py-3.5 text-sm font-semibold text-[#F4F6FB] hover:border-[#38BDF8]"
              >
                Browse Eligible Machines
              </Link>
            </div>
          </div>

          {/* Mandatory Trust Strip per A9: Brand New, Warranty Per Product, Returns Policy Link */}
          <div className="rounded-2xl border border-white/10 bg-[#0A0E18] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#9AA3B8]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#38BDF8]" />
              <span className="font-semibold text-[#F4F6FB]">
                100% Brand-New Factory Sealed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#F5B93A]" />
              <span>
                Warranty Attached Per Individual Product & Serial Number
              </span>
            </div>
            <Link
              to="/policies/returns"
              className="font-semibold text-[#38BDF8] hover:underline"
            >
              Read Returns & DOA Inspection Policy →
            </Link>
          </div>

          {/* Proof Slot & Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config.highlights.map((h) => (
              <Card key={h.label} className="space-y-2">
                <p className="text-xs font-semibold text-[#F5B93A] font-display">
                  {h.label}
                </p>
                <p className="font-mono-tabular text-lg font-bold text-[#F4F6FB]">
                  {h.value}
                </p>
                <p className="text-xs text-[#9AA3B8]">{h.detail}</p>
              </Card>
            ))}
          </div>

          {/* Live Delivery Zones Table from Settings on /delivery per A9 */}
          {segmentId === 'delivery' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Eyebrow>Live Store Settings (`settings/site.deliveryZones`)</Eyebrow>
                <h2 className="font-display text-2xl font-bold text-[#F4F6FB]">
                  Published Delivery Zones, Fees & Estimated Timelines
                </h2>
              </div>

              <div className="ir-card-elevated overflow-hidden divide-y divide-white/10">
                {siteSettings.deliveryZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-[#38BDF8]" />
                        <span className="font-display text-base font-bold text-[#F4F6FB]">
                          {zone.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#9AA3B8]">{zone.notes}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="font-mono-tabular text-lg font-bold text-[#F5B93A]">
                        {formatNgnFromKobo(zone.feeKobo)}
                      </p>
                      <p className="text-xs text-[#38BDF8]">{zone.etaDays}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bundles or Volume Tiers */}
          {config.bundlesOrTiers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.bundlesOrTiers.map((b) => (
                <Card key={b.name} elevated className="space-y-3">
                  <Eyebrow>{b.idealFor}</Eyebrow>
                  <h2 className="font-display text-xl font-bold text-[#F4F6FB]">
                    {b.name}
                  </h2>
                  <p className="text-sm text-[#9AA3B8]">{b.composition}</p>
                  <p className="text-xs text-[#38BDF8] pt-2 border-t border-white/10">
                    {b.tierNote}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Proof Banner */}
          <Card className="p-6 border-[#2563FF]/30 bg-[#0F1524]/70 space-y-2">
            <p className="font-display text-sm font-bold text-[#F4F6FB]">
              {config.proofHeadline}
            </p>
            <p className="text-xs text-[#9AA3B8]">{config.proofNote}</p>
          </Card>

          {/* Lead Capture Form writing to leads collection per Phase 6 */}
          <Card elevated className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <Eyebrow>Direct Inquiry & Pro-Forma Request</Eyebrow>
              <h2 className="font-display text-2xl font-bold text-[#F4F6FB]">
                {config.formTitle}
              </h2>
              <p className="text-xs text-[#9AA3B8]">{config.formSubtitle}</p>
            </div>

            {submittedLeadId && (
              <div
                role="status"
                className="rounded-xl border border-[#38BDF8]/50 bg-[#2563FF]/15 p-4 text-xs text-[#F4F6FB] space-y-1"
              >
                <p className="font-bold text-sm text-[#38BDF8]">
                  Inquiry Logged (Reference: {submittedLeadId})
                </p>
                <p>
                  Your request has been saved to our institutional desk. You can also click the WhatsApp button above for immediate live chat.
                </p>
              </div>
            )}

            {formError && (
              <p role="alert" className="text-xs text-[#EF2B3A]">
                {formError}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="lead-org"
                    className="block text-xs font-medium text-[#9AA3B8] mb-1"
                  >
                    School / Company / Institution Name
                  </label>
                  <input
                    id="lead-org"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Lagoon Secondary School / Zenith Logistics"
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lead-contact"
                    className="block text-xs font-medium text-[#9AA3B8] mb-1"
                  >
                    Contact Person Name *
                  </label>
                  <input
                    id="lead-contact"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="lead-phone"
                    className="block text-xs font-medium text-[#9AA3B8] mb-1"
                  >
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    id="lead-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0803..."
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lead-email"
                    className="block text-xs font-medium text-[#9AA3B8] mb-1"
                  >
                    Official Email
                  </label>
                  <input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="procurement@org.ng"
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lead-location"
                    className="block text-xs font-medium text-[#9AA3B8] mb-1"
                  >
                    {segmentId === 'international'
                      ? 'Destination Country *'
                      : 'Delivery State *'}
                  </label>
                  <input
                    id="lead-location"
                    type="text"
                    required
                    value={segmentId === 'international' ? country : stateRegion}
                    onChange={(e) =>
                      segmentId === 'international'
                        ? setCountry(e.target.value)
                        : setStateRegion(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lead-req"
                  className="block text-xs font-medium text-[#9AA3B8] mb-1"
                >
                  Hardware Models & Approximate Quantities *
                </label>
                <textarea
                  id="lead-req"
                  rows={3}
                  required
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g. 15× Lenovo ThinkPad E14 Gen 5, 1× HP LaserJet Pro 4003dn, and 1× Canon DR-C240 Scanner..."
                  className="w-full rounded-xl border border-white/15 bg-[#05070D] px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <Button type="submit" variant="primary" size="md">
                Submit Hardware Inquiry
              </Button>
            </form>
          </Card>
        </div>
      </Section>
    </div>
  );
};
