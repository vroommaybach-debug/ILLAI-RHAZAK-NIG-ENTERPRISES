import React from 'react';
import { useAppData } from '../../app/storeProvider';
import {
  Button,
  Card,
  Eyebrow,
  GemMark,
  Marquee,
  ProductImageStage,
  Section,
  Tag,
} from '../../components/ui';
import { shouldReduceMotion } from '../../lib/motion';

export const StyleguidePage: React.FC = () => {
  const { themeSettings, siteSettings } = useAppData();
  const isReduced = shouldReduceMotion(themeSettings.motion.level);

  const colorTokens = [
    { name: 'Ink (--color-ink)', value: themeSettings.colors.ink },
    { name: 'Surface (--color-surface)', value: themeSettings.colors.surface },
    { name: 'Elevated (--color-surface-elevated)', value: themeSettings.colors.surfaceElevated },
    { name: 'Text (--color-text)', value: themeSettings.colors.text },
    { name: 'Muted (--color-text-muted)', value: themeSettings.colors.textMuted },
    { name: 'Primary Blue (--color-primary-blue)', value: themeSettings.colors.primaryBlue },
    { name: 'Highlight Blue (--color-highlight-blue)', value: themeSettings.colors.highlightBlue },
    { name: 'Signal Red (--color-signal-red)', value: themeSettings.colors.signalRed },
    { name: 'Accent Gold (--color-accent-gold)', value: themeSettings.colors.accentGold },
  ];

  return (
    <div className="space-y-4">
      <Section>
        <div className="space-y-4">
          <Eyebrow>Phase 1 · Design System & Token Architecture</Eyebrow>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
            {siteSettings.businessName} Design System
          </h1>
          <p className="text-sm sm:text-base text-[#9AA3B8] max-w-2xl">
            Live CSS custom properties, fluid typography, conic gem mark, hardware image stages, and reduced-motion guards.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#9AA3B8] pt-2">
            <span>Theme Version: v{themeSettings.version}</span>
            <span aria-hidden="true">·</span>
            <span>Motion Level: {themeSettings.motion.level}</span>
            <span aria-hidden="true">·</span>
            <span>Reduced Motion Active: {isReduced ? 'Yes (Opacity-Only)' : 'No (Full GSAP)'}</span>
          </div>
        </div>
      </Section>

      <Marquee
        items={[
          'SPACE GROTESK DISPLAY',
          'INTER BODY PROSE',
          'JETBRAINS MONO TABULAR',
          '22PX CARD RADIUS',
          '999PX PILL BUTTONS',
          'REDUCED MOTION GUARDED',
        ]}
      />

      {/* Palette Swatches */}
      <Section>
        <div className="space-y-6">
          <Eyebrow>01. Brand Palette Tokens</Eyebrow>
          <h2 className="font-display text-2xl font-bold">CSS Custom Property Swatches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorTokens.map((t) => (
              <Card key={t.name} className="flex items-center gap-4 p-4">
                <div
                  className="h-12 w-12 rounded-xl border border-white/20 shrink-0"
                  style={{ backgroundColor: t.value }}
                />
                <div>
                  <p className="text-sm font-semibold text-[#F4F6FB]">{t.name}</p>
                  <p className="font-mono-tabular text-xs text-[#9AA3B8]">{t.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Buttons, Tags, GemMark */}
      <Section>
        <div className="space-y-8">
          <div className="space-y-3">
            <Eyebrow>02. Interactive Primitives</Eyebrow>
            <h2 className="font-display text-2xl font-bold">Buttons, GemMark & Quiet Metadata Tags</h2>
          </div>

          <Card className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#9AA3B8]">Pill Button Variants & Sizes</p>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="lg">
                  Primary Large CTA
                </Button>
                <Button variant="primary" size="md">
                  Primary Medium
                </Button>
                <Button variant="ghost" size="md">
                  Ghost Surface Button
                </Button>
                <Button variant="signal" size="md">
                  Signal Red Action
                </Button>
                <Button variant="gold" size="sm">
                  Accent Gold Small
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <p className="text-xs font-semibold text-[#9AA3B8]">
                Conic Gradient GemMark & Official Shopfront Emblem
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <GemMark size="sm" />
                <GemMark size="md" />
                <GemMark size="lg" />
                <img
                  src="/assets/aistudio/image_c7059637.png"
                  alt="ILLAI-RHASAK Official Emblem"
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-2xl border border-white/15 object-cover"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <p className="text-xs font-semibold text-[#9AA3B8]">
                Zero-Pill Unboxed Metadata Separators
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Tag tone="gold">Brand New Only</Tag>
                <span aria-hidden="true" className="text-[#9AA3B8]">·</span>
                <Tag tone="blue">12-Month Serial Warranty</Tag>
                <span aria-hidden="true" className="text-[#9AA3B8]">·</span>
                <Tag tone="default">7.5% VAT Inclusive</Tag>
                <span aria-hidden="true" className="text-[#9AA3B8]">·</span>
                <Tag tone="red">Low Stock Alert</Tag>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card elevated>
              <Eyebrow>Elevated Surface Card</Eyebrow>
              <h3 className="font-display text-xl font-bold mt-2">
                22px Radius & Hairline Border
              </h3>
              <p className="text-sm text-[#9AA3B8] mt-2">
                Single-elevation depth with 1px hairline border (`rgba(255,255,255,0.09)`).
              </p>
            </Card>
            <ProductImageStage
              alt="Fallback Hardware Studio Stage Demo"
              categoryId="laptops"
              isPlaceholder
              className="h-44"
            />
          </div>
        </div>
      </Section>
    </div>
  );
};
