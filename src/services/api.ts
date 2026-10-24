import { Lead, Blog } from '../types';
export type { Lead, Blog };
export type BlogPost = Blog;

const INITIAL_BLOGS: Blog[] = [
  {
    id: 1,
    slug: 'union-budget-day-trading-discipline-profit-breakdown',
    title: 'Union Budget Day: How Technical Discipline & Patience Secured ₹4,15,522.50 in Intraday Alpha',
    excerpt: 'A tactical breakdown of the Union Budget volatility: why waiting for institutional flow confirmation outperforms emotional trading, and the exact risk-to-reward parameters executed.',
    content: `Trading on high-impact event days like the Union Budget is where most retail participants surrender their capital to sudden gamma expansion and bid-ask slippage. On Budget Day, while the broader market was gripped by erratic headlines and whipsaw moves, our desk at Sixth Sense Investments executed a strictly rule-based plan.

### The Core Strategy: Capital Preservation First
Before 11:00 AM, volatility was artificially pricing in extreme outcomes across Bank Nifty and Nifty option chains. Rather than guessing the speech trajectory, we established our predefined order blocks and wait triggers.

1. **Pre-Session Levels**: Marked key weekly liquidity zones and standard deviation bands.
2. **Execution Timing**: Entered post-announcement once implied volatility peaked and directionality confirmed with volume surges.
3. **Result**: Closed the session with a sweet profit of **₹4,15,522.50** booked cleanly with zero overnight exposure.

### The Philosophy: Trust The Process
No overthinking. No panic adjustments. You design the risk matrix before the market opens, respect stop-losses unconditionally, and let the statistical edge do the work.`,
    category: 'Case Studies',
    author: 'Mann Jain (Founder & SEBI R.A.)',
    cover_image: '/assets/images/img_18.jpg',
    status: 'Published',
    read_time: '5 min read',
    created_at: '2026-02-01T15:30:00Z'
  },
  {
    id: 2,
    slug: 'portfolio-diversification-with-aditya-birla-capital',
    title: 'Institutional Wealth Structuring: Maximizing Risk-Adjusted Returns with Aditya Birla Capital PMS',
    excerpt: 'How high-net-worth investors can combine quantitative equity strategies with institutional asset allocation for multi-decade compounding.',
    content: `Building true wealth in Indian equities requires moving beyond fragmented stock picking. Through our institutional channel partnership with Aditya Birla Capital, Sixth Sense Investments delivers structured Portfolio Management Services (PMS) and depository-grade security.

### Why High-Net-Worth Portfolios Need Institutional Architecture
1. **Dynamic Asset Allocation**: Disciplined rebalancing between large-cap stability, mid-cap compounding engines, and tactical cash reserves.
2. **Fiduciary Transparency**: Complete direct custody, audited performance reporting, and SEBI-regulated fee structures.
3. **Access to Institutional Primary Offerings**: Priority allocation and research coverage on premier IPOs before public distribution.

Contact our advisory desk to review your existing equity portfolio against institutional benchmarks.`,
    category: 'Wealth Advisory',
    author: 'Mann Jain (Founder & SEBI R.A.)',
    cover_image: '/assets/images/img_3.jpg',
    status: 'Published',
    read_time: '4 min read',
    created_at: '2026-02-15T11:00:00Z'
  },
  {
    id: 3,
    slug: 'dehradun-national-investment-trading-competition-2026',
    title: 'Representing Sixth Sense Investments: The Dehradun National Trading League 2026',
    excerpt: 'Sixth Sense Investments is forming an elite 5-member team for the prestigious National Trading & Investment Championship in Dehradun with fully funded trading accounts.',
    content: `Practical market mastery cannot be developed in isolation behind hypothetical paper-trading dashboards. It demands live liquidity, psychological conditioning, and institutional oversight.

We are proud to announce that Sixth Sense Investments is fielding an elite 5-member squad to represent our firm at the upcoming National Investment & Trading Competition in Dehradun.

### What Selected Candidates Receive:
- **Funded Live Trading Capital**: Compete with real capital under institutional risk limits.
- **Exclusive Offline Masterclass Series**: Direct mentorship on order-flow analysis, VWAP scalping, and algorithmic hedging.
- **Full Travel & Accommodation Sponsorship**: All logistical expenses covered by the firm.

Registrations are now open through our Academy portal.`,
    category: 'Academy & Events',
    author: 'Mann Jain (Founder & SEBI R.A.)',
    cover_image: '/assets/images/img_20.jpg',
    status: 'Published',
    read_time: '3 min read',
    created_at: '2026-03-01T09:00:00Z'
  }
];

const LOCAL_LEADS_KEY = 'ssi_local_leads';
const LOCAL_BLOGS_KEY = 'ssi_local_blogs';

