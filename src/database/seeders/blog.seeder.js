import { Post } from '../../modules/blog/post.model.js';
import { Category } from '../../modules/taxonomy/category.model.js';
import { User } from '../../modules/users/user.model.js';
import { slugify } from '../../core/utils/slugify.js';
import { logger } from '../../core/utils/logger.js';
import { mediaRef } from './seedHelpers.js';

const POSTS = [
  {
    slug: 'materials-that-age-beautifully', title: 'Materials that age beautifully: a studio shortlist', category: 'Materials', date: '2026-06-18', image: 'photo-1615874959474-d609969a20ed',
    excerpt: 'The most expensive-feeling interiors are rarely the newest ones. Here are the surfaces we specify because they improve with a decade of touch.',
    tags: ['Materials', 'Craft', 'Longevity'],
    content: [
      "New interiors photograph well. Great interiors photograph better ten years later. The difference is almost always the material list — and specifically, whether each surface was chosen for how it wears or only for how it looks on installation day.",
      "Honed natural stone tops our list. Unlike polished finishes, honed surfaces hide fine scratches and develop a soft, tactile patina where hands and objects rest most. In kitchens and vanities, that patina reads as history rather than damage.",
      "Solid timber — walnut, oak, teak — earns its place the same way. Veneers have their uses, but edges, handles, and stair rails should be solid, because those are the places a home is actually touched. Twenty years of hands polish solid timber; they destroy a lacquered film.",
      "Finally: unlacquered brass and bronze. They start bright, darken unevenly, and settle into a depth no factory finish imitates. Clients are sometimes nervous about the first six months. Nobody has ever asked us to replace it in year five.",
    ],
  },
  {
    slug: 'lighting-layers-explained', title: 'The three lighting layers every room needs', category: 'Design Notes', date: '2026-05-27', image: 'photo-1600573472592-401b489a3cdc',
    excerpt: 'A room lit by one ceiling source is a room seen at its worst. We break down ambient, task, and accent light — and the switching that makes them usable.',
    tags: ['Lighting', 'Design Notes'],
    content: [
      "Ask why a hotel room feels calmer than most living rooms and the answer is usually light. Not more of it — more layers of it, each doing one job well.",
      "Ambient light sets the base level of the room. In our projects it almost never comes from a single central fixture; it comes from cove light, wall washers, or several low-glare downlights, so the ceiling stays visually quiet.",
      "Task light serves the activity: the reading chair, the kitchen counter, the vanity mirror. It should be brighter than the ambient layer and positioned so your own head never shadows the work.",
      "Accent light is what makes a room feel designed — a picture light, a shelf glow, a grazing beam on stone. The final ingredient is control: group these layers into scenes, because nobody adjusts six dimmers every evening.",
    ],
  },
  {
    slug: 'small-apartment-bigger-feel', title: 'Making a small apartment live large', category: 'Residential', date: '2026-04-30', image: 'photo-1502672260266-1c1ef2d93688',
    excerpt: 'Square footage is fixed; perceived space is not. Six planning moves we use to make compact apartments feel twice their size.',
    tags: ['Residential', 'Space Planning'],
    content: [
      "The fastest way to make a small apartment feel smaller is to treat every room as a separate decorating project. Continuity — one floor material, one palette, one joinery language — lets the eye read the whole plan as a single space.",
      "Storage is the second battle. Freestanding wardrobes and cabinets eat visual space twice: once with their footprint, once with the clutter around them. Full-height built-ins that meet the ceiling disappear into architecture.",
      "Sightlines matter more than square meters. If you can stand at the entry and see through to a window, the apartment reads as deep. We will move a doorway half a meter to win that view.",
      "Finally, scale furniture honestly. One properly sized sofa beats a three-piece suite squeezed into apology. Fewer, larger pieces make small rooms feel intentional rather than crowded.",
    ],
  },
  {
    slug: 'office-design-that-earns-the-commute', title: 'Office design that earns the commute', category: 'Commercial', date: '2026-03-19', image: 'photo-1497366216548-37526070297c',
    excerpt: 'Hybrid work changed the brief: the office now competes with home. What we design into workplaces so people choose to come in.',
    tags: ['Commercial', 'Workplace'],
    content: [
      "The pre-2020 office brief was density: how many desks fit per floor. The current brief is gravity: what pulls people in when home is an option. Those are opposite design problems.",
      "The offices that win the commute offer what home cannot: acoustically serious focus rooms, generous collaboration tables with proper displays, and a client-facing front of house that makes staff proud to bring people in.",
      "Materials do quiet work here. Carpet-tile-and-white-laminate reads as obligation; timber, wool, and warm light read as hospitality. The cost difference is smaller than most facility budgets assume.",
      "Our rule of thumb: spend where hands and eyes linger — entries, meeting tables, coffee points — and economize in the service zones nobody remembers.",
    ],
  },
  {
    slug: 'the-case-for-turnkey', title: 'The case for turnkey: why one contract beats five', category: 'Process', date: '2026-02-12', image: 'photo-1616594039964-ae9021a400a0',
    excerpt: 'Design, contractor, joinery, lighting, styling — five vendors means five schedules and one exhausted client. How turnkey delivery changes the math.',
    tags: ['Process', 'Turnkey'],
    content: [
      "Most renovation horror stories are not design failures; they are coordination failures. The designer blames the contractor, the contractor blames the joinery shop, and the client becomes the project manager they never wanted to be.",
      "Turnkey delivery collapses that chain into one accountable contract. When the same studio that drew the wall also builds it, the drawing stops being a suggestion. Details survive because the people who designed them supervise their installation.",
      "It also changes budgeting. Instead of five vendors each padding for the unknowns created by the other four, one team prices the whole scope with full information — and carries the risk of its own coordination.",
      "The honest trade-off: turnkey demands more trust upfront. That is why we structure it around staged approvals — concept, design, procurement, execution — so clients keep control at every gate.",
    ],
  },
  {
    slug: 'hospitality-lessons-for-homes', title: 'Five hospitality lessons we bring into homes', category: 'Hospitality', date: '2026-01-08', image: 'photo-1590490360182-c33d57733427',
    excerpt: 'The best hotel suites are engineered to make strangers feel at ease within minutes. Those same techniques work even better at home.',
    tags: ['Hospitality', 'Residential', 'Design Notes'],
    content: [
      "Hotels cannot rely on familiarity to make guests comfortable, so they engineer comfort deliberately. That discipline translates beautifully into residential work.",
      "Lesson one is the arrival moment: a compressed entry that opens into the main volume makes any home feel generous. Lesson two is lighting scenes — evening light in a good suite is a designed event, not a switch.",
      "Lesson three: the bed wall is a composition of headboard, light, and bedside surfaces designed as one piece. Lesson four: bathrooms deserve the same material ambition as living rooms.",
      "And lesson five — editing. Hotel suites hold remarkably few objects, all intentional. Homes that adopt that restraint feel calmer within a day, and stay easier to keep beautiful for years.",
    ],
  },
];

export const seedBlog = async () => {
  if (await Post.exists({})) return;

  const author = await User.findOne({ role: { $exists: true } }).sort('createdAt');
  const categorySlugs = [...new Set(POSTS.map((p) => p.category))];
  const categoryIds = {};
  for (const [i, name] of categorySlugs.entries()) {
    const slug = slugify(name);
    let cat = await Category.findOne({ taxonomy: 'blog', slug });
    if (!cat) cat = await Category.create({ taxonomy: 'blog', name, slug, order: i });
    categoryIds[name] = cat._id;
  }

  for (const p of POSTS) {
    await Post.create({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      contentHtml: p.content.map((paragraph) => `<p>${paragraph}</p>`).join(''),
      featuredImage: mediaRef(p.image, 1400, 800, p.title),
      author: author?._id,
      categories: [categoryIds[p.category]],
      tags: p.tags,
      readingTimeMinutes: Math.max(1, Math.round(p.content.join(' ').split(/\s+/).length / 200)),
      status: 'published',
      publishedAt: new Date(p.date),
      createdBy: author?._id,
      updatedBy: author?._id,
    });
  }
  logger.info(`  + blog: ${POSTS.length} posts across ${categorySlugs.length} categories`);
};
