#!/usr/bin/env node
// Nexora Digital static generator. Zero dependencies. Run: node tools/build.mjs
// - Without env vars: builds the polished PLACEHOLDER marketplace (preview mode).
// - With SUPABASE_URL + SUPABASE_ANON_KEY: pulls APPROVED live listings so every product/category page is real, indexable HTML.
// Netlify runs this on every deploy (netlify.toml) and the admin dashboard can trigger a rebuild via build hook.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { site, categories, vendors as seedVendors, listings as seedListings, articles } from './data/catalog.mjs';

const require = createRequire(import.meta.url);
const Art = require('../public/assets/js/art.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const SITE_URL = (process.env.SITE_URL || process.env.URL || 'https://nexora-digital.netlify.app').replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);
const GA = process.env.GA_MEASUREMENT_ID || '';
const GSC = process.env.GOOGLE_SITE_VERIFICATION || '';

const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kes = (n) => 'KSh ' + Math.round(n).toLocaleString('en-KE');
const write = (rel, data) => { const f = path.join(PUB, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
const catBy = Object.fromEntries(categories.map((c) => [c.slug, c]));
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

/* ------------------------------------------------------------------ data */
async function loadData() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), key = process.env.SUPABASE_ANON_KEY || '';
  if (url && key) {
    try {
      const H = { apikey: key, authorization: `Bearer ${key}` };
      const L = await (await fetch(`${url}/rest/v1/listings?status=eq.approved&select=id,slug,title,summary,description,category,type,price_cents,includes,tags,image_url,delivery_days,vendor_id,is_demo&order=created_at.desc&limit=1000`, { headers: H })).json();
      const V = await (await fetch(`${url}/rest/v1/public_vendors?select=id,store_name,slug`, { headers: H })).json();
      if (Array.isArray(L) && Array.isArray(V)) {
        const vm = Object.fromEntries(V.map((v) => [v.id, v]));
        console.log(`✔ Live data: ${L.length} approved listings`);
        return {
          live: true,
          vendors: V.map((v) => ({ slug: v.slug, name: v.store_name, initial: v.store_name[0].toUpperCase() })),
          listings: L.filter((l) => vm[l.vendor_id]).map((l) => ({ id: l.id, slug: l.slug, vendor: vm[l.vendor_id].slug, category: l.category, type: l.type, priceKes: l.price_cents / 100, title: l.title, summary: l.summary, description: l.description || l.summary, includes: l.includes || [], tags: l.tags || [], deliveryDays: l.delivery_days || 0, demo: !!l.is_demo, image: l.image_url || '' }))
        };
      }
    } catch (e) { console.warn('⚠ Could not reach Supabase, falling back to placeholders:', e.message); }
  }
  return { live: false, vendors: seedVendors, listings: seedListings };
}

/* ---------------------------------------------------------------- layout */
function header() {
  return `<a class="skip" href="#main">Skip to content</a>
<div class="announce">🇰🇪 Pay with <b>M-Pesa</b> or card · Instant downloads · Vendors paid securely · <a href="/sell/">Sell on ${h(site.name)}</a></div>
<div class="mode-banner hide" id="modeBanner"><b>Preview mode:</b> sample listings and demo dashboards. Live accounts, payments and payouts switch on automatically once Supabase and Paystack keys are added in Netlify.</div>
<header class="topbar"><div class="wrap">
<a class="brand" href="/" aria-label="${h(site.name)} home"><span class="brand-mark">N</span><span>NEXORA<span class="brand-light"> DIGITAL</span></span></a>
<nav class="nav" id="mainNav" aria-label="Main"><a href="/marketplace/">Marketplace</a><a href="/category/web-development/">Web</a><a href="/category/seo-marketing/">SEO &amp; Marketing</a><a href="/category/business-templates/">Templates</a><a href="/sell/" id="sellLink">Sell</a><a href="/help/">Help</a><a href="/admin/" class="hide" id="adminLink">Admin</a></nav>
<form class="navsearch js-search" role="search"><input type="search" placeholder="Search services &amp; downloads" aria-label="Search"><button aria-label="Search">⌕</button></form>
<div class="nav-actions"><select class="select-mini hide-sm" id="curSel" aria-label="Display currency"><option>KES</option><option>USD</option><option>EUR</option><option>GBP</option></select><a class="btn btn-line btn-sm hide-sm" id="acctLink" href="/account/">Sign in</a><a class="btn btn-dark btn-sm cart-btn" href="/checkout/">Cart <span class="count cart-count">0</span></a><button class="menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false">☰</button></div>
</div></header>
<div class="catbar" aria-label="Categories"><div class="wrap">${categories.map((c) => `<a href="/category/${c.slug}/">${h(c.name)}</a>`).join('')}</div></div>`;
}
function footer() {
  return `<section class="newsletter"><div class="wrap"><div><span class="eyebrow dark">The Nexora Note</span><h2>New listings &amp; selling tips, monthly.</h2><p>No spam. Unsubscribe anytime.</p></div><form class="js-newsletter" novalidate><div class="hp"><input type="text" tabindex="-1" autocomplete="off" aria-hidden="true"></div><input type="email" required placeholder="Your email address" aria-label="Email address"><button class="btn btn-dark">Subscribe</button></form></div></section>
<footer class="site"><div class="wrap"><div class="cols">
<div><a class="brand" href="/"><span class="brand-mark">N</span><span>NEXORA<span class="brand-light"> DIGITAL</span></span></a><p>${h(site.tagline)}. Hire trusted vendors or sell your skills and downloads to customers in Kenya and worldwide.</p><div class="paychips"><span>M-PESA</span><span>VISA</span><span>MASTERCARD</span><span>Paystack</span></div></div>
<div><h4>Marketplace</h4>${categories.slice(0, 6).map((c) => `<a href="/category/${c.slug}/">${h(c.name)}</a>`).join('')}<a href="/marketplace/">All listings</a></div>
<div><h4>Company</h4><a href="/sell/">Become a vendor</a><a href="/about/">About us</a><a href="/blog/">Blog &amp; guides</a><a href="/help/">Help centre</a><a href="/contact/">Contact</a><a href="/legal/terms/">Terms of service</a><a href="/legal/privacy/">Privacy policy</a><a href="/legal/refunds/">Refund policy</a></div>
<div><h4>Contact</h4><a href="tel:+${site.phoneIntl}">${h(site.phone)}</a><a href="mailto:${site.email}">${h(site.email)}</a><a href="https://wa.me/${site.phoneIntl}" rel="noopener">WhatsApp chat</a><span>${h(site.city)}, ${h(site.country)}</span><span>Contact person: ${h(site.owner)}</span></div>
</div><div class="legal"><span>© ${new Date().getFullYear()} ${h(site.legalName)}. All rights reserved.</span><span>Prices in KES. Other currencies are approximate.</span></div></div></footer>`;
}

function page({ url, title, desc, body, schema = [], noindex = false, scripts = [], bodyAttr = '', og = '/assets/img/og-image.png', type = 'website' }) {
  const canon = SITE_URL + url;
  const robots = noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">';
  return `<!doctype html>
<html lang="en-KE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${h(title)}</title>
<meta name="description" content="${h(desc)}">
${robots}
<link rel="canonical" href="${canon}">
${noindex ? '' : `<link rel="alternate" hreflang="en-ke" href="${canon}"><link rel="alternate" hreflang="x-default" href="${canon}">`}
<meta name="theme-color" content="#101827">
<meta name="geo.region" content="KE"><meta name="geo.placename" content="${h(site.city)}">
${GSC ? `<meta name="google-site-verification" content="${h(GSC)}">` : ''}
<meta property="og:type" content="${type}"><meta property="og:site_name" content="${h(site.name)}"><meta property="og:title" content="${h(title)}"><meta property="og:description" content="${h(desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${SITE_URL}${og}"><meta property="og:locale" content="en_KE">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${h(title)}"><meta name="twitter:description" content="${h(desc)}"><meta name="twitter:image" content="${SITE_URL}${og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
${schema.map(ld).join('\n')}
</head>
<body ${bodyAttr}>
${header()}
<main id="main">${body}</main>
${footer()}
<script src="/assets/js/art.js"></script><script src="/assets/js/core.js"></script>${scripts.map((s) => `<script src="/assets/js/${s}" defer></script>`).join('')}
</body></html>`;
}

const crumbs = (items) => `<nav class="crumbs wrap" aria-label="Breadcrumb">${items.map(([n, u], i) => (u ? `<a href="${u}">${h(n)}</a>` : `<b>${h(n)}</b>`) + (i < items.length - 1 ? '<span>›</span>' : '')).join('')}</nav>`;
const crumbLD = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, ...(u ? { item: SITE_URL + u } : {}) })) });
const faqLD = (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const faqHTML = (faq) => `<div class="faq">${faq.map(([q, a]) => `<details><summary>${h(q)}</summary><p>${h(a)}</p></details>`).join('')}</div>`;

/* ----------------------------------------------------------------- cards */
function imgFor(l) { return l.image || `/assets/img/listings/${l.slug}.svg`; }
function card(l, vmap) {
  const v = vmap[l.vendor] || { name: 'Vendor', initial: 'V' }, url = `/product/${l.slug}/`;
  return `<article class="card"><a class="art" href="${url}" tabindex="-1" aria-hidden="true"><img src="${h(imgFor(l))}" alt="" width="640" height="400" loading="lazy"><span class="badge">${l.type === 'digital' ? '⬇ Instant download' : '✦ Service'}</span>${l.demo ? '<span class="badge demo">Sample</span>' : ''}</a><div class="body"><span class="cat-l">${h(catBy[l.category]?.name || l.category)}</span><h3><a href="${url}">${h(l.title)}</a></h3><p>${h(l.summary)}</p><div class="vendor-line"><span class="avatar">${h(v.initial)}</span><span>${h(v.name)}</span></div><div class="buy"><span class="price"><span data-cents="${Math.round(l.priceKes * 100)}">${kes(l.priceKes)}</span><small>${l.type === 'digital' ? 'one-time' : l.deliveryDays ? `delivery in ${l.deliveryDays} days` : 'service'}</small></span><button class="btn btn-dark btn-sm" data-add="${h(l.id)}">Add to cart</button></div></div></article>`;
}

/* ----------------------------------------------------------------- pages */
const HOME_FAQ = [
  ['What is Nexora Digital?', 'Nexora Digital is a multi-vendor marketplace where customers in Kenya and around the world buy digital services and downloadable products — websites, SEO, design, templates, spreadsheets, writing, video and courses — from independent vendors.'],
  ['How do I pay on Nexora Digital?', 'You can pay with M-Pesa or a Visa/Mastercard card on a secure Paystack checkout. Prices are in Kenyan shillings (KES); other currencies shown are approximate.'],
  ['How do digital downloads work?', 'After your payment is confirmed, your files are available immediately in your account and on the confirmation page via a secure, expiring download link.'],
  ['How do vendors get paid?', 'Commission is deducted automatically on each sale. After a short buyer-protection window, vendor earnings are paid out to their M-Pesa on an automated schedule — no invoicing needed.'],
  ['How much does it cost to sell?', `Listing is free. Nexora Digital keeps a ${Math.round(site.defaultCommission * 100)}% commission on each completed sale (custom rates may apply to selected vendors).`],
  ['Is it safe to buy from vendors on Nexora Digital?', 'Vendors are reviewed before they can list, listings are approved before they appear, and payment is taken through the platform so every order is recorded and refundable under our refund policy.']
];

function build(data) {
  const { vendors, listings } = data;
  const vmap = Object.fromEntries(vendors.map((v) => [v.slug, v]));
  const sitemap = [];
  const add = (u, pr = '0.7', cf = 'weekly') => sitemap.push({ u, pr, cf });

  // clean generated dirs
  for (const d of ['product', 'category', 'blog', 'legal', 'assets/img/listings']) fs.rmSync(path.join(PUB, d), { recursive: true, force: true });

  // placeholder artwork + catalogue JSON for the client
  for (const l of listings) if (!l.image) write(`assets/img/listings/${l.slug}.svg`, Art.svg(l.category, l.slug));
  write('assets/data/catalog.json', JSON.stringify({ categories, vendors, listings, live: data.live, built: TODAY }));

  /* ---- home ---- */
  const featured = listings.slice(0, 8);
  const heroCats = [['web-development', 'Websites'], ['business-templates', 'Business templates'], ['data-spreadsheets', 'Excel dashboards']];
  const orgLD = {
    '@context': 'https://schema.org', '@type': 'Organization', name: site.name, url: SITE_URL, logo: SITE_URL + '/favicon.svg', description: site.description, founder: { '@type': 'Person', name: site.owner },
    contactPoint: { '@type': 'ContactPoint', telephone: site.phone, email: site.email, contactType: 'customer support', areaServed: 'KE', availableLanguage: ['en', 'sw'] },
    address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: site.countryCode }, sameAs: Object.values(site.social).filter(Boolean)
  };
  const websiteLD = { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: SITE_URL, inLanguage: 'en-KE', potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/marketplace/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' } };
  write('index.html', page({
    url: '/', title: `${site.name} | Digital Services & Downloads Marketplace in Kenya`,
    desc: 'Hire web designers, SEO experts, writers and creatives — or download templates, Excel dashboards and eBooks. Pay with M-Pesa or card on Kenya’s multi-vendor digital marketplace.',
    schema: [orgLD, websiteLD, faqLD(HOME_FAQ)], scripts: ['home.js'],
    body: `<section class="hero"><div class="wrap"><div>
<span class="eyebrow">Kenya’s digital marketplace</span>
<h1>Great digital work. <em>Made easy to buy &amp; sell.</em></h1>
<p class="lead">Hire trusted web designers, SEO specialists, writers and creatives — or download ready-made templates and tools. Pay with M-Pesa or card. Vendors earn with automatic payouts.</p>
<form class="herosearch js-search" role="search"><select aria-label="Category"><option value="">All categories</option>${categories.map((c) => `<option value="${c.slug}">${h(c.name)}</option>`).join('')}</select><input type="search" placeholder="Try “logo design”, “Excel template”, “SEO audit”…" aria-label="Search the marketplace"><button class="btn btn-primary">Search</button></form>
<div class="chips"><span>Popular:</span><a href="/category/web-development/">Web design Kenya</a><a href="/category/seo-marketing/">SEO services</a><a href="/category/business-templates/">Business plan template</a><a href="/category/design-branding/">Logo design</a><a href="/category/data-spreadsheets/">Excel dashboards</a></div>
<div class="trust"><span><i>✓</i> M-Pesa &amp; card payments</span><span><i>✓</i> Instant secure downloads</span><span><i>✓</i> Approved vendors only</span></div></div>
<div class="hero-art" aria-hidden="true">${heroCats.map(([c, n], i) => `<div class="hero-card ${'abc'[i]}"><img src="${Art.dataUri(c, 'hero' + i)}" alt="" width="320" height="200"><div class="cap"><b>${n}</b><span>Browse ${h(catBy[c].name)}</span></div></div>`).join('')}<div class="chipfloat" style="left:0;bottom:70px"><i>✓</i>Paid via M-Pesa</div><div class="chipfloat" style="right:6%;top:20px"><i>⬇</i>Instant download</div></div></div></section>

<section class="s"><div class="wrap"><div class="head"><div><span class="eyebrow dark">Browse by category</span><h2>Everything your business needs, in one marketplace</h2></div><a class="link-more" href="/marketplace/">View all listings →</a></div>
<div class="cats">${categories.map((c) => `<a class="cat" href="/category/${c.slug}/"><div class="ic" aria-hidden="true">${c.icon}</div><h3>${h(c.name)}</h3><p>${h(c.short)}</p></a>`).join('')}</div></div></section>

<section class="s alt"><div class="wrap"><div class="head"><div><span class="eyebrow dark">Featured</span><h2>Popular services &amp; downloads</h2><p>Hand-picked offers from approved vendors.</p></div><a class="link-more" href="/marketplace/">See everything →</a></div>
<div class="grid" id="featured">${featured.length ? featured.map((l) => card(l, vmap)).join('') : '<div class="empty" style="grid-column:1/-1"><h3>The marketplace is opening soon</h3><p>Be one of the first vendors on Nexora Digital.</p><a class="btn btn-primary" href="/sell/">Become a vendor</a></div>'}</div></div></section>

<section class="s"><div class="wrap"><div class="head"><div><span class="eyebrow dark">How it works</span><h2>Buy in three simple steps</h2></div></div>
<div class="steps"><div class="step"><span class="n">01</span><h3>Find what you need</h3><p>Search or browse categories and compare vendors, prices and what’s included.</p></div><div class="step"><span class="n">02</span><h3>Pay securely</h3><p>Check out with M-Pesa or card. Every order is recorded and protected by our refund policy.</p></div><div class="step"><span class="n">03</span><h3>Get it delivered</h3><p>Downloads unlock instantly. Services are delivered to your account — confirm when you’re happy.</p></div></div></div></section>

<section class="s alt"><div class="wrap"><div class="feature-row">
<div class="feature"><i>◈</i><h3>Secure payments</h3><p>M-Pesa and card payments through Paystack. We never store your card details.</p></div>
<div class="feature"><i>⬇</i><h3>Instant downloads</h3><p>Expiring, private download links delivered the moment payment clears.</p></div>
<div class="feature"><i>✓</i><h3>Approved vendors</h3><p>Every vendor and every listing is reviewed before it goes live.</p></div>
<div class="feature"><i>⇄</i><h3>Automatic vendor payouts</h3><p>Commission is calculated automatically and earnings are paid to M-Pesa.</p></div></div></div></section>

<section class="s"><div class="wrap"><div class="split"><div class="panel dark"><span class="eyebrow">For vendors</span><h2>Turn your skills into steady income</h2><p>Open a free vendor account, list your services and downloads, and get paid straight to M-Pesa.</p><ul><li>Free to list — pay ${Math.round(site.defaultCommission * 100)}% only when you sell</li><li>Dashboard for listings, orders and earnings</li><li>Automatic payouts after a ${site.payoutHoldDays}-day buyer-protection window</li></ul><a class="btn btn-primary" href="/sell/">Start selling ↗</a></div>
<div class="panel light"><span class="eyebrow dark">For customers</span><h2>Hire and download with confidence</h2><p>Compare real offers from independent professionals and pay in the way you already know.</p><ul><li>Clear prices and “what’s included” on every listing</li><li>Pay with M-Pesa or card in KES</li><li>Your orders and downloads, always in your account</li></ul><a class="btn btn-dark" href="/marketplace/">Browse the marketplace ↗</a></div></div></div></section>

<section class="s alt"><div class="wrap"><div class="head"><div><span class="eyebrow dark">Guides</span><h2>Learn, sell and hire smarter</h2></div><a class="link-more" href="/blog/">All guides →</a></div><div class="grid three">${articles.map((a) => `<article class="card"><div class="body"><span class="cat-l">${h(a.cat)}</span><h3><a href="/blog/${a.slug}/">${h(a.title)}</a></h3><p>${h(a.meta)}</p><div class="buy"><a class="link-more" href="/blog/${a.slug}/">Read guide →</a></div></div></article>`).join('')}</div></div></section>

<section class="s"><div class="wrap" style="max-width:900px"><div class="head"><div><span class="eyebrow dark">FAQ</span><h2>Questions, answered</h2></div></div>${faqHTML(HOME_FAQ)}</div></section>`
  }));
  add('/', '1.0', 'daily');

  /* ---- marketplace ---- */
  const itemList = (ls) => ({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: ls.slice(0, 50).map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/product/${l.slug}/`, name: l.title })) });
  write('marketplace/index.html', page({
    url: '/marketplace/', title: `Browse Services & Digital Downloads | ${site.name}`, desc: 'Search web design, SEO, graphic design, business templates, Excel dashboards, writing, video and courses from approved vendors in Kenya. Pay with M-Pesa.',
    schema: [crumbLD([['Home', '/'], ['Marketplace', null]]), itemList(listings)], scripts: ['market.js'],
    body: `${crumbs([['Home', '/'], ['Marketplace']])}<div class="wrap"><div class="pagehead"><h1>Browse the marketplace</h1><p>Search services and downloads from approved vendors. Filter by category, type and budget.</p></div>
<div class="browse"><aside class="filters" aria-label="Filters"><h4>Search</h4><input type="search" id="q" placeholder="Keyword…" aria-label="Keyword"><h4>Category</h4>${categories.map((c) => `<label class="opt"><input type="checkbox" name="cat" value="${c.slug}"> ${h(c.name)}</label>`).join('')}<h4>Type</h4><label class="opt"><input type="radio" name="type" value="digital"> Digital downloads</label><label class="opt"><input type="radio" name="type" value="service"> Services</label><h4>Max price (KES)</h4><select id="max"><option value="0">Any price</option><option value="500">Up to 500</option><option value="1000">Up to 1,000</option><option value="5000">Up to 5,000</option><option value="10000">Up to 10,000</option></select><button class="btn btn-line btn-sm" id="reset" style="margin-top:16px;width:100%">Reset filters</button></aside>
<div><div class="toolbar"><span class="count" id="count" aria-live="polite">${listings.length} results</span><label class="sr" for="sort">Sort</label><select id="sort" class="select-mini" style="width:auto"><option value="new">Newest</option><option value="popular">Most popular</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>
<div class="grid three" id="grid">${listings.map((l) => card(l, vmap)).join('')}</div><div class="empty" id="empty" hidden><h3>No matches</h3><p>Try a different keyword or clear your filters.</p></div></div></div></div>`
  }));
  add('/marketplace/', '0.9', 'daily');

  /* ---- categories ---- */
  for (const c of categories) {
    const ls = listings.filter((l) => l.category === c.slug), others = categories.filter((x) => x.slug !== c.slug);
    write(`category/${c.slug}/index.html`, page({
      url: `/category/${c.slug}/`, title: c.title, desc: c.meta, scripts: [],
      schema: [crumbLD([['Home', '/'], ['Marketplace', '/marketplace/'], [c.name, null]]), faqLD(c.faq), ...(ls.length ? [itemList(ls)] : [])],
      body: `${crumbs([['Home', '/'], ['Marketplace', '/marketplace/'], [c.name]])}<div class="wrap"><div class="pagehead"><h1>${h(c.h1)}</h1><p>${h(c.intro)}</p><div class="kw">${c.keywords.map((k) => `<span>${h(k)}</span>`).join('')}</div></div>
<div class="grid" style="margin:30px 0 20px">${ls.length ? ls.map((l) => card(l, vmap)).join('') : `<div class="empty" style="grid-column:1/-1"><h3>No ${h(c.name)} listings yet</h3><p>Be the first to sell in this category.</p><a class="btn btn-primary" href="/sell/">Become a vendor</a></div>`}</div></div>
<section class="s alt"><div class="wrap" style="max-width:900px"><div class="head"><div><h2>${h(c.name)}: frequently asked questions</h2></div></div>${faqHTML(c.faq)}</div></section>
<section class="s"><div class="wrap"><div class="head"><div><h2>Explore more categories</h2></div></div><div class="cats">${others.slice(0, 4).map((x) => `<a class="cat" href="/category/${x.slug}/"><div class="ic" aria-hidden="true">${x.icon}</div><h3>${h(x.name)}</h3><p>${h(x.short)}</p></a>`).join('')}</div></div></section>`
    }));
    add(`/category/${c.slug}/`, '0.9', 'weekly');
  }

  /* ---- product pages + live fallback ---- */
  for (const l of listings) {
    const c = catBy[l.category] || { name: l.category, slug: l.category }, v = vmap[l.vendor] || { name: 'Vendor', initial: 'V' };
    const rel = listings.filter((x) => x.category === l.category && x.slug !== l.slug).slice(0, 4);
    const url = `/product/${l.slug}/`, img = SITE_URL + imgFor(l);
    const title = `${l.title} | ${c.name} | ${site.name}`.slice(0, 70);
    const base = { name: l.title, description: l.summary, image: img, url: SITE_URL + url, brand: { '@type': 'Brand', name: v.name } };
    const offer = { '@type': 'Offer', url: SITE_URL + url, priceCurrency: 'KES', price: l.priceKes.toFixed(2), availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: v.name } };
    const prodLD = l.type === 'digital' ? { '@context': 'https://schema.org', '@type': 'Product', ...base, category: c.name, offers: offer } : { '@context': 'https://schema.org', '@type': 'Service', ...base, serviceType: c.name, provider: { '@type': 'Organization', name: v.name }, areaServed: 'KE', offers: offer };
    write(`product/${l.slug}/index.html`, page({
      url, title, desc: l.summary.slice(0, 155), og: imgFor(l), type: 'product', bodyAttr: '', scripts: ['product.js'],
      schema: [crumbLD([['Home', '/'], ['Marketplace', '/marketplace/'], [c.name, `/category/${c.slug}/`], [l.title, null]]), prodLD],
      body: `${crumbs([['Home', '/'], ['Marketplace', '/marketplace/'], [c.name, `/category/${c.slug}/`], [l.title]])}<div class="wrap"><div class="pd" id="pd" data-id="${h(l.id)}"><div>
<div class="hero-img"><img src="${h(imgFor(l))}" alt="${h(l.title)} — ${h(c.name)} on ${h(site.name)}" width="1280" height="800"></div>
<h2 style="margin:30px 0 10px;font-size:24px">About this ${l.type === 'digital' ? 'download' : 'service'}</h2><div class="prose"><p>${h(l.description)}</p></div>
${l.includes.length ? `<h2 style="margin:30px 0 10px;font-size:24px">What’s included</h2><ul class="includes">${l.includes.map((i) => `<li>${h(i)}</li>`).join('')}</ul>` : ''}
<h2 style="margin:30px 0 10px;font-size:24px">How it works</h2><div class="prose"><p>${l.type === 'digital' ? 'Pay with M-Pesa or card, then download your file instantly from the confirmation page or your account. Downloads use secure, expiring links.' : `Pay securely through ${h(site.name)}. The vendor starts work and delivers${l.deliveryDays ? ` within about ${l.deliveryDays} days` : ''} to your account. Confirm delivery when you are satisfied.`}</p></div>
<h2 style="margin:30px 0 10px;font-size:24px">Reviews</h2><div id="reviews"><p class="muted">No reviews yet. Verified buyers can review after their order.</p></div></div>
<aside class="buybox"><span class="badge" style="background:var(--greenbg);color:var(--green)">${l.type === 'digital' ? '⬇ Instant download' : '✦ Service'}</span><h1>${h(l.title)}</h1><p class="muted">${h(l.summary)}</p><div class="big" data-cents="${Math.round(l.priceKes * 100)}">${kes(l.priceKes)}</div>
<ul><li>${l.type === 'digital' ? 'Instant, secure download' : 'Delivered to your account'}</li><li>Pay with M-Pesa or card</li><li>Covered by our refund policy</li></ul>
<button class="btn btn-primary" data-buy="${h(l.id)}">Buy now</button><button class="btn btn-line" data-add="${h(l.id)}">Add to cart</button>
<div class="vendor-line" style="margin-top:18px"><span class="avatar">${h(v.initial)}</span><span>Sold by <b>${h(v.name)}</b></span></div>${l.demo ? '<div class="alert warn" style="margin-bottom:0">Sample listing — placeholder content shown while the marketplace is in preview.</div>' : ''}<div class="secure"><span>🔒 Secure checkout</span><span>M-Pesa · Visa · Mastercard</span></div></aside></div>
${rel.length ? `<div class="head"><div><h2>Related in ${h(c.name)}</h2></div></div><div class="grid" style="margin-bottom:60px">${rel.map((x) => card(x, vmap)).join('')}</div>` : ''}</div>`
    }));
    add(url, '0.8', 'weekly');
  }
  write('product-live.html', page({ url: '/product/', title: `Listing | ${site.name}`, desc: 'Digital service or download on Nexora Digital.', noindex: true, scripts: ['product.js'], body: `<div class="wrap"><div class="pd" id="pd" data-live style="padding-top:40px"><div class="skeleton" style="min-height:400px"></div></div></div>` }));

  /* ---- app pages (noindex) ---- */
  write('account/index.html', page({ url: '/account/', title: `My Account | ${site.name}`, desc: 'Sign in, manage orders and downloads.', noindex: true, scripts: ['account.js'], body: `<div id="acct"><div class="wrap" style="padding:60px 0"><div class="skeleton"></div></div></div>` }));
  write('vendor/index.html', page({ url: '/vendor/', title: `Vendor Dashboard | ${site.name}`, desc: 'Manage your listings, orders and payouts.', noindex: true, scripts: ['vendor.js'], body: `<div id="app"><div class="wrap" style="padding:60px 0"><div class="skeleton"></div></div></div>` }));
  write('admin/index.html', page({ url: '/admin/', title: `Admin | ${site.name}`, desc: 'Marketplace administration.', noindex: true, scripts: ['admin.js'], body: `<div id="app"><div class="wrap" style="padding:60px 0"><div class="skeleton"></div></div></div>` }));
  write('checkout/index.html', page({ url: '/checkout/', title: `Cart & Checkout | ${site.name}`, desc: 'Review your cart and pay securely with M-Pesa or card.', noindex: true, scripts: ['checkout.js'], bodyAttr: 'data-page="cart"',
    body: `<div class="wrap"><div class="pagehead"><h1>Your cart</h1></div><div class="checkout"><div id="cart"></div><aside class="buybox" id="summary" hidden><h3 style="font-size:19px;margin-bottom:12px">Order summary</h3><div class="sumline"><span>Subtotal</span><span id="subtotal"></span></div><div class="sumline total"><span>Total (KES)</span><span id="total"></span></div><p class="hint" id="approx"></p><button class="btn btn-primary" id="pay">Pay securely</button><div class="secure"><span>🔒 Encrypted checkout</span><span>M-Pesa · Visa · Mastercard</span></div><p class="hint">You will be redirected to Paystack to complete payment. Downloads unlock instantly afterwards.</p></aside></div></div>` }));
  write('checkout/complete/index.html', page({ url: '/checkout/complete/', title: `Order Confirmation | ${site.name}`, desc: 'Your order confirmation and downloads.', noindex: true, scripts: ['checkout.js'], bodyAttr: 'data-page="complete"',
    body: `<div class="wrap" style="max-width:820px"><div class="pagehead"><h1>Order confirmation</h1></div><div id="result" style="padding-bottom:70px"><div class="alert info">Confirming your payment…</div><div class="skeleton"></div></div></div>` }));

  /* ---- sell ---- */
  const SELL_FAQ = [
    ['How much does it cost to sell on Nexora Digital?', `Opening a vendor account and listing is free. We keep a ${Math.round(site.defaultCommission * 100)}% commission on each completed sale; the rest is yours.`],
    ['How and when do I get paid?', `Earnings are held for ${site.payoutHoldDays} days for buyer protection, then paid automatically to your M-Pesa on the daily payout run once you reach the minimum payout.`],
    ['What can I sell?', 'Digital services (web design, SEO, writing, design, video, data work) and downloadable products (templates, spreadsheets, eBooks, courses, graphics).'],
    ['How long does vendor approval take?', 'We aim to review applications and listings within 1–2 business days.'],
    ['Do I need a business registration?', 'Not to start. You are responsible for your own taxes and any licences your work requires.']
  ];
  write('sell/index.html', page({
    url: '/sell/', title: `Sell Digital Products & Services in Kenya | Become a Vendor | ${site.name}`, desc: `Sell templates, downloads and freelance services online in Kenya. Free to list, ${Math.round(site.defaultCommission * 100)}% commission, automatic M-Pesa payouts. Apply to become a Nexora Digital vendor.`,
    schema: [crumbLD([['Home', '/'], ['Sell', null]]), faqLD(SELL_FAQ)],
    body: `<section class="hero"><div class="wrap"><div><span class="eyebrow">Become a vendor</span><h1>Sell your skills to <em>customers across Kenya &amp; beyond</em></h1><p class="lead">Free to list. Commission is automatic. Earnings are paid straight to your M-Pesa. Build a store for your services, templates and digital downloads.</p><div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-primary" href="/account/?mode=vendor">Apply to sell ↗</a><a class="btn btn-ghost" href="/vendor/">Preview vendor dashboard</a></div><div class="trust"><span><i>✓</i> Free to list</span><span><i>✓</i> ${Math.round(site.defaultCommission * 100)}% commission only when you sell</span><span><i>✓</i> Daily automated payouts</span></div></div>
<div class="hero-art" aria-hidden="true"><div class="hero-card a"><img src="${Art.dataUri('data-spreadsheets', 's1')}" alt="" width="320" height="200"><div class="cap"><b>Your listing here</b><span>Reach new customers</span></div></div><div class="hero-card b"><img src="${Art.dataUri('design-branding', 's2')}" alt="" width="320" height="200"><div class="cap"><b>Track every sale</b><span>Orders &amp; earnings dashboard</span></div></div></div></div></section>
<section class="s"><div class="wrap"><div class="head"><div><span class="eyebrow dark">How selling works</span><h2>From application to payout in four steps</h2></div></div><div class="feature-row">
<div class="feature"><i>①</i><h3>Register &amp; apply</h3><p>Create an account and tell us about your store. We review applications within 1–2 business days.</p></div>
<div class="feature"><i>②</i><h3>Create listings</h3><p>Add titles, pricing, images and files. Submit for approval — approved listings go live automatically.</p></div>
<div class="feature"><i>③</i><h3>Sell &amp; deliver</h3><p>Downloads are delivered instantly. For services, deliver files and notes from your dashboard.</p></div>
<div class="feature"><i>④</i><h3>Get paid</h3><p>Commission is deducted automatically and your earnings arrive by M-Pesa on the daily payout run.</p></div></div></div></section>
<section class="s alt"><div class="wrap"><div class="head"><div><span class="eyebrow dark">Fees &amp; payouts</span><h2>Simple, transparent pricing</h2></div></div><div class="box"><div class="tablewrap"><table><tbody><tr><td><b>Listing fee</b></td><td>Free</td></tr><tr><td><b>Marketplace commission</b></td><td>${Math.round(site.defaultCommission * 100)}% of each completed sale</td></tr><tr><td><b>Buyer-protection hold</b></td><td>${site.payoutHoldDays} days (shorter once the buyer confirms delivery)</td></tr><tr><td><b>Payout schedule</b></td><td>Automatic, daily — to M-Pesa</td></tr><tr><td><b>Minimum payout</b></td><td>KSh 500</td></tr></tbody></table></div></div></div></section>
<section class="s"><div class="wrap" style="max-width:900px"><div class="head"><div><span class="eyebrow dark">Vendor FAQ</span><h2>Selling questions</h2></div></div>${faqHTML(SELL_FAQ)}<p style="margin-top:30px"><a class="btn btn-primary" href="/account/?mode=vendor">Apply to sell ↗</a> <a class="btn btn-line" href="/legal/vendor-agreement/">Read the vendor agreement</a></p></div></section>`
  }));
  add('/sell/', '0.8', 'monthly');

  /* ---- about / contact / help ---- */
  write('about/index.html', page({ url: '/about/', title: `About ${site.name} | Kenya’s Digital Services Marketplace`, desc: `${site.name} connects Kenyan freelancers and creators with customers worldwide through a secure multi-vendor marketplace for digital services and downloads.`, schema: [crumbLD([['Home', '/'], ['About', null]]), orgLD],
    body: `${crumbs([['Home', '/'], ['About']])}<div class="wrap"><div class="pagehead"><h1>About ${h(site.name)}</h1><p>A marketplace built so talented people can sell digital work — and customers can buy it with confidence.</p></div><div class="prose" style="padding-bottom:70px"><h2>Our mission</h2><p>${h(site.name)} makes it easy to buy and sell digital services and downloads. We built a secure, mobile-money-friendly marketplace where Kenyan freelancers, studios and creators can reach customers locally and internationally.</p><h2>How we work</h2><p>Every vendor is reviewed before they can list, and every listing is approved before it appears. Payments run through Paystack so customers can pay with M-Pesa or card, and vendors are paid automatically after a short buyer-protection window.</p><h2>Who is behind it</h2><p>${h(site.name)} is operated by ${h(site.owner)} in ${h(site.city)}, ${h(site.country)}.</p><h2>Contact</h2><p>Phone / WhatsApp: <a href="tel:+${site.phoneIntl}">${h(site.phone)}</a><br>Email: <a href="mailto:${site.email}">${h(site.email)}</a></p></div></div>` }));
  add('/about/', '0.5', 'monthly');
  write('contact/index.html', page({ url: '/contact/', title: `Contact ${site.name} | Support in Nairobi, Kenya`, desc: `Contact ${site.name} — call or WhatsApp ${site.phone}, email ${site.email}, or send a message.`, schema: [crumbLD([['Home', '/'], ['Contact', null]]), { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact', url: SITE_URL + '/contact/' }], scripts: ['contact.js'],
    body: `${crumbs([['Home', '/'], ['Contact']])}<div class="wrap"><div class="pagehead"><h1>Contact us</h1><p>Questions about an order, selling, or partnerships? We usually reply within one business day.</p></div><div class="checkout" style="padding-top:10px"><form id="cf" class="box" novalidate><div class="hp"><input type="text" id="hp" tabindex="-1" autocomplete="off" aria-hidden="true"></div><div class="row2"><div class="field"><label for="cn">Your name</label><input id="cn" type="text" required></div><div class="field"><label for="ce">Email</label><input id="ce" type="email" required></div></div><div class="field"><label for="cs">Subject</label><input id="cs" type="text" required></div><div class="field"><label for="cm">Message</label><textarea id="cm" required minlength="5"></textarea></div><button class="btn btn-dark">Send message</button><div id="cmsg"></div></form>
<aside class="box"><h3>Reach us directly</h3><p><b>${h(site.owner)}</b><br>${h(site.city)}, ${h(site.country)}</p><p>📞 <a href="tel:+${site.phoneIntl}">${h(site.phone)}</a><br>💬 <a href="https://wa.me/${site.phoneIntl}" rel="noopener">WhatsApp</a><br>✉ <a href="mailto:${site.email}">${h(site.email)}</a></p></aside></div></div>` }));
  add('/contact/', '0.5', 'monthly');

  const HELP = [
    ['Buying', [['How do I buy something?', 'Add items to your cart, sign in or create an account, and pay with M-Pesa or card. You are redirected to Paystack’s secure page and return here when done.'], ['Where do I find my downloads?', 'On the confirmation page right after payment and any time under My account → Orders & downloads.'], ['What if a vendor does not deliver?', 'Contact us from your order. If a service is not delivered as described, you can request a refund under our refund policy.']]],
    ['Selling', [['How do I become a vendor?', 'Create an account, choose “Sell”, and submit your store application. Approved vendors can create listings.'], ['Why is my listing pending?', 'All listings are reviewed before going live. Editing a live listing sends it back for a quick re-check.'], ['How are payouts calculated?', 'Each sale shows price, commission and your net earning in your dashboard. Net earnings are paid to M-Pesa after the protection window.']]],
    ['Payments & refunds', [['Which payment methods do you accept?', 'M-Pesa and Visa/Mastercard cards via Paystack. Prices are in KES.'], ['Is my payment information safe?', 'Payments are processed by Paystack. Nexora Digital never sees or stores your card number or M-Pesa PIN.'], ['How do refunds work?', 'See our refund policy. Approved refunds are returned to your original payment method.']]]
  ];
  const helpAll = HELP.flatMap(([, q]) => q);
  write('help/index.html', page({ url: '/help/', title: `Help Centre & FAQs | ${site.name}`, desc: 'Answers about buying, selling, payments, downloads, vendor payouts and refunds on Nexora Digital.', schema: [crumbLD([['Home', '/'], ['Help', null]]), faqLD(helpAll)],
    body: `${crumbs([['Home', '/'], ['Help centre']])}<div class="wrap" style="max-width:900px"><div class="pagehead"><h1>Help centre</h1><p>Quick answers to common questions. Still stuck? <a href="/contact/" style="color:var(--green);text-decoration:underline">Contact us</a>.</p></div>${HELP.map(([t, q]) => `<h2 style="margin:34px 0 6px;font-size:22px">${t}</h2>${faqHTML(q)}`).join('')}<div style="height:70px"></div></div>` }));
  add('/help/', '0.6', 'monthly');

  /* ---- blog ---- */
  write('blog/index.html', page({ url: '/blog/', title: `Guides: Sell, Hire & Grow Online in Kenya | ${site.name} Blog`, desc: 'Practical guides on selling digital products in Kenya, hiring freelancers safely and local SEO for small businesses.', schema: [crumbLD([['Home', '/'], ['Blog', null]])],
    body: `${crumbs([['Home', '/'], ['Blog']])}<div class="wrap"><div class="pagehead"><h1>Guides &amp; resources</h1><p>Practical advice for sellers, buyers and small businesses in Kenya.</p></div><div class="grid three" style="padding:20px 0 70px">${articles.map((a) => `<article class="card"><div class="body"><span class="cat-l">${h(a.cat)}</span><h3><a href="/blog/${a.slug}/">${h(a.title)}</a></h3><p>${h(a.meta)}</p><div class="buy"><span class="muted" style="font-size:12.5px">${a.date}</span><a class="link-more" href="/blog/${a.slug}/">Read →</a></div></div></article>`).join('')}</div></div>` }));
  add('/blog/', '0.6', 'weekly');
  for (const a of articles) {
    write(`blog/${a.slug}/index.html`, page({ url: `/blog/${a.slug}/`, title: `${a.title} | ${site.name}`.slice(0, 70), desc: a.meta, type: 'article',
      schema: [crumbLD([['Home', '/'], ['Blog', '/blog/'], [a.title, null]]), { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.meta, datePublished: a.date, dateModified: TODAY, author: { '@type': 'Person', name: site.owner }, publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: SITE_URL + '/favicon.svg' } }, mainEntityOfPage: `${SITE_URL}/blog/${a.slug}/`, image: SITE_URL + '/assets/img/og-image.png' }],
      body: `${crumbs([['Home', '/'], ['Blog', '/blog/'], [a.title]])}<div class="wrap"><article class="pagehead"><span class="eyebrow dark">${h(a.cat)}</span><h1 style="margin-top:10px">${h(a.title)}</h1><p>${h(a.meta)}</p></article><div class="prose" style="padding-bottom:40px">${a.body.map(([t, p]) => `<h2>${h(t)}</h2><p>${h(p)}</p>`).join('')}<div class="box" style="margin-top:34px"><h3>Ready to get started?</h3><p class="muted">Browse services and downloads or open your own vendor store.</p><div class="actions"><a class="btn btn-dark" href="/marketplace/">Browse marketplace</a><a class="btn btn-primary" href="/sell/">Become a vendor</a></div></div></div></div>` }));
    add(`/blog/${a.slug}/`, '0.6', 'monthly');
  }

  /* ---- legal ---- */
  const co = `${site.name} (operated by ${site.owner}, ${site.city}, ${site.country})`;
  const LEGAL = {
    terms: ['Terms of Service', [['Using the marketplace', `${co} provides an online marketplace where independent vendors sell digital services and downloads to customers. By creating an account or placing an order you agree to these terms.`], ['Accounts', 'You must provide accurate information, keep your password secure and be at least 18 years old (or have a guardian’s consent). You are responsible for activity on your account.'], ['Orders and payment', 'Prices are shown in Kenyan shillings (KES). Payment is processed by Paystack. An order is confirmed once payment succeeds. Other currencies shown on the site are approximate.'], ['Digital downloads and services', 'Downloads are delivered through secure, expiring links and may be limited to a reasonable number of downloads. Services are delivered by the vendor as described in the listing.'], ['Vendors', 'Vendors are independent sellers, not employees of Nexora Digital. They are responsible for the accuracy of their listings, the quality of their work and their own taxes.'], ['Prohibited use', 'You may not sell or buy illegal, infringing, deceptive or harmful items, manipulate reviews, or attempt to bypass the marketplace to avoid fees.'], ['Liability', 'To the extent permitted by Kenyan law, Nexora Digital is not liable for indirect losses arising from vendor work. Nothing limits liability that cannot be limited by law.'], ['Governing law', 'These terms are governed by the laws of Kenya.'], ['Contact', `${site.email} · ${site.phone}`]]],
    privacy: ['Privacy Policy', [['Who we are', `${co} is the data controller for personal data processed on this site.`], ['What we collect', 'Account details (name, email, phone), order and payment references, vendor payout details (M-Pesa number, account name), messages you send us, and technical data such as device and usage information if you accept analytics cookies.'], ['How we use it', 'To provide the marketplace, process orders and payouts, prevent fraud, provide support, and (with consent) measure and improve the site.'], ['Payments', 'Card and M-Pesa payments are handled by Paystack. We do not store your card number or M-Pesa PIN.'], ['Sharing', 'We share data with service providers that run the platform (hosting, database, payments, analytics) and with vendors only as needed to fulfil your order (for example your email for service delivery).'], ['Your rights', 'Under the Kenya Data Protection Act, 2019 you may request access, correction or deletion of your data. Contact us using the details below.'], ['Retention and security', 'We keep data only as long as needed for the purposes above and legal obligations, and protect it using access controls and encryption in transit.'], ['Cookies', 'Essential storage keeps your cart and sign-in working. Analytics cookies are used only if you accept them.'], ['Contact', `${site.email} · ${site.phone}`]]],
    refunds: ['Refund Policy', [['Digital downloads', 'Because downloads are delivered instantly, they are generally non-refundable once accessed. We will refund if the file is missing, corrupt, or materially different from its description and the vendor cannot resolve it.'], ['Services', 'If a service is not delivered, or is materially different from the listing, contact us within 7 days of the delivery date (or expected delivery date). We will review with the vendor and may refund in full or part.'], ['How to request a refund', `Email ${site.email} with your order number and a short description of the issue.`], ['How refunds are paid', 'Approved refunds are returned to the original payment method via Paystack. Timing depends on your bank or M-Pesa.'], ['Vendor earnings', 'Earnings on refunded orders are cancelled and are not paid out to the vendor.']]],
    'vendor-agreement': ['Vendor Agreement', [['Eligibility', 'Vendors must be 18 or over, provide accurate details and pass review. We may reject or suspend accounts that breach these terms.'], ['Listings', 'You must own or have the right to sell everything you list, describe it accurately and deliver what you promise. Listings are reviewed before publication; edits to live listings are re-reviewed.'], ['Commission', `Nexora Digital deducts a commission (default ${Math.round(site.defaultCommission * 100)}% of the sale price; custom rates may be agreed) on each completed sale. Payment gateway costs are covered from the commission.`], ['Payouts', `Net earnings are held for ${site.payoutHoldDays} days and then paid automatically to the payout account you register (M-Pesa, Till or Paybill) once the minimum payout is reached. You are responsible for the accuracy of those details.`], ['Refunds and disputes', 'Earnings on refunded orders are cancelled. If a refund is approved after payout, you agree we may deduct it from future earnings.'], ['Conduct', 'No off-platform payment solicitation, fake reviews, infringing or illegal content. Breach can lead to suspension and withholding of disputed earnings.'], ['Taxes', 'You are responsible for your own tax obligations on earnings.'], ['Termination', 'Either party may end this agreement at any time; outstanding eligible earnings will be paid out.']]]
  };
  for (const [slug, [t, secs]] of Object.entries(LEGAL)) {
    write(`legal/${slug}/index.html`, page({ url: `/legal/${slug}/`, title: `${t} | ${site.name}`, desc: `${t} for ${site.name}, the Kenyan marketplace for digital services and downloads. Plain-language terms for buyers and vendors, last updated ${TODAY}.`, schema: [crumbLD([['Home', '/'], [t, null]])],
      body: `${crumbs([['Home', '/'], [t]])}<div class="wrap"><div class="pagehead"><h1>${t}</h1><p>Last updated: ${TODAY}</p></div><div class="prose" style="padding-bottom:70px">${secs.map(([a, b]) => `<h2>${h(a)}</h2><p>${h(b)}</p>`).join('')}</div></div>` }));
    add(`/legal/${slug}/`, '0.3', 'yearly');
  }

  /* ---- 404 ---- */
  write('404.html', page({ url: '/404.html', title: `Page not found | ${site.name}`, desc: 'Page not found.', noindex: true, body: `<div class="wrap" style="padding:90px 0;text-align:center"><span class="eyebrow dark">404</span><h1 style="font-size:44px;margin:12px 0">We couldn’t find that page</h1><p class="muted">It may have moved or the listing is no longer available.</p><p><a class="btn btn-dark" href="/marketplace/">Browse the marketplace</a> <a class="btn btn-line" href="/">Home</a></p></div>` }));

  /* ---- sitemap, robots, manifest, favicon, netlify files ---- */
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((s) => `<url><loc>${SITE_URL}${s.u}</loc><lastmod>${TODAY}</lastmod><changefreq>${s.cf}</changefreq><priority>${s.pr}</priority></url>`).join('\n')}\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /account/\nDisallow: /vendor/\nDisallow: /admin/\nDisallow: /checkout/\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  write('manifest.webmanifest', JSON.stringify({ name: site.name, short_name: 'Nexora', description: site.description, start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#101827', icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }] }));
  write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#101827"/><text x="32" y="45" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="38" fill="#b9f3d3">N</text></svg>`);
  write('_redirects', `# Netlify redirects (also work for drag-and-drop deploys)\n/api/*  /.netlify/functions/:splat  200\n/product/*  /product-live.html  200\n`);
  write('_headers', `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)\n  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload\n  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://checkout.paystack.com\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/data/*\n  Cache-Control: public, max-age=300\n/assets/js/*\n  Cache-Control: public, max-age=3600\n/assets/css/*\n  Cache-Control: public, max-age=3600\n/api/*\n  Cache-Control: no-store\n`);

  // Optional: SQL seed for the placeholder catalogue (only meaningful for preview content)
  const q = (s) => `'${String(s).replace(/'/g, "''")}'`, arr = (a) => `array[${a.map(q).join(',')}]::text[]`;
  let sql = `-- Optional placeholder catalogue (generated by tools/build.mjs). Run AFTER schema.sql if you want sample listings visible.\n-- Everything here is flagged is_demo=true: checkout blocks it in LIVE mode (allowed in Paystack TEST mode). Remove later from Admin → Settings → "Remove demo content".\n`;
  for (const v of seedVendors) sql += `insert into public.vendors (store_name, slug, bio, country, status, is_demo) values (${q(v.name)}, ${q(v.slug)}, ${q(v.bio)}, ${q(v.country)}, 'approved', true) on conflict (slug) do nothing;\n`;
  for (const l of seedListings) sql += `insert into public.listings (vendor_id, title, slug, category, type, summary, description, includes, tags, price_cents, delivery_days, status, is_demo) select id, ${q(l.title)}, ${q(l.slug)}, ${q(l.category)}, ${q(l.type)}, ${q(l.summary)}, ${q(l.description)}, ${arr(l.includes)}, ${arr(l.tags)}, ${l.priceKes * 100}, ${l.deliveryDays}, 'approved', true from public.vendors where slug = ${q(l.vendor)} on conflict (slug) do nothing;\n`;
  fs.writeFileSync(path.join(ROOT, 'supabase', 'seed.sql'), sql);

  console.log(`✔ Built ${sitemap.length} indexable URLs → ${PUB}  (site URL: ${SITE_URL})`);
}

build(await loadData());
