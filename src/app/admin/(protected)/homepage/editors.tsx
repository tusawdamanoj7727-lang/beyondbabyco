"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/admin/Icon";
import MediaPicker from "@/components/admin/MediaPicker";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Spinner } from "@/components/admin/LoadingState";
import {
  ArrayEditor,
  AreaField,
  Checkbox,
  IconBtn,
  NumberField,
  OrderedSelect,
  SectionShell,
  SelectField,
  TextField,
  useSaver,
} from "./parts";
import {
  createHeroSlide,
  createTestimonial,
  deleteHeroSlide,
  deleteTestimonial,
  reorderHeroSlides,
  reorderTestimonials,
  saveSection,
  saveSettings,
  toggleTestimonialPublished,
  updateHeroSlide,
  updateTestimonial,
  type HeroSlideInput,
  type TestimonialInput,
} from "@/lib/admin/homepage-actions";
import {
  MASCOT_OPTIONS,
  POSE_OPTIONS,
  type CardItem,
  type MascotItem,
  type SectionKey,
  type SettingsKey,
  type TimelineEntry,
} from "@/lib/admin/homepage-schema";
import type { HeroSlide, HomepageAdminData, SelectOption, TestimonialRow } from "@/lib/admin/homepage";

// ============================= Frames =============================

function SettingsFrame<T extends object>({
  settingsKey,
  title,
  description,
  initial,
  children,
}: {
  settingsKey: SettingsKey;
  title: string;
  description?: string;
  initial: T;
  children: (config: T, set: (patch: Partial<T>) => void) => ReactNode;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<T>(initial);
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(initial));
  const saver = useSaver();
  const dirty = JSON.stringify(config) !== snapshot;

  const set = (patch: Partial<T>) => {
    setConfig((c) => ({ ...c, ...patch }));
    saver.setSaved(false);
  };

  const onSave = () => {
    const snap = JSON.stringify(config);
    saver.run(
      () => saveSettings(settingsKey, config as Record<string, unknown>),
      () => {
        setSnapshot(snap);
        router.refresh();
      },
    );
  };

  return (
    <SectionShell
      title={title}
      description={description}
      pending={saver.pending}
      saved={saver.saved}
      error={saver.error}
      dirty={dirty}
      onSave={onSave}
    >
      {children(config, set)}
    </SectionShell>
  );
}

