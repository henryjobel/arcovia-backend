import { Page } from '../../modules/pages/page.model.js';
import { logger } from '../../core/utils/logger.js';
import { genUid, mediaRef, internalLink } from './seedHelpers.js';

const section = (type, props, dynamicSource) => ({ uid: genUid(), type, order: 0, enabled: true, props, dynamicSource });

/** System pages every install gets, undeletable (systemKey set). Content beyond `home` is
 *  built out progressively in later milestones (M4 content, M6 about/process, M7 contact). */
const SYSTEM_PAGES = ['home', 'services', 'portfolio', 'about', 'process', 'testimonials', 'team', 'contact', 'blog'];

function homeSections() {
  const sections = [
    section('hero', {
      slides: [
        { _uid: genUid(), heading: 'Inspired Spaces — Elevated Living', body: 'We create refined, comfortable interiors where thoughtful planning and timeless materials come together.', image: mediaRef('photo-1600607687939-ce8a6c25118c', 2000, 1350, 'Refined interior living space') },
        { _uid: genUid(), heading: 'Atmosphere designed before decoration.', body: 'From private residences to executive floors and coastal lounges, every space is composed like architecture — proportion first, ornament last.', image: mediaRef('photo-1600210492486-724fe5c67fb0', 2000, 1350, 'Composed architectural interior') },
        { _uid: genUid(), heading: 'From first sketch to final handover.', body: 'Design, procurement, execution, and styling carried by one team, so the space you approve on paper is the space you walk into.', image: mediaRef('photo-1616486338812-3dadae4b4ace', 2000, 1350, 'Turnkey interior delivery') },
      ],
      autoplaySeconds: 7,
    }),
    section('stats-counter', {
      stats: [
        { _uid: genUid(), value: 65250, suffix: '+', label: 'Design Hours Completed' },
        { _uid: genUid(), value: 23160, suffix: '+', label: 'Satisfied Clients' },
        { _uid: genUid(), value: 150, suffix: '+', label: 'Awards Winning' },
        { _uid: genUid(), value: 20, suffix: '+', label: 'Years of Design Experience' },
      ],
    }),
    section('text-image', {
      eyebrow: 'About Us',
      heading: 'We’re committed to turning your vision into reality.',
      body: '<p>We create thoughtful interiors that balance beauty, function, and the way you live.</p><p>Every space is uniquely tailored, from the first idea to the final considered detail.</p>',
      image: mediaRef('photo-1600210491369-e753d80a41f3', 900, 1120, 'Warm modern residential interior'),
      secondaryImage: mediaRef('photo-1600607687920-4e2a09cf159d', 520, 620, 'Stone and furniture detail'),
      cta: { buttons: [{ _uid: genUid(), label: 'Read the Studio Story', link: internalLink('/about') }] },
    }),
    section(
      'services-grid',
      {
        eyebrow: 'Our Services',
        heading: 'Design solutions made for living.',
        intro: 'Thoughtful interior design services tailored to your lifestyle, needs, and vision.',
        limit: 5,
        cta: { buttons: [{ _uid: genUid(), label: 'Explore Services', link: internalLink('/services') }] },
      },
      { kind: 'entries', contentType: 'service', limit: 5 }
    ),
    section(
      'portfolio-grid',
      {
        eyebrow: 'Signature Projects',
        heading: 'Immersive interiors with architectural calm.',
        limit: 4,
        cta: { buttons: [{ _uid: genUid(), label: 'Enter Portfolio', link: internalLink('/portfolio') }] },
      },
      { kind: 'entries', contentType: 'project', limit: 4 }
    ),
    section('philosophy-marquee', {
      eyebrow: 'Design Philosophy',
      heading: 'Edited. Tactile. Enduring.',
      items: [
        { _uid: genUid(), text: 'A space should feel edited, not decorated.' },
        { _uid: genUid(), text: 'Luxury is proportion, restraint, and how light lands on a surface.' },
        { _uid: genUid(), text: 'Every material must earn its place through touch, longevity, and atmosphere.' },
      ],
    }),
    section(
      'process-steps',
      {
        eyebrow: 'Process',
        heading: 'A precise journey from brief to handover.',
        intro: 'The studio process keeps creative direction, budget discipline, and site delivery connected through every stage.',
      },
      { kind: 'entries', contentType: 'process-step' }
    ),
    section(
      'testimonials-slider',
      {
        eyebrow: 'Client Trust',
        heading: 'Spaces remembered by the people who live in them.',
        intro: 'Our clients value the balance between visual ambition, calm communication, and disciplined execution.',
        limit: 8,
      },
      { kind: 'entries', contentType: 'testimonial', limit: 8 }
    ),
    section(
      'blog-grid',
      {
        eyebrow: 'Journal',
        heading: 'Notes from the studio.',
        intro: 'Material stories, design thinking, and lessons from projects in progress.',
        limit: 3,
        cta: { buttons: [{ _uid: genUid(), label: 'Read the Journal', link: internalLink('/blog') }] },
      },
      { kind: 'posts', limit: 3 }
    ),
    section('awards-grid', {
      eyebrow: 'Awards & Recognition',
      items: [
        { _uid: genUid(), title: 'Interior Excellence', source: 'Bangladesh Design Forum, 2026' },
        { _uid: genUid(), title: 'Best Residential Space', source: 'Luxury Living Awards, 2025' },
        { _uid: genUid(), title: 'Emerging Studio', source: 'Architecture South Asia, 2024' },
        { _uid: genUid(), title: 'Hospitality Concept', source: 'Dhaka Creative Week, 2024' },
      ],
    }),
    section('contact-info', {
      eyebrow: 'Private Consultation',
      heading: 'Begin with a conversation.',
      showMap: true,
    }),
  ];
  return sections.map((s, i) => ({ ...s, order: i }));
}

