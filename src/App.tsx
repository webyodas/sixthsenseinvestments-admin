import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Phone, 
  Mail, 
  Send, 
  Lock, 
  Eye, 
  EyeOff, 
  LayoutList, 
  Table as TableIcon,
  ChevronDown
} from 'lucide-react';
import { Logo } from './components/Logo';
import { api, Lead } from './services/api';

const PASSCODE = 'sixthsense2026';
const PUBLIC_SITE_URL = 'https://sixthsenseinvestments.pages.dev';

interface StatusDropdownProps {
  status: Lead['status'];
  onChange: (nextStatus: Lead['status']) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

function StatusDropdown({ status, onChange, disabled, size = 'md' }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const config = {
    New: {
      label: 'New',
      dot: 'bg-amber-400',
      badge: 'text-amber-400 bg-amber-950/40 border-amber-800/40 hover:bg-amber-950/70'
    },
    Contacted: {
      label: 'Contacted',
      dot: 'bg-sky-400',
      badge: 'text-sky-400 bg-sky-950/40 border-sky-800/40 hover:bg-sky-950/70'
    },
    Qualified: {
      label: 'Qualified',
      dot: 'bg-teal-400',
      badge: 'text-teal-400 bg-teal-950/40 border-teal-800/40 hover:bg-teal-950/70'
    },
    Converted: {
      label: 'Converted',
      dot: 'bg-emerald-400',
      badge: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40 hover:bg-emerald-950/70'
    },
    Archived: {
      label: 'Archived',
      dot: 'bg-slate-400',
      badge: 'text-slate-400 bg-slate-900 border-slate-800 hover:bg-slate-800/70'
    }
  };

  const current = config[status] || config.New;
  const isSm = size === 'sm';

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`${isSm ? 'h-7 px-2 text-[11px]' : 'h-8 px-2.5 text-xs'} rounded-lg border font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer ${current.badge} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        <span>Status: {current.label}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div data-ui className="absolute right-0 mt-1 w-36 rounded-xl bg-[#121720] border border-[#1e2638] shadow-2xl p-1 z-30 space-y-0.5 text-xs">
          {(['New', 'Contacted', 'Qualified', 'Converted', 'Archived'] as const).map((opt) => {
            const item = config[opt];
            const isSelected = status === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left font-medium transition-colors flex items-center justify-between ${
                  isSelected 
                    ? 'bg-[#1a2232] text-white' 
                    : 'text-[#8b9bb4] hover:bg-[#18202e] hover:text-[#f1f4f8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                  <span>{item.label}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // Modal state for full inquiry details & internal notes
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

  // Clean phone number for WhatsApp URL
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

  // Standardized Phone Formatter (+91 XXXXX XXXXX)
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    if (digits.length === 12 && digits.startsWith('91')) {
      return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    }
    return phone;
  };

  // Standardized Budget Formatter (removes corrupted ? and $ marks, adds clean ₹)
  const formatBudget = (budget: string | undefined) => {
    if (!budget) return 'Not specified';
    // Replace any ? sequences or dollar signs with clean rupee symbol
    let clean = budget.replace(/[\?$]+/g, '₹').trim();
    // Consolidate duplicate rupee symbols
    clean = clean.replace(/₹+/g, '₹');
    // Ensure clean rupee prefix if starts with number
    if (/^\d/.test(clean)) {
      clean = `₹${clean}`;
    }
    return clean;
  };

  // Date Formatter: Date Only
  const formatDateOnly = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  // Time Formatter: Time Only
  const formatTimeOnly = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  // Full Date & Time Formatter
  const formatDateTime = (isoString: string) => {
    return `${formatDateOnly(isoString)}, ${formatTimeOnly(isoString)}`;
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
      formatDateTime(l.created_at),
      `"${l.name.replace(/"/g, '""')}"`,
      `"${formatPhoneNumber(l.phone)}"`,
      `"${l.email}"`,
      `"${(l.service_interested || '').replace(/"/g, '""')}"`,
      `"${formatBudget(l.investment_budget).replace(/"/g, '""')}"`,
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

  // Status Badge Colors Helper
  const getStatusBadgeStyle = (status: Lead['status']) => {
    switch (status) {
      case 'New':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
      case 'Contacted':
        return 'text-sky-400 bg-sky-950/40 border-sky-800/40';
      case 'Qualified':
        return 'text-teal-400 bg-teal-950/40 border-teal-800/40';
      case 'Converted':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
      case 'Archived':
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div data-ui className="min-h-screen bg-[#090c10] text-[#f1f4f8] flex items-center justify-center p-4">
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
      <header className="bg-[#090c10] sticky top-0 z-20 border-b border-[#1e2638]">
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
              className="h-9 px-3 rounded-lg bg-[#121720] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] transition-colors flex items-center gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#d4af37]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={exportCSV}
              title="Download CSV"
              className="h-9 px-3 rounded-lg bg-[#121720] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] transition-colors flex items-center gap-2 text-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <a
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3 rounded-lg bg-[#121720] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] transition-colors flex items-center gap-1.5 text-xs"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="h-9 px-3 rounded-lg bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950/40 text-rose-300 transition-colors flex items-center gap-1.5 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
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

        {/* Search, Status Filters & View Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
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
                  className={`h-9 px-3.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                    active 
                      ? 'bg-[#d4af37] text-[#090c10]' 
                      : 'bg-[#121720] border border-[#1e2638] text-[#8b9bb4] hover:text-[#f1f4f8] hover:border-[#8b9bb4]'
                  }`}
                >
                  <span>{tab}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    active ? 'bg-[#090c10]/20 text-[#090c10]' : 'bg-[#1e2638] text-[#8b9bb4]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: View Toggle & Search */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* View Mode Switcher */}
            <div className="h-9 p-0.5 rounded-lg bg-[#121720] border border-[#1e2638] flex items-center shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                title="Cards View"
                className={`h-7 px-2.5 rounded text-xs flex items-center gap-1.5 font-medium transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-[#090c10] text-[#f1f4f8] border border-[#1e2638]' 
                    : 'text-[#8b9bb4] hover:text-[#f1f4f8]'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`h-7 px-2.5 rounded text-xs flex items-center gap-1.5 font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-[#090c10] text-[#f1f4f8] border border-[#1e2638]' 
                    : 'text-[#8b9bb4] hover:text-[#f1f4f8]'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 lg:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9bb4]" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inquiries..."
                className="w-full h-9 bg-[#121720] border border-[#1e2638] focus:border-[#d4af37] rounded-lg pl-9 pr-7 text-xs text-[#f1f4f8] placeholder-[#475569] outline-none transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b9bb4] hover:text-[#f1f4f8]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inquiries Content (Table or Cards View) */}
        {loading && leads.length === 0 ? (
          <div className="rounded-xl bg-[#121720] border border-[#1e2638] py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin mx-auto" />
            <p className="text-sm text-[#8b9bb4]">Connecting to Cloudflare D1 database...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="rounded-xl bg-[#121720] border border-[#1e2638] py-20 text-center space-y-2">
            <p className="text-sm text-[#f1f4f8]">No inquiries found.</p>
            <p className="text-xs text-[#8b9bb4]">
              {searchQuery ? 'Try adjusting your search criteria.' : 'New inquiries from the website will automatically appear here.'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          
          /* --- TABLE VIEW --- */
          <div data-ui className="rounded-xl bg-[#121720] border border-[#1e2638] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0d1117] text-[#8b9bb4] font-medium border-b border-[#1e2638]">{/* taste-skill-ignore */}
                    <th className="py-3 px-4 w-36 whitespace-nowrap">Date & Time</th>
                    <th className="py-3 px-4 w-48">Client</th>
                    <th className="py-3 px-4 w-52">Service & Budget</th>
                    <th className="py-3 px-4 min-w-[220px]">Message Preview</th>
                    <th className="py-3 px-4 w-32 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 w-44 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2638]">{/* taste-skill-ignore */}
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLead?.id === lead.id;
                    const statusStyle = getStatusBadgeStyle(lead.status);

                    return (
                      <tr 
                        key={lead.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-[#18202f]' : 'hover:bg-[#151c27]'
                        }`}
                      >
                        {/* Date & Time */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="font-medium text-[#f1f4f8]">{formatDateOnly(lead.created_at)}</div>
                          <div className="text-[11px] text-[#8b9bb4]">{formatTimeOnly(lead.created_at)}</div>
                        </td>

                        {/* Client Info */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-sm text-[#f1f4f8]">{lead.name}</div>
                          <div className="text-[11px] text-[#8b9bb4] truncate mt-0.5">
                            {formatPhoneNumber(lead.phone)}
                          </div>
                          <div className="text-[11px] text-[#8b9bb4] truncate">
                            {lead.email}
                          </div>
                        </td>

                        {/* Service & Budget */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="inline-block px-2 py-0.5 rounded bg-[#090c10] border border-[#1e2638] text-[#d4af37] text-[11px] font-medium max-w-[200px] truncate">
                            {lead.service_interested || 'General Inquiry'}
                          </span>
                          <div className="text-[#f1f4f8] font-medium text-[11px] mt-1">
                            Budget: {formatBudget(lead.investment_budget)}
                          </div>
                        </td>

                        {/* Message Preview */}
                        <td className="py-3.5 px-4 align-top">
                          {lead.message ? (
                            <p className="text-[#8b9bb4] line-clamp-2 italic font-normal">
                              &ldquo;{lead.message}&rdquo;
                            </p>
                          ) : (
                            <span className="text-[#475569] italic">No message included</span>
                          )}

                          {lead.notes && (
                            <div className="text-[10px] text-[#d4af37] font-medium mt-1 truncate">
                              Note: {lead.notes}
                            </div>
                          )}
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <StatusDropdown
                            status={lead.status}
                            onChange={(next) => handleStatusChange(lead.id, next)}
                            disabled={statusUpdatingId === lead.id}
                            size="sm"
                          />
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {/* WhatsApp */}
                            <a
                              href={getWhatsAppUrl(lead)}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="h-7 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>

                            {/* Call */}
                            <a
                              href={`tel:${lead.phone}`}
                              title={`Call ${formatPhoneNumber(lead.phone)}`}
                              className="h-7 w-7 rounded bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#38bdf8] inline-flex items-center justify-center transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                            </a>

                            {/* Email */}
                            <a
                              href={`mailto:${lead.email}?subject=Sixth Sense Investments Consultation`}
                              title={`Email ${lead.email}`}
                              className="h-7 w-7 rounded bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] inline-flex items-center justify-center transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                            </a>

                            {/* Details */}
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setLeadNoteInput(lead.notes || '');
                              }}
                              title="View Details & Notes"
                              className="h-7 px-2 rounded bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/30 text-[11px] font-medium transition-colors"
                            >
                              Notes
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteLead(lead.id, lead.name)}
                              title="Delete Lead"
                              className="h-7 w-7 rounded text-[#8b9bb4] hover:text-rose-400 inline-flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (

          /* --- CARDS VIEW (STRICT GRID & ALIGNMENT LOCK) --- */
          <div data-ui className="space-y-3">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              const statusStyle = getStatusBadgeStyle(lead.status);

              return (
                <div 
                  key={lead.id}
                  className={`rounded-xl bg-[#121720] border border-[#1e2638] p-5 space-y-3 transition-colors ${
                    isSelected ? 'ring-1 ring-[#d4af37]/40 bg-[#151c28]' : 'hover:border-[#2d3748]'
                  }`}
                >
                  {/* Card Row 1: Header + Action Toolbar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Left: Client Name, Status Badge, Date & Time */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-semibold text-base text-[#f1f4f8]">
                        {lead.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusStyle}`}>
                        {lead.status}
                      </span>
                      <span className="text-xs text-[#8b9bb4] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8b9bb4]" />
                        <span>{formatDateTime(lead.created_at)}</span>
                      </span>
                    </div>

                    {/* Right: Fixed-Width Standardized Action Toolbar */}
                    <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
                      
                      {/* WhatsApp Button (Fixed Width 96px) */}
                      <a
                        href={getWhatsAppUrl(lead)}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat on WhatsApp"
                        className="h-8 w-24 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Call Button (Fixed 32x32 icon) */}
                      <a
                        href={`tel:${lead.phone}`}
                        title={`Call ${formatPhoneNumber(lead.phone)}`}
                        className="h-8 w-8 rounded-lg bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#38bdf8] flex items-center justify-center transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      {/* Email Button (Fixed 32x32 icon) */}
                      <a
                        href={`mailto:${lead.email}?subject=Regarding your consultation request with Sixth Sense Investments`}
                        title={`Email ${lead.email}`}
                        className="h-8 w-8 rounded-lg bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] flex items-center justify-center transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>

                      {/* Status Selector Dropdown */}
                      <StatusDropdown
                        status={lead.status}
                        onChange={(next) => handleStatusChange(lead.id, next)}
                        disabled={statusUpdatingId === lead.id}
                        size="md"
                      />

                      {/* Details & Notes Button (Fixed Width 110px) */}
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setLeadNoteInput(lead.notes || '');
                        }}
                        className="h-8 px-3 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/30 text-xs font-medium transition-colors"
                      >
                        Details & Notes
                      </button>

                      {/* Delete Button (Fixed 32x32) */}
                      <button
                        onClick={() => handleDeleteLead(lead.id, lead.name)}
                        title="Delete Inquiry"
                        className="h-8 w-8 rounded-lg text-[#8b9bb4] hover:text-rose-400 hover:bg-rose-950/20 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </div>

                  {/* Card Row 2: Metadata Strip (Service, Budget, Phone, Email) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-md bg-[#090c10] border border-[#1e2638] text-[#d4af37] text-xs font-medium">
                      {lead.service_interested || 'General Consultation'}
                    </span>

                    <span className="px-2.5 py-1 rounded-md bg-[#090c10] border border-[#1e2638] text-[#f1f4f8] text-xs font-medium">
                      Budget: {formatBudget(lead.investment_budget)}
                    </span>

                    <span className="px-2.5 py-1 rounded-md bg-[#090c10] border border-[#1e2638] text-[#8b9bb4] text-xs flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#38bdf8]" />
                      <span>{formatPhoneNumber(lead.phone)}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-md bg-[#090c10] border border-[#1e2638] text-[#8b9bb4] text-xs flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-[#d4af37]" />
                      <span>{lead.email}</span>
                    </span>
                  </div>

                  {/* Card Row 3: Client Message Quote (if present) */}
                  {lead.message && (
                    <div className="p-3 rounded-lg bg-[#090c10] border border-[#1e2638]/60 text-xs text-[#8b9bb4] italic leading-relaxed">
                      &ldquo;{lead.message}&rdquo;
                    </div>
                  )}

                  {/* Card Row 4: Internal CRM Notes (if present) */}
                  {lead.notes && (
                    <div className="p-2.5 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 text-xs text-[#d4af37] flex items-center gap-2">
                      <span className="font-semibold shrink-0">Internal Note:</span>
                      <span className="truncate">{lead.notes}</span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

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
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadgeStyle(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>
                </div>
                <p className="text-xs text-[#8b9bb4] mt-0.5">
                  Inquiry received on {formatDateTime(selectedLead.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="h-8 w-8 rounded-lg bg-[#090c10] border border-[#1e2638] hover:border-[#8b9bb4] text-[#8b9bb4] hover:text-[#f1f4f8] flex items-center justify-center"
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
                <span>Call {formatPhoneNumber(selectedLead.phone)}</span>
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
                <p className="text-sm font-semibold text-[#f1f4f8]">{formatBudget(selectedLead.investment_budget)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#8b9bb4] font-medium">Phone Number</span>
                <p className="text-sm text-[#f1f4f8]">{formatPhoneNumber(selectedLead.phone)}</p>
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