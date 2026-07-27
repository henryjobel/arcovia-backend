import { Entry } from '../../modules/content/entry.model.js';
import { Category } from '../../modules/taxonomy/category.model.js';
import { slugify } from '../../core/utils/slugify.js';
import { logger } from '../../core/utils/logger.js';
import { mediaRef, internalLink } from './seedHelpers.js';

const featureList = (texts) => texts.map((text) => ({ _uid: slugify(text), text }));
const ctaButton = (label, url) => [{ _uid: slugify(label), label, link: internalLink(url) }];

const SERVICES = [
  {
    slug: 'residential-interior', title: 'Residential Interior', icon: 'Sofa', image: 'photo-1600210491369-e753d80a41f3',
    shortDescription: 'Private homes shaped around comfort, proportion, and quiet luxury.',
    description: '<p>We design residences that feel composed rather than decorated — homes where every room carries the same calm material language, and where comfort is engineered as carefully as the visual story.</p>',
    features: ['Full-home concept and mood direction', 'Custom joinery and furniture design', 'Lighting design and layered scene control', 'Material, stone, and textile curation', 'Art, styling, and final dressing'],
    gallery: ['photo-1600210492486-724fe5c67fb0', 'photo-1616486338812-3dadae4b4ace', 'photo-1600585154340-be6161a56a0c'],
  },
  {
    slug: 'commercial-interior', title: 'Commercial Interior', icon: 'Building2', image: 'photo-1497366754035-f200968a6e72',
    shortDescription: 'Polished workplaces, showrooms, and retail environments built for performance.',
    description: '<p>Workplaces and retail spaces are brand statements you walk through. We design commercial interiors that carry identity, sharpen client perception, and hold up under daily operational pressure.</p>',
    features: ['Workplace strategy and space programming', 'Front-of-house and client experience design', 'Retail display and circulation planning', 'Acoustic, lighting, and MEP coordination', 'Brand integration and wayfinding'],
    gallery: ['photo-1497366216548-37526070297c', 'photo-1497366811353-6870744d04b2', 'photo-1524758631624-e2822e304c36'],
  },
  {
    slug: 'hospitality-design', title: 'Hospitality Design', icon: 'Sparkles', image: 'photo-1600566752355-35792bedcfea',
    shortDescription: 'Memorable hotels, lounges, cafes, and guest experiences with atmospheric detail.',
    description: '<p>Hospitality succeeds on atmosphere. We choreograph arrival, seating, light levels, and material warmth so guests feel the space before they can explain it — and return because of it.</p>',
    features: ['Guest journey and arrival sequencing', 'F&B and lounge concept design', 'Guestroom and suite prototypes', 'Decorative lighting and mood scenes', 'FF&E specification and procurement'],
    gallery: ['photo-1590490360182-c33d57733427', 'photo-1517248135467-4c7edcad34c4', 'photo-1552566626-52f8b828add9'],
  },
  {
    slug: 'bespoke-interior', title: 'Bespoke Interior', icon: 'Gem', image: 'photo-1616486338812-3dadae4b4ace',
    shortDescription: 'Custom furniture, feature walls, lighting stories, and crafted material palettes.',
    description: '<p>For clients who want pieces that exist nowhere else, our bespoke practice designs and commissions furniture, feature walls, and lighting installations built by specialist craftsmen.</p>',
    features: ['One-off furniture design and prototyping', 'Feature walls and sculptural ceilings', 'Custom lighting installations', 'Rare stone and veneer sourcing', 'Artisan and workshop supervision'],
    gallery: ['photo-1615874959474-d609969a20ed', 'photo-1600573472592-401b489a3cdc', 'photo-1586023492125-27b2c045efd7'],
  },
  {
    slug: 'architecture', title: 'Architecture', icon: 'Ruler', image: 'photo-1600607687920-4e2a09cf159d',
    shortDescription: 'Architecture concepts, planning, elevations, and integrated interior coordination.',
    description: '<p>Interiors succeed when the architecture agrees with them. We provide architectural concepts, planning, and elevation studies coordinated with the interior narrative from day one.</p>',
    features: ['Concept massing and facade studies', 'Plan optimization and daylight analysis', 'Elevation and section development', 'Authority drawing coordination', 'Interior-architecture integration'],
    gallery: ['photo-1600585154526-990dced4db0d', 'photo-1600607687939-ce8a6c25118c', 'photo-1600210491369-e753d80a41f3'],
  },
  {
    slug: 'space-planning', title: 'Space Planning', icon: 'Layers3', image: 'photo-1522708323590-d24dbb6b0267',
    shortDescription: 'Intelligent layouts that improve movement, function, daylight, and visual balance.',
    description: '<p>Before any surface is chosen, the plan must work. We study movement, sightlines, storage, and daylight to produce layouts that feel larger, calmer, and easier to live in.</p>',
    features: ['Circulation and zoning studies', 'Furniture layout optimization', 'Storage and utility planning', 'Daylight and view mapping', 'Multi-option plan comparisons'],
    gallery: ['photo-1502672260266-1c1ef2d93688', 'photo-1560448204-e02f11c3d0e2', 'photo-1493809842364-78817add7ffb'],
  },
  {
    slug: 'renovation', title: 'Renovation', icon: 'CheckCircle2', image: 'photo-1600607687939-ce8a6c25118c',
    shortDescription: 'Premium transformations for existing properties with controlled execution.',
    description: '<p>Renovation is design under constraint. We audit what exists, keep what deserves to stay, and transform the rest — with dust control, phasing, and budgets managed like a construction project, because it is one.</p>',
    features: ['Condition audit and feasibility study', 'Phased renovation planning', 'Structural and MEP upgrades', 'Finish replacement and refinishing', 'Occupied-property site management'],
    gallery: ['photo-1600210492493-0946911123ea', 'photo-1618221195710-dd6b41faaea6', 'photo-1615873968403-89e068629265'],
  },
  {
    slug: 'turnkey-solution', title: 'Turnkey Solution', icon: 'CalendarCheck', image: 'photo-1600210492486-724fe5c67fb0',
    shortDescription: 'End-to-end project delivery from concept and sourcing to final handover.',
    description: '<p>One studio, one contract, one accountable team. Our turnkey service carries a project from the first sketch to the day we hand you the keys — design, procurement, execution, and styling included.</p>',
    features: ['Single-point design and build contract', 'Procurement and vendor management', 'Site execution and quality control', 'Budget and timeline governance', 'Styling, snagging, and handover'],
    gallery: ['photo-1616594039964-ae9021a400a0', 'photo-1600210492486-724fe5c67fb0', 'photo-1616486338812-3dadae4b4ace'],
  },
];

