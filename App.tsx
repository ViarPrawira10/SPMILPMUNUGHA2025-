
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, AuditEntry, AuditStatus, Standard, Indicator, CorrectiveAction, AuditPlan, AuditSchedule, SPMIDocument } from './types';
import { STANDARDS as DEFAULT_STANDARDS, PRODI_LIST } from './constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const INITIAL_ADMIN: User = { 
  id: 'admin-001', 
  username: 'admin', 
  password: 'admin123', 
  role: UserRole.ADMIN 
};

const CYCLE_OPTIONS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [auditPlans, setAuditPlans] = useState<AuditPlan[]>([]);
  const [spmiDocuments, setSpmiDocuments] = useState<SPMIDocument[]>([]);
  
  const [currentCycle, setCurrentCycle] = useState<string>('2025');
  const [activeCycles, setActiveCycles] = useState<string[]>(['2025', '2026']); 
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'audit' | 'users' | 'reports' | 'settings' | 'corrective' | 'planning' | 
    'p1_perencanaan' | 'p2_pelaksanaan' | 'p3_pengendalian' | 'p4_peningkatan'
  >('dashboard');

  useEffect(() => {
    const savedUsers = localStorage.getItem('spmi_users');
    const savedAudit = localStorage.getItem('spmi_audit');
    const savedStandards = localStorage.getItem('spmi_standards');
    const savedPTK = localStorage.getItem('spmi_ptk');
    const savedCycle = localStorage.getItem('spmi_current_cycle');
    const savedPlans = localStorage.getItem('spmi_audit_plans');
    const savedDocs = localStorage.getItem('spmi_documents');
    const savedActiveCycles = localStorage.getItem('spmi_active_cycles');
    
    let loadedUsers: User[] = savedUsers ? JSON.parse(savedUsers) : [INITIAL_ADMIN];
    if (!loadedUsers.some(u => u.role === UserRole.ADMIN)) loadedUsers.push(INITIAL_ADMIN);
    setUsers(loadedUsers);

    setStandards(savedStandards ? JSON.parse(savedStandards) : DEFAULT_STANDARDS);
    if (savedAudit) setAuditData(JSON.parse(savedAudit));
    if (savedPTK) setCorrectiveActions(JSON.parse(savedPTK));
    
    if (savedCycle) {
        try { 
            const parsed = JSON.parse(savedCycle);
            setCurrentCycle(String(parsed)); 
        } catch { 
            setCurrentCycle(String(savedCycle)); 
        }
    }

    if (savedActiveCycles) {
      try {
        const parsed = JSON.parse(savedActiveCycles);
        if (Array.isArray(parsed)) setActiveCycles(parsed);
      } catch (e) {
        console.error("Gagal memuat status siklus", e);
      }
    }

    if (savedPlans) setAuditPlans(JSON.parse(savedPlans));
    if (savedDocs) setSpmiDocuments(JSON.parse(savedDocs));
  }, []);

  const saveToLocal = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleCycleChange = (cycle: string) => {
    setCurrentCycle(cycle);
    saveToLocal('spmi_current_cycle', cycle);
  };

  const toggleCycleStatus = (cycle: string) => {
    let newActive;
    if (activeCycles.includes(cycle)) {
      newActive = activeCycles.filter(c => c !== cycle);
    } else {
      newActive = [...activeCycles, cycle];
    }
    setActiveCycles(newActive);
    saveToLocal('spmi_active_cycles', newActive);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setError('');
    } else {
      setError('Username atau Password salah!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
    setActiveTab('dashboard');
  };

  const saveAuditEntry = (entry: AuditEntry) => {
    const newData = [...auditData];
    const index = newData.findIndex(d => 
      d.indicatorId === entry.indicatorId && 
      d.prodi === entry.prodi && 
      String(d.cycle) === String(entry.cycle)
    );
    const updatedEntry = { ...entry, lastUpdated: new Date().toISOString() };
    if (index > -1) newData[index] = updatedEntry;
    else newData.push(updatedEntry);
    setAuditData(newData);
    saveToLocal('spmi_audit', newData);
  };

  const savePTK = (ptk: CorrectiveAction) => {
    const newData = [...correctiveActions];
    const index = newData.findIndex(d => 
      d.indicatorId === ptk.indicatorId && 
      d.prodi === ptk.prodi && 
      String(d.cycle) === String(ptk.cycle)
    );
    if (index > -1) newData[index] = ptk;
    else newData.push(ptk);
    setCorrectiveActions(newData);
    saveToLocal('spmi_ptk', newData);
  };

  const saveUser = (u: User) => {
    const newUsers = users.find(existing => existing.id === u.id) 
      ? users.map(existing => existing.id === u.id ? u : existing)
      : [...users, u];
    setUsers(newUsers);
    saveToLocal('spmi_users', newUsers);
  };

  const deleteUser = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    if (window.confirm("Yakin ingin menghapus user ini secara permanen?")) {
      const newUsers = users.filter(u => u.id !== id);
      setUsers(newUsers);
      saveToLocal('spmi_users', newUsers);
    }
  };

  const saveStandards = (s: Standard[]) => {
    setStandards(s);
    saveToLocal('spmi_standards', s);
  };

  const savePlan = (plan: AuditPlan) => {
    const newPlans = [...auditPlans];
    const index = newPlans.findIndex(p => p.id === plan.id);
    if (index > -1) newPlans[index] = plan;
    else newPlans.push(plan);
    setAuditPlans(newPlans);
    saveToLocal('spmi_audit_plans', newPlans);
  }

  const saveDocument = (doc: SPMIDocument) => {
    const newDocs = [...spmiDocuments, doc];
    setSpmiDocuments(newDocs);
    saveToLocal('spmi_documents', newDocs);
  }

  const deleteDocument = (id: string) => {
    if(confirm('Hapus dokumen ini?')) {
      const newDocs = spmiDocuments.filter(d => d.id !== id);
      setSpmiDocuments(newDocs);
      saveToLocal('spmi_documents', newDocs);
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-900 p-4 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <i className="fas fa-university text-emerald-600 text-3xl"></i>
            </div>
            <h1 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">SPMI UNUGHA</h1>
            <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] mt-1 italic">Quality Control Center</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="text" placeholder="Username" required
              className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:border-emerald-500 outline-none transition-all font-bold shadow-inner"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
            />
            <input 
              type="password" placeholder="Password" required
              className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:border-emerald-500 outline-none transition-all font-bold shadow-inner"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
            />
            {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95">
              LOGIN KE SISTEM
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      <aside className="w-72 bg-emerald-950 text-white flex flex-col fixed inset-y-0 shadow-2xl z-20 overflow-y-auto">
        <div className="p-8 border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <i className="fas fa-shield-halved text-emerald-400 text-2xl"></i>
            <span className="font-black text-xl tracking-tighter uppercase">SPMI<span className="text-emerald-400 italic">Hub</span></span>
          </div>
          <div className="mt-6 p-4 bg-emerald-900/40 rounded-2xl border border-emerald-800">
            <p className="text-[10px] text-emerald-400 font-black uppercase mb-1">User Aktif</p>
            <p className="font-bold text-sm truncate">{currentUser.username}</p>
            <p className="text-[9px] text-emerald-500 uppercase font-black mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              {currentUser.role} {currentUser.prodi ? `| ${currentUser.prodi}` : ''}
            </p>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
            <div className="px-4 py-2 mt-2">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">P1 - Perencanaan</span>
            </div>
            <NavItem active={activeTab === 'p1_perencanaan'} onClick={() => setActiveTab('p1_perencanaan')} icon="fa-file-lines" label="Dokumen SPMI" />

            <div className="px-4 py-2 mt-4">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">P2 - Pelaksanaan</span>
            </div>
            <NavItem active={activeTab === 'p2_pelaksanaan'} onClick={() => setActiveTab('p2_pelaksanaan')} icon="fa-gavel" label="SK & Pelaksanaan" />

            <div className="px-4 py-2 mt-4">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">E - Evaluasi (Audit)</span>
            </div>
            <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fa-house" label="Dashboard" />
            <NavItem active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon="fa-clipboard-check" label="Audit Mutu" />
            <NavItem active={activeTab === 'corrective'} onClick={() => setActiveTab('corrective')} icon="fa-triangle-exclamation" label="Tindakan Koreksi" />
            <NavItem active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon="fa-chart-column" label="Laporan Hasil" />
            
            {isAdmin && (
              <>
                <div className="my-2 border-t border-emerald-900 mx-4"></div>
                <NavItem active={activeTab === 'planning'} onClick={() => setActiveTab('planning')} icon="fa-calendar-alt" label="Perencanaan Audit" />
                <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon="fa-users-gear" label="Manajemen Akun" />
                <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon="fa-sliders" label="Kelola Standar" />
              </>
            )}

            <div className="px-4 py-2 mt-4">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">P3 - Pengendalian</span>
            </div>
            <NavItem active={activeTab === 'p3_pengendalian'} onClick={() => setActiveTab('p3_pengendalian')} icon="fa-tower-control" label="Dokumen Pengendalian" />

            <div className="px-4 py-2 mt-4">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">P4 - Peningkatan</span>
            </div>
            <NavItem active={activeTab === 'p4_peningkatan'} onClick={() => setActiveTab('p4_peningkatan')} icon="fa-arrow-trend-up" label="Dokumen Peningkatan" />
        </nav>
        <div className="p-6">
          <button onClick={handleLogout} className="w-full p-4 bg-red-600/20 hover:bg-red-600 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest">
            LOGOUT
          </button>
        </div>
      </aside>

      <main className="ml-72 flex-1 p-10 overflow-x-hidden">
        <header className="mb-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-3xl font-black text-gray-900 tracking-tight capitalize">
                   {activeTab === 'p1_perencanaan' ? 'P1 - Perencanaan SPMI' : 
                    activeTab === 'p2_pelaksanaan' ? 'P2 - Pelaksanaan (SK)' :
                    activeTab === 'p3_pengendalian' ? 'P3 - Pengendalian Mutu' :
                    activeTab === 'p4_peningkatan' ? 'P4 - Peningkatan Mutu' :
                    activeTab.replace('-', ' ')}
                 </h2>
              </div>
              <p className="text-gray-400 text-sm font-medium italic">Pemantauan Mutu Internal - Periode Tahun {currentCycle}</p>
            </div>

            <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100">
              <div className={`px-5 py-3 rounded-[1.5rem] flex items-center gap-4 bg-emerald-50`}>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pilih Tahun Siklus:</span>
                  <select 
                    className={`bg-transparent font-black text-sm outline-none cursor-pointer text-emerald-600`}
                    value={currentCycle}
                    onChange={(e) => handleCycleChange(e.target.value)}
                  >
                    {CYCLE_OPTIONS.map(c => <option key={c} value={c}>TAHUN {c}</option>)}
                  </select>
                </div>
                <i className={`fas fa-calendar-check text-emerald-500 text-lg ml-4`}></i>
              </div>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          {activeTab === 'p1_perencanaan' && <DocumentPortal title="Dokumen Perencanaan (P1)" categories={['Kebijakan', 'Manual', 'Standar', 'Formulir']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          {activeTab === 'p2_pelaksanaan' && <DocumentPortal title="Dokumen Pelaksanaan & SK (P2)" categories={['SK']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          {activeTab === 'p3_pengendalian' && <DocumentPortal title="Dokumen Pengendalian (P3)" categories={['Pengendalian']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          {activeTab === 'p4_peningkatan' && <DocumentPortal title="Dokumen Peningkatan (P4)" categories={['Peningkatan']} documents={spmiDocuments} onSave={saveDocument} onDelete={deleteDocument} isReadOnly={!isAdmin} />}
          
          {activeTab === 'dashboard' && <Dashboard auditData={auditData} standards={standards} correctiveActions={correctiveActions} currentCycle={currentCycle} />}
          {activeTab === 'audit' && <AuditPortal auditData={auditData} onSave={saveAuditEntry} currentUser={currentUser} standards={standards} currentCycle={currentCycle} activeCycles={activeCycles} />}
          {activeTab === 'corrective' && <CorrectiveActionPortal auditData={auditData} correctiveActions={correctiveActions} onSavePTK={savePTK} currentUser={currentUser} standards={standards} currentCycle={currentCycle} activeCycles={activeCycles} />}
          {activeTab === 'planning' && <PlanningPortal plans={auditPlans} onSavePlan={savePlan} users={users} currentCycle={currentCycle} activeCycles={activeCycles} onToggleCycle={toggleCycleStatus} />}
          {activeTab === 'users' && <UserManagement users={users} onSaveUser={saveUser} onDeleteUser={deleteUser} currentUser={currentUser} />}
          {activeTab === 'settings' && <StandardSettings standards={standards} onSave={saveStandards} currentCycle={currentCycle} />}
          {activeTab === 'reports' && <Reports auditData={auditData} standards={standards} currentCycle={currentCycle} currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: string, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${active ? 'bg-emerald-600 text-white shadow-xl translate-x-1' : 'text-emerald-300 hover:bg-emerald-900/50'}`}>
    <i className={`fas ${icon} w-5`}></i>
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const DocumentPortal: React.FC<{ 
  title: string, 
  categories: string[], 
  documents: SPMIDocument[], 
  onSave: (doc: SPMIDocument) => void,
  onDelete: (id: string) => void,
  isReadOnly?: boolean 
}> = ({ title, categories, documents, onSave, onDelete, isReadOnly = false }) => {
  const [activeCat, setActiveCat] = useState(categories[0]);
  const [formData, setFormData] = useState({ name: '', url: '' });

  const filteredDocs = documents.filter(d => d.category === activeCat);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return;
    onSave({
      id: `doc-${Date.now()}`,
      category: activeCat as any,
      name: formData.name,
      url: formData.url,
      lastUpdated: new Date().toISOString()
    });
    setFormData({ name: '', url: '' });
  };

  return (
    <div className="space-y-6">
      {categories.length > 1 && (
        <div className="flex gap-2 p-1 bg-gray-200 rounded-xl w-fit">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeCat === cat ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {!isReadOnly && (
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
              <i className="fas fa-plus-circle text-emerald-500"></i>
              Tambah {activeCat}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nama Dokumen</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-emerald-200 transition-all" 
                  placeholder={`Contoh: ${activeCat} Akademik 2025`}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Link File (Google Drive/Web)</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-emerald-200 transition-all text-blue-600" 
                  placeholder="https://..."
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>
              <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest mt-2 hover:bg-emerald-700 transition-all">
                Simpan Dokumen
              </button>
            </form>
          </div>
        )}

        <div className={`${isReadOnly ? 'md:col-span-3' : 'md:col-span-2'} space-y-4`}>
           {filteredDocs.map(doc => (
             <div key={doc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-emerald-200 transition-all">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                   <i className="fas fa-file-pdf"></i>
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-800 text-sm">{doc.name}</h4>
                   <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 font-bold hover:underline truncate max-w-[200px] block">
                     {doc.url}
                   </a>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const PlanningPortal: React.FC<{ 
  plans: AuditPlan[], 
  onSavePlan: (p: AuditPlan) => void, 
  users: User[], 
  currentCycle: string,
  activeCycles: string[],
  onToggleCycle: (c: string) => void
}> = ({ plans, onSavePlan, users, currentCycle, activeCycles, onToggleCycle }) => {
  const [formData, setFormData] = useState<Partial<AuditPlan>>({
    cycle: currentCycle,
    prodi: PRODI_LIST[0],
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: AuditPlan = {
      id: `plan-${Date.now()}`,
      prodi: formData.prodi!,
      cycle: formData.cycle!,
      isActive: true,
      auditorIds: [],
      schedule: { fillingStart: '', fillingEnd: '', deskEvalStart: '', deskEvalEnd: '', visitStart: '', visitEnd: '', rtmStart: '', rtmEnd: '' }
    };
    onSavePlan(newPlan);
    alert('Perencanaan berhasil disimpan!');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-emerald-100">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-emerald-900 flex items-center gap-3">
              <i className="fas fa-shield-halved"></i> Manajemen PPEPP (Buka/Tutup Borang Audit)
            </h3>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {CYCLE_OPTIONS.map(year => {
               const isOpen = activeCycles.includes(year);
               return (
                  <button key={year} onClick={() => onToggleCycle(year)} className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${isOpen ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md transform hover:scale-105' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 hover:opacity-100'}`}>
                     <span className="text-base font-black mb-1">{year}</span>
                     <span className="text-[9px] font-black uppercase tracking-tighter">{isOpen ? 'BORANG DIBUKA' : 'BORANG DITUTUP'}</span>
                  </button>
               );
            })}
         </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{
  auditData: AuditEntry[];
  standards: Standard[];
  correctiveActions: CorrectiveAction[];
  currentCycle: string;
}> = ({ auditData, currentCycle }) => {
  const currentData = auditData.filter((d) => String(d.cycle) === String(currentCycle));
  const achieved = currentData.filter((d) => d.status === AuditStatus.ACHIEVED).length;
  const notAchieved = currentData.filter((d) => d.status === AuditStatus.NOT_ACHIEVED).length;
  const pending = currentData.filter((d) => d.status === AuditStatus.PENDING).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Indikator Tercapai</h3>
          <p className="text-4xl font-black text-emerald-600 mt-2">{achieved}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Tidak Tercapai</h3>
          <p className="text-4xl font-black text-red-600 mt-2">{notAchieved}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Menunggu Audit</h3>
          <p className="text-4xl font-black text-orange-600 mt-2">{pending}</p>
        </div>
      </div>
    </div>
  );
};

const AuditPortal: React.FC<{
  auditData: AuditEntry[];
  onSave: (entry: AuditEntry) => void;
  currentUser: User;
  standards: Standard[];
  currentCycle: string;
  activeCycles: string[];
}> = ({ auditData, onSave, currentUser, standards, currentCycle, activeCycles }) => {
  const [selectedStandard, setSelectedStandard] = useState(standards[0]?.id);
  const availableProdis = useMemo(() => {
     if (currentUser.role === UserRole.ADMIN) return PRODI_LIST;
     if (currentUser.role === UserRole.AUDITEE) return [currentUser.prodi || ''];
     if (currentUser.role === UserRole.AUDITOR) return currentUser.assignedProdi || [];
     return [];
  }, [currentUser]);
  const [selectedProdi, setSelectedProdi] = useState<string>(availableProdis[0] || '');

  const isCycleLocked = !activeCycles.includes(currentCycle) && currentUser.role === UserRole.AUDITEE;

  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center gap-6">
          <select value={selectedProdi} onChange={e => setSelectedProdi(e.target.value)} className="font-black text-sm outline-none bg-emerald-50 px-4 py-2 rounded-xl text-emerald-700 cursor-pointer">
             {availableProdis.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
       </div>
       <div className="grid grid-cols-1 gap-6">
          {standards.find(s => s.id === selectedStandard)?.indicators.map(ind => {
             const entry = auditData.find(d => d.indicatorId === ind.id && d.prodi === selectedProdi && String(d.cycle) === String(currentCycle));
             return (
               <div key={ind.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group hover:border-emerald-100 transition-all relative overflow-hidden">
                  <h4 className="font-black text-gray-800 text-lg">{ind.name}</h4>
                  <span className="text-[10px] font-black uppercase text-emerald-600">{entry?.status || 'BELUM DIISI'}</span>
               </div>
             );
          })}
       </div>
    </div>
  );
};

const CorrectiveActionPortal: React.FC<{
  auditData: AuditEntry[];
  correctiveActions: CorrectiveAction[];
  onSavePTK: (ptk: CorrectiveAction) => void;
  currentUser: User;
  standards: Standard[];
  currentCycle: string;
  activeCycles: string[];
}> = ({ auditData, correctiveActions, onSavePTK, currentUser, standards, currentCycle }) => {
  const [selectedProdi, setSelectedProdi] = useState<string>('ALL');
  const availableProdis = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN) return ['ALL', ...PRODI_LIST];
    if (currentUser.role === UserRole.AUDITEE) return [currentUser.prodi || ''];
    if (currentUser.role === UserRole.AUDITOR) return ['ALL', ...(currentUser.assignedProdi || [])];
    return [];
  }, [currentUser]);

  const filteredNotAchieved = useMemo(() => {
    return auditData.filter(d => {
      const isCycle = String(d.cycle) === String(currentCycle);
      const isNotAchieved = d.status === AuditStatus.NOT_ACHIEVED;
      const matchesProdi = selectedProdi === 'ALL' ? true : d.prodi === selectedProdi;
      return isCycle && isNotAchieved && matchesProdi;
    });
  }, [auditData, currentCycle, selectedProdi]);

  return (
    <div className="space-y-8">
      {filteredNotAchieved.map(entry => (
          <div key={`${entry.indicatorId}-${entry.prodi}`} className="bg-white p-10 rounded-[3rem] shadow-sm border-l-[12px] border-red-500">
             <h4 className="font-black text-gray-800 text-xl">{entry.indicatorId} - {entry.prodi}</h4>
          </div>
      ))}
    </div>
  );
};

const UserManagement: React.FC<{
  users: User[];
  onSaveUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User;
}> = ({ users, onSaveUser, onDeleteUser, currentUser }) => {
  return <div className="p-4">Halaman Manajemen User</div>;
};

const StandardSettings: React.FC<{
  standards: Standard[];
  onSave: (s: Standard[]) => void;
  currentCycle: string;
}> = ({ standards }) => {
  return <div className="p-4">Halaman Pengaturan Standar</div>;
};

// --- KOMPONEN LAPORAN TERBARU ---
const Reports: React.FC<{
  auditData: AuditEntry[];
  standards: Standard[];
  currentCycle: string;
  currentUser: User;
}> = ({ auditData, standards, currentCycle, currentUser }) => {
   const [reportView, setReportView] = useState<'prodi' | 'universitas'>('prodi');
   const [selectedProdi, setSelectedProdi] = useState<string>(currentUser.role === UserRole.AUDITEE ? currentUser.prodi || PRODI_LIST[0] : PRODI_LIST[0]);

   // Logika Laporan Prodi
   const prodiData = useMemo(() => {
      return auditData.filter(d => String(d.cycle) === String(currentCycle) && d.prodi === selectedProdi);
   }, [auditData, currentCycle, selectedProdi]);

   // Logika Laporan Universitas
   const universityStats = useMemo(() => {
      const currentEntries = auditData.filter(d => String(d.cycle) === String(currentCycle));
      
      return standards.map(std => {
         const indicators = std.indicators;
         let totalAchieved = 0;
         let totalItems = indicators.length * PRODI_LIST.length;

         indicators.forEach(ind => {
            const indEntries = currentEntries.filter(e => e.indicatorId === ind.id);
            totalAchieved += indEntries.filter(e => e.status === AuditStatus.ACHIEVED).length;
         });

         const percentage = totalItems > 0 ? (totalAchieved / totalItems) * 100 : 0;
         
         return {
            name: std.code,
            title: std.title,
            percentage: Math.round(percentage),
            achieved: totalAchieved,
            total: totalItems
         };
      });
   }, [auditData, currentCycle, standards]);

   return (
      <div className="space-y-8">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
            <div className="flex p-1 bg-gray-200 rounded-2xl w-fit">
               <button 
                  onClick={() => setReportView('prodi')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportView === 'prodi' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                  Laporan Per Prodi
               </button>
               <button 
                  onClick={() => setReportView('universitas')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportView === 'universitas' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                  Laporan Universitas
               </button>
            </div>
            <button onClick={() => window.print()} className="bg-gray-800 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">
               <i className="fas fa-print mr-2"></i> Cetak Laporan
            </button>
         </div>

         {reportView === 'prodi' ? (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 print:hidden">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Program Studi:</span>
                  <select 
                     value={selectedProdi} 
                     onChange={e => setSelectedProdi(e.target.value)}
                     className="bg-emerald-50 text-emerald-700 font-black text-sm px-4 py-2 rounded-xl outline-none border border-emerald-100"
                     disabled={currentUser.role === UserRole.AUDITEE}
                  >
                     {PRODI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
               </div>

               <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="mb-8 flex justify-between items-end">
                     <div>
                        <h3 className="text-2xl font-black text-gray-800">Laporan Audit Mutu Internal</h3>
                        <p className="text-emerald-600 font-bold uppercase text-xs tracking-widest mt-1">PROGRAM STUDI: {selectedProdi}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-black uppercase">Siklus Tahun</p>
                        <p className="text-3xl font-black text-gray-900">{currentCycle}</p>
                     </div>
                  </div>

                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b-2 border-gray-100">
                           <th className="p-4 text-[10px] font-black uppercase text-gray-400">Kode</th>
                           <th className="p-4 text-[10px] font-black uppercase text-gray-400">Indikator Mutu</th>
                           <th className="p-4 text-[10px] font-black uppercase text-gray-400">Target</th>
                           <th className="p-4 text-[10px] font-black uppercase text-gray-400">Capaian</th>
                           <th className="p-4 text-[10px] font-black uppercase text-gray-400">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {standards.map(std => std.indicators.map(ind => {
                           const entry = prodiData.find(d => d.indicatorId === ind.id);
                           return (
                              <tr key={`${selectedProdi}-${ind.id}`}>
                                 <td className="p-4 text-xs font-bold text-gray-400">{ind.id}</td>
                                 <td className="p-4">
                                    <p className="text-xs font-black text-gray-800 leading-tight">{ind.name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{std.code}</p>
                                 </td>
                                 <td className="p-4 text-xs font-bold text-emerald-600">{ind.target}</td>
                                 <td className="p-4 text-xs font-bold text-gray-800">{entry?.achievementValue || '-'}</td>
                                 <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                       entry?.status === AuditStatus.ACHIEVED ? 'bg-emerald-100 text-emerald-600' :
                                       entry?.status === AuditStatus.NOT_ACHIEVED ? 'bg-red-100 text-red-600' :
                                       'bg-gray-100 text-gray-400'
                                    }`}>
                                       {entry?.status || 'BELUM DIISI'}
                                    </span>
                                 </td>
                              </tr>
                           );
                        }))}
                     </tbody>
                  </table>
               </div>
            </div>
         ) : (
            <div className="space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Grafik Per Standar */}
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                     <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-2">
                        <i className="fas fa-chart-pie text-emerald-500"></i> Ketercapaian Per Standar
                     </h3>
                     <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={universityStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" domain={[0, 100]} hide />
                              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 900 }} />
                              <Tooltip 
                                 cursor={{ fill: '#f3f4f6' }}
                                 content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                       const data = payload[0].payload;
                                       return (
                                          <div className="bg-white p-4 shadow-2xl rounded-2xl border border-gray-100">
                                             <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">{data.name}</p>
                                             <p className="text-xs font-bold text-gray-800 mb-2">{data.title}</p>
                                             <div className="flex justify-between items-center gap-8">
                                                <span className="text-2xl font-black text-gray-900">{data.percentage}%</span>
                                                <span className="text-[10px] font-black text-gray-400">{data.achieved}/{data.total} Capaian</span>
                                             </div>
                                          </div>
                                       );
                                    }
                                    return null;
                                 }}
                              />
                              <Bar dataKey="percentage" radius={[0, 10, 10, 0]} barSize={25}>
                                 {universityStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.percentage > 80 ? '#10b981' : entry.percentage > 50 ? '#f59e0b' : '#ef4444'} />
                                 ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Ringkasan Indikator Universitas */}
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                     <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-2">
                        <i className="fas fa-list-check text-blue-500"></i> Detail Indikator Nasional
                     </h3>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                        {standards.map(std => (
                           <div key={std.id} className="space-y-2">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 p-2 rounded-lg">{std.code} - {std.title}</p>
                              {std.indicators.map(ind => {
                                 const totalAchieved = auditData.filter(d => d.indicatorId === ind.id && String(d.cycle) === String(currentCycle) && d.status === AuditStatus.ACHIEVED).length;
                                 const percentage = Math.round((totalAchieved / PRODI_LIST.length) * 100);
                                 return (
                                    <div key={ind.id} className="flex items-center justify-between p-3 hover:bg-emerald-50 rounded-xl transition-all">
                                       <div className="max-w-[70%]">
                                          <p className="text-xs font-bold text-gray-800 leading-tight">{ind.name}</p>
                                       </div>
                                       <div className="flex items-center gap-3">
                                          <div className="text-right">
                                             <p className="text-sm font-black text-gray-900">{percentage}%</p>
                                             <p className="text-[8px] font-black text-gray-400 uppercase">{totalAchieved}/{PRODI_LIST.length} Prodi</p>
                                          </div>
                                          <div className="w-1.5 h-10 bg-gray-100 rounded-full overflow-hidden">
                                             <div className="w-full bg-emerald-500 transition-all duration-1000" style={{ height: `${percentage}%`, marginTop: `${100-percentage}%` }}></div>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Matriks Capaian Global */}
               <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 overflow-x-auto">
                  <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-2">
                     <i className="fas fa-table text-purple-500"></i> Matriks Capaian Prodi (Siklus {currentCycle})
                  </h3>
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr>
                           <th className="p-4 bg-gray-50 rounded-tl-2xl text-[10px] font-black uppercase text-gray-400">Indikator</th>
                           {PRODI_LIST.map(p => (
                              <th key={p} className="p-2 bg-gray-50 text-[8px] font-black uppercase text-gray-400 text-center writing-mode-vertical min-w-[30px]">{p}</th>
                           ))}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {standards.map(std => std.indicators.map(ind => (
                           <tr key={`matrix-${ind.id}`}>
                              <td className="p-3">
                                 <p className="text-[10px] font-black text-gray-800 leading-none">{ind.id}</p>
                                 <p className="text-[8px] text-gray-400 font-bold mt-1 line-clamp-1">{ind.name}</p>
                              </td>
                              {PRODI_LIST.map(p => {
                                 const entry = auditData.find(d => d.indicatorId === ind.id && d.prodi === p && String(d.cycle) === String(currentCycle));
                                 return (
                                    <td key={`${ind.id}-${p}`} className="p-2 text-center">
                                       <div className={`w-4 h-4 rounded-full mx-auto shadow-sm ${
                                          entry?.status === AuditStatus.ACHIEVED ? 'bg-emerald-500' :
                                          entry?.status === AuditStatus.NOT_ACHIEVED ? 'bg-red-500' :
                                          'bg-gray-100'
                                       }`}></div>
                                    </td>
                                 );
                              })}
                           </tr>
                        )))}
                     </tbody>
                  </table>
                  <div className="mt-6 flex gap-6 px-4">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Tercapai</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Tidak Tercapai</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Belum Diisi / Pending</span>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default App;
