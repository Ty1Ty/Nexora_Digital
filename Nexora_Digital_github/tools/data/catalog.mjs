// Nexora Digital — site configuration, categories and PLACEHOLDER catalogue.
// Everything here is placeholder content used until live vendors publish real listings.
// When Supabase env vars are present, tools/build.mjs replaces listings with live approved ones.

export const site = {
  name: 'Nexora Digital',
  legalName: 'Nexora Digital',
  tagline: 'Kenya’s digital services & downloads marketplace',
  description: 'Buy and sell digital services, templates, and downloads on Nexora Digital — a multi-vendor marketplace for Kenya and the world. Pay with M-Pesa or card, instant downloads, secure vendor payouts.',
  owner: 'Tyrone John',
  phone: '+254 792 381 698',
  phoneIntl: '254792381698',
  email: 'tyronejohn001@gmail.com',
  city: 'Nairobi',
  country: 'Kenya',
  countryCode: 'KE',
  currency: 'KES',
  // Approximate display rates (1 KES = x). Charging always happens in KES. Update occasionally.
  rates: { KES: 1, USD: 0.0077, EUR: 0.0071, GBP: 0.0061 },
  symbols: { KES: 'KSh', USD: '$', EUR: '€', GBP: '£' },
  defaultCommission: 0.12,
  payoutHoldDays: 7,
  social: { instagram: '', x: '', linkedin: '', facebook: '' }
};