const PROJECT_CATEGORIES = [
  { name: 'Residential', slug: 'residential' },
  { name: 'Commercial', slug: 'commercial' },
  { name: 'Hospitality', slug: 'hospitality' },
];

const PROJECTS = [
  { slug: 'aurelia-residence', title: 'The Aurelia Residence', category: 'residential', client: 'Private Family', location: 'Gulshan, Dhaka', projectDate: '2026-01-01', image: 'photo-1600210492486-724fe5c67fb0', shortDescription: 'A layered family residence composed around stone, walnut, and softened daylight.', overview: '<p>The Aurelia Residence rethinks a large Gulshan apartment as a sequence of calm rooms connected by a single material story: honed stone, warm walnut, and linen-wrapped walls that soften both light and sound.</p>', solution: '<p>We opened the plan around the daylight axis, concealed storage behind full-height joinery, and designed every fixed element — from the stone-clad foyer to the sculpted bedroom headwalls — as part of one architectural composition.</p>', gallery: ['photo-1600210492486-724fe5c67fb0', 'photo-1600210491369-e753d80a41f3', 'photo-1616486338812-3dadae4b4ace', 'photo-1615874959474-d609969a20ed'], featured: true },
  { slug: 'noir-executive-office', title: 'Noir Executive Office', category: 'commercial', client: 'Kairo Offices', location: 'Banani, Dhaka', projectDate: '2025-01-01', image: 'photo-1497366754035-f200968a6e72', shortDescription: 'A restrained executive workplace with cinematic contrast and hospitality-grade detail.', overview: '<p>Noir is an executive floor designed to make clients feel they have arrived somewhere serious. Dark oak, bronze mesh, and controlled pools of light replace the generic brightness of a standard office.</p>', solution: '<p>The plan separates a hospitality-grade client zone from a daylight-flooded working zone. Meeting rooms are treated as dark, acoustically soft rooms; workstations sit in calm, neutral light with long sightlines.</p>', gallery: ['photo-1497366754035-f200968a6e72', 'photo-1497366216548-37526070297c', 'photo-1497366811353-6870744d04b2', 'photo-1524758631624-e2822e304c36'], featured: true },
  { slug: 'maison-verde-lounge', title: 'Maison Verde Lounge', category: 'hospitality', client: 'Verde Hospitality', location: "Cox's Bazar", projectDate: '2025-01-01', image: 'photo-1600566752355-35792bedcfea', shortDescription: 'An atmospheric coastal lounge shaped through texture, green marble, and low amber light.', overview: '<p>A beachfront lounge that trades tropical cliché for depth: green marble, rattan shadows, and amber light levels tuned hour by hour from sunset to close.</p>', solution: '<p>We sequenced the guest journey from a compressed, dark entry into a tall, sea-facing volume, using the contrast to make the ocean view land harder.</p>', gallery: ['photo-1600566752355-35792bedcfea', 'photo-1517248135467-4c7edcad34c4', 'photo-1552566626-52f8b828add9', 'photo-1590490360182-c33d57733427'] },
  { slug: 'aria-duplex-suite', title: 'Aria Duplex Suite', category: 'residential', client: 'Private Client', location: 'Uttara, Dhaka', projectDate: '2024-01-01', image: 'photo-1616486338812-3dadae4b4ace', shortDescription: 'A duplex interior with tailored joinery, sculptural lighting, and quietly opulent materials.', overview: '<p>Aria is a duplex where almost nothing is off the shelf: the staircase screen, the double-height light installation, and the full joinery program were designed and commissioned as one bespoke collection.</p>', solution: '<p>We treated the double-height void as the heart of the home, wrapping it in a ribbed timber screen and suspending a custom cascade of glass pendants.</p>', gallery: ['photo-1616486338812-3dadae4b4ace', 'photo-1600573472592-401b489a3cdc', 'photo-1586023492125-27b2c045efd7', 'photo-1616594039964-ae9021a400a0'] },
  { slug: 'solstice-retail-gallery', title: 'Solstice Retail Gallery', category: 'commercial', client: 'Solstice Brands', location: 'Dhanmondi, Dhaka', projectDate: '2024-01-01', image: 'photo-1600607687920-4e2a09cf159d', shortDescription: 'A premium retail gallery designed as a calm sequence of displays, thresholds, and light.', overview: '<p>Solstice treats retail like a gallery: fewer products, more air, and lighting that makes every displayed object feel curated rather than stocked.</p>', solution: '<p>Display islands are arranged as a slow walking loop with deliberate pauses. Materials stay quiet — micro-cement, pale oak, brushed steel — so the merchandise supplies the color.</p>', gallery: ['photo-1600607687920-4e2a09cf159d', 'photo-1600607687939-ce8a6c25118c', 'photo-1522708323590-d24dbb6b0267', 'photo-1600585154526-990dced4db0d'] },
  { slug: 'cedar-urban-apartment', title: 'Cedar Urban Apartment', category: 'residential', client: 'Private Couple', location: 'Bashundhara R/A', projectDate: '2023-01-01', image: 'photo-1600210491369-e753d80a41f3', shortDescription: 'A compact city apartment elevated through proportion, custom storage, and warm neutrals.', overview: '<p>Cedar proves that square footage is not the ceiling on quality. A compact apartment gains calm and apparent size through disciplined storage, warm neutrals, and one continuous floor material.</p>', solution: '<p>Every wall that could work harder became joinery. The palette stays within three materials so the eye reads the apartment as one continuous space.</p>', gallery: ['photo-1600210491369-e753d80a41f3', 'photo-1502672260266-1c1ef2d93688', 'photo-1560448204-e02f11c3d0e2', 'photo-1493809842364-78817add7ffb'] },
];

