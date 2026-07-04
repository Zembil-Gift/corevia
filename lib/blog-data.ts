export interface BlogPost {
  slug: string
  title: string
  description: string
  image: string
  content: string
  date: string
  author: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "building-scalable-apps-africa",
    title: "Building Scalable Apps for African Markets",
    description: "How we design and deploy solutions that perform reliably across diverse connectivity and devices.",
    image: "/modern-green-gradient-card.png",
    content: "African markets present unique opportunities and challenges for technology companies. At AfroDebab, we focus on building applications that work seamlessly across varying network conditions and device capabilities. This post explores our approach to scalability, offline-first design, and local infrastructure partnerships.",
    date: "2025-01-28",
    author: "AfroDebab Team",
  },
  {
    slug: "pan-african-tech-ecosystem",
    title: "The Pan-African Tech Ecosystem in 2025",
    description: "A look at how diaspora and local innovators are shaping the next wave of African tech.",
    image: "/modern-teal-gradient-card.png",
    content: "The Pan-African tech ecosystem continues to grow, with increased collaboration between diaspora talent and local startups. We examine key trends: fintech adoption, agritech solutions, and the rise of regional hubs. AfroDebab is proud to be part of this movement, connecting markets and building trusted platforms.",
    date: "2025-01-25",
    author: "AfroDebab Team",
  },
  {
    slug: "flutter-vs-react-native-2025",
    title: "Flutter vs React Native: Choosing in 2025",
    description: "Our experience building cross-platform apps and when we pick each stack.",
    image: "/modern-orange-gradient-card.png",
    content: "Both Flutter and React Native have matured significantly. We share our criteria for choosing between them: team skills, performance requirements, and ecosystem needs. Spoiler: there's no single winner—it depends on your product and team.",
    date: "2025-01-22",
    author: "AfroDebab Team",
  },
  {
    slug: "trust-and-compliance-digital",
    title: "Trust and Compliance in Digital Platforms",
    description: "Why governance and transparency matter for long-term success in regulated markets.",
    image: "/modern-purple-gradient-card.png",
    content: "Building trust with users and regulators is essential. We discuss our approach to data privacy, local compliance, and transparent terms of service. These practices aren't just ethical—they're good business in emerging markets.",
    date: "2025-01-18",
    author: "AfroDebab Team",
  },
  {
    slug: "connecting-diaspora-and-local",
    title: "Connecting Diaspora and Local Markets",
    description: "How technology bridges gaps between global talent and on-the-ground demand.",
    image: "/modern-red-gradient-card.png",
    content: "The diaspora brings skills, capital, and networks; local markets bring context and demand. We explore how AfroDebab facilitates this connection through our products and partnerships, and what we've learned along the way.",
    date: "2025-01-15",
    author: "AfroDebab Team",
  },
  {
    slug: "future-of-african-fintech",
    title: "The Future of African Fintech",
    description: "Trends and predictions for payments, lending, and financial inclusion.",
    image: "/modern-grid-layout.png",
    content: "African fintech is evolving beyond mobile money. We look at embedded finance, BNPL, and regulatory sandboxes. Our view: the next decade will see deeper integration with global rails while preserving local innovation.",
    date: "2025-01-10",
    author: "AfroDebab Team",
  },
  {
    slug: "offline-first-design-patterns",
    title: "Offline-First Design Patterns for Emerging Markets",
    description: "Building apps that work when the network doesn't—practical patterns we use every day.",
    image: "/modern-green-gradient-card.png",
    content: "Connectivity in many African markets can be intermittent. We share our offline-first design patterns: local-first data, sync strategies, and graceful degradation. These approaches keep users productive even when the network is unreliable.",
    date: "2025-01-08",
    author: "AfroDebab Team",
  },
  {
    slug: "agritech-opportunities-2025",
    title: "Agritech Opportunities in 2025",
    description: "How technology is transforming agriculture across the continent and where we're investing.",
    image: "/modern-teal-gradient-card.png",
    content: "Agritech is one of the fastest-growing sectors in African tech. From supply chain digitization to precision farming and market linkages, we explore the opportunities and our approach to building solutions that serve smallholder farmers.",
    date: "2025-01-05",
    author: "AfroDebab Team",
  },
  {
    slug: "localization-beyond-translation",
    title: "Localization Beyond Translation",
    description: "Why true localization means design, currency, and culture—not just language.",
    image: "/modern-orange-gradient-card.png",
    content: "Shipping a product in Africa means more than translating strings. We discuss RTL support, local payment methods, date and number formats, and cultural nuances that make the difference between adoption and abandonment.",
    date: "2025-01-02",
    author: "AfroDebab Team",
  },
  {
    slug: "building-trust-in-digital-products",
    title: "Building Trust in Digital Products",
    description: "How we design for trust in markets where digital adoption is still growing.",
    image: "/modern-purple-gradient-card.png",
    content: "Trust is the foundation of adoption. We share our principles: clear value propositions, transparent pricing, local support channels, and community-driven validation. These elements help users feel safe trying new digital tools.",
    date: "2024-12-28",
    author: "AfroDebab Team",
  },
  {
    slug: "mobile-money-integration-guide",
    title: "Mobile Money Integration: A Practical Guide",
    description: "Integrating M-Pesa, MTN MoMo, and others—what we've learned from the field.",
    image: "/modern-red-gradient-card.png",
    content: "Mobile money is the primary payment rail in many African markets. We walk through integration patterns, error handling, and reconciliation for major providers. Practical tips from products we've built and operated.",
    date: "2024-12-22",
    author: "AfroDebab Team",
  },
  {
    slug: "scaling-teams-across-time-zones",
    title: "Scaling Teams Across Time Zones",
    description: "Running distributed engineering teams between Africa and the diaspora.",
    image: "/modern-grid-layout.png",
    content: "Our team spans multiple countries and time zones. We share how we structure sprints, communication, and ownership so that distributed doesn't mean disconnected. Async-first with intentional sync moments.",
    date: "2024-12-18",
    author: "AfroDebab Team",
  },
  {
    slug: "api-design-for-emerging-markets",
    title: "API Design for Emerging Markets",
    description: "Designing APIs for variable latency, low bandwidth, and diverse clients.",
    image: "/modern-green-gradient-card.png",
    content: "APIs consumed in emerging markets face different constraints. We discuss payload size, polling vs push, versioning, and backward compatibility. Small choices that compound into better experiences for millions of users.",
    date: "2024-12-14",
    author: "AfroDebab Team",
  },
  {
    slug: "user-research-across-cultures",
    title: "User Research Across Cultures",
    description: "Conducting meaningful user research when your users are thousands of miles away.",
    image: "/modern-teal-gradient-card.png",
    content: "Building for users you don't share a time zone with requires intentional research. We cover remote interviews, local partnerships, and avoiding the trap of building for ourselves. Real stories from our product process.",
    date: "2024-12-10",
    author: "AfroDebab Team",
  },
  {
    slug: "security-best-practices-startups",
    title: "Security Best Practices for Startups",
    description: "Practical security steps that don't require a huge team or budget.",
    image: "/modern-orange-gradient-card.png",
    content: "Security doesn't have to wait until you're big. We outline the practices we adopt from day one: secrets management, HTTPS everywhere, minimal permissions, and incident response basics. A checklist every founder can use.",
    date: "2024-12-06",
    author: "AfroDebab Team",
  },
  {
    slug: "open-source-in-african-tech",
    title: "Open Source in African Tech",
    description: "How we use and contribute to open source while building commercial products.",
    image: "/modern-purple-gradient-card.png",
    content: "Open source powers much of African tech. We discuss our philosophy: using OSS responsibly, contributing back, and when it makes sense to open-source our own tools. Community and commerce can coexist.",
    date: "2024-12-02",
    author: "AfroDebab Team",
  },
  {
    slug: "lessons-from-our-first-product",
    title: "Lessons from Our First Product Launch",
    description: "What we learned launching goGerami and what we'd do differently.",
    image: "/modern-red-gradient-card.png",
    content: "Launching our first product taught us more than any playbook. We share the wins, the mistakes, and the surprises. From pricing to support to iteration speed—real lessons for anyone building in Pan-African markets.",
    date: "2024-11-28",
    author: "AfroDebab Team",
  },
]

export const POSTS_PER_PAGE = 6

export function getPaginatedPosts(page: number) {
  const start = (page - 1) * POSTS_PER_PAGE
  return BLOG_POSTS.slice(start, start + POSTS_PER_PAGE)
}

export function getTotalPages() {
  return Math.ceil(BLOG_POSTS.length / POSTS_PER_PAGE)
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}
