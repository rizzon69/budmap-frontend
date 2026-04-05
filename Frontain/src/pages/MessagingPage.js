import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Send, Search, MessageSquare, RefreshCw, X, Plus, Trash2,
  Paperclip, Image, FileText, Video, Download, CheckCheck,
  ChevronRight, MoreVertical, Phone, Mail,
} from 'lucide-react';
import './PageStyles.css';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

// ── helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' });
};
const fullName  = (u) => u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Unknown';
const initials  = (u) => u ? `${(u.firstName||'')[0]||''}${(u.lastName||'')[0]||''}`.toUpperCase() : '?';
const fmtSize   = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

const AVATAR_COLORS = [
  ['#dcfce7','#16a34a'], ['#dbeafe','#2563eb'], ['#fef3c7','#d97706'],
  ['#f3e8ff','#7c3aed'], ['#fce7f3','#db2777'], ['#e0f2fe','#0284c7'],
];
const avatarColor = (id = '') => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0];

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 40 }) => {
  const id = user?._id || user?.id || '';
  const [bg, fg] = avatarColor(String(id));
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: Math.round(size * 0.34), flexShrink: 0,
      letterSpacing: 0.5,
    }}>
      {initials(user)}
    </div>
  );
};

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = {
    admin:           { label: 'Admin',           bg: '#fef2f2', color: '#991b1b' },
    finance_officer: { label: 'Finance Officer', bg: '#f0fdf4', color: '#166534' },
    department_head: { label: 'Dept Head',       bg: '#f3e8ff', color: '#5b21b6' },
    viewer:          { label: 'Viewer',          bg: '#f1f5f9', color: '#475569' },
  };
  const cfg = map[role] || { label: role, bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: cfg.bg, color: cfg.color, textTransform: 'capitalize' }}>
      {cfg.label}
    </span>
  );
};