const TEAM = [
  { title: 'Ayaan Rahman', designation: 'Founder & Design Director', photo: 'photo-1472099645785-5658abf4ff4e', shortBio: "Sets the creative direction of every project and guards the studio's standard of restraint.", featured: true },
  { title: 'Mahira Hossain', designation: 'Principal Interior Designer', photo: 'photo-1573496359142-b8d87734a5a2', shortBio: 'Leads residential design from concept to styling, with a deep library of materials.', featured: true },
  { title: 'Tanvir Ahmed', designation: 'Head of Architecture', photo: 'photo-1506794778202-cad84cf45f1d', shortBio: 'Coordinates architecture, structure, and services so interiors are never compromised.', featured: true },
  { title: 'Sadia Islam', designation: 'Project Delivery Lead', photo: 'photo-1580489944761-15a19d654956', shortBio: 'Runs site execution, vendors, and timelines — the reason projects hand over on schedule.', featured: true },
];

const TESTIMONIALS = [
  { authorName: 'Nadia Rahman', companyOrDesignation: 'Homeowner', quote: 'Arcovia Studio made our apartment feel calm, expensive, and deeply personal. Their material choices were exceptional.', photo: 'photo-1494790108377-be9c29b29330', rating: 5, featured: true },
  { authorName: 'Samiul Karim', companyOrDesignation: 'Founder, Kairo Offices', quote: 'The office redesign elevated our entire client experience. The process was organized, transparent, and beautifully handled.', photo: 'photo-1500648767791-00dcc994a43e', rating: 5, featured: true },
  { authorName: 'Farzana Chowdhury', companyOrDesignation: 'Boutique Hotel Owner', quote: 'They understood atmosphere better than anyone we met. Every corner now feels intentional and photogenic.', photo: 'photo-1438761681033-6461ffad8d80', rating: 5, featured: true },
];