export const categories = [
  {
    slug: 'web-development', name: 'Web & Technology', icon: '⌘',
    short: 'Websites, landing pages, speed fixes and technical help',
    title: 'Web Design & Development Services in Kenya | Hire Web Developers',
    h1: 'Web design & development services',
    meta: 'Hire vetted web designers and developers in Kenya. Business websites, landing pages, WordPress speed optimisation and more — pay with M-Pesa or card.',
    intro: 'From a first business website to a fast, conversion-focused landing page, hire independent web designers and developers in Nairobi, Mombasa and across Africa. Every vendor is reviewed before listing and every order is protected.',
    keywords: ['web design Kenya', 'website developer Nairobi', 'business website Kenya', 'landing page design', 'WordPress speed optimisation', 'hire web developer'],
    faq: [
      ['How much does a business website cost in Kenya?', 'Prices vary by scope. On Nexora Digital, starter business websites begin from a few thousand shillings and each listing shows exactly what is included, so you can compare vendors before paying.'],
      ['Will my website be mobile-friendly and SEO-ready?', 'Most web listings include responsive design and basic on-page SEO. Check each listing’s “What’s included” section or message the vendor before ordering.']
    ]
  },
  {
    slug: 'seo-marketing', name: 'SEO & Digital Marketing', icon: '↗',
    short: 'SEO audits, local SEO, social media and content planning',
    title: 'SEO & Digital Marketing Services in Kenya | Grow Your Business Online',
    h1: 'SEO & digital marketing services',
    meta: 'SEO audits, local SEO, Google Business Profile setup, social media planners and marketing templates from Kenyan digital marketers. Secure checkout with M-Pesa.',
    intro: 'Get found on Google and turn followers into customers. Hire SEO specialists and digital marketers, or download ready-made planners and checklists you can use today.',
    keywords: ['SEO services Kenya', 'digital marketing Nairobi', 'local SEO', 'Google Business Profile setup', 'social media content planner', 'SEO audit'],
    faq: [
      ['What is an SEO audit?', 'An SEO audit reviews your website’s technical health, on-page content and search opportunities, then gives you a prioritised list of fixes.'],
      ['Can I buy marketing templates instantly?', 'Yes. Digital download listings are delivered immediately after payment and stay available in your account.']
    ]
  },
  {
    slug: 'design-branding', name: 'Design & Branding', icon: '✳',
    short: 'Logos, brand identity, social media graphics and print design',
    title: 'Graphic Design & Logo Design in Kenya | Brand Identity Services',
    h1: 'Graphic design, logos & branding',
    meta: 'Order logo design, brand identity, social media templates and graphics from creative designers in Kenya. Transparent prices, M-Pesa and card payments.',
    intro: 'Build a brand people remember. Browse logo designers, brand identity packages and editable social media template packs from independent creatives.',
    keywords: ['logo design Kenya', 'graphic designer Nairobi', 'brand identity', 'social media templates', 'Canva templates Kenya', 'business branding'],
    faq: [
      ['Do I own the files of my logo?', 'Ownership terms are stated on each listing. Most brand packages include final files and usage rights; confirm with the vendor before ordering.'],
      ['Can I request revisions?', 'Many design services include revision rounds. The number of included revisions is shown on the listing.']
    ]
  },
  {
    slug: 'business-templates', name: 'Business Templates', icon: '▦',
    short: 'Business plans, invoices, trackers and ready-to-use documents',
    title: 'Business Templates & Excel Trackers Kenya | Instant Download',
    h1: 'Business templates & downloads',
    meta: 'Download business plan templates, invoice and quotation bundles, Excel trackers and planners for small businesses in Kenya. Instant delivery after payment.',
    intro: 'Save hours with professionally built templates for Kenyan small businesses — business plans, invoices, quotations, inventory and expense trackers, delivered instantly.',
    keywords: ['business plan template Kenya', 'invoice template', 'Excel tracker', 'small business templates', 'quotation template', 'inventory tracker'],
    faq: [
      ['How do I receive my download?', 'After payment you are taken to a secure page with your download link, and the file remains in your Nexora account under Orders.'],
      ['Can I edit the templates?', 'Yes. Templates are editable in Excel, Google Sheets or Word unless the listing says otherwise.']
    ]
  },
  {
    slug: 'data-spreadsheets', name: 'Data & Spreadsheets', icon: '▥',
    short: 'Excel dashboards, data cleaning, reports and analysis',
    title: 'Excel Dashboards & Data Analysis Services Kenya',
    h1: 'Data, Excel & reporting services',
    meta: 'Hire Excel experts and data analysts in Kenya. Dashboards, data cleaning, summary reports and spreadsheet templates with secure payment.',
    intro: 'Turn messy spreadsheets into clear decisions. Find Excel experts, data analysts and ready-made dashboard templates.',
    keywords: ['Excel dashboard', 'data analysis Kenya', 'spreadsheet expert', 'data cleaning', 'sales dashboard template', 'Excel report'],
    faq: [
      ['Can you work with my existing spreadsheet?', 'Most data services accept your own file. Share it with the vendor after ordering.'],
      ['Are my files kept private?', 'Files you share stay between you and the vendor and are covered by Nexora Digital’s privacy policy.']
    ]
  },
  {
    slug: 'writing-translation', name: 'Writing & Translation', icon: '✎',
    short: 'Articles, copywriting and English ⇄ Swahili translation',
    title: 'Content Writing & Swahili Translation Services Kenya',
    h1: 'Writing & translation services',
    meta: 'Hire content writers, copywriters and English–Swahili translators in Kenya. Blog articles, website copy and translations, paid securely via M-Pesa or card.',
    intro: 'Words that work. Order SEO blog articles, website copy and accurate English–Swahili translation from independent writers.',
    keywords: ['content writing Kenya', 'blog writer', 'Swahili translation', 'copywriting services', 'SEO articles', 'English to Swahili translator'],
    faq: [
      ['Is the writing original?', 'Vendors must deliver original work. Report any issue and our team will investigate; refunds follow our refund policy.'],
      ['Can I order SEO-optimised articles?', 'Yes — look for listings that mention keyword research and on-page optimisation.']
    ]
  },
  {
    slug: 'video-audio', name: 'Video & Audio', icon: '▶',
    short: 'Video editing, promo videos, voice-overs and jingles',
    title: 'Video Editing & Audio Production Services in Kenya',
    h1: 'Video & audio services',
    meta: 'Order promo video editing, social media reels, voice-overs and podcast jingles from creators in Kenya. Secure checkout, M-Pesa accepted.',
    intro: 'Bring your message to life with video editors, voice-over artists and audio producers.',
    keywords: ['video editing Kenya', 'promo video', 'social media reels', 'voice over', 'podcast jingle', 'video editor Nairobi'],
    faq: [
      ['How do I send my raw footage?', 'After ordering, share files with the vendor via the link method they specify on the listing.'],
      ['What video lengths are supported?', 'Each listing states the maximum duration included. Longer projects can be agreed with the vendor.']
    ]
  },
  {
    slug: 'courses-ebooks', name: 'Courses & eBooks', icon: '✧',
    short: 'Guides, mini-courses and learning resources you can download',
    title: 'Online Courses & eBooks for Kenyans | Learn Digital Skills',
    h1: 'Courses, eBooks & guides',
    meta: 'Download eBooks, guides and mini-courses on freelancing, digital marketing and business skills from Kenyan educators. Instant access after payment.',
    intro: 'Learn practical digital skills at your own pace with guides and mini-courses from independent educators.',
    keywords: ['online courses Kenya', 'freelancing guide', 'digital marketing course', 'eBooks Kenya', 'learn digital skills', 'earn online Kenya'],
    faq: [
      ['Do I get lifetime access?', 'Purchased downloads remain in your account under Orders for as long as your account is active.'],
      ['Can I become a course vendor?', 'Yes. Apply on the Sell page — approved vendors can publish downloadable courses and guides.']
    ]
  }
];