// ── Attachment renderer ───────────────────────────────────────────────────────
const Attachment = ({ att, mine }) => {
  const url      = att.url?.startsWith('http') ? att.url : `${API_BASE}${att.url}`;
  const isImage  = att.mimetype?.startsWith('image/');
  const isVideo  = att.mimetype?.startsWith('video/');
  const isPDF    = att.mimetype === 'application/pdf';
  const isWord   = att.mimetype?.includes('word');

  if (isImage) return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 6 }}>
      <img src={url} alt={att.filename}
        style={{ maxWidth: 200, maxHeight: 160, borderRadius: 10, objectFit: 'cover', display: 'block', border: mine ? 'none' : '1px solid #e2e8f0' }} />
    </a>
  );

  if (isVideo) return (
    <video controls style={{ maxWidth: 240, borderRadius: 10, marginTop: 6, display: 'block' }}>
      <source src={url} type={att.mimetype} />
    </video>
  );

  const Icon  = isPDF ? FileText : isWord ? FileText : Paperclip;
  const color = isPDF ? '#dc2626' : isWord ? '#2563eb' : '#6b7280';
  const bg    = mine ? 'rgba(255,255,255,0.15)' : '#f8fafc';
  const tc    = mine ? 'rgba(255,255,255,0.9)' : '#334155';
  const sc    = mine ? 'rgba(255,255,255,0.6)' : '#94a3b8';

  return (
    <a href={url} target="_blank" rel="noreferrer" download={att.filename}
      style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, padding:'10px 12px', background: bg, borderRadius:10, textDecoration:'none', maxWidth:220, border: mine ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0' }}>
      <div style={{ width:34, height:34, borderRadius:8, background: mine ? 'rgba(255,255,255,0.2)' : color+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={16} style={{ color: mine ? 'white' : color }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color: tc, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{att.filename}</div>
        <div style={{ fontSize:10, color: sc, marginTop:1 }}>{fmtSize(att.size)}</div>
      </div>
      <Download size={13} style={{ color: mine ? 'rgba(255,255,255,0.7)' : color, flexShrink:0 }} />
    </a>
  );
};

// ── File picker ───────────────────────────────────────────────────────────────
const FilePicker = ({ files, setFiles }) => {
  const ref = useRef();
  const open = (accept) => { ref.current.accept = accept; ref.current.click(); };
  const remove = (i) => setFiles(p => p.filter((_, idx) => idx !== i));

  return (
    <div>
      <input ref={ref} type="file" multiple style={{ display:'none' }}
        onChange={e => setFiles(p => [...p, ...Array.from(e.target.files)].slice(0,5))} />

      {files.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'8px 12px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0', marginBottom:8 }}>
          {files.map((f,i) => {
            const isImg = f.type.startsWith('image/');
            const isVid = f.type.startsWith('video/');
            const Icon  = isImg ? Image : isVid ? Video : FileText;
            const col   = isImg ? '#16a34a' : isVid ? '#7c3aed' : '#dc2626';
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'white', borderRadius:8, border:'1px solid #e2e8f0', fontSize:12 }}>
                <Icon size={13} style={{ color: col, flexShrink:0 }} />
                <span style={{ maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#334155', fontWeight:500 }}>{f.name}</span>
                <span style={{ color:'#94a3b8', fontSize:10 }}>{fmtSize(f.size)}</span>
                <button onClick={() => remove(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}>
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:'flex', gap:6 }}>
        {[
          { label:'Photo', icon: Image,    color:'#16a34a', accept:'image/*' },
          { label:'Video', icon: Video,    color:'#7c3aed', accept:'video/mp4,video/webm,video/quicktime' },
          { label:'PDF',   icon: FileText, color:'#dc2626', accept:'application/pdf,.doc,.docx' },
          { label:'File',  icon: Paperclip,color:'#6b7280', accept:'*' },
        ].map(({ label, icon: Icon, color, accept }) => (
          <button key={label} type="button" onClick={() => open(accept)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:'white', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:12, color:'#64748b', fontFamily:'inherit', fontWeight:500, transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}>
            <Icon size={13} style={{ color }} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
export default function MessagingPage() {
  const { user } = useAuth();
  const myId = String(user?._id || user?.id || '');

  const [convos,  setConvos]  = useState([]);
  const [thread,  setThread]  = useState(null);
  const [users,   setUsers]   = useState([]);
  const [body,    setBody]    = useState('');
  const [subject, setSubject] = useState('');
  const [files,   setFiles]   = useState([]);
  const [search,  setSearch]  = useState('');
  const [showNew, setShowNew] = useState(false);
  const [recip,   setRecip]   = useState(null);
  const [uSearch, setUSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unread,  setUnread]  = useState(0);
  const [sendError, setSendError] = useState('');
  const threadEndRef = useRef(null);
  const textareaRef  = useRef(null);

  // ── data loaders ─────────────────────────────────────────────────────────
  const loadConvos = useCallback(async () => {
    try {
      const r = await api.get('/messages/conversations');
      if (r.data.success) {
        const list = r.data.data || [];
        setConvos(list);
        setUnread(list.reduce((s, c) => s + (c.unreadCount || 0), 0));
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const r = await api.get('/users/colleagues');
      if (r.data.success) setUsers(r.data.data.users || []);
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => {
    loadConvos(); loadUsers();
    const iv = setInterval(loadConvos, 15000);
    return () => clearInterval(iv);
  }, [loadConvos, loadUsers]);

  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread?.messages]);

  // ── open thread ───────────────────────────────────────────────────────────
  const openThread = async (pid, partner) => {
    try {
      const r = await api.get('/messages/thread/' + pid);
      if (r.data.success) {
        setThread({ partnerId: pid, partner: partner || r.data.data.user, messages: r.data.data.messages || [] });
        loadConvos();
      }
    } catch(e) { console.error(e); }
  };

  // ── send ──────────────────────────────────────────────────────────────────
  const send = async () => {
    const rid = (recip && (recip._id || recip.id)) || thread?.partnerId;
    if ((!body.trim() && files.length === 0) || !rid) return;
    setSendError('');
    setSending(true);
    try {
      let res;
      if (files.length > 0) {
        const fd = new FormData();
        fd.append('recipientId', rid);
        if (body.trim()) fd.append('body', body.trim());
        if (subject.trim()) fd.append('subject', subject.trim());
        files.forEach(f => fd.append('attachments', f));
        res = await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/messages', { recipientId: rid, body: body.trim(), subject: subject.trim() || undefined });
      }
      if (res.data.success) {
        setBody(''); setSubject(''); setFiles([]);
        if (showNew) {
          const p = recip; setShowNew(false); setRecip(null); setUSearch('');
          await openThread(rid, p);
        } else {
          setThread(prev => ({ ...prev, messages: [...prev.messages, res.data.data] }));
        }
        loadConvos();
      }
    } catch(e) { setSendError(e.response?.data?.message || 'Failed to send message. Please try again.'); }
    finally { setSending(false); }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const del = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete('/messages/' + id);
      setThread(prev => ({ ...prev, messages: prev.messages.filter(m => (m._id||m.id) !== id) }));
    } catch(e) { console.error(e); }
  };

  const fConvos = convos.filter(c =>
    fullName(c.partner).toLowerCase().includes(search.toLowerCase()) ||
    (c.partner?.email||'').toLowerCase().includes(search.toLowerCase())
  );
  // Show all users when search is empty, filter when typing
  const fUsers = uSearch.trim() === ''
    ? users
    : users.filter(u =>
        fullName(u).toLowerCase().includes(uSearch.toLowerCase()) ||
        (u.email||'').toLowerCase().includes(uSearch.toLowerCase())
      );

  // ── styles ────────────────────────────────────────────────────────────────
  const S = {
    page:    { display:'flex', height:'calc(100vh - 64px)', overflow:'hidden', background:'#f8fafc' },
    sidebar: { width:300, flexShrink:0, display:'flex', flexDirection:'column', background:'white', borderRight:'1px solid #e2e8f0' },
    main:    { flex:1, display:'flex', flexDirection:'column', minWidth:0, background:'#f8fafc' },
  };

  return (
    <div style={S.page}>

      {/* ══ SIDEBAR ════════════════════════════════════════════════════════ */}
      <div style={S.sidebar}>

        {/* Sidebar header */}
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:0 }}>Messages</h3>
              {unread > 0 && (
                <span style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>{unread} unread</span>
              )}
            </div>
            <button onClick={() => { setShowNew(true); setThread(null); setFiles([]); }}
              style={{ width:34, height:34, borderRadius:10, background:'#16a34a', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}
              title="New message">
              <Plus size={18} />
            </button>
          </div>
          {/* Search */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0' }}>
            <Search size={14} style={{ color:'#94a3b8', flexShrink:0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:'#334155', fontFamily:'inherit' }} />
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontSize:13 }}>
              <RefreshCw size={20} style={{ animation:'spin 1s linear infinite', margin:'0 auto 8px', display:'block' }} />
              Loading...
            </div>
          ) : fConvos.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
              <MessageSquare size={36} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }} />
              <p style={{ fontSize:13, fontWeight:600, color:'#64748b', marginBottom:4 }}>No conversations yet</p>
              <p style={{ fontSize:12 }}>Click + to start a new message</p>
            </div>
          ) : fConvos.map(c => {
            const active = thread?.partnerId === c.partnerId;
            return (
              <div key={c.partnerId} onClick={() => openThread(c.partnerId, c.partner)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', cursor:'pointer', background: active ? '#f0fdf4' : 'transparent', borderLeft: `3px solid ${active ? '#16a34a' : 'transparent'}`, borderBottom:'1px solid #f8fafc', transition:'background 0.1s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background='#f8fafc'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background='transparent'; }}>
                <div style={{ position:'relative' }}>
                  <Avatar user={c.partner} size={42} />
                  {c.unreadCount > 0 && (
                    <span style={{ position:'absolute', top:-2, right:-2, width:16, height:16, borderRadius:'50%', background:'#dc2626', border:'2px solid white', fontSize:9, fontWeight:700, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight: c.unreadCount > 0 ? 700 : 600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {fullName(c.partner)}
                    </span>
                    <span style={{ fontSize:10, color:'#94a3b8', flexShrink:0, marginLeft:6 }}>{timeAgo(c.lastMessage?.createdAt)}</span>
                  </div>
                  <span style={{ fontSize:12, color: c.unreadCount > 0 ? '#334155' : '#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block', fontWeight: c.unreadCount > 0 ? 500 : 400 }}>
                    {c.lastMessage?.attachments?.length > 0
                      ? `📎 ${c.lastMessage.body || 'Attachment'}`
                      : (c.lastMessage?.body || '').slice(0, 42)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ MAIN PANE ═══════════════════════════════════════════════════════ */}
      <div style={S.main}>

        {/* ── NEW MESSAGE ─────────────────────────────────────────────────── */}
        {showNew && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            {/* Header */}
            <div style={{ padding:'16px 24px', background:'white', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={() => { setShowNew(false); setFiles([]); }}
                style={{ width:32, height:32, borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
                <X size={16} />
              </button>
              <div>
                <h4 style={{ margin:0, fontSize:15, fontWeight:700, color:'#0f172a' }}>New Message</h4>
                <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>Send to a team member</p>
              </div>
            </div>

            {/* To + Subject */}
            <div style={{ padding:'20px 24px', background:'white', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.6px', display:'block', marginBottom:8 }}>To</label>
                {recip ? (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0' }}>
                    <Avatar user={recip} size={32} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#166534' }}>{fullName(recip)}</div>
                      <div style={{ fontSize:11, color:'#4ade80' }}>{recip.email}</div>
                    </div>
                    <RoleBadge role={recip.role} />
                    <button onClick={() => setRecip(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4, display:'flex' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ position:'relative' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0' }}>
                  <Search size={14} style={{ color:'#94a3b8' }} />
                  <input value={uSearch} onChange={e => setUSearch(e.target.value)} autoFocus
                  placeholder="Search team members by name or email..."
                  style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:'#334155', fontFamily:'inherit' }}
                      onFocus={() => setUSearch(uSearch)} />
                  </div>
                  {/* Show dropdown always when input is focused — even if empty (shows all) */}
                  {(uSearch !== null) && (
                  <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:20, background:'white', borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', border:'1px solid #e2e8f0', overflow:'hidden', maxHeight:260, overflowY:'auto' }}>
                  {/* Header */}
                  <div style={{ padding:'10px 16px 8px', borderBottom:'1px solid #f1f5f9', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  {uSearch ? `Results for "${uSearch}"` : 'All Team Members'}
                  </div>
                  {fUsers.length === 0 ? (
                  <div style={{ padding:'20px 16px', textAlign:'center', color:'#94a3b8', fontSize:13 }}>No team members found</div>
                  ) : fUsers.slice(0,10).map(u => (
                  <div key={u._id||u.id} onClick={() => { setRecip(u); setUSearch(''); }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #f8fafc', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <Avatar user={u} size={36} />
                      <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{fullName(u)}</div>
                            <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{u.email}</div>
                            </div>
                            <RoleBadge role={u.role} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.6px', display:'block', marginBottom:8 }}>Subject (optional)</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Budget approval request"
                  style={{ width:'100%', padding:'10px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box', color:'#334155' }} />
              </div>
            </div>

            {/* Compose area */}
            <div style={{ flex:1, padding:'20px 24px', display:'flex', flexDirection:'column', gap:12 }}>
              <textarea ref={textareaRef} value={body} onChange={e => setBody(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && e.ctrlKey) send(); }}
                placeholder="Write your message here... (Press Ctrl+Enter to send)"
                style={{ flex:1, padding:'16px', background:'white', border:'1px solid #e2e8f0', borderRadius:12, fontSize:14, lineHeight:1.6, resize:'none', outline:'none', fontFamily:'inherit', color:'#334155', minHeight:120 }} />
              <FilePicker files={files} setFiles={setFiles} />
              {sendError && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, fontSize:13, color:'#dc2626' }}>
                  <span style={{ fontSize:16 }}>⚠</span>
                  {sendError}
                  <button onClick={() => setSendError('')} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:0 }}><X size={14}/></button>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4 }}>
                <button onClick={() => { setShowNew(false); setFiles([]); setSendError(''); }}
                  style={{ padding:'10px 20px', borderRadius:10, background:'white', border:'1px solid #e2e8f0', color:'#64748b', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  Cancel
                </button>
                <button onClick={send} disabled={sending || (!body.trim() && files.length === 0) || !recip}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 22px', borderRadius:10, background: (!body.trim() && files.length === 0) || !recip ? '#e2e8f0' : '#16a34a', color: (!body.trim() && files.length === 0) || !recip ? '#94a3b8' : 'white', fontSize:13, fontWeight:600, cursor: (!body.trim() && files.length === 0) || !recip ? 'not-allowed' : 'pointer', border:'none', fontFamily:'inherit', transition:'background 0.15s' }}>
                  {sending ? <RefreshCw size={15} style={{ animation:'spin 1s linear infinite' }} /> : <Send size={15} />}
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── THREAD ──────────────────────────────────────────────────────── */}
        {!showNew && thread && (
          <>
            {/* Thread header */}
            <div style={{ padding:'14px 24px', background:'white', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:14 }}>
              <Avatar user={thread.partner} size={42} />
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:2 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{fullName(thread.partner)}</span>
                  <RoleBadge role={thread.partner?.role} />
                </div>
                <div style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Mail size={11}/>{thread.partner?.email}</span>
                </div>
              </div>
              <button onClick={() => openThread(thread.partnerId, thread.partner)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:12, color:'#64748b', fontFamily:'inherit', fontWeight:500 }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:16 }}>
              {thread.messages.length === 0 ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, color:'#94a3b8' }}>
                  <MessageSquare size={40} style={{ opacity:0.3 }} />
                  <p style={{ fontSize:14, fontWeight:500 }}>No messages yet</p>
                  <p style={{ fontSize:12 }}>Say something to {fullName(thread.partner)}</p>
                </div>
              ) : thread.messages.map(msg => {
                const sid  = String(msg.senderId?._id || msg.senderId || '');
                const mine = sid === myId;
                return (
                  <div key={msg._id||msg.id} style={{ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start', gap:10, alignItems:'flex-end' }}>
                    {!mine && <Avatar user={thread.partner} size={32} />}
                    <div style={{ maxWidth:'60%' }}>
                      {/* Subject line */}
                      {msg.subject && (
                        <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:4, textAlign: mine ? 'right' : 'left', textTransform:'uppercase', letterSpacing:'0.4px' }}>
                          RE: {msg.subject}
                        </div>
                      )}
                      {/* Bubble */}
                      <div style={{
                        padding: msg.body || (msg.attachments||[]).length > 0 ? '12px 16px' : 0,
                        borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: mine ? '#16a34a' : 'white',
                        color: mine ? 'white' : '#334155',
                        fontSize: 13, lineHeight: 1.6,
                        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                        border: mine ? 'none' : '1px solid #e2e8f0',
                      }}>
                        {msg.body && <div style={{ whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.body}</div>}
                        {(msg.attachments||[]).map((att, i) => <Attachment key={i} att={att} mine={mine} />)}
                      </div>
                      {/* Meta */}
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize:10, color:'#94a3b8' }}>{timeAgo(msg.createdAt)}</span>
                        {mine && msg.readAt && (
                          <span style={{ fontSize:10, color:'#16a34a', display:'flex', alignItems:'center', gap:3 }}>
                            <CheckCheck size={11} /> Read
                          </span>
                        )}
                        {(msg.attachments||[]).length > 0 && (
                          <span style={{ fontSize:10, color:'#94a3b8', display:'flex', alignItems:'center', gap:3 }}>
                            <Paperclip size={10} /> {msg.attachments.length}
                          </span>
                        )}
                        {mine && (
                          <button onClick={() => del(msg._id||msg.id)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', padding:2, display:'flex', opacity:0.6 }}
                            onMouseEnter={e => e.currentTarget.style.color='#dc2626'}
                            onMouseLeave={e => e.currentTarget.style.color='#cbd5e1'}>
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    {mine && <Avatar user={user} size={32} />}
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>

            {/* Reply box */}
            <div style={{ padding:'16px 24px', background:'white', borderTop:'1px solid #e2e8f0' }}>
              {sendError && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, fontSize:13, color:'#dc2626', marginBottom:10 }}>
                  <span>⚠</span> {sendError}
                  <button onClick={() => setSendError('')} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:0 }}><X size={14}/></button>
                </div>
              )}
              <FilePicker files={files} setFiles={setFiles} />
              <div style={{ display:'flex', gap:12, alignItems:'flex-end', marginTop: files.length > 0 ? 10 : 0 }}>
                <textarea ref={textareaRef} rows={2} value={body}
                  onChange={e => setBody(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter' && e.ctrlKey) send(); }}
                  placeholder="Type a message... (Ctrl+Enter to send)"
                  style={{ flex:1, padding:'12px 16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, fontSize:13, lineHeight:1.5, resize:'none', outline:'none', fontFamily:'inherit', color:'#334155', transition:'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor='#16a34a'}
                  onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                <button onClick={send} disabled={sending || (!body.trim() && files.length === 0)}
                  style={{ width:44, height:44, borderRadius:12, background: (!body.trim() && files.length === 0) ? '#e2e8f0' : '#16a34a', border:'none', cursor: (!body.trim() && files.length === 0) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, transition:'background 0.15s' }}>
                  {sending
                    ? <RefreshCw size={16} style={{ animation:'spin 1s linear infinite' }} />
                    : <Send size={16} />}
                </button>
              </div>
              <p style={{ fontSize:11, color:'#cbd5e1', marginTop:6, textAlign:'right' }}>Ctrl+Enter to send</p>
            </div>
          </>
        )}

        {/* ── EMPTY STATE ──────────────────────────────────────────────────── */}
        {!showNew && !thread && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, color:'#94a3b8' }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MessageSquare size={36} style={{ color:'#16a34a', opacity:0.7 }} />
            </div>
            <div style={{ textAlign:'center' }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:'#334155', margin:'0 0 6px' }}>Your Messages</h3>
              <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>Select a conversation or start a new one</p>
            </div>
            <button onClick={() => { setShowNew(true); setFiles([]); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, background:'#16a34a', border:'none', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              <Plus size={16} /> New Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