const PROCESS_STEPS = [
  { title: 'Discover', description: 'Site visit, lifestyle or brand brief, budget frame, and success criteria.' },
  { title: 'Concept', description: 'Spatial strategy, mood direction, and the first material palette.' },
  { title: 'Design', description: 'Developed plans, elevations, joinery, lighting, and specifications.' },
  { title: 'Visualization', description: 'Photoreal renders and walkthroughs so decisions are made with confidence.' },
  { title: 'Execution', description: 'Site supervision, vendor coordination, and quality control at every stage.' },
  { title: 'Handover', description: 'Styling, snagging, documentation, and a space ready to be lived in.' },
];

async function seedCategories() {
  for (const [i, cat] of PROJECT_CATEGORIES.entries()) {
    if (await Category.exists({ taxonomy: 'project', slug: cat.slug })) continue;
    await Category.create({ taxonomy: 'project', name: cat.name, slug: cat.slug, order: i });
  }
}

async function seedServices() {
  if (await Entry.exists({ typeKey: 'service' })) return;
  for (const [i, s] of SERVICES.entries()) {
    await Entry.create({
      typeKey: 'service',
      title: s.title,
      slug: s.slug,
      order: i,
      status: 'published',
      featured: i < 5,
      data: {
        icon: s.icon,
        image: mediaRef(s.image, 760, 1000, s.title),
        bannerImage: mediaRef(s.image, 1800, 700, s.title),
        shortDescription: s.shortDescription,
        description: s.description,
        features: featureList(s.features),
        gallery: s.gallery.map((id) => mediaRef(id, 900, 700, s.title)),
        cta: ctaButton('Book a Consultation', '/contact'),
      },
    });
  }
}

async function seedProjects() {
  if (await Entry.exists({ typeKey: 'project' })) return;
  for (const [i, p] of PROJECTS.entries()) {
    await Entry.create({
      typeKey: 'project',
      title: p.title,
      slug: p.slug,
      order: i,
      status: 'published',
      featured: Boolean(p.featured),
      data: {
        category: p.category,
        client: p.client,
        location: p.location,
        projectDate: p.projectDate,
        shortDescription: p.shortDescription,
        featuredImage: mediaRef(p.image, 1100, 1300, p.title),
        gallery: p.gallery.map((id) => mediaRef(id, 1100, 1300, p.title)),
        beforeImage: null,
        afterImage: null,
        servicesProvided: [],
        overview: p.overview,
        challenge: '',
        solution: p.solution,
        results: '',
        cta: ctaButton('Start Your Project', '/contact'),
      },
    });
  }
}

async function seedTeam() {
  if (await Entry.exists({ typeKey: 'team-member' })) return;
  for (const [i, t] of TEAM.entries()) {
    await Entry.create({
      typeKey: 'team-member',
      title: t.title,
      order: i,
      status: 'published',
      featured: t.featured,
      data: {
        photo: mediaRef(t.photo, 500, 500, t.title),
        designation: t.designation,
        shortBio: t.shortBio,
        fullBio: `<p>${t.shortBio}</p>`,
        email: '',
        phone: '',
        socialLinks: [],
        skills: [],
      },
    });
  }
}

async function seedTestimonials() {
  if (await Entry.exists({ typeKey: 'testimonial' })) return;
  for (const [i, t] of TESTIMONIALS.entries()) {
    await Entry.create({
      typeKey: 'testimonial',
      title: t.authorName,
      order: i,
      status: 'published',
      featured: t.featured,
      data: {
        authorName: t.authorName,
        authorPhoto: mediaRef(t.photo, 160, 160, t.authorName),
        companyOrDesignation: t.companyOrDesignation,
        quote: t.quote,
        rating: t.rating,
        relatedService: null,
      },
    });
  }
}

async function seedProcessSteps() {
  if (await Entry.exists({ typeKey: 'process-step' })) return;
  for (const [i, step] of PROCESS_STEPS.entries()) {
    await Entry.create({
      typeKey: 'process-step',
      title: step.title,
      order: i,
      status: 'published',
      data: { title: step.title, description: step.description, icon: '' },
    });
  }
}

export const seedContent = async () => {
  await seedCategories();
  await seedServices();
  await seedProjects();
  await seedTeam();
  await seedTestimonials();
  await seedProcessSteps();
  logger.info('  + content: services, portfolio, team, testimonials, process steps (with categories)');
};