const REASONS = [
  { title: 'Tailored Design', description: "Every detail is composed around the client's lifestyle, brand, site, and ambition." },
  { title: 'Experienced Designers', description: 'A multidisciplinary team brings clarity from spatial planning to finishing.' },
  { title: 'Premium Materials', description: 'We curate refined surfaces, fixtures, textures, and details that age beautifully.' },
  { title: 'On-time Delivery', description: 'Clear milestones and site coordination keep projects moving with discipline.' },
  { title: 'Transparent Communication', description: 'Clients stay aligned through structured updates, approvals, and documentation.' },
  { title: 'End-to-End Project Management', description: 'One accountable studio guides design, sourcing, execution, and handover.' },
];

const ctaSection = () =>
  section('cta', {
    eyebrow: 'Start Your Project',
    heading: 'Ready for a space with lasting presence?',
    backgroundImage: mediaRef('photo-1600607687920-4e2a09cf159d', 900, 740, 'Luxury interior project detail'),
    buttons: [{ _uid: genUid(), label: 'Book Consultation', link: internalLink('/contact') }],
  });

const featuresSection = () =>
  section('features', {
    eyebrow: 'Why Arcovia',
    heading: 'Premium delivery without visual compromise.',
    items: REASONS.map((r) => ({ _uid: genUid(), ...r })),
  });

function servicesSections() {
  return [
    section('page-hero', {
      crumbLabel: 'Services', eyebrow: 'Services', heading: 'Interior design services with architectural discipline.',
      intro: 'Residential, commercial, hospitality, bespoke interiors, architecture support, renovation, and turnkey delivery.',
      image: mediaRef('photo-1600607687920-4e2a09cf159d', 1900, 900),
    }),
    section('services-grid', { eyebrow: '', heading: 'Every service we offer.', limit: 0 }, { kind: 'entries', contentType: 'service', limit: 0 }),
    section('process-steps', { eyebrow: 'Process', heading: 'A precise journey from brief to handover.', intro: 'The studio process keeps creative direction, budget discipline, and site delivery connected through every stage.' }, { kind: 'entries', contentType: 'process-step' }),
    featuresSection(),
    ctaSection(),
  ];
}