export const vendors = [
  { slug: 'nexora-studio', name: 'Nexora Studio', initial: 'N', country: 'Kenya', bio: 'The in-house Nexora team: websites, SEO and practical business resources. Placeholder vendor profile.' },
  { slug: 'pixel-and-pen', name: 'Pixel & Pen', initial: 'P', country: 'Kenya', bio: 'Independent design and web studio in Nairobi. Placeholder vendor profile.' },
  { slug: 'savannah-sheets', name: 'Savannah Sheets', initial: 'S', country: 'Kenya', bio: 'Excel templates and data tools for small businesses. Placeholder vendor profile.' },
  { slug: 'kilimanjaro-creative', name: 'Kilimanjaro Creative', initial: 'K', country: 'Kenya', bio: 'Copywriting, SEO and translation team. Placeholder vendor profile.' },
  { slug: 'mombasa-media', name: 'Mombasa Media', initial: 'M', country: 'Kenya', bio: 'Video editing and audio production on the coast. Placeholder vendor profile.' },
  { slug: 'mwangaza-learning', name: 'Mwangaza Learning', initial: 'W', country: 'Kenya', bio: 'Practical eBooks and mini-courses. Placeholder vendor profile.' }
];

const L = (id, vendor, category, type, price, title, summary, includes, tags, days = 0) => ({
  id: 'demo-' + id,
  slug: title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  vendor, category, type, priceKes: price, title, summary, includes, tags, deliveryDays: days, demo: true,
  description: summary + ' This is a placeholder listing shown while the marketplace is in preview — real vendors will publish their own offers here once approved.'
});

