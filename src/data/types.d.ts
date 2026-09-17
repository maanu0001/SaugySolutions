/**
 * Typdefinitionen für die Inhalte aus `content/`.
 *
 * Die YAML-Dateien selbst sind untypisiert. Diese Beschreibungen geben den
 * Ladeschichten in `src/data/*.mjs` eine feste Form, damit Seiten und
 * Komponenten typsicher darauf zugreifen können und `astro check` die
 * Verwendung prüfen kann.
 */

/** Ein Punkt innerhalb einer Leistung („Was dazugehört“). */
export interface ServiceInclude {
  title: string;
  text: string;
}

export interface Service {
  slug: string;
  icon: string;
  title: string;
  teaser: string;
  lead: string;
  benefit: string;
  includes: ServiceInclude[];
  useCases: string[];
}

export interface Benefit {
  icon: string;
  title: string;
  text: string;
}

export interface ProcessStep {
  title: string;
  summary: string;
  whatHappens: string;
  yourPart: string;
  outcome: string;
}

export interface TeamMember {
  name: string;
  initials: string;
  role: string;
  education: string;
  current: string;
  photo: string | null;
  photoAlt: string;
  text: string;
  focus: string[];
  accent: 'primary' | 'secondary';
}

export interface FaqEntry {
  q: string;
  a: string;
}

/** Eine Herausforderung innerhalb eines Projekts. */
export interface ProjectChallenge {
  title: string;
  text: string;
}

/** Ein Bild der optionalen Projektgalerie. */
export interface ProjectGalleryItem {
  image: string;
  alt: string;
}

export interface Project {
  slug: string;
  name: string;
  domain: string;
  url: string;
  category: string;
  industry: string;
  metaTitle: string;
  metaDescription: string;
  teaser: string;
  accent: string;
  featured: boolean;
  order: number;

  cover: string | null;
  coverAlt: string;
  shotDesktop: string | null;
  shotDesktopAlt: string;
  shotMobile: string | null;
  shotMobileAlt: string;
  gallery: ProjectGalleryItem[];

  intro: string;
  situation: string;
  goals: string[];
  delivered: string[];
  challenges: ProjectChallenge[];
  result: string;
  ctaTitle: string;
  ctaText: string;
}

/** Ein Eintrag der Navigation oder der rechtlichen Links. */
export interface NavItem {
  label: string;
  href: string;
}

export interface SocialProfile {
  label: string;
  href: string;
}

/** Geschäftsadresse, strukturiert. */
export interface PostalAddress {
  name?: string;
  street?: string;
  postalCode?: string;
  locality?: string;
  country?: string;
  countryCode?: string;
}

/** Ein Handlungsaufruf im Hero. */
export interface CallToAction {
  label: string;
  href: string;
}

/** Vertrauenspunkt unterhalb des Heros. */
export interface TrustPoint {
  icon: string;
  text: string;
}

export interface HeroContent {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primary_cta?: CallToAction;
  secondary_cta?: CallToAction;
  trust_points?: TrustPoint[];
}

/** Ein Abschnitt der Startseite. */
export interface HomeSection {
  visible?: boolean;
  order?: number;
  eyebrow?: string;
  title?: string;
  lead?: string;
  cta_label?: string;
  steps_shown?: number;
  points?: string[];
  aside_title?: string;
  aside_points?: { strong: string; text: string }[];
}

/** Inhalte der Startseite (content/settings/home.yml). */
export interface HomeContent {
  hero?: HeroContent;
  sections?: Record<string, HomeSection>;
  cta?: { visible?: boolean; eyebrow?: string; title?: string; text?: string };
}

/** Titel und Beschreibungen je Seite (content/settings/pages.yml). */
export interface PageMeta {
  title?: string;
  description?: string;
  heading?: string;
  lead?: string;
}

export type PagesContent = Record<string, PageMeta>;
