import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Download, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RefreshCw,
  X,
  MessageSquare,
  Phone,
  Mail,
  Send,
  Lock,
  Eye,
  EyeOff,
  User,
  DollarSign,
  Briefcase,
  ChevronDown
} from 'lucide-react';
import { Logo } from './components/Logo';
import { api, Lead } from './services/api';

const PASSCODE = 'sixthsense2026';
const PUBLIC_SITE_URL = 'https://sixthsenseinvestments.pages.dev';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ssi_admin_token') === 'authenticated_2026';
  });
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'New' | 'Contacted' | 'Converted' | 'Archived'>('All');
  
  // Modal / Drawer state for full inquiry details & internal notes
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNoteInput, setLeadNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  // Load Inquiries from Cloudflare D1
  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await api.getLeads();
      setLeads(data);
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadLeads();
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
      setAuthError('Invalid passcode. Please enter the official administrative access key.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ssi_admin_token');
    setIsAuthenticated(false);
    setPasscode('');
  };

  // Status Update Handler
  const handleStatusChange = async (leadId: number, nextStatus: Lead['status']) => {
    setStatusUpdatingId(leadId);
    try {
      const success = await api.updateLeadStatus(leadId, nextStatus);
      if (success) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, status: nextStatus } : null);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Save Internal Notes
  const handleSaveNote = async () => {
    if (!selectedLead) return;
    setSavingNote(true);
    try {
      const success = await api.updateLeadStatus(selectedLead.id, selectedLead.status, leadNoteInput);
      if (success) {
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: leadNoteInput } : l));
        setSelectedLead(prev => prev ? { ...prev, notes: leadNoteInput } : null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  };

  // Delete Inquiry
  const handleDeleteLead = async (leadId: number, leadName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the inquiry from "${leadName}"?`)) {
      return;
    }
    try {
      const success = await api.deleteLead(leadId);
      if (success) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(null);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete inquiry.');
    }
  };

  // Clean phone number for direct WhatsApp links
  const getCleanPhone = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  // WhatsApp Pre-filled message generator
  const getWhatsAppUrl = (lead: Lead) => {
    const cleanPhone = getCleanPhone(lead.phone);
    const text = encodeURIComponent(
      `Hi ${lead.name}, this is Mann Jain from Sixth Sense Investments. Thank you for reaching out regarding ${lead.service_interested || 'our advisory services'}. How can I best assist you today?`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // Date Formatter
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesStatus;
      
      const matchesSearch = 
        l.name.toLowerCase().includes(query) ||
        l.email.toLowerCase().includes(query) ||
        l.phone.includes(query) ||
        (l.service_interested && l.service_interested.toLowerCase().includes(query)) ||
        (l.message && l.message.toLowerCase().includes(query)) ||
        (l.notes && l.notes.toLowerCase().includes(query));
      
      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, searchQuery]);

  // Quick Counts
  const counts = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter(l => l.status === 'New').length,
      contacted: leads.filter(l => l.status === 'Contacted').length,
      converted: leads.filter(l => l.status === 'Converted').length,
      archived: leads.filter(l => l.status === 'Archived').length,
    };
  }, [leads]);

  // CSV Export
  const exportCSV = () => {
    if (leads.length === 0) {
      alert('No inquiries to export.');
      return;
    }
    const headers = ['ID', 'Date Received', 'Client Name', 'Phone', 'Email', 'Service Interested', 'Investment Budget', 'Status', 'Client Message', 'Internal Notes'];
    const rows = filteredLeads.map(l => [
      l.id,
      formatDate(l.created_at),
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${(l.service_interested || '').replace(/"/g, '""')}"`,
      `"${(l.investment_budget || '').replace(/"/g, '""')}"`,
      l.status,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sixthsense_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090c10] text-[#f1f4f8] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#121720] border border-[#1e2638] rounded-2xl p-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#090c10] border border-[#d4af37]/40 flex items-center justify-center">
              <Logo className="w-8 h-8 text-[#d4af37]" variant="gold" />
            </div>
            <h1 className="font-serif text-2xl text-[#f1f4f8]">Sixth Sense Investments</h1>
            <p className="text-xs text-[#8b9bb4]">Client Inquiries & Consultation Inbox</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#8b9bb4]">
                Administrative Passcode
              </label>
              <div className="relative">
                <input 
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  className="w-full bg-[#090c10] border border-[#1e2638] focus:border-[#d4af37] rounded-xl px-4 py-3 text-sm text-[#f1f4f8] placeholder-[#475569] outline-none transition-colors pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b9bb4] hover:text-[#f1f4f8]"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#d4af37] hover:bg-[#c59e2b] text-[#090c10] font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Access Inquiries Inbox</span>
            </button>
          </form>

          <div className="pt-4 text-center">
            <a 
              href={PUBLIC_SITE_URL} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-[#8b9bb4] hover:text-[#d4af37] transition-colors inline-flex items-center gap-1.5"
            >
              <span>Return to Public Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED INQUIRIES VIEW ---
  return (
    <div data-ui className="min-h-screen bg-[#090c10] text-[#f1f4f8]">
      {/* Top Header */}
      <header className="bg-[#090c10] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#121720] border border-[#d4af37]/40 flex items-center justify-center">
              <Logo className="w-5 h-5 text-[#d4af37]" variant="gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg text-[#f1f4f8]">Sixth Sense Investments</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                  Inquiries Portal
                </span>
              </div>
              <p className="text-[11px] text-[#8b9bb4]">Direct Consultation Submissions Inbox</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={loadLeads}
              disabled={loading}
              title="Refresh Inquiries"
              className="p-2.5 rounded-lg bg-[#121720] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] transition-colors flex items-center gap-2 text-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d4af37]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={exportCSV}
              title="Download CSV"
              className="p-2.5 rounded-lg bg-[#121720] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] transition-colors flex items-center gap-2 text-xs"
            >
              <Download className="w-4 h-4 text-[#d4af37]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <a
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-lg bg-[#121720] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] transition-colors flex items-center gap-1.5 text-xs"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950/40 text-rose-300 transition-colors flex items-center gap-1.5 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#121720] border border-[#1e2638] space-y-1">
            <span className="text-xs text-[#8b9bb4] font-medium">Total Inquiries</span>
            <div className="font-serif text-3xl text-[#f1f4f8]">{counts.total}</div>
            <p className="text-[11px] text-[#8b9bb4]">All submissions logged in database</p>
          </div>

          <div className="p-5 rounded-xl bg-[#121720] border border-amber-900/40 space-y-1">
            <span className="text-xs text-amber-400 font-medium">New / Uncontacted</span>
            <div className="font-serif text-3xl text-amber-400">{counts.new}</div>
            <p className="text-[11px] text-[#8b9bb4]">Awaiting initial client callback</p>
          </div>

          <div className="p-5 rounded-xl bg-[#121720] border border-emerald-900/40 space-y-1">
            <span className="text-xs text-emerald-400 font-medium">Converted Clients</span>
            <div className="font-serif text-3xl text-emerald-400">{counts.converted}</div>
            <p className="text-[11px] text-[#8b9bb4]">Active advisory or mentorship agreements</p>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'New', 'Contacted', 'Converted', 'Archived'] as const).map(tab => {
              const active = statusFilter === tab;
              const count = tab === 'All' ? counts.total :
                            tab === 'New' ? counts.new :
                            tab === 'Contacted' ? counts.contacted :
                            tab === 'Converted' ? counts.converted : counts.archived;
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    active 
                      ? 'bg-[#d4af37] text-[#090c10]' 
                      : 'bg-[#121720] border border-[#1e2638] text-[#8b9bb4] hover:text-[#f1f4f8] hover:border-[#8b9bb4]'
                  }`}
                >
                  <span>{tab}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    active ? 'bg-[#090c10]/20 text-[#090c10]' : 'bg-[#1e2638] text-[#8b9bb4]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9bb4]" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, phone, email..."
              className="w-full bg-[#121720] border border-[#1e2638] focus:border-[#d4af37] rounded-xl pl-10 pr-4 py-2 text-xs text-[#f1f4f8] placeholder-[#475569] outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b9bb4] hover:text-[#f1f4f8]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Inquiries List / Table */}
        <div className="rounded-xl bg-[#121720] border border-[#1e2638] overflow-hidden">
          {loading && leads.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
              <p className="text-sm text-[#8b9bb4]">Connecting to Cloudflare D1 database...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-sm text-[#f1f4f8]">No inquiries found.</p>
              <p className="text-xs text-[#8b9bb4]">
                {searchQuery ? 'Try adjusting your search criteria.' : 'New inquiries from the website will automatically appear here.'}
              </p>
            </div>
          ) : (
            <div data-ui className="divide-y divide-[#1e2638]">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const statusColor = 
                  lead.status === 'New' ? 'text-amber-400 bg-amber-950/40 border-amber-800/40' :
                  lead.status === 'Contacted' ? 'text-sky-400 bg-sky-950/40 border-sky-800/40' :
                  lead.status === 'Converted' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' :
                  'text-slate-400 bg-slate-900 border-slate-800';

                return (
                  <div 
                    key={lead.id}
                    className={`p-5 transition-colors ${
                      isSelected ? 'bg-[#18202f]' : 'hover:bg-[#151c27]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left: Client Name, Date, Service, Budget */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-base text-[#f1f4f8]">
                            {lead.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusColor}`}>
                            {lead.status}
                          </span>
                          <span className="text-xs text-[#8b9bb4] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#8b9bb4]" />
                            {formatDate(lead.created_at)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8b9bb4]">
                          <span className="px-2 py-0.5 rounded bg-[#090c10] border border-[#1e2638] text-[#d4af37] font-medium">
                            {lead.service_interested || 'General Consultation'}
                          </span>
                          <span className="flex items-center gap-1 text-[#f1f4f8]">
                            <DollarSign className="w-3 h-3 text-[#d4af37]" />
                            <span>Budget: {lead.investment_budget || 'Not specified'}</span>
                          </span>
                        </div>

                        {/* Message Preview */}
                        {lead.message && (
                          <p className="text-xs text-[#8b9bb4] line-clamp-2 pt-1 font-normal italic">
                            &ldquo;{lead.message}&rdquo;
                          </p>
                        )}

                        {/* Internal Notes Preview */}
                        {lead.notes && (
                          <div className="pt-1 text-[11px] text-[#d4af37] flex items-center gap-1">
                            <span className="font-semibold">Internal Note:</span>
                            <span className="truncate">{lead.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Quick Action Buttons & Status Selector */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Direct WhatsApp Button */}
                        <a
                          href={getWhatsAppUrl(lead)}
                          target="_blank"
                          rel="noreferrer"
                          title="Open WhatsApp Chat"
                          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Direct Call Button */}
                        <a
                          href={`tel:${lead.phone}`}
                          title="Call Client"
                          className="px-3 py-2 rounded-lg bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#f1f4f8] text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#38bdf8]" />
                          <span>{lead.phone}</span>
                        </a>

                        {/* Direct Email Button */}
                        <a
                          href={`mailto:${lead.email}?subject=Regarding your consultation request with Sixth Sense Investments`}
                          title="Email Client"
                          className="p-2 rounded-lg bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>

                        {/* Status Dropdown */}
                        <div className="relative">
                          <select
                            value={lead.status}
                            disabled={statusUpdatingId === lead.id}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead['status'])}
                            className="bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-xs text-[#f1f4f8] rounded-lg px-2.5 py-2 outline-none cursor-pointer"
                          >
                            <option value="New">Status: New</option>
                            <option value="Contacted">Status: Contacted</option>
                            <option value="Converted">Status: Converted</option>
                            <option value="Archived">Status: Archived</option>
                          </select>
                        </div>

                        {/* View Full Details & Notes Button */}
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setLeadNoteInput(lead.notes || '');
                          }}
                          className="px-3 py-2 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/30 text-xs font-medium transition-colors"
                        >
                          Details & Notes
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                          title="Delete Lead"
                          className="p-2 rounded-lg text-[#8b9bb4] hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* DETAIL & CRM NOTES MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div data-ui className="w-full max-w-2xl bg-[#121720] border border-[#1e2638] rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl text-[#f1f4f8]">{selectedLead.name}</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                    {selectedLead.status}
                  </span>
                </div>
                <p className="text-xs text-[#8b9bb4]">
                  Inquiry received on {formatDate(selectedLead.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 rounded-lg bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Contacts Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href={getWhatsAppUrl(selectedLead)}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Message on WhatsApp</span>
              </a>

              <a
                href={`tel:${selectedLead.phone}`}
                className="p-3 rounded-xl bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#f1f4f8] font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#38bdf8]" />
                <span>Call {selectedLead.phone}</span>
              </a>

              <a
                href={`mailto:${selectedLead.email}?subject=Sixth Sense Investments Consultation`}
                className="p-3 rounded-xl bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#f1f4f8] font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Mail className="w-4 h-4 text-[#d4af37]" />
                <span>Send Email</span>
              </a>
            </div>

            {/* Client Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#090c10] border border-[#1e2638]">
              <div className="space-y-1">
                <span className="text-xs text-[#8b9bb4] font-medium">Service Requested</span>
                <p className="text-sm font-semibold text-[#d4af37]">{selectedLead.service_interested || 'General Consultation'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#8b9bb4] font-medium">Capital / Portfolio Budget</span>
                <p className="text-sm font-semibold text-[#f1f4f8]">{selectedLead.investment_budget || 'Not specified'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#8b9bb4] font-medium">Phone Number</span>
                <p className="text-sm text-[#f1f4f8]">{selectedLead.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#8b9bb4] font-medium">Email Address</span>
                <p className="text-sm text-[#f1f4f8]">{selectedLead.email}</p>
              </div>
            </div>

            {/* Client Message */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-[#8b9bb4]">Submitted Client Message</span>
              <div className="p-4 rounded-xl bg-[#090c10] border border-[#1e2638] text-sm text-[#f1f4f8] leading-relaxed">
                {selectedLead.message || 'No additional message was included in this consultation submission.'}
              </div>
            </div>

            {/* Internal CRM Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#d4af37]">Internal Fiduciary Notes (Private)</span>
                <span className="text-[10px] text-[#8b9bb4]">Saved to Cloudflare D1</span>
              </div>
              <textarea
                value={leadNoteInput}
                onChange={(e) => setLeadNoteInput(e.target.value)}
                placeholder="Add private consultation notes (e.g., Called client, discussed 20L portfolio allocation, meeting scheduled for Tuesday)..."
                rows={3}
                className="w-full bg-[#090c10] border border-[#1e2638] focus:border-[#d4af37] rounded-xl p-3 text-xs text-[#f1f4f8] placeholder-[#475569] outline-none transition-colors"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#c59e2b] text-[#090c10] font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  {savingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{savingNote ? 'Saving...' : 'Save Note'}</span>
                </button>
              </div>
            </div>

            {/* Quick Status Buttons */}
            <div className="space-y-2 pt-2">
              <span className="text-xs text-[#8b9bb4]">Quick Status Update</span>
              <div className="flex flex-wrap gap-2">
                {(['New', 'Contacted', 'Converted', 'Archived'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedLead.id, st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedLead.status === st
                        ? 'bg-[#d4af37] text-[#090c10]'
                        : 'bg-[#090c10] border border-[#1e2638] text-[#8b9bb4] hover:text-[#f1f4f8]'
                    }`}
                  >
                    Mark as {st}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
export default App;