export const listings = [
  L(1, 'nexora-studio', 'web-development', 'service', 8500, 'Business Website Starter', 'A clean, mobile-friendly 5-page business website built for speed and search visibility.', ['Up to 5 responsive pages', 'On-page SEO basics & meta tags', 'Contact form & WhatsApp button', '1 round of revisions'], ['website', 'business website', 'responsive'], 7),
  L(2, 'pixel-and-pen', 'web-development', 'service', 12000, 'Landing Page Design & Build', 'A high-converting single landing page designed around your offer and built to load fast.', ['Custom design', 'Mobile-first build', 'Lead capture form', 'Analytics set-up'], ['landing page', 'conversion', 'design'], 5),
  L(3, 'nexora-studio', 'web-development', 'service', 4500, 'WordPress Speed Optimisation', 'Cut load times with caching, image compression and clean-up — better UX and better rankings.', ['Speed audit', 'Caching & image optimisation', 'Before/after report'], ['WordPress', 'speed', 'performance'], 3),
  L(4, 'nexora-studio', 'seo-marketing', 'service', 1800, 'SEO Website Health Check', 'A practical review of technical SEO, on-page content and quick-win opportunities.', ['Technical SEO review', 'Keyword opportunity list', 'Prioritised fix list (PDF)'], ['SEO audit', 'technical SEO'], 3),
  L(5, 'kilimanjaro-creative', 'seo-marketing', 'service', 6500, 'Local SEO Setup for Kenyan Businesses', 'Get found on Google Maps and “near me” searches with a fully optimised Business Profile.', ['Google Business Profile set-up', 'Local citations (10)', 'Review-request template'], ['local SEO', 'Google Business Profile', 'Nairobi'], 7),
  L(6, 'nexora-studio', 'seo-marketing', 'digital', 350, 'Social Media Content Planner', 'A monthly planner to organise posts, hashtags and campaigns across platforms.', ['Editable Excel + Google Sheets', '30-day calendar', 'Hashtag tracker'], ['content planner', 'social media'], 0),
  L(7, 'pixel-and-pen', 'design-branding', 'service', 3500, 'Logo & Brand Identity Essentials', 'A starter identity: logo, colour palette and typography guide for a new business.', ['3 logo concepts', 'Colour & font guide', 'Final files (PNG, SVG, PDF)'], ['logo design', 'brand identity'], 5),
  L(8, 'pixel-and-pen', 'design-branding', 'digital', 900, 'Social Media Post Template Pack', '30 editable post templates for Instagram and Facebook, ready for your brand colours.', ['30 templates', 'Canva-compatible', 'Font list included'], ['templates', 'Canva', 'Instagram'], 0),
  L(9, 'savannah-sheets', 'business-templates', 'digital', 450, 'Small Business Excel Tracker', 'Track income, expenses and stock in one tidy, editable spreadsheet.', ['Income & expense sheets', 'Stock tracker', 'Monthly summary'], ['Excel', 'tracker', 'small business'], 0),
  L(10, 'savannah-sheets', 'business-templates', 'digital', 750, 'Business Plan Template', 'A step-by-step business plan template tailored for Kenyan start-ups and loan applications.', ['Word document', 'Financial projections sheet', 'Worked example'], ['business plan', 'start-up'], 0),
  L(11, 'savannah-sheets', 'business-templates', 'digital', 500, 'Invoice & Quotation Template Bundle', 'Professional invoice, quotation and receipt templates with automatic totals and VAT.', ['10 templates', 'Auto-calculating totals', 'Excel + Word'], ['invoice', 'quotation', 'receipt'], 0),
  L(12, 'nexora-studio', 'data-spreadsheets', 'service', 2200, 'Excel Data Summary Report', 'Turn a tidy spreadsheet into a clear, useful summary with charts and key insights.', ['Data cleaning', 'Pivot tables & charts', 'Written insights'], ['Excel', 'report', 'analysis'], 4),
  L(13, 'savannah-sheets', 'data-spreadsheets', 'digital', 1200, 'Sales Dashboard Excel Template', 'An interactive dashboard that visualises monthly sales, products and targets.', ['Interactive Excel dashboard', 'Sample data', 'Setup video guide'], ['dashboard', 'sales', 'Excel'], 0),
  L(14, 'kilimanjaro-creative', 'writing-translation', 'service', 1500, 'SEO Blog Article (1,000 words)', 'A researched, original 1,000-word blog article optimised for your target keyword.', ['Keyword research', '1,000 words', 'Meta title & description'], ['blog', 'content writing', 'SEO'], 4),
  L(15, 'kilimanjaro-creative', 'writing-translation', 'service', 800, 'English ⇄ Swahili Translation (500 words)', 'Accurate, natural-sounding translation between English and Swahili.', ['Up to 500 words', 'Human translation', '1 proofread'], ['Swahili', 'translation'], 2),
  L(16, 'mombasa-media', 'video-audio', 'service', 5500, 'Promo Video Editing (up to 60s)', 'Polished social-ready promo video with captions, music and branding.', ['Up to 60 seconds', 'Captions & music', '1080p export'], ['video editing', 'reels', 'promo'], 5),
  L(17, 'mombasa-media', 'video-audio', 'service', 3000, 'Podcast & Brand Audio Jingle', 'A short custom jingle or intro for your podcast, radio ad or brand video.', ['10–15s jingle', 'WAV + MP3', '1 revision'], ['jingle', 'podcast', 'audio'], 4),
  L(18, 'mwangaza-learning', 'courses-ebooks', 'digital', 600, 'Freelancing Starter Guide (eBook)', 'A practical eBook on finding your first online clients and getting paid.', ['PDF eBook', 'Proposal templates', 'Pricing worksheet'], ['freelancing', 'eBook', 'earn online'], 0),
  L(19, 'mwangaza-learning', 'courses-ebooks', 'digital', 2500, 'Digital Marketing Basics Mini-Course', 'Learn SEO, social media and email basics in short, practical lessons.', ['Video lessons', 'Workbook (PDF)', 'Certificate of completion'], ['digital marketing', 'course'], 0)
];