function portfolioSections() {
  return [
    section('page-hero', {
      crumbLabel: 'Portfolio', eyebrow: 'Portfolio', heading: 'A visual archive of spaces with quiet drama.',
      intro: 'Filter through selected residential, commercial, and hospitality projects by Arcovia Studio.',
      image: mediaRef('photo-1616486338812-3dadae4b4ace', 1900, 900),
    }),
    section('portfolio-grid', { eyebrow: '', heading: 'Every project we have delivered.', limit: 0 }, { kind: 'entries', contentType: 'project', limit: 0 }),
    ctaSection(),
  ];
}

function teamSections() {
  return [
    section('page-hero', {
      crumbLabel: 'Team', eyebrow: 'Our Team', heading: 'People who shape every detail.',
      intro: 'Designers, architects and makers united by a precise, human approach.',
      image: mediaRef('photo-1521737711867-e3b97375f902', 1900, 900),
    }),
    section('team-grid', { eyebrow: 'The Studio Team', heading: 'The people behind the atmosphere.', intro: 'A compact, senior team — every project is led by the people whose names are on it.', limit: 0 }, { kind: 'entries', contentType: 'team-member', limit: 0 }),
    ctaSection(),
  ];
}

function testimonialsSections() {
  return [
    section('page-hero', {
      crumbLabel: 'Testimonials', eyebrow: 'Testimonials', heading: 'Client trust shaped through craft and clarity.',
      intro: 'What homeowners, founders, and hospitality clients say about working with Arcovia Studio.',
      image: mediaRef('photo-1600210492493-0946911123ea', 1900, 900),
    }),
    section('testimonials-slider', { eyebrow: 'Client Trust', heading: 'Spaces remembered by the people who live in them.', intro: 'Our clients value the balance between visual ambition, calm communication, and disciplined execution.', limit: 0 }, { kind: 'entries', contentType: 'testimonial', limit: 0 }),
    section('awards-grid', {
      eyebrow: 'Awards & Recognition',
      items: [
        { _uid: genUid(), title: 'Interior Excellence', source: 'Bangladesh Design Forum, 2026' },
        { _uid: genUid(), title: 'Best Residential Space', source: 'Luxury Living Awards, 2025' },
        { _uid: genUid(), title: 'Emerging Studio', source: 'Architecture South Asia, 2024' },
        { _uid: genUid(), title: 'Hospitality Concept', source: 'Dhaka Creative Week, 2024' },
      ],
    }),
    ctaSection(),
  ];
}

function processSections() {
  return [
    section('page-hero', {
      crumbLabel: 'Process', eyebrow: 'Process', heading: 'A calm system for ambitious interiors.',
      intro: 'Discover how Arcovia Studio moves from early brief to concept, visualization, execution, and handover.',
      image: mediaRef('photo-1600566752355-35792bedcfea', 1900, 900),
    }),
    section('process-steps', { eyebrow: 'Process', heading: 'A precise journey from brief to handover.', intro: 'The studio process keeps creative direction, budget discipline, and site delivery connected through every stage.' }, { kind: 'entries', contentType: 'process-step' }),
    featuresSection(),
    ctaSection(),
  ];
}

const PAGE_SECTION_BUILDERS = {
  home: homeSections,
  services: servicesSections,
  portfolio: portfolioSections,
  team: teamSections,
  testimonials: testimonialsSections,
  process: processSections,
};

export const seedPages = async () => {
  for (const key of SYSTEM_PAGES) {
    if (await Page.exists({ systemKey: key })) continue;

    const title = key === 'home' ? 'Home' : key.charAt(0).toUpperCase() + key.slice(1);
    const builder = PAGE_SECTION_BUILDERS[key];
    const sections = builder ? builder().map((s, i) => ({ ...s, order: i })) : [];
    const hasContent = sections.length > 0;

    await Page.create({
      title,
      slug: key,
      type: key === 'home' ? 'home' : 'system',
      systemKey: key,
      draft: { sections },
      published: hasContent ? { sections, version: 1, at: new Date() } : { sections: [], version: 0 },
      status: hasContent ? 'published' : 'draft',
      hasUnpublishedChanges: false,
    });
    logger.info(`  + page: ${key}${hasContent ? ' (published with seeded content)' : ' (empty, ready to build)'}`);
  }
};