function SectionFrame<T extends object>({
  sectionKey,
  title,
  description,
  initialEnabled,
  initialConfig,
  children,
}: {
  sectionKey: SectionKey;
  title: string;
  description?: string;
  initialEnabled: boolean;
  initialConfig: T;
  children: (config: T, set: (patch: Partial<T>) => void) => ReactNode;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [config, setConfig] = useState<T>(initialConfig);
  const [snapshot, setSnapshot] = useState(() => JSON.stringify({ enabled: initialEnabled, config: initialConfig }));
  const saver = useSaver();
  const dirty = JSON.stringify({ enabled, config }) !== snapshot;

  const set = (patch: Partial<T>) => {
    setConfig((c) => ({ ...c, ...patch }));
    saver.setSaved(false);
  };

  const onSave = () => {
    const snap = JSON.stringify({ enabled, config });
    saver.run(
      () => saveSection(sectionKey, { isEnabled: enabled, config: config as Record<string, unknown> }),
      () => {
        setSnapshot(snap);
        router.refresh();
      },
    );
  };

  return (
    <SectionShell
      title={title}
      description={description}
      enabled={enabled}
      onToggleEnabled={(n) => {
        setEnabled(n);
        saver.setSaved(false);
      }}
      pending={saver.pending}
      saved={saver.saved}
      error={saver.error}
      dirty={dirty}
      onSave={onSave}
    >
      {children(config, set)}
    </SectionShell>
  );
}

function CardArray({
  items,
  onChange,
  label,
}: {
  items: CardItem[];
  onChange: (items: CardItem[]) => void;
  label: string;
}) {
  return (
    <ArrayEditor<CardItem>
      items={items}
      onChange={onChange}
      itemLabel="Card"
      addLabel={`Add ${label}`}
      newItem={() => ({ title: "", description: "" })}
      renderItem={(item, update) => (
        <div className="space-y-3">
          <TextField label="Title" value={item.title} onChange={(v) => update({ title: v })} />
          <AreaField label="Description" value={item.description} onChange={(v) => update({ description: v })} rows={2} />
        </div>
      )}
    />
  );
}

// ============================= Settings editors =============================

export function GeneralEditor({ data }: { data: HomepageAdminData["settings"]["general"] }) {
  return (
    <SettingsFrame settingsKey="general" title="General" description="Site identity and default SEO." initial={data}>
      {(c, set) => (
        <>
          <TextField label="Website name" value={c.websiteName} onChange={(v) => set({ websiteName: v })} required />
          <TextField label="Tagline" value={c.tagline} onChange={(v) => set({ tagline: v })} />
          <TextField label="Default SEO title" value={c.defaultSeoTitle} onChange={(v) => set({ defaultSeoTitle: v })} />
          <AreaField
            label="Default SEO description"
            value={c.defaultSeoDescription}
            onChange={(v) => set({ defaultSeoDescription: v })}
            rows={3}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-semibold text-green-900">OG image</p>
              <MediaPicker label="OG image" value={c.ogImage} onChange={(v) => set({ ogImage: v })} />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-green-900">Favicon</p>
              <MediaPicker label="Favicon" value={c.favicon} onChange={(v) => set({ favicon: v })} />
            </div>
          </div>
        </>
      )}
    </SettingsFrame>
  );
}

export function SeoEditor({ data }: { data: HomepageAdminData["settings"]["seo"] }) {
  return (
    <SettingsFrame settingsKey="seo" title="SEO" description="Homepage search metadata and structured data." initial={data}>
      {(c, set) => (
        <>
          <TextField label="Homepage title" value={c.title} onChange={(v) => set({ title: v })} />
          <AreaField label="Description" value={c.description} onChange={(v) => set({ description: v })} rows={3} />
          <TextField label="Keywords" value={c.keywords} onChange={(v) => set({ keywords: v })} description="Comma-separated." />
          <TextField label="Canonical URL" value={c.canonical} onChange={(v) => set({ canonical: v })} />
          <AreaField
            label="Schema (JSON-LD)"
            value={c.schema}
            onChange={(v) => set({ schema: v })}
            rows={6}
            description="Raw JSON-LD injected into the homepage <head>."
          />
        </>
      )}
    </SettingsFrame>
  );
}

export function FooterEditor({ data }: { data: HomepageAdminData["settings"]["footer"] }) {
  return (
    <SettingsFrame settingsKey="footer" title="Footer" description="Company information, contact and social links." initial={data}>
      {(c, set) => (
        <>
          <AreaField label="Company info" value={c.companyInfo} onChange={(v) => set({ companyInfo: v })} rows={3} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Email" type="email" value={c.email} onChange={(v) => set({ email: v })} />
            <TextField label="Phone" value={c.phone} onChange={(v) => set({ phone: v })} />
          </div>
          <TextField label="Address" value={c.address} onChange={(v) => set({ address: v })} />
          <div>
            <p className="mb-2 text-sm font-semibold text-green-900">Social links</p>
            <ArrayEditor
              items={c.social}
              onChange={(social) => set({ social })}
              itemLabel="Link"
              addLabel="Add social link"
              newItem={() => ({ platform: "", url: "" })}
              renderItem={(item, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Platform" value={item.platform} onChange={(v) => update({ platform: v })} />
                  <TextField label="URL" value={item.url} onChange={(v) => update({ url: v })} />
                </div>
              )}
            />
          </div>
          <TextField label="Copyright" value={c.copyright} onChange={(v) => set({ copyright: v })} />
        </>
      )}
    </SettingsFrame>
  );
}

// ============================= Section editors =============================

export function AnnouncementEditor({ section }: { section: HomepageAdminData["sections"]["announcement"] }) {
  return (
    <SectionFrame
      sectionKey="announcement"
      title="Announcement Bar"
      description="Slim banner shown at the very top of the site."
      initialEnabled={section.isEnabled}
      initialConfig={section.config}
    >
      {(c, set) => (
        <>
          <TextField label="Text" value={c.text} onChange={(v) => set({ text: v })} />
          <TextField label="Link" value={c.link} onChange={(v) => set({ link: v })} placeholder="https://…" />
          <TextField label="Background colour" value={c.background} onChange={(v) => set({ background: v })} placeholder="#0f5132" />
        </>
      )}
    </SectionFrame>
  );
}

export function FeaturedProductsEditor({
  section,
  products,
}: {
  section: HomepageAdminData["sections"]["featured_products"];
  products: SelectOption[];
}) {
  return (
    <SectionFrame
      sectionKey="featured_products"
      title="Featured Products"
      description="Curate which products appear on the homepage."
      initialEnabled={section.isEnabled}
      initialConfig={section.config}
    >
      {(c, set) => (
        <>
          <TextField label="Heading" value={c.heading} onChange={(v) => set({ heading: v })} />
          <NumberField label="Limit" value={c.limit} min={1} max={24} onChange={(v) => set({ limit: v })} />
          <OrderedSelect
            label="Products"
            options={products}
            selected={c.productIds}
            onChange={(productIds) => set({ productIds })}
          />
        </>
      )}
    </SectionFrame>
  );
}

export function BrandPromiseEditor({ section }: { section: HomepageAdminData["sections"]["brand_promise"] }) {
  return (
    <SectionFrame
      sectionKey="brand_promise"
      title="Brand Promise"
      initialEnabled={section.isEnabled}
      initialConfig={section.config}
    >
      {(c, set) => (
        <>
          <TextField label="Heading" value={c.heading} onChange={(v) => set({ heading: v })} />
          <AreaField label="Description" value={c.description} onChange={(v) => set({ description: v })} rows={3} />
          <div>
            <p className="mb-2 text-sm font-semibold text-green-900">Promise cards</p>
            <CardArray items={c.cards} onChange={(cards) => set({ cards })} label="card" />
          </div>
        </>
      )}
    </SectionFrame>
  );
}

export function ScienceEditor({ section }: { section: HomepageAdminData["sections"]["science"] }) {
  return (
    <SectionFrame sectionKey="science" title="Science Section" initialEnabled={section.isEnabled} initialConfig={section.config}>
      {(c, set) => (
        <>
          <TextField label="Heading" value={c.heading} onChange={(v) => set({ heading: v })} />
          <AreaField label="Description" value={c.description} onChange={(v) => set({ description: v })} rows={3} />
          <div>
            <p className="mb-1.5 text-sm font-semibold text-green-900">Image</p>
            <MediaPicker label="Science image" value={c.imageUrl} onChange={(v) => set({ imageUrl: v })} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-green-900">Feature cards</p>
            <CardArray items={c.features} onChange={(features) => set({ features })} label="feature" />
          </div>
        </>
      )}
    </SectionFrame>
  );
}

export function LifestyleEditor({ section }: { section: HomepageAdminData["sections"]["lifestyle"] }) {
  return (
    <SectionFrame sectionKey="lifestyle" title="Lifestyle" initialEnabled={section.isEnabled} initialConfig={section.config}>
      {(c, set) => (
        <>
          <TextField label="Heading" value={c.heading} onChange={(v) => set({ heading: v })} />
          <AreaField label="Description" value={c.description} onChange={(v) => set({ description: v })} rows={3} />
          <div>
            <p className="mb-1.5 text-sm font-semibold text-green-900">Image</p>
            <MediaPicker label="Lifestyle image" value={c.imageUrl} onChange={(v) => set({ imageUrl: v })} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-green-900">Cards</p>
            <CardArray items={c.cards} onChange={(cards) => set({ cards })} label="card" />
          </div>
        </>
      )}
    </SectionFrame>
  );
}

export function MascotsEditor({ section }: { section: HomepageAdminData["sections"]["mascots"] }) {
  return (
    <SectionFrame sectionKey="mascots" title="Mascots" initialEnabled={section.isEnabled} initialConfig={section.config}>
      {(c, set) => (
        <>
          <TextField label="Heading" value={c.heading} onChange={(v) => set({ heading: v })} />
          <div>
            <p className="mb-2 text-sm font-semibold text-green-900">Mascots</p>
            <ArrayEditor<MascotItem>
              items={c.items}
              onChange={(items) => set({ items })}
              itemLabel="Mascot"
              addLabel="Add mascot"
              newItem={() => ({ mascot: "bella-bunny", pose: "default", description: "", visible: true })}
              renderItem={(item, update) => (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField
                      label="Mascot"
                      value={item.mascot}
                      onChange={(v) => update({ mascot: v as MascotItem["mascot"] })}
                      options={MASCOT_OPTIONS}
                    />
                    <SelectField
                      label="Pose"
                      value={item.pose}
                      onChange={(v) => update({ pose: v as MascotItem["pose"] })}
                      options={POSE_OPTIONS.map((p) => ({ value: p, label: p }))}
                    />
                  </div>
                  <AreaField label="Description" value={item.description} onChange={(v) => update({ description: v })} rows={2} />
                  <Checkbox
                    label="Visible"
                    checked={item.visible}
                    onChange={(e) => update({ visible: e.target.checked })}
                  />
                </div>
              )}
            />
          </div>
        </>
      )}
    </SectionFrame>
  );
}

export function ResearchTimelineEditor({ section }: { section: HomepageAdminData["sections"]["research_timeline"] }) {
  return (
    <SectionFrame
      sectionKey="research_timeline"
      title="Research Timeline"
      initialEnabled={section.isEnabled}
      initialConfig={section.config}
    >
      {(c, set) => (
        <>
          <TextField label="Heading" value={c.heading} onChange={(v) => set({ heading: v })} />
          <div>
            <p className="mb-2 text-sm font-semibold text-green-900">Timeline entries</p>
            <ArrayEditor<TimelineEntry>
              items={c.entries}
              onChange={(entries) => set({ entries })}
              itemLabel="Entry"
              addLabel="Add entry"
              newItem={() => ({ year: "", title: "", description: "" })}
              renderItem={(item, update) => (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
                    <TextField label="Year" value={item.year} onChange={(v) => update({ year: v })} />
                    <TextField label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                  </div>
                  <AreaField label="Description" value={item.description} onChange={(v) => update({ description: v })} rows={2} />
                </div>
              )}
            />
          </div>
        </>
      )}
    </SectionFrame>
  );
}

export function NewsletterEditor({ section }: { section: HomepageAdminData["sections"]["newsletter"] }) {
  return (
    <SectionFrame sectionKey="newsletter" title="Newsletter" initialEnabled={section.isEnabled} initialConfig={section.config}>
      {(c, set) => (
        <>
          <TextField label="Heading" value={c.heading} onChange={(v) => set({ heading: v })} />
          <AreaField label="Description" value={c.description} onChange={(v) => set({ description: v })} rows={3} />
          <TextField label="Button text" value={c.buttonText} onChange={(v) => set({ buttonText: v })} />
        </>
      )}
    </SectionFrame>
  );
}

// ============================= Hero (composite) =============================

export function HeroEditor({
  section,
  slides,
}: {
  section: HomepageAdminData["sections"]["hero"];
  slides: HeroSlide[];
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(section.isEnabled);
  const saver = useSaver();
  const adder = useSaver();

  const toggle = (next: boolean) => {
    setEnabled(next);
    saver.run(() => saveSection("hero", { isEnabled: next, config: {} }), () => router.refresh());
  };

  const reorder = (ids: string[]) => adder.run(() => reorderHeroSlides(ids), () => router.refresh());

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-4xl border border-cream-300 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-green-900">Hero</h2>
          <p className="mt-0.5 text-sm text-green-700/60">Manage hero slides shown at the top of the homepage.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-sm font-medium text-green-900">
            <input type="checkbox" className="h-4 w-4 rounded border-cream-300 accent-green-600" checked={enabled} onChange={(e) => toggle(e.target.checked)} />
            {enabled ? "Enabled" : "Disabled"}
          </label>
          <Button
            type="button"
            size="sm"
            leftIcon={adder.pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : <Icon name="plus" size={16} />}
            disabled={adder.pending}
            onClick={() => adder.run(() => createHeroSlide(), () => router.refresh())}
          >
            Add slide
          </Button>
        </div>
      </div>

      {slides.length === 0 ? (
        <p className="rounded-4xl border border-dashed border-cream-300 bg-cream-50 px-4 py-10 text-center text-sm text-green-700/50">
          No hero slides yet. Add your first slide to get started.
        </p>
      ) : (
        slides.map((slide, index) => (
          <HeroSlideCard
            key={slide.id}
            slide={slide}
            index={index}
            count={slides.length}
            onMove={(dir) => {
              const ids = slides.map((s) => s.id);
              const target = index + dir;
              if (target < 0 || target >= ids.length) return;
              [ids[index], ids[target]] = [ids[target], ids[index]];
              reorder(ids);
            }}
          />
        ))
      )}
    </section>
  );
}

function HeroSlideCard({
  slide,
  index,
  count,
  onMove,
}: {
  slide: HeroSlide;
  index: number;
  count: number;
  onMove: (dir: number) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<HeroSlideInput>({
    title: slide.title,
    subtitle: slide.subtitle,
    description: slide.description,
    imageUrl: slide.imageUrl,
    backgroundUrl: slide.backgroundUrl,
    overlay: slide.overlay,
    ctaLabel: slide.ctaLabel,
    ctaUrl: slide.ctaUrl,
    secondaryCtaLabel: slide.secondaryCtaLabel,
    secondaryCtaUrl: slide.secondaryCtaUrl,
    isActive: slide.isActive,
  });
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(form));
  const [confirm, setConfirm] = useState(false);
  const saver = useSaver();
  const remover = useSaver();
  const dirty = JSON.stringify(form) !== snapshot;
  const set = (patch: Partial<HeroSlideInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    saver.setSaved(false);
  };

  return (
    <div className="rounded-4xl border border-cream-300 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-cream-200 p-4">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-green-900">Slide {index + 1}</span>
          {!form.isActive && <Badge variant="default" size="sm">Hidden</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <Icon name="chevronDown" size={16} className="rotate-180" />
          </IconBtn>
          <IconBtn label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
            <Icon name="chevronDown" size={16} />
          </IconBtn>
          <IconBtn label="Delete slide" onClick={() => setConfirm(true)}>
            <Icon name="close" size={16} />
          </IconBtn>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <TextField label="Headline" value={form.title} onChange={(v) => set({ title: v })} />
        <TextField label="Subheading" value={form.subtitle} onChange={(v) => set({ subtitle: v })} />
        <AreaField label="Description" value={form.description} onChange={(v) => set({ description: v })} rows={2} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Primary button label" value={form.ctaLabel} onChange={(v) => set({ ctaLabel: v })} />
          <TextField label="Primary button URL" value={form.ctaUrl} onChange={(v) => set({ ctaUrl: v })} />
          <TextField label="Secondary button label" value={form.secondaryCtaLabel} onChange={(v) => set({ secondaryCtaLabel: v })} />
          <TextField label="Secondary button URL" value={form.secondaryCtaUrl} onChange={(v) => set({ secondaryCtaUrl: v })} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-green-900">Hero image</p>
            <MediaPicker label="Hero image" value={form.imageUrl} onChange={(v) => set({ imageUrl: v })} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-green-900">Background</p>
            <MediaPicker label="Background" value={form.backgroundUrl} onChange={(v) => set({ backgroundUrl: v })} />
          </div>
        </div>

        <NumberField label="Overlay opacity (%)" value={form.overlay} min={0} max={100} onChange={(v) => set({ overlay: v })} />
        <Checkbox
          label="Slide visible"
          description="Disable to keep the slide but hide it from the homepage."
          checked={form.isActive}
          onChange={(e) => set({ isActive: e.target.checked })}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-cream-200 p-4">
        <p className="text-sm" aria-live="polite">
          {saver.error ? (
            <span className="font-medium text-terra-600">{saver.error}</span>
          ) : saver.saved ? (
            <span className="font-medium text-green-600">Saved.</span>
          ) : dirty ? (
            <span className="text-green-700/50">Unsaved changes</span>
          ) : (
            <span className="text-green-700/40">Up to date</span>
          )}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={saver.pending || !dirty}
          leftIcon={saver.pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : undefined}
          onClick={() => {
            const snap = JSON.stringify(form);
            saver.run(() => updateHeroSlide(slide.id, form), () => {
              setSnapshot(snap);
              router.refresh();
            });
          }}
        >
          Save slide
        </Button>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete this slide?"
        description="This permanently removes the hero slide."
        confirmLabel="Delete"
        tone="danger"
        loading={remover.pending}
        onConfirm={() => remover.run(() => deleteHeroSlide(slide.id), () => {
          setConfirm(false);
          router.refresh();
        })}
      />
    </div>
  );
}

// ============================= Testimonials (composite) =============================

export function TestimonialsEditor({
  section,
  testimonials,
}: {
  section: HomepageAdminData["sections"]["testimonials"];
  testimonials: TestimonialRow[];
}) {
  const router = useRouter();
  const adder = useSaver();

  const reorder = (ids: string[]) => adder.run(() => reorderTestimonials(ids), () => router.refresh());

  return (
    <div className="space-y-5">
      <SectionFrame
        sectionKey="testimonials"
        title="Testimonials"
        description="Section heading and visibility."
        initialEnabled={section.isEnabled}
        initialConfig={section.config}
      >
        {(c, set) => (
          <>
            <TextField label="Heading" value={c.heading} onChange={(v) => set({ heading: v })} />
            <AreaField label="Description" value={c.description} onChange={(v) => set({ description: v })} rows={2} />
          </>
        )}
      </SectionFrame>

      <div className="flex items-center justify-between rounded-4xl border border-cream-300 bg-white p-5 shadow-card">
        <div>
          <h3 className="font-heading font-bold text-green-900">Testimonial entries</h3>
          <p className="mt-0.5 text-sm text-green-700/60">Only published testimonials appear on the site.</p>
        </div>
        <Button
          type="button"
          size="sm"
          leftIcon={adder.pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : <Icon name="plus" size={16} />}
          disabled={adder.pending}
          onClick={() =>
            adder.run(
              () => createTestimonial({ name: "New parent", city: "", rating: 5, text: "Edit this testimonial…", avatarUrl: "", isPublished: false }),
              () => router.refresh(),
            )
          }
        >
          Add testimonial
        </Button>
      </div>

      {testimonials.length === 0 ? (
        <p className="rounded-4xl border border-dashed border-cream-300 bg-cream-50 px-4 py-10 text-center text-sm text-green-700/50">
          No testimonials yet.
        </p>
      ) : (
        testimonials.map((t, index) => (
          <TestimonialCard
            key={t.id}
            row={t}
            index={index}
            count={testimonials.length}
            onMove={(dir) => {
              const ids = testimonials.map((x) => x.id);
              const target = index + dir;
              if (target < 0 || target >= ids.length) return;
              [ids[index], ids[target]] = [ids[target], ids[index]];
              reorder(ids);
            }}
          />
        ))
      )}
    </div>
  );
}

function TestimonialCard({
  row,
  index,
  count,
  onMove,
}: {
  row: TestimonialRow;
  index: number;
  count: number;
  onMove: (dir: number) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<TestimonialInput>({
    name: row.name,
    city: row.city,
    rating: row.rating,
    text: row.text,
    avatarUrl: row.avatarUrl,
    isPublished: row.isPublished,
  });
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(form));
  const [confirm, setConfirm] = useState(false);
  const saver = useSaver();
  const remover = useSaver();
  const publisher = useSaver();
  const dirty = JSON.stringify(form) !== snapshot;
  const set = (patch: Partial<TestimonialInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    saver.setSaved(false);
  };

  return (
    <div className="rounded-4xl border border-cream-300 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-cream-200 p-4">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-green-900">{form.name || `Testimonial ${index + 1}`}</span>
          <Badge variant={form.isPublished ? "success" : "default"} size="sm">
            {form.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <Icon name="chevronDown" size={16} className="rotate-180" />
          </IconBtn>
          <IconBtn label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
            <Icon name="chevronDown" size={16} />
          </IconBtn>
          <IconBtn label="Delete testimonial" onClick={() => setConfirm(true)}>
            <Icon name="close" size={16} />
          </IconBtn>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" value={form.name} onChange={(v) => set({ name: v })} required />
          <TextField label="City" value={form.city} onChange={(v) => set({ city: v })} />
        </div>
        <NumberField label="Rating (1–5)" value={form.rating} min={1} max={5} onChange={(v) => set({ rating: v })} />
        <AreaField label="Testimonial" value={form.text} onChange={(v) => set({ text: v })} rows={3} />
        <div>
          <p className="mb-1.5 text-sm font-semibold text-green-900">Avatar</p>
          <MediaPicker label="Avatar" value={form.avatarUrl} onChange={(v) => set({ avatarUrl: v })} size={72} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cream-200 p-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={publisher.pending}
          onClick={() =>
            publisher.run(() => toggleTestimonialPublished(row.id, !form.isPublished), () => {
              setForm((f) => ({ ...f, isPublished: !f.isPublished }));
              setSnapshot((s) => {
                const parsed = JSON.parse(s);
                return JSON.stringify({ ...parsed, isPublished: !parsed.isPublished });
              });
              router.refresh();
            })
          }
        >
          {form.isPublished ? "Unpublish" : "Publish"}
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm" aria-live="polite">
            {saver.error ? (
              <span className="font-medium text-terra-600">{saver.error}</span>
            ) : saver.saved ? (
              <span className="font-medium text-green-600">Saved.</span>
            ) : dirty ? (
              <span className="text-green-700/50">Unsaved changes</span>
            ) : null}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={saver.pending || !dirty}
            leftIcon={saver.pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : undefined}
            onClick={() => {
              const snap = JSON.stringify(form);
              saver.run(() => updateTestimonial(row.id, form), () => {
                setSnapshot(snap);
                router.refresh();
              });
            }}
          >
            Save
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete this testimonial?"
        confirmLabel="Delete"
        tone="danger"
        loading={remover.pending}
        onConfirm={() => remover.run(() => deleteTestimonial(row.id), () => {
          setConfirm(false);
          router.refresh();
        })}
      />
    </div>
  );
}