export const articles = [
  {
    slug: 'how-to-sell-digital-products-in-kenya',
    title: 'How to Sell Digital Products in Kenya (and Get Paid via M-Pesa)',
    meta: 'A practical guide to selling templates, eBooks and services online in Kenya — what to sell, how to price, and how to get paid by M-Pesa.',
    date: '2026-11-04',
    cat: 'Selling',
    body: [
      ['Why digital products work in Kenya', 'Digital products — templates, eBooks, designs and downloadable tools — need no stock, no shipping and no premises. A single file can be sold again and again, and customers pay with M-Pesa or card in seconds.'],
      ['What to sell', 'Start where your skills already are: Excel trackers, business plan templates, social media post packs, short guides, or services such as logo design, SEO audits and translation. Look at what small businesses ask you for repeatedly and package it.'],
      ['How to price', 'Check similar listings, price for the outcome rather than the hours, and keep a simple entry-level offer to win first customers. Remember marketplace commission when you set your price.'],
      ['Getting paid', 'On Nexora Digital, buyers pay by M-Pesa or card and your earnings are tracked automatically. After a short protection period, payouts are sent to your M-Pesa or bank account on a schedule — no invoices to chase.']
    ]
  },
  {
    slug: 'hire-freelancers-in-kenya-checklist',
    title: 'Hiring Freelancers in Kenya: A 7-Point Checklist',
    meta: 'How to hire web designers, writers and marketers in Kenya safely — a checklist covering portfolios, scope, payment protection and revisions.',
    date: '2026-11-04',
    cat: 'Buying',
    body: [
      ['1. Define the outcome', 'Write down what “done” looks like: pages, deliverables, formats and deadline.'],
      ['2. Check the portfolio', 'Look for work similar to yours. Message the vendor with questions before ordering.'],
      ['3. Read “What’s included”', 'Good listings list deliverables, revisions and delivery time clearly.'],
      ['4. Pay through the platform', 'Paying through the marketplace keeps a record of the order and protects both sides.'],
      ['5. Agree revisions up front', 'Know how many revision rounds are included.'],
      ['6. Share assets early', 'Logos, copy and access details speed delivery.'],
      ['7. Leave a review', 'Honest reviews help other buyers and good vendors grow.']
    ]
  },
  {
    slug: 'local-seo-guide-kenyan-small-business',
    title: 'Local SEO for Kenyan Small Businesses: A Beginner’s Guide',
    meta: 'Learn how Kenyan small businesses can rank on Google Maps and local searches with a Google Business Profile, citations, reviews and a fast website.',
    date: '2026-11-04',
    cat: 'Marketing',
    body: [
      ['What is local SEO?', 'Local SEO helps your business appear when people nearby search for what you offer — for example “plumber in Nairobi” or “bakery near me”.'],
      ['Claim your Google Business Profile', 'Add accurate name, address, phone, hours, categories and photos. Keep details identical everywhere online.'],
      ['Collect genuine reviews', 'Ask happy customers for honest reviews and reply to each one.'],
      ['Make your website fast and mobile-friendly', 'Most Kenyan searches happen on phones. Compress images and keep pages light.'],
      ['Create location pages and helpful content', 'Write about the areas you serve and answer common customer questions.']
    ]
  }
];
