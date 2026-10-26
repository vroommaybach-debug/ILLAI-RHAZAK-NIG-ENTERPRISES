import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppData } from '../../app/storeProvider';
import { Card, Eyebrow, Section } from '../../components/ui';
import { PolicyDoc } from '../../types';

export const PolicyPage: React.FC = () => {
  const { slug } = useParams<{ slug: PolicyDoc['slug'] }>();
  const { policies, siteSettings } = useAppData();

  const activeSlug: PolicyDoc['slug'] =
    slug && slug in policies ? (slug as PolicyDoc['slug']) : 'warranty';
  const policy = policies[activeSlug];

  const allSlugs: { slug: PolicyDoc['slug']; label: string }[] = [
    { slug: 'warranty', label: 'Warranty' },
    { slug: 'returns', label: 'Returns' },
    { slug: 'shipping', label: 'Shipping' },
    { slug: 'terms', label: 'Terms' },
    { slug: 'privacy', label: 'Privacy' },
    { slug: 'cookies', label: 'Cookies' },
  ];

  return (
    <Section>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Policy Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          {allSlugs.map((item) => (
            <Link
              key={item.slug}
              to={`/policies/${item.slug}`}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeSlug === item.slug
                  ? 'bg-[#2563FF] text-white'
                  : 'bg-[#0A0E18] text-[#9AA3B8] hover:text-white border border-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          <Eyebrow>
            {siteSettings.legalName} · Last Updated: {policy.lastUpdated}
          </Eyebrow>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F4F6FB]">
            {policy.title}
          </h1>
          <p className="text-sm text-[#9AA3B8] leading-relaxed">{policy.summary}</p>
        </div>

        <div className="space-y-4">
          {policy.sections.map((sec) => (
            <Card key={sec.heading} className="space-y-2 p-6">
              <h2 className="font-display text-lg font-bold text-[#F4F6FB]">
                {sec.heading}
              </h2>
              <p className="text-sm text-[#9AA3B8] leading-relaxed">{sec.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
};