function getLocalLeads(): Lead[] {
  try {
    const data = localStorage.getItem(LOCAL_LEADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalLeads(leads: Lead[]) {
  try {
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error(e);
  }
}

function getLocalBlogs(): Blog[] {
  try {
    const data = localStorage.getItem(LOCAL_BLOGS_KEY);
    return data ? JSON.parse(data) : INITIAL_BLOGS;
  } catch {
    return INITIAL_BLOGS;
  }
}

function saveLocalBlogs(blogs: Blog[]) {
  try {
    localStorage.setItem(LOCAL_BLOGS_KEY, JSON.stringify(blogs));
  } catch (e) {
    console.error(e);
  }
}

export const api = {
  // --- LEADS ---
  async getLeads(status?: string, search?: string): Promise<Lead[]> {
    try {
      const url = new URL('/api/leads', window.location.origin);
      if (status) url.searchParams.set('status', status);
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
          // Sync with local backup
          saveLocalLeads(data.leads);
          return data.leads;
        }
      }
    } catch {
      // Fallback
    }

    let leads = getLocalLeads();
    if (status && status !== 'All') {
      leads = leads.filter(l => l.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      leads = leads.filter(l => 
        l.name.toLowerCase().includes(s) || 
        l.email.toLowerCase().includes(s) || 
        l.phone.includes(s) ||
        l.service_interested.toLowerCase().includes(s)
      );
    }
    return leads;
  },

  async submitLead(lead: Omit<Lead, 'id' | 'status' | 'created_at'>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return { success: true, message: data.message || "Consultation request submitted successfully." };
        }
      }
    } catch {
      // Fallback to local save
    }

    const current = getLocalLeads();
    const newLead: Lead = {
      ...lead,
      id: Date.now(),
      status: 'New',
      created_at: new Date().toISOString(),
    };
    saveLocalLeads([newLead, ...current]);
    return { success: true, message: "Consultation request logged successfully (Local & Cloudflare Ready)." };
  },

  async updateLeadStatus(id: number, status: Lead['status'], notes?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return true;
      }
    } catch {
      // Fallback
    }

    const current = getLocalLeads();
    const updated = current.map(l => l.id === id ? { ...l, status, notes: notes !== undefined ? notes : l.notes } : l);
    saveLocalLeads(updated);
    return true;
  },

  // --- BLOGS ---
  async getBlogs(category?: string, status: string = 'Published'): Promise<Blog[]> {
    try {
      const url = new URL('/api/blogs', window.location.origin);
      if (category && category !== 'All') url.searchParams.set('category', category);
      url.searchParams.set('status', status);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.blogs) && data.blogs.length > 0) {
          saveLocalBlogs(data.blogs);
          return data.blogs;
        }
      }
    } catch {
      // Fallback
    }

    let blogs = getLocalBlogs();
    if (status !== 'All') {
      blogs = blogs.filter(b => b.status === status);
    }
    if (category && category !== 'All') {
      blogs = blogs.filter(b => b.category === category);
    }
    return blogs;
  },

  async getBlogBySlug(slug: string): Promise<Blog | null> {
    try {
      const url = new URL('/api/blogs', window.location.origin);
      url.searchParams.set('slug', slug);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.blog) return data.blog;
      }
    } catch {
      // Fallback
    }

    const blogs = getLocalBlogs();
    return blogs.find(b => b.slug === slug) || null;
  },

  async createBlog(blog: Omit<Blog, 'id' | 'created_at'>): Promise<{ success: boolean; slug?: string }> {
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blog),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return { success: true, slug: data.slug };
      }
    } catch {
      // Fallback
    }

    const blogs = getLocalBlogs();
    const slug = blog.slug || blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
    const newBlog: Blog = {
      ...blog,
      id: Date.now(),
      slug,
      created_at: new Date().toISOString(),
    };
    saveLocalBlogs([newBlog, ...blogs]);
    return { success: true, slug };
  },

  async updateBlog(id: number, updates: Partial<Blog>): Promise<boolean> {
    try {
      const res = await fetch('/api/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return true;
      }
    } catch {
      // Fallback
    }

    const blogs = getLocalBlogs();
    const updated = blogs.map(b => b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b);
    saveLocalBlogs(updated);
    return true;
  },

  async deleteBlog(id: number): Promise<boolean> {
    try {
      const url = new URL('/api/blogs', window.location.origin);
      url.searchParams.set('id', id.toString());
      const res = await fetch(url.toString(), { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return true;
      }
    } catch {
      // Fallback
    }

    const blogs = getLocalBlogs();
    saveLocalBlogs(blogs.filter(b => b.id !== id));
    return true;
  }
};
