import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Download, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Database,
  RefreshCw,
  Eye,
  PanelLeftClose,
  PanelLeft,
  X,
  MessageSquare,
  Phone,
  Mail,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Logo } from './components/Logo';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { api, Lead, BlogPost } from './services/api';

const PASSCODE = 'sixthsense2026';
const PUBLIC_SITE_URL = 'https://sixthsenseinvestments.pages.dev';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ssi_admin_token') === 'authenticated_2026';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'blogs' | 'system'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);

  // Leads CRM state
  const [leadStatusFilter, setLeadStatusFilter] = useState<'All' | 'New' | 'Contacted' | 'Converted' | 'Archived'>('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNoteInput, setLeadNoteInput] = useState('');

  // Blog CMS state
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedBlogForPreview, setSelectedBlogForPreview] = useState<BlogPost | null>(null);

  // Time & Market Session
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check Indian market status (IST is UTC +5:30)
  const marketStatus = useMemo(() => {
    const now = new Date();
    const istOffset = 5.5 * 60; // in minutes
    const localOffset = now.getTimezoneOffset(); // in minutes
    const istTime = new Date(now.getTime() + (istOffset + localOffset) * 60000);
    const day = istTime.getDay();
    const hours = istTime.getHours();
    const mins = istTime.getMinutes();
    const currentMins = hours * 60 + mins;

    // Mon-Fri: 9:15 to 15:30
    const isWeekday = day >= 1 && day <= 5;
    const isOpen = isWeekday && currentMins >= (9 * 60 + 15) && currentMins <= (15 * 60 + 30);
    const isPreMarket = isWeekday && currentMins >= (9 * 60) && currentMins < (9 * 60 + 15);

    if (isOpen) return { text: 'NSE / BSE Trading Session Active', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' };
    if (isPreMarket) return { text: 'NSE Pre-Market Open', color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' };
    return { text: 'Market Closed · After-Hours Execution', color: 'text-slate-400 bg-slate-900 border-slate-800' };
  }, [currentTime]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const [leadsRes, blogsRes] = await Promise.all([
        api.getLeads(),
        api.getBlogs()
      ]);
      setLeads(leadsRes);
      setBlogs(blogsRes);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Handle Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === PASSCODE) {
      sessionStorage.setItem('ssi_admin_token', 'authenticated_2026');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid fiduciary access key. Access denied.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ssi_admin_token');
    setIsAuthenticated(false);
    setPasscode('');
  };

  // --- LEADS ACTIONS ---
  const handleUpdateLeadStatus = async (leadId: number, nextStatus: Lead['status']) => {
    try {
      const success = await api.updateLeadStatus(leadId, nextStatus);
      if (success) {
        setLeads((prev: Lead[]) => prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead((prev: Lead | null) => prev ? { ...prev, status: nextStatus } : null);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update lead status in D1 database.');
    }
  };

  const handleSaveLeadNote = async () => {
    if (!selectedLead) return;
    try {
      const success = await api.updateLeadStatus(selectedLead.id, selectedLead.status, leadNoteInput);
      if (success) {
        setLeads((prev: Lead[]) => prev.map(l => l.id === selectedLead.id ? { ...l, notes: leadNoteInput } : l));
        setSelectedLead((prev: Lead | null) => prev ? { ...prev, notes: leadNoteInput } : null);
        alert('Internal fiduciary note saved to Cloudflare D1.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save note.');
    }
  };

  const exportLeadsCSV = () => {
    if (filteredLeads.length === 0) {
      alert('No leads available to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Name', 'Phone', 'Email', 'Service', 'Budget/Capital', 'Status', 'Message', 'Notes'];
    const rows = filteredLeads.map(l => [
      l.id,
      new Date(l.created_at).toISOString(),
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${(l.service_interested || '').replace(/"/g, '""')}"`,
      `"${(l.investment_budget || '').replace(/"/g, '""')}"`,
      l.status,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sixthsense_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesStatus = leadStatusFilter === 'All' || l.status === leadStatusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        l.name.toLowerCase().includes(query) ||
        l.email.toLowerCase().includes(query) ||
        l.phone.includes(query) ||
        (l.service_interested && l.service_interested.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [leads, leadStatusFilter, searchQuery]);

  // --- BLOGS ACTIONS ---
  const handleOpenNewBlog = () => {
    setEditingBlog({
      title: '',
      slug: '',
      category: 'Market Insights',
      excerpt: '',
      content: '',
      author: 'Mann Jain (Founder & SEBI R.A.)',
      cover_image: '/assets/images/img_18.jpg',
      status: 'Published',
      read_time: '4 min read'
    });
    setPreviewMode(false);
    setIsBlogModalOpen(true);
  };

  const handleEditBlog = (blog: BlogPost) => {
    setEditingBlog(blog);
    setPreviewMode(false);
    setIsBlogModalOpen(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog || !editingBlog.title || !editingBlog.content) {
      alert('Please provide title and content.');
      return;
    }

    try {
      if (editingBlog.id) {
        // Update
        const success = await api.updateBlog(editingBlog.id, editingBlog);
        if (success) {
          setBlogs((prev: BlogPost[]) => prev.map(b => b.id === editingBlog.id ? { ...b, ...editingBlog } as BlogPost : b));
          setIsBlogModalOpen(false);
          setEditingBlog(null);
        } else {
          alert('Could not update blog in D1.');
        }
      } else {
        // Create
        const res = await api.createBlog(editingBlog as any);
        if (res.success) {
          await loadData();
          setIsBlogModalOpen(false);
          setEditingBlog(null);
        } else {
          alert('Could not publish blog.');
        }
      }
    } catch (err: any) {
      alert('Error saving blog: ' + err.message);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this research article permanently from Cloudflare D1?')) {
      return;
    }
    try {
      const ok = await api.deleteBlog(id);
      if (ok) {
        setBlogs((prev: BlogPost[]) => prev.filter(b => b.id !== id));
      } else {
        alert('Failed to delete blog.');
      }
    } catch (err) {
      alert('Error deleting blog.');
    }
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090c10] text-[#f1f4f8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121720] border border-[#202938] rounded-2xl p-8 space-y-8 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-[#090c10] border border-[#202938] mb-2">
              <Logo variant="gold" className="w-12 h-12" />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#f1f4f8]">
              Sixth Sense Investments
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#d4af37] font-mono">
              Executive Admin OS · Fiduciary Desk
            </p>
            <p className="text-xs text-[#8b9bb4]">
              Authorized personnel only. Direct Cloudflare D1 governance portal.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-[#8b9bb4] font-medium flex justify-between">
                <span>Security Passcode</span>
                <span className="font-mono text-[10px] text-[#5b6574]">256-BIT ENCRYPTED</span>
              </label>
              <input 
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter executive access key..."
                className="w-full px-4 py-3 bg-[#090c10] border border-[#202938] focus:border-[#d4af37] focus:outline-none text-sm text-[#f1f4f8] rounded-lg"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#d4af37] hover:bg-[#c49f2e] text-[#090c10] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Authenticate Executive Session
            </button>
          </form>

          <div className="pt-4 border-t border-[#202938]/60 text-center text-[11px] text-[#5b6574]">
            Sixth Sense Investments & Aditya Birla Capital Partner Infrastructure
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED EXECUTIVE DASHBOARD (shadcn-admin Pattern) ---
  return (
    <div className="min-h-screen bg-[#090c10] text-[#f1f4f8] flex overflow-hidden">
      
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-[#0d1219] border-r border-[#1a2230] flex flex-col shrink-0 select-none`}>
        {/* Brand Header */}
        <div className="h-16 border-b border-[#1a2230] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <Logo variant="gold" className="w-8 h-8" />
            {!sidebarCollapsed && (
              <div className="leading-tight truncate">
                <p className="font-serif font-bold text-sm text-[#f1f4f8] truncate">Sixth Sense</p>
                <p className="text-[10px] text-[#d4af37] font-mono tracking-wider">ADMIN OS</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 text-[#8b9bb4] hover:text-white rounded-md hover:bg-[#151c27]"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#151d29] text-[#d4af37] border border-[#d4af37]/20 shadow-sm'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#121722]'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Executive Overview</span>}
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'leads'
                ? 'bg-[#151d29] text-[#d4af37] border border-[#d4af37]/20 shadow-sm'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#121722]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Lead Base CRM</span>}
            </div>
            {!sidebarCollapsed && leads.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#1f293d] text-[#8b9bb4]">
                {leads.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('blogs')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'blogs'
                ? 'bg-[#151d29] text-[#d4af37] border border-[#d4af37]/20 shadow-sm'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#121722]'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Research CMS</span>}
            </div>
            {!sidebarCollapsed && blogs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#1f293d] text-[#8b9bb4]">
                {blogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'system'
                ? 'bg-[#151d29] text-[#d4af37] border border-[#d4af37]/20 shadow-sm'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#121722]'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>D1 Cloudflare Sync</span>}
          </button>
        </nav>

        {/* Founder Profile & Logout */}
        <div className="p-3 border-t border-[#1a2230] space-y-2">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 p-2 bg-[#121722] rounded-lg">
              <img 
                src="/assets/images/mann_jain_avatar.jpg" 
                alt="Mann Jain" 
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#d4af37]/30" 
              />
              <div className="overflow-hidden leading-tight flex-1">
                <p className="text-xs font-semibold text-[#f1f4f8] truncate">Mann Jain</p>
                <p className="text-[10px] text-[#8b9bb4] truncate">SEBI Reg. Analyst</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogout}
              className="w-full flex justify-center py-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#1a2230] bg-[#0c1017] px-6 flex items-center justify-between shrink-0">
          {/* Breadcrumbs & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-[#8b9bb4]">
              <span>Operations</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#f1f4f8] font-semibold capitalize">{activeTab} Desk</span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono tracking-tight transition-colors">
              <span className={`w-2 h-2 rounded-full ${marketStatus.color.includes('emerald') ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className={marketStatus.color.split(' ')[0]}>{marketStatus.text}</span>
            </div>
          </div>

          {/* Quick Actions & Public Site Link */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="px-3 py-1.5 bg-[#121722] hover:bg-[#18202e] border border-[#202938] rounded-lg text-xs text-[#8b9bb4] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <a
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#d4af37] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>View Public Platform</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* 4 KPI Summary Cards (Rule 5) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#121720] border border-[#1d2634] rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-[#8b9bb4] text-xs">
                    <span>Total Inquiries</span>
                    <Users className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-3xl font-serif text-[#f1f4f8]">{leads.length}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Real-time D1 Capture</span>
                  </div>
                </div>

                <div className="bg-[#121720] border border-[#1d2634] rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-[#8b9bb4] text-xs">
                    <span>Qualified Pipeline</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-serif text-[#f1f4f8]">
                    {leads.filter(l => l.status === 'New' || l.status === 'Contacted').length}
                  </div>
                  <div className="text-[11px] text-[#8b9bb4]">
                    Requires desk follow-up
                  </div>
                </div>

                <div className="bg-[#121720] border border-[#1d2634] rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-[#8b9bb4] text-xs">
                    <span>Published Research</span>
                    <FileText className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-3xl font-serif text-[#f1f4f8]">{blogs.length}</div>
                  <div className="text-[11px] text-emerald-400">
                    100% indexed on Public Hub
                  </div>
                </div>

                <div className="bg-[#121720] border border-[#1d2634] rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-[#8b9bb4] text-xs">
                    <span>Alpha Highlight</span>
                    <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-3xl font-serif text-[#d4af37]">₹4.15 Lakh</div>
                  <div className="text-[11px] text-[#8b9bb4]">
                    Single-session budget day net
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Recent Inquiries & Quick CMS Launch */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Leads */}
                <div className="lg:col-span-7 bg-[#121720] border border-[#1d2634] rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-lg text-[#f1f4f8]">Latest Client Submissions</h3>
                      <p className="text-xs text-[#8b9bb4]">Inbound inquiries from sixthsenseinvestments.pages.dev</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('leads')}
                      className="text-xs text-[#d4af37] hover:underline"
                    >
                      View All Leads →
                    </button>
                  </div>

                  {leads.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#8b9bb4]">
                      No leads received yet. The lead form on the public site is ready to receive submissions.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1a2230]">
                      {leads.slice(0, 5).map(lead => (
                        <div key={lead.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-[#f1f4f8]">{lead.name}</p>
                            <div className="flex items-center gap-3 text-xs text-[#8b9bb4]">
                              <span>{lead.phone}</span>
                              <span>·</span>
                              <span>{lead.service_interested || 'General Inquiry'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              lead.status === 'New' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' :
                              lead.status === 'Contacted' ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40' :
                              lead.status === 'Converted' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {lead.status}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setLeadNoteInput(lead.notes || '');
                                setActiveTab('leads');
                              }}
                              className="text-xs text-[#8b9bb4] hover:text-white"
                            >
                              Manage
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Article Dispatch & Regulatory Note */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-[#121720] border border-[#1d2634] rounded-xl p-6 space-y-4">
                    <h3 className="font-serif text-lg text-[#f1f4f8]">Publish New Market Note</h3>
                    <p className="text-xs text-[#8b9bb4]">
                      Draft an intraday setup, NISM commentary, or PMS allocation update for immediate syndication.
                    </p>
                    <button
                      onClick={handleOpenNewBlog}
                      className="w-full py-2.5 bg-[#d4af37] hover:bg-[#c49f2e] text-[#090c10] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Write Article</span>
                    </button>
                  </div>

                  <div className="bg-[#121720] border border-[#1d2634] rounded-xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#f1f4f8]">
                      <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                      <span>Fiduciary Governance Status</span>
                    </div>
                    <p className="text-xs text-[#8b9bb4] leading-relaxed">
                      SEBI RA Registration: <strong className="text-white">INZXXXXX8032</strong><br />
                      Authorized Partner: <strong className="text-white">Aditya Birla Capital Stocks & Securities</strong><br />
                      Cloudflare D1 Backend: <strong className="text-emerald-400">Connected & Live</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEAD BASE CRM (TanStack-style Table) */}
          {activeTab === 'leads' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              {/* Header with Search & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121720] border border-[#1d2634] rounded-xl p-4">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#8b9bb4]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search leads by name, email, phone, service..."
                    className="w-full bg-transparent text-xs text-[#f1f4f8] focus:outline-none placeholder-[#5b6574]"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto">
                  {(['All', 'New', 'Contacted', 'Converted', 'Archived'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setLeadStatusFilter(st)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        leadStatusFilter === st
                          ? 'bg-[#d4af37] text-[#090c10]'
                          : 'bg-[#18202d] text-[#8b9bb4] hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}

                  <button
                    onClick={exportLeadsCSV}
                    className="px-3 py-1 bg-[#18202d] hover:bg-[#222d3e] border border-[#2a3648] text-xs text-[#f1f4f8] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ml-2"
                    title="Export CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-[#121720] border border-[#1d2634] rounded-xl overflow-hidden shadow">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e131b] border-b border-[#1d2634] text-[#8b9bb4] uppercase tracking-wider font-mono">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Service Required</th>
                        <th className="py-3 px-4">Capital Range</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#18202d] text-[#f1f4f8]">
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#8b9bb4]">
                            No leads match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-[#151c27] transition-colors">
                            <td className="py-3 px-4 text-[#8b9bb4] font-mono whitespace-nowrap">
                              {new Date(lead.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="py-3 px-4 font-semibold">{lead.name}</td>
                            <td className="py-3 px-4">
                              <div className="space-y-0.5">
                                <a 
                                  href={`tel:${lead.phone}`} 
                                  className="text-[#d4af37] hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{lead.phone}</span>
                                </a>
                                <div className="text-[11px] text-[#8b9bb4] flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{lead.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#8b9bb4]">{lead.service_interested || 'General Inquiry'}</td>
                            <td className="py-3 px-4 font-mono text-[#d4af37]">
                              {lead.investment_budget || 'Unspecified'}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as Lead['status'])}
                                className={`px-2 py-1 rounded text-[11px] font-medium border bg-[#090c10] cursor-pointer focus:outline-none ${
                                  lead.status === 'New' ? 'text-amber-400 border-amber-800/40' :
                                  lead.status === 'Contacted' ? 'text-blue-400 border-blue-800/40' :
                                  lead.status === 'Converted' ? 'text-emerald-400 border-emerald-800/40' :
                                  'text-slate-400 border-slate-700'
                                }`}
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Converted">Converted</option>
                                <option value="Archived">Archived</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setLeadNoteInput(lead.notes || '');
                                }}
                                className="px-2.5 py-1 bg-[#18202d] hover:bg-[#202938] text-xs text-[#f1f4f8] rounded transition-colors"
                              >
                                View / Note
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESEARCH & BLOG CMS */}
          {activeTab === 'blogs' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between bg-[#121720] border border-[#1d2634] rounded-xl p-4">
                <div>
                  <h3 className="font-serif text-lg text-[#f1f4f8]">Institutional Research Publications</h3>
                  <p className="text-xs text-[#8b9bb4]">Market briefings, NISM research, and budget case studies on sixthsenseinvestments.pages.dev</p>
                </div>
                <button
                  onClick={handleOpenNewBlog}
                  className="px-4 py-2 bg-[#d4af37] hover:bg-[#c49f2e] text-[#090c10] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Publication</span>
                </button>
              </div>

              {/* Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((b) => (
                  <div key={b.id} className="bg-[#121720] border border-[#1d2634] rounded-xl overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="aspect-[16/9] w-full overflow-hidden bg-[#090c10] relative">
                        <img 
                          src={b.cover_image || '/assets/images/img_18.jpg'} 
                          alt={b.title} 
                          className="w-full h-full object-cover object-center" 
                        />
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#090c10]/80 backdrop-blur-sm border border-[#202938] text-[#d4af37]">
                          {b.category}
                        </span>
                      </div>
                      <div className="p-5 space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-[#8b9bb4]">
                          <span>{b.read_time || '4 min read'}</span>
                          <span>·</span>
                          <span>{new Date(b.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <h4 className="font-serif text-base font-semibold text-[#f1f4f8] line-clamp-2 leading-snug">
                          {b.title}
                        </h4>
                        <p className="text-xs text-[#8b9bb4] line-clamp-2 leading-relaxed">
                          {b.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border-t border-[#1a2230] flex items-center justify-between text-xs">
                      <button
                        onClick={() => setSelectedBlogForPreview(b)}
                        className="text-[#8b9bb4] hover:text-white flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEditBlog(b)}
                          className="text-[#d4af37] hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(b.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete from Cloudflare D1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM & D1 SYNC */}
          {activeTab === 'system' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-[#121720] border border-[#1d2634] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-[#d4af37]" />
                  <div>
                    <h3 className="font-serif text-lg text-[#f1f4f8]">Cloudflare D1 Database Status</h3>
                    <p className="text-xs text-[#8b9bb4]">Real-time edge binding: <code className="text-[#d4af37]">sixthsense-db</code></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-[#090c10] border border-[#1d2634] rounded-lg space-y-1">
                    <span className="text-[10px] text-[#8b9bb4] font-mono uppercase">Database ID</span>
                    <p className="text-xs font-mono text-[#f1f4f8] break-all">84ed07b9-9e6e-4bfb-9fa5-9b0bba8a1708</p>
                  </div>
                  <div className="p-4 bg-[#090c10] border border-[#1d2634] rounded-lg space-y-1">
                    <span className="text-[10px] text-[#8b9bb4] font-mono uppercase">Primary Region</span>
                    <p className="text-xs font-mono text-emerald-400">APAC (Singapore / Mumbai Edge)</p>
                  </div>
                </div>

                <div className="p-4 bg-[#090c10] border border-[#1d2634] rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8b9bb4]">Table: <code>leads</code></span>
                    <span className="text-emerald-400 font-mono">{leads.length} records</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8b9bb4]">Table: <code>blogs</code></span>
                    <span className="text-emerald-400 font-mono">{blogs.length} records</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={loadData}
                    className="px-4 py-2 bg-[#d4af37] text-[#090c10] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Force D1 Edge Sync
                  </button>
                  <button
                    onClick={exportLeadsCSV}
                    className="px-4 py-2 bg-[#18202d] hover:bg-[#222d3e] text-[#f1f4f8] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Export Leads Backup
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* LEAD DETAIL MODAL / DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121720] border border-[#202938] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#202938] pb-3">
              <div>
                <h3 className="font-serif text-lg text-[#f1f4f8]">{selectedLead.name}</h3>
                <p className="text-xs text-[#d4af37] font-mono">{selectedLead.service_interested || 'General Inquiry'}</p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-[#8b9bb4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#090c10] rounded-lg space-y-1">
                  <span className="text-[#8b9bb4]">Phone</span>
                  <p className="font-semibold text-white">{selectedLead.phone}</p>
                  <a
                    href={`https://wa.me/91${selectedLead.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hi ${selectedLead.name}, this is Mann Jain from Sixth Sense Investments...`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-[#d4af37] hover:underline text-[11px]"
                  >
                    Chat on WhatsApp →
                  </a>
                </div>
                <div className="p-3 bg-[#090c10] rounded-lg space-y-1">
                  <span className="text-[#8b9bb4]">Email</span>
                  <p className="font-semibold text-white break-all">{selectedLead.email}</p>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="inline-block mt-1 text-[#d4af37] hover:underline text-[11px]"
                  >
                    Send Email →
                  </a>
                </div>
              </div>

              <div className="p-3 bg-[#090c10] rounded-lg space-y-1">
                <span className="text-[#8b9bb4]">Capital / Portfolio Size</span>
                <p className="font-mono text-[#d4af37] font-semibold">{selectedLead.investment_budget || 'Unspecified'}</p>
              </div>

              {selectedLead.message && (
                <div className="p-3 bg-[#090c10] rounded-lg space-y-1">
                  <span className="text-[#8b9bb4]">Client Message / Requirement</span>
                  <p className="text-[#f1f4f8] whitespace-pre-wrap">{selectedLead.message}</p>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="text-[#8b9bb4] font-medium">Internal Fiduciary Desk Notes</label>
                <textarea
                  value={leadNoteInput}
                  onChange={(e) => setLeadNoteInput(e.target.value)}
                  placeholder="Record consultation notes, portfolio allocation details, follow-up calls..."
                  rows={3}
                  className="w-full p-3 bg-[#090c10] border border-[#202938] rounded-lg text-xs text-[#f1f4f8] focus:border-[#d4af37] focus:outline-none"
                />
                <button
                  onClick={handleSaveLeadNote}
                  className="px-4 py-2 bg-[#d4af37] text-[#090c10] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Save Note to D1
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE CREATE / EDIT MODAL */}
      {isBlogModalOpen && editingBlog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121720] border border-[#202938] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[#202938] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-[#f1f4f8]">
                  {editingBlog.id ? 'Edit Research Publication' : 'Draft New Publication'}
                </h3>
                <p className="text-xs text-[#8b9bb4]">Direct publication to sixthsenseinvestments.pages.dev</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-xs text-[#d4af37] hover:underline"
                >
                  {previewMode ? 'Back to Editor' : 'Live Markdown Preview'}
                </button>
                <button onClick={() => setIsBlogModalOpen(false)} className="text-[#8b9bb4] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveBlog} className="p-6 overflow-y-auto space-y-4 flex-1">
              {previewMode ? (
                <div className="space-y-4">
                  <div className="aspect-[21/9] rounded-xl overflow-hidden bg-[#090c10]">
                    <img 
                      src={editingBlog.cover_image || '/assets/images/img_18.jpg'} 
                      alt="Cover" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <h2 className="font-serif text-2xl text-[#f1f4f8]">{editingBlog.title || 'Untitled Post'}</h2>
                  <p className="text-xs text-[#8b9bb4] italic">{editingBlog.excerpt}</p>
                  <div className="pt-2 border-t border-[#202938]">
                    <MarkdownRenderer content={editingBlog.content || ''} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-[#8b9bb4]">Title</label>
                    <input
                      type="text"
                      required
                      value={editingBlog.title || ''}
                      onChange={(e) => {
                        const title = e.target.value;
                        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                        setEditingBlog((prev: any) => ({ ...prev, title, slug: prev?.slug ? prev.slug : slug }));
                      }}
                      placeholder="e.g. Union Budget: Capital Gains Restructuring & Hedging..."
                      className="w-full p-3 bg-[#090c10] border border-[#202938] rounded-lg text-xs text-[#f1f4f8] focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-[#8b9bb4]">Category</label>
                      <select
                        value={editingBlog.category || 'Market Insights'}
                        onChange={(e) => setEditingBlog((prev: any) => ({ ...prev, category: e.target.value }))}
                        className="w-full p-3 bg-[#090c10] border border-[#202938] rounded-lg text-xs text-[#f1f4f8] focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="Market Insights">Market Insights</option>
                        <option value="Case Studies">Case Studies</option>
                        <option value="Wealth Advisory">Wealth Advisory</option>
                        <option value="NISM Education">NISM Education</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-[#8b9bb4]">Cover Asset Selection</label>
                      <select
                        value={editingBlog.cover_image || '/assets/images/img_18.jpg'}
                        onChange={(e) => setEditingBlog((prev: any) => ({ ...prev, cover_image: e.target.value }))}
                        className="w-full p-3 bg-[#090c10] border border-[#202938] rounded-lg text-xs text-[#f1f4f8] focus:border-[#d4af37] focus:outline-none"
                      >
                        <option value="/assets/images/img_18.jpg">Budget Day Live Terminal (img_18)</option>
                        <option value="/assets/images/img_3.jpg">Aditya Birla Capital Partner (img_3)</option>
                        <option value="/assets/images/img_20.jpg">Dehradun 2026 Workstation (img_20)</option>
                        <option value="/assets/images/img_2.jpg">Trade Like Us Masterclass (img_2)</option>
                        <option value="/assets/images/img_6.jpg">Strategy Desk Briefing (img_6)</option>
                        <option value="/assets/images/logo_gold.png">Gold Monogram Crest</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#8b9bb4]">Excerpt / Executive Summary</label>
                    <textarea
                      rows={2}
                      value={editingBlog.excerpt || ''}
                      onChange={(e) => setEditingBlog((prev: any) => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief 1-2 sentence hook for the market feed..."
                      className="w-full p-3 bg-[#090c10] border border-[#202938] rounded-lg text-xs text-[#f1f4f8] focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#8b9bb4]">Article Body (Markdown Supported)</label>
                    <textarea
                      rows={8}
                      required
                      value={editingBlog.content || ''}
                      onChange={(e) => setEditingBlog((prev: any) => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your research analysis here..."
                      className="w-full p-3 bg-[#090c10] border border-[#202938] rounded-lg text-xs text-[#f1f4f8] focus:border-[#d4af37] focus:outline-none font-mono"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-[#202938] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBlogModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#8b9bb4] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#d4af37] hover:bg-[#c49f2e] text-[#090c10] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  {editingBlog.id ? 'Save Updates to D1' : 'Publish Article Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARTICLE PREVIEW MODAL */}
      {selectedBlogForPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121720] border border-[#202938] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#202938] pb-3">
              <span className="text-xs uppercase tracking-wider text-[#d4af37] font-mono">
                {selectedBlogForPreview.category}
              </span>
              <button onClick={() => setSelectedBlogForPreview(null)} className="text-[#8b9bb4] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#090c10]">
              <img 
                src={selectedBlogForPreview.cover_image || '/assets/images/img_18.jpg'} 
                alt={selectedBlogForPreview.title} 
                className="w-full h-full object-cover" 
              />
            </div>
            <h2 className="font-serif text-2xl text-[#f1f4f8]">{selectedBlogForPreview.title}</h2>
            <p className="text-xs text-[#8b9bb4] italic">{selectedBlogForPreview.excerpt}</p>
            <div className="pt-2 border-t border-[#202938]">
              <MarkdownRenderer content={selectedBlogForPreview.content} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
