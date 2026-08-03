import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen, Users, LogOut, Plus, Edit2, Trash2, Check, X, Clock,
  Eye, EyeOff, Menu, ChevronDown, Minus, Shield, GraduationCap,
  Target, BarChart3, BookMarked, AlertCircle, CheckCircle2, Award,
  ChevronLeft, ChevronRight, UserCheck, Layers, Bell, Search
} from "lucide-react";
import { toast } from "sonner"; // Sesuaikan jika menggunakan library toast lain

// ============================= TYPES =============================
type Role = "admin" | "muhaffidz" | "santri";
type Page =
  | "login" | "register"
  | "admin-users" | "admin-halaqah"
  | "muhaffidz-ziyadah" | "muhaffidz-target" | "muhaffidz-ujian"
  | "santri-ziyadah" | "santri-target" | "santri-ujian";

interface User {
  id: string; username: string; email: string; password: string;
  role: Role; halaqahId?: string;
}
interface Halaqah {
  id: string; name: string; location: string; muhaffidzId: string; santriIds: string[];
}
type Day = "senin" | "selasa" | "rabu" | "kamis" | "jumat" | "sabtu" | "ahad";
const DAYS: Day[] = ["senin","selasa","rabu","kamis","jumat","sabtu","ahad"];
const DAY_AR: Record<Day,string> = { senin:"الاثنين",selasa:"الثلاثاء",rabu:"الأربعاء",kamis:"الخميس",jumat:"الجمعة",sabtu:"السبت",ahad:"الأحد" };
const DAY_ID: Record<Day,string> = { senin:"Senin",selasa:"Selasa",rabu:"Rabu",kamis:"Kamis",jumat:"Jumat",sabtu:"Sabtu",ahad:"Ahad" };
const TAQDIR = ["Mumtaz","Jayyid Jiddan","Jayyid","Maqbul","Dho'if"];

interface ZiyadahDay { hafalan:string; taqdirHafalan:string; murajaah:string; taqdirMurajaah:string; catatan:string; }
interface ZiyadahRekap {
  id:string; santriId:string; pekan:number; tahun:number; tanggal:string;
  days: Record<Day,ZiyadahDay>; evaluasi:string; targetPekanan:string;
}
interface WeekTarget {
  id:string; santriId:string; pekan:number; tahun:number; tanggalMulai:string;
  targets: Record<Day,string>; done: Record<Day,boolean>; isActiveWeek:boolean;
}
interface KertasTasmi { mustami:string; status:"maqbul"|"mardud"|""; taqdir:string; khoto:number; tanbih:number; catatan:string; }
interface UjianNilai { hifdz:number; tajwid:number; tartil:number; rata?:number;  }
interface Ujian {
  id:string; santriId:string; muhaffidzId:string; juz:number;
  status:"active"|"submitted"|"completed"; startTime:number;
  kertasTasmi:KertasTasmi[]; nilai?:UjianNilai;
}

// ============================= INITIAL DATA =============================
const emptyDay = (): ZiyadahDay => ({ hafalan:"",taqdirHafalan:"Jayyid",murajaah:"",taqdirMurajaah:"Jayyid",catatan:"" });
const emptyKT = (): KertasTasmi => ({ mustami:"",status:"",taqdir:"",khoto:0,tanbih:0,catatan:"" });

const INIT_USERS: User[] = [
  { id:"u1",username:"Admin Utama",email:"admin@tahfidz.id",password:"admin123",role:"admin" },
  { id:"u2",username:"Ust. Ahmad Fauzi",email:"ahmad@tahfidz.id",password:"pass123",role:"muhaffidz",halaqahId:"h1" },
  { id:"u3",username:"Ust. Ibrahim Malik",email:"ibrahim@tahfidz.id",password:"pass123",role:"muhaffidz",halaqahId:"h2" },
  { id:"u4",username:"Muhammad Farhan",email:"farhan@santri.id",password:"pass123",role:"santri",halaqahId:"h1" },
  { id:"u5",username:"Abdullah Rizki",email:"rizki@santri.id",password:"pass123",role:"santri",halaqahId:"h1" },
  { id:"u6",username:"Yusuf Hakim",email:"yusuf@santri.id",password:"pass123",role:"santri",halaqahId:"h1" },
  { id:"u7",username:"Hafiz Zain",email:"zain@santri.id",password:"pass123",role:"santri",halaqahId:"h2" },
];
const INIT_HALAQAH: Halaqah[] = [
  { id:"h1",name:"Halaqah Al-Fatih",location:"Masjid Al-Ikhlas",muhaffidzId:"u2",santriIds:["u4","u5","u6"] },
  { id:"h2",name:"Halaqah An-Nahl",location:"Masjid Ar-Rahman",muhaffidzId:"u3",santriIds:["u7"] },
];
const makeEmptyDays = () => DAYS.reduce((a,d)=>({...a,[d]:""}),{}) as Record<Day,string>;
const makeEmptyDone = () => DAYS.reduce((a,d)=>({...a,[d]:false}),{}) as Record<Day,boolean>;

const INIT_TARGETS: WeekTarget[] = [
  { id:"t1",santriId:"u4",pekan:1,tahun:2025,tanggalMulai:"2025-01-06",
    targets:{senin:"Al-Baqarah 1-5",selasa:"Al-Baqarah 6-10",rabu:"Al-Baqarah 11-16",kamis:"Al-Baqarah 17-20",jumat:"Murajaah",sabtu:"Al-Baqarah 21-25",ahad:"Al-Baqarah 26-30"},
    done:{senin:true,selasa:true,rabu:true,kamis:true,jumat:true,sabtu:true,ahad:true},isActiveWeek:false },
  { id:"t2",santriId:"u4",pekan:2,tahun:2025,tanggalMulai:"2025-01-13",
    targets:{senin:"Al-Baqarah 31-36",selasa:"Al-Baqarah 37-42",rabu:"Al-Baqarah 43-48",kamis:"Al-Baqarah 49-54",jumat:"Murajaah",sabtu:"Al-Baqarah 55-60",ahad:"Al-Baqarah 61-65"},
    done:{senin:true,selasa:true,rabu:false,kamis:false,jumat:false,sabtu:false,ahad:false},isActiveWeek:false },
  { id:"t3",santriId:"u4",pekan:3,tahun:2025,tanggalMulai:"2025-01-20",
    targets:{senin:"Al-Baqarah 66-72",selasa:"Al-Baqarah 73-78",rabu:"Al-Baqarah 79-84",kamis:"Al-Baqarah 85-90",jumat:"Murajaah Juz 1",sabtu:"Al-Baqarah 91-95",ahad:"Al-Baqarah 96-100"},
    done:{senin:false,selasa:false,rabu:false,kamis:false,jumat:false,sabtu:false,ahad:false},isActiveWeek:true },
];
const makeDayRekap = (h:string,tH:string,m:string,tM:string,c:string): ZiyadahDay => ({ hafalan:h,taqdirHafalan:tH,murajaah:m,taqdirMurajaah:tM,catatan:c });
const INIT_ZIYADAH: ZiyadahRekap[] = [
  { id:"z1",santriId:"u4",pekan:1,tahun:2025,tanggal:"2025-01-06",
    days:{ senin:makeDayRekap("Al-Baqarah 1-5","Mumtaz","Al-Fatihah","Mumtaz","Lancar"),selasa:makeDayRekap("Al-Baqarah 6-10","Jayyid Jiddan","Al-Baqarah 1-5","Jayyid Jiddan","Baik"),rabu:makeDayRekap("Al-Baqarah 11-16","Jayyid","Al-Baqarah 6-10","Jayyid","Perlu ditingkatkan"),kamis:makeDayRekap("Al-Baqarah 17-20","Mumtaz","Al-Baqarah 11-16","Mumtaz","Sangat bagus"),jumat:makeDayRekap("-","Jayyid","Murajaah 1-20","Jayyid Jiddan","Konsisten"),sabtu:makeDayRekap("Al-Baqarah 21-25","Jayyid Jiddan","Al-Baqarah 1-20","Jayyid","Stabil"),ahad:makeDayRekap("Al-Baqarah 26-30","Mumtaz","Al-Baqarah 21-30","Mumtaz","Sempurna") },
    evaluasi:"Pekan pertama berjalan dengan baik. Farhan menunjukkan semangat tinggi dalam menghafal.",targetPekanan:"Menyelesaikan Juz 1 ayat 1-30" },
  { id:"z2",santriId:"u4",pekan:2,tahun:2025,tanggal:"2025-01-13",
    days:{ senin:makeDayRekap("Al-Baqarah 31-36","Jayyid Jiddan","Al-Baqarah 26-30","Jayyid Jiddan","Bagus"),selasa:makeDayRekap("Al-Baqarah 37-42","Jayyid","Al-Baqarah 31-36","Jayyid","Stabil"),rabu:makeDayRekap("Al-Baqarah 43-48","Mumtaz","Al-Baqarah 37-42","Mumtaz","Luar biasa"),kamis:makeDayRekap("Al-Baqarah 49-54","Jayyid","Al-Baqarah 43-48","Jayyid","Cukup"),jumat:makeDayRekap("-","","Murajaah 31-54","Jayyid Jiddan","Murajaah berjalan lancar"),sabtu:makeDayRekap("Al-Baqarah 55-60","Jayyid Jiddan","Al-Baqarah 49-54","Jayyid Jiddan","Konsisten"),ahad:makeDayRekap("Al-Baqarah 61-65","Jayyid","Al-Baqarah 55-60","Jayyid","Perlu perbaikan tajwid") },
    evaluasi:"Pekan kedua baik namun ada penurunan di akhir pekan. Perlu motivasi tambahan.",targetPekanan:"Menyelesaikan Al-Baqarah 31-65" },
];
const INIT_UJIAN: Ujian[] = [
  { id:"uj1",santriId:"u5",muhaffidzId:"u2",juz:1,status:"active",startTime:Date.now()-1800000,kertasTasmi:[] },
];

// ============================= HELPERS =============================
const uid = () => Math.random().toString(36).slice(2,10);
const fmt = (s:number) => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const pct = (done: Record<Day,boolean>) => { const vals=Object.values(done); return Math.round(vals.filter(Boolean).length/vals.length*100); };

// ============================= UI PRIMITIVES =============================
const cn = (...cls:(string|undefined|false)[]) => cls.filter(Boolean).join(" ");

const Btn = ({ children, onClick, variant="primary", size="md", className="", disabled=false, type="button" }: {
  children:React.ReactNode; onClick?:()=>void; variant?:"primary"|"secondary"|"ghost"|"danger"|"gold"; size?:"sm"|"md"|"lg";
  className?:string; disabled?:boolean; type?:"button"|"submit";
}) => {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm:"px-3 py-1.5 text-sm", md:"px-4 py-2 text-sm", lg:"px-6 py-3 text-base" };
  const variants = {
    primary:"bg-[#113f59] text-white hover:bg-[#0d3347] shadow-sm hover:shadow-md",
    secondary:"bg-[#e8dcc8] text-[#113f59] hover:bg-[#ddd0b8]",
    ghost:"bg-transparent text-[#113f59] hover:bg-[#f0ebd8]",
    danger:"bg-[#c0392b] text-white hover:bg-[#a93226]",
    gold:"bg-[#c5a059] text-white hover:bg-[#b8903f] shadow-sm hover:shadow-md",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={cn(base,sizes[size],variants[variant],className)}>{children}</button>;
};

const Badge = ({ children, color="navy" }: { children:React.ReactNode; color?:"navy"|"gold"|"green"|"red"|"gray" }) => {
  const colors = { navy:"bg-[#113f59]/10 text-[#113f59]", gold:"bg-[#c5a059]/15 text-[#9a7a3e]", green:"bg-green-100 text-green-700", red:"bg-red-100 text-red-700", gray:"bg-gray-100 text-gray-600" };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",colors[color])}>{children}</span>;
};

const Card = ({ children, className="" }: { children:React.ReactNode; className?:string }) => (
  <div className={cn("bg-white/95 rounded-xl shadow-lg border border-[#c5a059]/25",className)}>{children}</div>
);

const CardHeader = ({ title, subtitle, action }: { title:string; subtitle?:string; action?:React.ReactNode }) => (
  <div className="flex items-start justify-between p-5 border-b border-[#c5a059]/15">
    <div>
      <h2 className="font-playfair text-[#113f59] font-semibold text-lg">{title}</h2>
      {subtitle && <p className="text-sm text-[#6b7a8d] mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

const Input = ({ label,value,onChange,type="text",placeholder="",required=false,readOnly=false }: {
  label?:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string; required?:boolean; readOnly?:boolean;
}) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-[#1c2b3a]">{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} readOnly={readOnly}
      className="px-3 py-2 rounded-lg border border-[#c5a059]/30 bg-[#f8f5ef] text-[#1c2b3a] text-sm placeholder:text-[#6b7a8d] focus:outline-none focus:ring-2 focus:ring-[#c5a059]/40 focus:border-[#c5a059] transition-all read-only:bg-[#f0ebd8] read-only:cursor-default" />
  </div>
);

const Select = ({ label,value,onChange,options,readOnly=false }: {
  label?:string; value:string; onChange:(v:string)=>void; options:{value:string;label:string}[]; readOnly?:boolean;
}) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-[#1c2b3a]">{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} disabled={readOnly}
      className="px-3 py-2 rounded-lg border border-[#c5a059]/30 bg-[#f8f5ef] text-[#1c2b3a] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]/40 focus:border-[#c5a059] transition-all disabled:bg-[#f0ebd8] disabled:cursor-default">
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Textarea = ({ label,value,onChange,rows=3,readOnly=false }: { label?:string;value:string;onChange:(v:string)=>void;rows?:number;readOnly?:boolean }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-[#1c2b3a]">{label}</label>}
    <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} readOnly={readOnly}
      className="px-3 py-2 rounded-lg border border-[#c5a059]/30 bg-[#f8f5ef] text-[#1c2b3a] text-sm placeholder:text-[#6b7a8d] focus:outline-none focus:ring-2 focus:ring-[#c5a059]/40 focus:border-[#c5a059] transition-all resize-none read-only:bg-[#f0ebd8] read-only:cursor-default" />
  </div>
);

const Modal = ({ open, onClose, title, children, wide=false }: {
  open:boolean; onClose:()=>void; title:string; children:React.ReactNode; wide?:boolean;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-white rounded-2xl shadow-2xl border border-[#c5a059]/30 max-h-[90vh] overflow-y-auto",wide?"w-full max-w-4xl":"w-full max-w-xl")}>
        <div className="flex items-center justify-between p-5 border-b border-[#c5a059]/20 sticky top-0 bg-white z-10">
          <h3 className="font-playfair text-[#113f59] font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0ebd8] text-[#6b7a8d] hover:text-[#113f59] transition-colors"><X size={18}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const ProgressBar = ({ pct: p, label }: { pct:number; label?:string }) => (
  <div className="space-y-1.5">
    {label && <div className="flex justify-between text-sm"><span className="text-[#6b7a8d]">{label}</span><span className="font-medium text-[#113f59]">{p}%</span></div>}
    <div className="h-2.5 rounded-full bg-[#f0ebd8] overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-[#113f59] to-[#c5a059] transition-all duration-500" style={{width:`${p}%`}} />
    </div>
  </div>
);

const Divider = () => <div className="flex items-center gap-3 my-4"><div className="flex-1 h-px bg-[#c5a059]/20"/><span className="text-[#c5a059] text-xs">✦</span><div className="flex-1 h-px bg-[#c5a059]/20"/></div>;

// ============================= LAYOUT =============================
const navByRole: Record<Role,{label:string;page:Page;icon:React.ReactNode}[]> = {
  admin: [
    { label:"Manajemen Pengguna", page:"admin-users", icon:<Users size={18}/> },
    { label:"Manajemen Halaqah", page:"admin-halaqah", icon:<Layers size={18}/> },
  ],
  muhaffidz: [
    { label:"Rekap Ziyadah", page:"muhaffidz-ziyadah", icon:<BookMarked size={18}/> },
    { label:"Target Murajaah", page:"muhaffidz-target", icon:<Target size={18}/> },
    { label:"Ujian Kenaikan Juz", page:"muhaffidz-ujian", icon:<Award size={18}/> },
  ],
  santri: [
    { label:"Rekap Ziyadah", page:"santri-ziyadah", icon:<BookMarked size={18}/> },
    { label:"Target Murajaah", page:"santri-target", icon:<Target size={18}/> },
    { label:"Ujian Kenaikan Juz", page:"santri-ujian", icon:<Award size={18}/> },
  ],
};

const roleLabel: Record<Role,string> = { admin:"Admin", muhaffidz:"Muhaffidz", santri:"Santri" };
const roleBadgeColor: Record<Role,"navy"|"gold"|"green"> = { admin:"navy", muhaffidz:"gold", santri:"green" };

interface AppState {
  users: User[]; halaqahs: Halaqah[]; targets: WeekTarget[];
  ziyadahs: ZiyadahRekap[]; ujians: Ujian[];
  setUsers:(u:User[])=>void; setHalaqahs:(h:Halaqah[])=>void;
  setTargets:(t:WeekTarget[])=>void; setZiyadahs:(z:ZiyadahRekap[])=>void;
  setUjians:(u:Ujian[])=>void;
  currentUser:User; setCurrentUser:(u:User|null)=>void;
  currentPage:Page; setPage:(p:Page)=>void;
}

// ============================= SIDEBAR =============================
function Sidebar({ state, open, setOpen }: { state:AppState; open:boolean; setOpen:(b:boolean)=>void }) {
  const { currentUser, currentPage, setPage, setCurrentUser, ujians } = state;
  const nav = navByRole[currentUser.role];
  const pendingUjian = ujians.filter(u=>u.status==="submitted" && u.muhaffidzId===currentUser.id).length;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={()=>setOpen(false)} />}
      <aside className={cn("fixed top-0 left-0 h-full z-40 flex flex-col bg-[#113f59] transition-all duration-300",open?"w-64":"w-0 overflow-hidden lg:w-16")}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 min-h-[72px]">
          {open && <>
            <div className="w-9 h-9 rounded-lg bg-[#c5a059] flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-white font-playfair font-semibold text-sm leading-tight">Mutaba'ah</p>
              <p className="text-[#c5a059] text-xs">Tahfidz System</p>
            </div>
          </>}
          {!open && <div className="w-8 h-8 rounded-lg bg-[#c5a059] flex items-center justify-center mx-auto"><BookOpen size={16} className="text-white"/></div>}
        </div>

        {open && (
          <div className="px-3 py-3 border-b border-white/10">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white font-medium text-sm truncate">{currentUser.username}</p>
              <p className="text-white/60 text-xs truncate">{currentUser.email}</p>
              <div className="mt-2"><Badge color={roleBadgeColor[currentUser.role]}>{roleLabel[currentUser.role]}</Badge></div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {nav.map(n => (
            <button key={n.page} onClick={()=>{ setPage(n.page); setOpen(false); }}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                currentPage===n.page ? "bg-[#c5a059] text-white shadow" : "text-white/70 hover:text-white hover:bg-white/10")}>
              <span className="flex-shrink-0">{n.icon}</span>
              {open && <span className="truncate">{n.label}</span>}
              {n.page==="muhaffidz-ujian" && pendingUjian>0 && open && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingUjian}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-white/10">
          <button onClick={()=>setCurrentUser(null)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <LogOut size={18} className="flex-shrink-0" />
            {open && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function Layout({ state, children }: { state:AppState; children:React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const { currentUser, currentPage } = state;
  const nav = navByRole[currentUser.role];
  const currentNav = nav.find(n=>n.page===currentPage);

  return (
    <div className="min-h-screen" style={{ background:"#fdfbf7", backgroundImage:"linear-gradient(45deg,#f0ebd8 25%,transparent 25%),linear-gradient(-45deg,#f0ebd8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f0ebd8 75%),linear-gradient(-45deg,transparent 75%,#f0ebd8 75%)", backgroundSize:"24px 24px", backgroundPosition:"0 0,0 12px,12px -12px,-12px 0" }}>
      <Sidebar state={state} open={open} setOpen={setOpen} />
      <div className={cn("transition-all duration-300 min-h-screen flex flex-col",open?"lg:ml-64":"lg:ml-16")}>
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-[#c5a059]/20 px-4 py-3 flex items-center gap-4">
          <button onClick={()=>setOpen(!open)} className="p-2 rounded-lg hover:bg-[#f0ebd8] text-[#113f59] transition-colors"><Menu size={20}/></button>
          <h1 className="font-playfair text-[#113f59] font-semibold text-lg">{currentNav?.label ?? "Dashboard"}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Badge color={roleBadgeColor[currentUser.role]}>{roleLabel[currentUser.role]}</Badge>
            <span className="text-sm text-[#6b7a8d] hidden sm:block">{currentUser.username}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

// ============================= AUTH =============================
function LoginPage({ onLogin, onGoRegister }: { onLogin:(u:User)=>void; onGoRegister:()=>void }) {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [show,setShow] = useState(false);
  const [error,setError] = useState("");
  const [users] = useState<User[]>(INIT_USERS);

  const submit = (e:React.FormEvent) => {
    e.preventDefault();
    const u = users.find(x=>x.email===email&&x.password===password);
    if (u) { onLogin(u); setError(""); }
    else setError("Email atau password salah.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:"#fdfbf7", backgroundImage:"linear-gradient(45deg,#f0ebd8 25%,transparent 25%),linear-gradient(-45deg,#f0ebd8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f0ebd8 75%),linear-gradient(-45deg,transparent 75%,#f0ebd8 75%)", backgroundSize:"24px 24px", backgroundPosition:"0 0,0 12px,12px -12px,-12px 0" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#113f59] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen size={28} className="text-[#c5a059]" />
          </div>
          <p className="text-[#c5a059] text-xl font-playfair italic mb-1">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
          <h1 className="text-2xl font-playfair font-bold text-[#113f59]">Mutaba'ah Tahfidz</h1>
          <p className="text-[#6b7a8d] text-sm mt-1">Sistem Manajemen Hafalan Al-Qur'an</p>
        </div>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="email@tahfidz.id" required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1c2b3a]">Password</label>
              <div className="relative">
                <input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-[#c5a059]/30 bg-[#f8f5ef] text-[#1c2b3a] text-sm placeholder:text-[#6b7a8d] focus:outline-none focus:ring-2 focus:ring-[#c5a059]/40 focus:border-[#c5a059] transition-all" />
                <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a8d] hover:text-[#113f59]">
                  {show?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            {error && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={14}/>{error}</div>}
            <Btn type="submit" variant="primary" className="w-full justify-center py-2.5">Masuk</Btn>
          </form>
          <Divider />
          <p className="text-center text-sm text-[#6b7a8d]">Belum punya akun?{" "}
            <button onClick={onGoRegister} className="text-[#c5a059] font-medium hover:underline">Daftar sekarang</button>
          </p>
        </Card>
      </div>
    </div>
  );
}

function RegisterPage({ onBack }: { onBack:()=>void }) {
  const [form,setForm] = useState({ username:"",email:"",password:"",confirm:"" });
  const [error,setError] = useState("");
  const [success,setSuccess] = useState(false);
  const set = (k:string)=>(v:string)=>setForm(f=>({...f,[k]:v}));

  const submit = (e:React.FormEvent) => {
    e.preventDefault();
    if (form.password!==form.confirm) { setError("Password tidak cocok."); return; }
    if (form.password.length<6) { setError("Password minimal 6 karakter."); return; }
    setSuccess(true);
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:"#fdfbf7" }}>
      <Card className="p-8 text-center max-w-sm">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="font-playfair text-[#113f59] font-bold text-xl mb-2">Pendaftaran Berhasil!</h2>
        <p className="text-[#6b7a8d] text-sm mb-4">Akun Anda telah didaftarkan. Mohon hubungi Admin untuk aktivasi dan penentuan role.</p>
        <Btn onClick={onBack} variant="primary" className="w-full justify-center">Kembali ke Login</Btn>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:"#fdfbf7", backgroundImage:"linear-gradient(45deg,#f0ebd8 25%,transparent 25%),linear-gradient(-45deg,#f0ebd8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f0ebd8 75%),linear-gradient(-45deg,transparent 75%,#f0ebd8 75%)", backgroundSize:"24px 24px", backgroundPosition:"0 0,0 12px,12px -12px,-12px 0" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#113f59] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"><BookOpen size={24} className="text-[#c5a059]"/></div>
          <h1 className="text-2xl font-playfair font-bold text-[#113f59]">Daftar Akun</h1>
        </div>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Input label="Username" value={form.username} onChange={set("username")} placeholder="Nama lengkap" required />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="email@tahfidz.id" required />
            <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 karakter" required />
            <Input label="Konfirmasi Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Ulangi password" required />
            {error && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={14}/>{error}</div>}
            <Btn type="submit" variant="primary" className="w-full justify-center py-2.5">Daftar</Btn>
          </form>
          <Divider />
          <button onClick={onBack} className="w-full text-center text-sm text-[#6b7a8d] hover:text-[#113f59] flex items-center justify-center gap-1.5">
            <ChevronLeft size={14}/> Kembali ke Login
          </button>
        </Card>
      </div>
    </div>
  );
}

// ============================= ADMIN: USERS =============================
function AdminUsers({ state }: { state:AppState }) {
  const { users, setUsers, halaqahs } = state;
  const [modal,setModal] = useState<{type:"add"|"edit";user?:User}|null>(null);
  const [form,setForm] = useState({ username:"",email:"",password:"",role:"santri" as Role,halaqahId:"" });
  const [search,setSearch] = useState("");
  const set = (k:string)=>(v:string)=>setForm(f=>({...f,[k]:v}));

  const openAdd = () => { setForm({ username:"",email:"",password:"",role:"santri",halaqahId:"" }); setModal({type:"add"}); };
  const openEdit = (u:User) => { setForm({ username:u.username,email:u.email,password:u.password,role:u.role,halaqahId:u.halaqahId??"" }); setModal({type:"edit",user:u}); };
  const save = () => {
    if (modal?.type==="add") setUsers([...users,{ id:uid(),...form }]);
    else if (modal?.user) setUsers(users.map(u=>u.id===modal.user!.id?{...u,...form}:u));
    setModal(null);
  };
  const del = (id:string) => { if (confirm("Hapus pengguna ini?")) setUsers(users.filter(u=>u.id!==id)); };
  const filtered = users.filter(u=>u.username.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Manajemen Pengguna" subtitle={`Total ${users.length} pengguna terdaftar`}
          action={<Btn onClick={openAdd} size="sm"><Plus size={14}/>Tambah</Btn>} />
        <div className="p-4">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama atau email..."
            className="w-full px-3 py-2 rounded-lg border border-[#c5a059]/30 bg-[#f8f5ef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]/40 mb-4" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#c5a059]/20">
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">No</th>
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Nama</th>
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Email</th>
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Role</th>
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Halaqah</th>
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Aksi</th>
              </tr></thead>
              <tbody>{filtered.map((u,i)=>{
                const h = halaqahs.find(h=>h.id===u.halaqahId);
                return <tr key={u.id} className="border-b border-[#c5a059]/10 hover:bg-[#fdfbf7] transition-colors">
                  <td className="py-3 px-3 text-[#6b7a8d]">{i+1}</td>
                  <td className="py-3 px-3 font-medium text-[#1c2b3a]">{u.username}</td>
                  <td className="py-3 px-3 text-[#6b7a8d]">{u.email}</td>
                  <td className="py-3 px-3"><Badge color={roleBadgeColor[u.role]}>{roleLabel[u.role]}</Badge></td>
                  <td className="py-3 px-3 text-[#6b7a8d]">{h?.name??"-"}</td>
                  <td className="py-3 px-3"><div className="flex gap-1.5">
                    <button onClick={()=>openEdit(u)} className="p-1.5 rounded-lg hover:bg-[#f0ebd8] text-[#113f59] transition-colors"><Edit2 size={14}/></button>
                    <button onClick={()=>del(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      </Card>
      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal?.type==="add"?"Tambah Pengguna":"Edit Pengguna"}>
        <div className="space-y-4">
          <Input label="Username" value={form.username} onChange={set("username")} />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          <Input label="Password" type="password" value={form.password} onChange={set("password")} />
          <Select label="Role" value={form.role} onChange={v=>set("role")(v as Role)} options={[{value:"admin",label:"Admin"},{value:"muhaffidz",label:"Muhaffidz"},{value:"santri",label:"Santri"}]} />
          <Select label="Halaqah" value={form.halaqahId} onChange={set("halaqahId")} options={[{value:"",label:"— Tidak ada —"},...halaqahs.map(h=>({value:h.id,label:h.name}))]} />
          <div className="flex gap-2 justify-end pt-2">
            <Btn variant="secondary" onClick={()=>setModal(null)}>Batal</Btn>
            <Btn variant="primary" onClick={save}>Simpan</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================= ADMIN: HALAQAH =============================
function AdminHalaqah({ state }: { state:AppState }) {
  const { halaqahs, setHalaqahs, users, setUsers } = state;
  const [modal,setModal] = useState<{type:"add"|"edit";h?:Halaqah}|null>(null);
  const [form,setForm] = useState({ name:"",location:"",muhaffidzId:"" });
  const set = (k:string)=>(v:string)=>setForm(f=>({...f,[k]:v}));
  const muhaffidzList = users.filter(u=>u.role==="muhaffidz");

  const openAdd = () => { setForm({name:"",location:"",muhaffidzId:""}); setModal({type:"add"}); };
  const openEdit = (h:Halaqah) => { setForm({name:h.name,location:h.location,muhaffidzId:h.muhaffidzId}); setModal({type:"edit",h}); };
  const save = () => {
    if (modal?.type==="add") {
      const id=uid();
      setHalaqahs([...halaqahs,{id,...form,santriIds:[]}]);
      setUsers(users.map(u=>u.id===form.muhaffidzId?{...u,halaqahId:id}:u));
    } else if (modal?.h) {
      setHalaqahs(halaqahs.map(h=>h.id===modal.h!.id?{...h,...form}:h));
      setUsers(users.map(u=>u.id===form.muhaffidzId?{...u,halaqahId:modal.h!.id}:u));
    }
    setModal(null);
  };
  const del = (id:string) => { if (confirm("Hapus halaqah ini?")) setHalaqahs(halaqahs.filter(h=>h.id!==id)); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Manajemen Halaqah" subtitle={`${halaqahs.length} halaqah aktif`}
          action={<Btn onClick={openAdd} size="sm"><Plus size={14}/>Tambah</Btn>} />
        <div className="p-4 grid gap-4 sm:grid-cols-2">
          {halaqahs.map(h=>{
            const muhaffidz = users.find(u=>u.id===h.muhaffidzId);
            const santris = users.filter(u=>h.santriIds.includes(u.id));
            return <Card key={h.id} className="p-4 border-l-4 border-l-[#c5a059]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-playfair font-semibold text-[#113f59]">{h.name}</h3>
                  <p className="text-xs text-[#6b7a8d]">{h.location}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(h)} className="p-1.5 rounded-lg hover:bg-[#f0ebd8] text-[#113f59]"><Edit2 size={13}/></button>
                  <button onClick={()=>del(h.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={13}/></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><UserCheck size={14} className="text-[#c5a059]"/><span className="text-[#6b7a8d]">Muhaffidz:</span><span className="font-medium text-[#1c2b3a]">{muhaffidz?.username??"-"}</span></div>
                <div className="flex items-start gap-2"><Users size={14} className="text-[#c5a059] mt-0.5"/><span className="text-[#6b7a8d]">Santri ({santris.length}):</span><span className="text-[#1c2b3a]">{santris.map(s=>s.username).join(", ")||"-"}</span></div>
              </div>
            </Card>;
          })}
        </div>
      </Card>
      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal?.type==="add"?"Tambah Halaqah":"Edit Halaqah"}>
        <div className="space-y-4">
          <Input label="Nama Halaqah" value={form.name} onChange={set("name")} />
          <Input label="Lokasi" value={form.location} onChange={set("location")} />
          <Select label="Muhaffidz" value={form.muhaffidzId} onChange={set("muhaffidzId")}
            options={[{value:"",label:"— Pilih Muhaffidz —"},...muhaffidzList.map(u=>({value:u.id,label:u.username}))]} />
          <div className="flex gap-2 justify-end pt-2">
            <Btn variant="secondary" onClick={()=>setModal(null)}>Batal</Btn>
            <Btn variant="primary" onClick={save}>Simpan</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================= MUHAFFIDZ: ZIYADAH =============================
function MuhaffidzZiyadah({ state }: { state:AppState }) {
  const { currentUser, users, halaqahs, ziyadahs, setZiyadahs } = state;
  const halaqah = halaqahs.find(h=>h.muhaffidzId===currentUser.id);
  const santriList = users.filter(u=>halaqah?.santriIds.includes(u.id));
  const myZiyadahs = ziyadahs.filter(z=>santriList.some(s=>s.id===z.santriId));
  const [modal,setModal] = useState<{z?:ZiyadahRekap}|null>(null);
  const makeEmptyZ = ():ZiyadahRekap => ({
    id:uid(),santriId:santriList[0]?.id??"",pekan:1,tahun:new Date().getFullYear(),tanggal:new Date().toISOString().slice(0,10),
    days:DAYS.reduce((a,d)=>({...a,[d]:emptyDay()}),{}) as Record<Day,ZiyadahDay>,evaluasi:"",targetPekanan:""
  });
  const [form,setForm] = useState<ZiyadahRekap>(makeEmptyZ());
  const openAdd = () => { setForm(makeEmptyZ()); setModal({}); };
  const openEdit = (z:ZiyadahRekap) => { setForm({...z}); setModal({z}); };
  const save = () => {
    if (modal?.z) setZiyadahs(ziyadahs.map(z=>z.id===form.id?form:z));
    else setZiyadahs([...ziyadahs,form]);
    setModal(null);
  };
// State untuk menyimpan teks pencarian
  const [searchQuery, setSearchQuery] = useState("");

  // Logika filter: cocokan nama santri dengan teks pencarian
  const filteredZiyadahs = myZiyadahs.filter((z) => {
    const santri = users.find((u) => u.id === z.santriId);
    return santri?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const del = (id:string) => { if (confirm("Hapus rekap ini?")) setZiyadahs(ziyadahs.filter(z=>z.id!==id)); };
  const updateDay = (day:Day,field:keyof ZiyadahDay,val:string) =>
    setForm(f=>({...f,days:{...f.days,[day]:{...f.days[day],[field]:val}}}));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader 
          title="Rekap Ziyadah" 
          subtitle={`${filteredZiyadahs.length} rekap ditampilkan`}
          action={
            <div className="flex items-center gap-2">
              {/* --- Search Bar Baru --- */}
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari santri..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#113f59] focus:ring-1 focus:ring-[#113f59] bg-gray-50 min-w-[150px] md:min-w-[200px]"
                />
              </div>
              {/* ----------------------- */}
              
              <Btn onClick={openAdd} size="sm">
                <Plus size={14}/>Buat Rekap
              </Btn>
            </div>
          } 
        />
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c5a059]/20">
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">No</th>
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Nama Santri</th>
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Pekan</th>
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Tanggal</th>
                <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {/* Gunakan array hasil filter di sini */}
              {filteredZiyadahs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[#6b7a8d]">
                    {searchQuery ? "Santri tidak ditemukan" : "Belum ada rekap ziyadah"}
                  </td>
                </tr>
              ) : filteredZiyadahs.map((z, i) => {
                const santri = users.find(u => u.id === z.santriId);
                return (
                  <tr key={z.id} className="border-b border-[#c5a059]/10 hover:bg-[#fdfbf7] transition-colors">
                    <td className="py-3 px-3 text-[#6b7a8d]">{i + 1}</td>
                    <td className="py-3 px-3 font-medium text-[#1c2b3a]">{santri?.username ?? "-"}</td>
                    <td className="py-3 px-3"><Badge color="navy">Pekan {z.pekan}</Badge></td>
                    <td className="py-3 px-3 text-[#6b7a8d]">{z.tanggal}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(z)} className="p-1.5 rounded-lg hover:bg-[#f0ebd8] text-[#113f59]">
                          <Edit2 size={14}/>
                        </button>
                        <button onClick={() => del(z.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal?.z?"Edit Rekap Ziyadah":"Buat Rekap Ziyadah"} wide>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Santri" value={form.santriId} onChange={v=>setForm(f=>({...f,santriId:v}))}
              options={santriList.map(s=>({value:s.id,label:s.username}))} />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1"><label className="text-sm font-medium text-[#1c2b3a]">Pekan</label>
                <input type="number" value={form.pekan} onChange={e=>setForm(f=>({...f,pekan:+e.target.value}))} min={1}
                  className="px-3 py-2 rounded-lg border border-[#c5a059]/30 bg-[#f8f5ef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]/40" /></div>
              <Input label="Tanggal" type="date" value={form.tanggal} onChange={v=>setForm(f=>({...f,tanggal:v}))} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" dir="rtl">
              <thead><tr className="bg-[#113f59] text-white">
                <th className="py-2.5 px-2 font-medium rounded-tr-lg">اليوم</th>
                <th className="py-2.5 px-2 font-medium">الحفظ</th>
                <th className="py-2.5 px-2 font-medium">تقدير</th>
                <th className="py-2.5 px-2 font-medium">المراجعة</th>
                <th className="py-2.5 px-2 font-medium">تقدير</th>
                <th className="py-2.5 px-2 font-medium rounded-tl-lg">ملاحظات</th>
              </tr></thead>
              <tbody>{DAYS.map(day=>(
                <tr key={day} className="border-b border-[#c5a059]/10">
                  <td className="py-2 px-2 font-medium text-[#113f59] text-right">{DAY_AR[day]}</td>
                  <td className="py-1 px-1"><input value={form.days[day].hafalan} onChange={e=>updateDay(day,"hafalan",e.target.value)} className="w-full px-2 py-1 rounded border border-[#c5a059]/20 bg-[#f8f5ef] text-xs focus:outline-none focus:ring-1 focus:ring-[#c5a059]/40" style={{direction:"rtl"}}/></td>
                  <td className="py-1 px-1"><select value={form.days[day].taqdirHafalan} onChange={e=>updateDay(day,"taqdirHafalan",e.target.value)} className="w-full px-1 py-1 rounded border border-[#c5a059]/20 bg-[#f8f5ef] text-xs focus:outline-none" style={{direction:"rtl"}}>
                    {TAQDIR.map(t=><option key={t}>{t}</option>)}</select></td>
                  <td className="py-1 px-1"><input value={form.days[day].murajaah} onChange={e=>updateDay(day,"murajaah",e.target.value)} className="w-full px-2 py-1 rounded border border-[#c5a059]/20 bg-[#f8f5ef] text-xs focus:outline-none focus:ring-1 focus:ring-[#c5a059]/40" style={{direction:"rtl"}}/></td>
                  <td className="py-1 px-1"><select value={form.days[day].taqdirMurajaah} onChange={e=>updateDay(day,"taqdirMurajaah",e.target.value)} className="w-full px-1 py-1 rounded border border-[#c5a059]/20 bg-[#f8f5ef] text-xs focus:outline-none" style={{direction:"rtl"}}>
                    {TAQDIR.map(t=><option key={t}>{t}</option>)}</select></td>
                  <td className="py-1 px-1"><input value={form.days[day].catatan} onChange={e=>updateDay(day,"catatan",e.target.value)} className="w-full px-2 py-1 rounded border border-[#c5a059]/20 bg-[#f8f5ef] text-xs focus:outline-none focus:ring-1 focus:ring-[#c5a059]/40" style={{direction:"rtl"}}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Textarea label="Evaluasi Mingguan" value={form.evaluasi} onChange={v=>setForm(f=>({...f,evaluasi:v}))} rows={2} />
          <Input label="Target Pekanan" value={form.targetPekanan} onChange={v=>setForm(f=>({...f,targetPekanan:v}))} />
          <div className="flex gap-2 justify-end pt-2">
            {modal?.z && <Btn variant="danger" onClick={()=>{del(form.id);setModal(null);}}>Hapus</Btn>}
            <Btn variant="secondary" onClick={()=>setModal(null)}>Batal</Btn>
            <Btn variant="primary" onClick={save}>Simpan</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================= MUHAFFIDZ: TARGET =============================
function MuhaffidzTarget({ state }: { state:AppState }) {
  const { currentUser, users, halaqahs, targets, setTargets } = state;
  const halaqah = halaqahs.find(h=>h.muhaffidzId===currentUser.id);
  const santriList = users.filter(u=>halaqah?.santriIds.includes(u.id));
  const myTargets = targets.filter(t=>santriList.some(s=>s.id===t.santriId));
  const [modal,setModal] = useState<{t?:WeekTarget}|null>(null);
  const [selSantri,setSelSantri] = useState(santriList[0]?.id??"");

  const nextPekan = () => {
    const existing = targets.filter(t=>t.santriId===selSantri);
    return existing.length>0 ? Math.max(...existing.map(t=>t.pekan))+1 : 1;
  };
  const makeEmpty = ():WeekTarget => ({
    id:uid(),santriId:selSantri,pekan:nextPekan(),tahun:new Date().getFullYear(),
    tanggalMulai:new Date().toISOString().slice(0,10),targets:makeEmptyDays(),done:makeEmptyDone(),isActiveWeek:false
  });
  const [form,setForm] = useState<WeekTarget>(makeEmpty());

  const openAdd = () => { const e=makeEmpty(); setForm(e); setModal({}); };
  const openEdit = (t:WeekTarget) => { setForm({...t}); setModal({t}); };
  const save = () => {
    if (modal?.t) setTargets(targets.map(t=>t.id===form.id?form:t));
    else setTargets([...targets,form]);
    setModal(null);
  };
  const del = (id:string) => { if(confirm("Hapus target ini?")) setTargets(targets.filter(t=>t.id!==id)); };
  const setActive = (santriId:string, targetId:string) => {
    setTargets(targets.map(t=>{
      if (t.santriId!==santriId) return t;
      return {...t,isActiveWeek:t.id===targetId};
    }));
  };

  const grouped = santriList.map(s=>({ santri:s, targets:myTargets.filter(t=>t.santriId===s.id).sort((a,b)=>b.pekan-a.pekan) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div/>
        <Btn onClick={openAdd}><Plus size={14}/>Buat Target</Btn>
      </div>
      {grouped.map(g=>(
        <Card key={g.santri.id}>
          <CardHeader title={g.santri.username} subtitle={`${g.targets.length} target tersimpan`} />
          <div className="p-4 space-y-2">
            {g.targets.length===0 ? <p className="text-sm text-[#6b7a8d] text-center py-4">Belum ada target</p> :
            g.targets.map(t=>(
              <div key={t.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all",t.isActiveWeek?"border-[#c5a059] bg-[#c5a059]/5":"border-[#c5a059]/20 bg-[#fdfbf7]")}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[#113f59]">Pekan {t.pekan}</span>
                    {t.isActiveWeek && <Badge color="gold">Pekan Aktif</Badge>}
                    <Badge color="gray">{pct(t.done)}%</Badge>
                  </div>
                  <p className="text-xs text-[#6b7a8d] mt-0.5">Mulai: {t.tanggalMulai}</p>
                </div>
                <div className="flex gap-1.5">
                  {!t.isActiveWeek && <Btn size="sm" variant="gold" onClick={()=>setActive(t.santriId,t.id)}>Set Aktif</Btn>}
                  <button onClick={()=>openEdit(t)} className="p-1.5 rounded-lg hover:bg-[#f0ebd8] text-[#113f59]"><Edit2 size={14}/></button>
                  <button onClick={()=>del(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal?.t?"Edit Target":"Buat Target Mingguan"}>
        <div className="space-y-4">
          <Select label="Santri" value={form.santriId} onChange={v=>{ setSelSantri(v); setForm(f=>({...f,santriId:v,pekan:nextPekan()})); }}
            options={santriList.map(s=>({value:s.id,label:s.username}))} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1"><label className="text-sm font-medium text-[#1c2b3a]">Pekan ke-</label>
              <input type="number" value={form.pekan} min={1} onChange={e=>setForm(f=>({...f,pekan:+e.target.value}))}
                className="px-3 py-2 rounded-lg border border-[#c5a059]/30 bg-[#f8f5ef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]/40" /></div>
            <Input label="Tanggal Mulai" type="date" value={form.tanggalMulai} onChange={v=>setForm(f=>({...f,tanggalMulai:v}))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1c2b3a]">Target Harian</label>
            {DAYS.map(d=>(
              <div key={d} className="flex items-center gap-3">
                <span className="w-16 text-sm text-[#6b7a8d] flex-shrink-0">{DAY_ID[d]}</span>
                <input value={form.targets[d]} onChange={e=>setForm(f=>({...f,targets:{...f.targets,[d]:e.target.value}}))}
                  placeholder={`Target ${DAY_ID[d]}...`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#c5a059]/30 bg-[#f8f5ef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]/40" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            {modal?.t && <Btn variant="danger" onClick={()=>{del(form.id);setModal(null);}}>Hapus</Btn>}
            <Btn variant="secondary" onClick={()=>setModal(null)}>Batal</Btn>
            <Btn variant="primary" onClick={save}>Simpan</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================= MUHAFFIDZ: UJIAN =============================
function MuhaffidzUjian({ state }: { state: AppState }) {
  const { currentUser, users, halaqahs, ujians, setUjians } = state;
  const halaqah = halaqahs.find((h) => h.muhaffidzId === currentUser.id);
  const santriList = users.filter((u) => halaqah?.santriIds.includes(u.id));
  const myUjians = ujians.filter((u) => u.muhaffidzId === currentUser.id);

  // State untuk Panel Pengaturan
  const [selectedSantriId, setSelectedSantriId] = useState(santriList[0]?.id ?? "");
  const [jmlJuz, setJmlJuz] = useState<number>(3);
  
  // State untuk Form Penilaian Akhir
  const [nilai, setNilai] = useState({ hifdz: 0, tajwid: 0, tartil: 0 });
  const [timer, setTimer] = useState(0);

  // Mendapatkan ujian yang sedang aktif untuk santri yang DIPILIH di dropdown
  const activeUjian = myUjians.find(
    (u) => u.santriId === selectedSantriId && (u.status === "active" || u.status === "submitted")
  );

  const rataRata = ((nilai.hifdz + nilai.tajwid + nilai.tartil) / 3).toFixed(2);

  // Timer Effect
  useEffect(() => {
    if (!activeUjian) {
      setTimer(0);
      return;
    }
    const elapsed = Math.floor((Date.now() - activeUjian.startTime) / 1000);
    setTimer(elapsed);
    const iv = setInterval(() => setTimer((p) => p + 1), 1000);
    return () => clearInterval(iv);
  }, [activeUjian?.id]);

  // Handler Aktivasi
  const aktivasi = () => {
    if (activeUjian) {
      alert("Santri ini sudah memiliki ujian aktif!");
      return;
    }
    // Logika +5 baris cadangan
  const totalBaris = jmlJuz + 5; 
  
  // Tambahkan ": KertasTasmi" setelah kurung parameter ()
  const initialKertasTasmi = Array.from({ length: totalBaris }).map((): KertasTasmi => ({
    mustami: "",
    status: "", // Sekarang TypeScript tahu ini adalah tipe kosong khusus dari status
    taqdir: "", // Sama halnya dengan taqdir, agar tidak dianggap string sembarangan
    khoto: 0,
    tanbih: 0,
    catatan: "",
  }));
    setUjians([
      ...ujians,
      {
        id: uid(),
        santriId: selectedSantriId,
        muhaffidzId: currentUser.id,
        juz: jmlJuz,
        status: "active",
        startTime: Date.now(),
        kertasTasmi: initialKertasTasmi,
      },
    ]);
  };

  // Fungsi agar Muhaffidz bisa mengubah baris tertentu (untuk kasus kecurangan)
  const updateBarisMuhaffidz = (index: number, field: string, value: string) => {
    if (!activeUjian) return;
    setUjians(
      ujians.map((u) => {
        if (u.id === activeUjian.id) {
          const newKertas = [...u.kertasTasmi];
          newKertas[index] = { ...newKertas[index], [field]: value };
          return { ...u, kertasTasmi: newKertas };
        }
        return u;
      })
    );
  };

  // 1. Tambahkan useEffect untuk memicu Toast Notifikasi
  useEffect(() => {
    if (activeUjian && activeUjian.status === "submitted") {
      // Memunculkan pop-up notifikasi di layar Muhaffidz
      toast.info("Santri Siap Dinilai! 🔔", {
        description: "Santri telah menyelesaikan setoran. Silakan periksa Kertas Tasmi' dan berikan penilaian akhir.",
      });
    }
  }, [activeUjian?.status]); // Hanya terpanggil jika status ujian yang aktif berubah

  // Handler Selesai
  const selesaikan = () => {
    if (!activeUjian) return;
    setUjians(
      ujians.map((u) =>
        u.id === activeUjian.id
          ? { ...u, status: "completed", nilai: { ...nilai, rata: parseFloat(rataRata) } }
          : u
      )
    );
    setNilai({ hifdz: 0, tajwid: 0, tartil: 0 });
  };

  const completed = myUjians.filter((u) => u.status === "completed");

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* 1. PANEL PENGATURAN UJIAN */}
      <Card className="p-5 border-[#c5a059]/40">
        <h3 className="font-playfair text-[#113f59] font-bold text-lg mb-4 border-b border-[#c5a059]/20 pb-2">
          Panel Pengaturan Ujian (Muhaffidz)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Select
            label="Pilih Santri:"
            value={selectedSantriId}
            onChange={setSelectedSantriId}
            options={[
              { value: "", label: "- Pilih Santri -" },
              ...santriList.map((s) => ({ value: s.id, label: s.username })),
            ]}
          />
          <Input
            label="Jumlah Juz Ujian:"
            type="number"
            value={jmlJuz.toString()}
            onChange={(v) => setJmlJuz(Number(v))}
          />
          <Btn variant="primary" onClick={aktivasi} className="w-full py-2.5 bg-[#113f59] text-white">
            Aktifkan Ujian & Durasi
          </Btn>
        </div>
      </Card>

      {activeUjian && (
        <>
          {/* 2. STATUS UJIAN */}
          <Card className="p-4 bg-[#fdfbf7] flex justify-between items-center border-[#c5a059]/30">
            <div>
              <p className="text-sm font-bold text-[#1c2b3a]">
                Status Ujian: <span className="text-green-600">PERSIAPAN</span>
              </p>
              <p className="text-sm text-[#6b7a8d]">Jumlah Juz: {activeUjian.juz} Juz</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6b7a8d] mb-1">Durasi Ujian:</p>
              <p className="text-xl font-mono font-bold text-[#113f59] bg-white px-3 py-1 rounded border border-[#c5a059]/20">
                {fmt(timer)}
              </p>
            </div>
          </Card>
{/* Banner Notifikasi Standby */}
          {activeUjian.status === "submitted" && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-start md:items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-base">Santri Siap Diuji / Dinilai!</p>
                <p className="text-sm mt-1">
                  Kertas Tasmi' telah dikirim oleh santri/mustami'. Silakan evaluasi tabel di bawah dan kunci nilai di Form Penilaian Akhir.
                </p>
              </div>
            </div>
          )}
          
          {/* 3. KERTAS TASMI' (Read-Only Table) */}
          <div className="text-center font-playfair font-bold text-[#113f59] text-xl mt-4">Kertas Tasmi'</div>
          <Card className="overflow-x-auto shadow-sm border-[#113f59]/20">
            <table className="w-full text-sm text-center" dir="rtl">
              <thead className="bg-[#113f59] text-white">
                <tr>
                  <th className="py-3 px-2 border-l border-white/20">رقم</th>
                  <th className="py-3 px-2 border-l border-white/20">جزء</th>
                  <th className="py-3 px-2 border-l border-white/20">تنبيه</th>
                  <th className="py-3 px-2 border-l border-white/20">خطأ</th>
                  <th className="py-3 px-2 border-l border-white/20">تقدير</th>
                  <th className="py-3 px-2 border-l border-white/20">مقبول/مردود</th>
                  <th className="py-3 px-2">مستمع</th>
                </tr>
              </thead>
              <tbody>
                {/* Looping baris sesuai jumlah juz dari ujian aktif */}
                {Array.from({ length: activeUjian.juz + 5}).map((_, i) => (
                  <tr key={i} className="border-b border-[#c5a059]/20 bg-white">
                    <td className="py-2 px-2 border-l border-[#c5a059]/20 font-bold">{i + 1}</td>
                    <td className="py-2 px-2 border-l border-[#c5a059]/20">جزء {i + 1}</td>
                    <td className="py-2 px-2 border-l border-[#c5a059]/20">
                      <div className="flex justify-center items-center gap-1">
                        <button disabled className="px-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">-</button>
                        <input disabled value="0" className="w-8 text-center bg-gray-50 border border-gray-200" />
                        <button disabled className="px-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">+</button>
                      </div>
                    </td>
                    <td className="py-2 px-2 border-l border-[#c5a059]/20">
                       <div className="flex justify-center items-center gap-1">
                        <button disabled className="px-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">-</button>
                        <input disabled value="0" className="w-8 text-center bg-gray-50 border border-gray-200" />
                        <button disabled className="px-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">+</button>
                      </div>
                    </td>
                    <td className="py-2 px-2 border-l border-[#c5a059]/20">
                       <select disabled className="bg-gray-50 border border-gray-200 rounded px-1 cursor-not-allowed">
                         <option>- ممتاز -</option>
                       </select>
                    </td>
                   <td className="py-2 px-2 border-l border-[#c5a059]/20">
  <select 
    value={activeUjian.kertasTasmi[i]?.status || ""} 
    onChange={(e) => updateBarisMuhaffidz(i, "status", e.target.value)}
    className="w-full bg-transparent border-none text-center outline-none cursor-pointer text-[#113f59]"
  >
    <option value="">- اختر -</option>
    <option value="maqbul">- مقبول -</option>
    <option value="mardud">- مردود -</option>
  </select>
</td>
                    <td className="py-2 px-2">
                       <input disabled placeholder="الأخ/الأستاذ" className="w-full text-center bg-gray-50 border border-gray-200" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* 4. FORM PENILAIAN AKHIR UJIAN */}
          <Card className="p-5 border-[#c5a059]/40">
             <h3 className="font-playfair text-[#113f59] font-bold text-lg mb-4 border-b border-[#c5a059]/20 pb-2">
               Form Penilaian Akhir Ujian (Muhaffidz)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input label="Nilai Hifdz (0-100):" type="number" value={nilai.hifdz.toString()} onChange={v => setNilai({...nilai, hifdz: Number(v)})} />
                <Input label="Nilai Tajwid (0-100):" type="number" value={nilai.tajwid.toString()} onChange={v => setNilai({...nilai, tajwid: Number(v)})} />
                <Input label="Nilai Tartil (0-100):" type="number" value={nilai.tartil.toString()} onChange={v => setNilai({...nilai, tartil: Number(v)})} />
             </div>
             <div className="flex flex-col md:flex-row justify-between items-center bg-[#f8f5ef] p-3 rounded-lg border border-[#c5a059]/20">
                <p className="font-bold text-[#1c2b3a] mb-2 md:mb-0">
                  Hasil Akhir (Rata-rata): <span className="text-[#113f59]">{rataRata}</span>
                </p>
                <Btn variant="primary" onClick={selesaikan} className="bg-[#113f59]">
                  Simpan Penilaian & Selesaikan Ujian
                </Btn>
             </div>
          </Card>
        </>
      )}

      {/* 5. RIWAYAT UJIAN */}
      <Card className="p-5 border-[#c5a059]/40 mt-8">
         <h3 className="font-playfair text-[#113f59] font-bold text-lg mb-4 border-b border-[#c5a059]/20 pb-2">
           Riwayat Ujian Kenaikan Juz Selesai
         </h3>
         <table className="w-full text-sm text-center">
            <thead className="bg-[#113f59] text-white">
              <tr>
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Nama Santri</th>
                <th className="py-2.5 px-3">Jumlah Juz</th>
                <th className="py-2.5 px-3">Hasil Akhir</th>
                <th className="py-2.5 px-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
               {completed.length === 0 ? (
                 <tr><td colSpan={5} className="py-4 text-[#6b7a8d] italic">Memuat riwayat...</td></tr>
               ) : (
                 completed.map((u, i) => (
                   <tr key={u.id} className="border-b border-[#c5a059]/20">
                     <td className="py-2.5">{i + 1}</td>
                     <td className="py-2.5 font-bold">{users.find(s => s.id === u.santriId)?.username}</td>
                     <td className="py-2.5">{u.juz} Juz</td>
                     <td className="py-2.5 text-green-600 font-bold">{u.nilai?.rata || 0}</td>
                     <td className="py-2.5">
                       <Btn variant="primary" size="sm" className="bg-[#113f59] px-4 py-1">Lihat</Btn>
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
         </table>
      </Card>
    </div>
  );
}

// ============================= SANTRI: ZIYADAH =============================
function SantriZiyadah({ state }: { state:AppState }) {
  const { currentUser, ziyadahs } = state;
  const myZ = ziyadahs.filter(z=>z.santriId===currentUser.id);
  const [viewModal,setViewModal] = useState<ZiyadahRekap|null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Riwayat Ziyadah" subtitle={`${myZ.length} rekap tersimpan`} />
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#c5a059]/20">
              <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">No</th>
              <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Pekan</th>
              <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Tanggal</th>
              <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Target</th>
              <th className="text-left py-2.5 px-3 text-[#6b7a8d] font-medium">Aksi</th>
            </tr></thead>
            <tbody>{myZ.length===0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-[#6b7a8d]">Belum ada rekap ziyadah</td></tr>
            ) : myZ.map((z,i)=>(
              <tr key={z.id} className="border-b border-[#c5a059]/10 hover:bg-[#fdfbf7] transition-colors">
                <td className="py-3 px-3 text-[#6b7a8d]">{i+1}</td>
                <td className="py-3 px-3"><Badge color="navy">Pekan {z.pekan}</Badge></td>
                <td className="py-3 px-3 text-[#6b7a8d]">{z.tanggal}</td>
                <td className="py-3 px-3 text-[#1c2b3a] max-w-[200px] truncate">{z.targetPekanan||"-"}</td>
                <td className="py-3 px-3"><Btn size="sm" variant="ghost" onClick={()=>setViewModal(z)}><Eye size={13}/>Lihat</Btn></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      <Modal open={!!viewModal} onClose={()=>setViewModal(null)} title={`Rekap Ziyadah — Pekan ${viewModal?.pekan}`} wide>
        {viewModal && <div className="space-y-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" dir="rtl">
              <thead><tr className="bg-[#113f59] text-white">
                <th className="py-2.5 px-2 font-medium rounded-tr-lg">اليوم</th>
                <th className="py-2.5 px-2 font-medium">الحفظ</th>
                <th className="py-2.5 px-2 font-medium">تقدير</th>
                <th className="py-2.5 px-2 font-medium">المراجعة</th>
                <th className="py-2.5 px-2 font-medium">تقدير</th>
                <th className="py-2.5 px-2 font-medium rounded-tl-lg">ملاحظات</th>
              </tr></thead>
              <tbody>{DAYS.map(d=>(
                <tr key={d} className="border-b border-[#c5a059]/10">
                  <td className="py-2.5 px-3 font-medium text-[#113f59] text-right">{DAY_AR[d]}</td>
                  <td className="py-2.5 px-2 text-right">{viewModal.days[d].hafalan||"—"}</td>
                  <td className="py-2.5 px-2 text-right"><Badge color="navy">{viewModal.days[d].taqdirHafalan}</Badge></td>
                  <td className="py-2.5 px-2 text-right">{viewModal.days[d].murajaah||"—"}</td>
                  <td className="py-2.5 px-2 text-right"><Badge color="gold">{viewModal.days[d].taqdirMurajaah}</Badge></td>
                  <td className="py-2.5 px-2 text-right text-[#6b7a8d]">{viewModal.days[d].catatan||"—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f0ebd8] rounded-xl p-3">
              <p className="text-xs text-[#6b7a8d] mb-1">Evaluasi Mingguan</p>
              <p className="text-sm text-[#1c2b3a]">{viewModal.evaluasi||"—"}</p>
            </div>
            <div className="bg-[#f0ebd8] rounded-xl p-3">
              <p className="text-xs text-[#6b7a8d] mb-1">Target Pekanan</p>
              <p className="text-sm text-[#1c2b3a]">{viewModal.targetPekanan||"—"}</p>
            </div>
          </div>
        </div>}
      </Modal>
    </div>
  );
}

// ============================= SANTRI: TARGET =============================
function SantriTarget({ state }: { state:AppState }) {
  const { currentUser, targets, setTargets } = state;
  const myTargets = targets.filter(t=>t.santriId===currentUser.id);
  const activeTarget = myTargets.find(t=>t.isActiveWeek);

  const toggleDone = (day:Day) => {
    if (!activeTarget) return;
    setTargets(targets.map(t=>t.id===activeTarget.id ? { ...t, done:{ ...t.done, [day]:!t.done[day] } } : t));
  };

  const prog = activeTarget ? pct(activeTarget.done) : 0;
  const completedCount = activeTarget ? Object.values(activeTarget.done).filter(Boolean).length : 0;

  return (
    <div className="space-y-4">
      {!activeTarget ? (
        <Card className="p-8 text-center">
          <Target size={40} className="text-[#c5a059]/40 mx-auto mb-3"/>
          <p className="text-[#6b7a8d]">Belum ada pekan aktif yang ditentukan muhaffidz.</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-[#113f59] to-[#0d3347] p-5 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge color="gold">Pekan Aktif</Badge>
                  <h2 className="font-playfair font-bold text-xl mt-1">Pekan {activeTarget.pekan} — {activeTarget.tahun}</h2>
                  <p className="text-white/60 text-sm">Mulai: {activeTarget.tanggalMulai}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-playfair font-bold text-[#c5a059]">{prog}%</p>
                  <p className="text-xs text-white/60">{completedCount}/7 hari</p>
                </div>
              </div>
              <ProgressBar pct={prog} />
            </div>
            <div className="p-4 space-y-2">
              {DAYS.map(day=>{
                const done = activeTarget.done[day];
                const target = activeTarget.targets[day];
                return <div key={day} onClick={()=>toggleDone(day)}
                  className={cn("flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                    done ? "border-green-200 bg-green-50" : "border-[#c5a059]/20 bg-[#fdfbf7] hover:bg-[#f8f5ef]")}>
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    done ? "bg-green-500 border-green-500" : "border-[#c5a059]/50")}>
                    {done && <Check size={13} className="text-white"/>}
                  </div>
                  <span className="w-14 text-sm font-medium text-[#6b7a8d] flex-shrink-0">{DAY_ID[day]}</span>
                  <span className={cn("flex-1 text-sm transition-all",done?"text-[#6b7a8d] line-through":"text-[#1c2b3a]")}>{target||"—"}</span>
                  {done && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0"/>}
                </div>;
              })}
            </div>
          </Card>
        </>
      )}
      {myTargets.filter(t=>!t.isActiveWeek).length>0 && (
        <Card>
          <CardHeader title="Riwayat Target" subtitle="Pekan-pekan sebelumnya" />
          <div className="p-4 space-y-2">
            {myTargets.filter(t=>!t.isActiveWeek).sort((a,b)=>b.pekan-a.pekan).map(t=>(
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#c5a059]/15 bg-[#fdfbf7]">
                <span className="font-medium text-sm text-[#113f59]">Pekan {t.pekan}</span>
                <ProgressBar pct={pct(t.done)} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================= SANTRI: UJIAN =============================
function SantriUjian({ state }: { state: AppState }) {
  const { currentUser, ujians, setUjians } = state;

  // Cari ujian santri yang sedang aktif
  const activeUjian = ujians.find(
    (u) => u.santriId === currentUser.id && u.status === "active"
  );

  // Fungsi helper untuk update data tabel per baris
  const updateBaris = (index: number, field: string, value: string | number) => {
    if (!activeUjian) return;
    setUjians(
      ujians.map((u) => {
        if (u.id === activeUjian.id) {
          const newKertas = [...u.kertasTasmi];
          newKertas[index] = { ...newKertas[index], [field]: value };
          return { ...u, kertasTasmi: newKertas };
        }
        return u;
      })
    );
  };

  const ubahCount = (index: number, field: "khoto" | "tanbih", delta: number) => {
    if (!activeUjian) return;
    const currentVal = activeUjian.kertasTasmi[index][field] || 0;
    let newVal = currentVal + delta;
    if (newVal < 0) newVal = 0; // Cegah minus
    updateBaris(index, field, newVal);
  };

  if (!activeUjian) {
    return (
      <div className="text-center text-gray-500 py-10">
        Belum ada ujian yang diaktifkan oleh Muhaffidz.
      </div>
    );
  }

 // Menghitung total juz yang sudah berstatus 'maqbul'
  const jumlahMaqbul = activeUjian?.kertasTasmi.filter(row => row.status === "maqbul").length || 0;
  
  // Indikator bahwa tasmi selesai (jumlah maqbul sama dengan target juz)
  const isTasmiSelesai = activeUjian && jumlahMaqbul === activeUjian.juz;

  const kirimKeMuhaffidz = () => {
    if (!activeUjian) return;

    // Pop-up Konfirmasi
    const konfirmasi = window.confirm("Antum sudah siap untuk ujian?");
    if (!konfirmasi) return; // Batal kirim jika user memilih 'Cancel'
    
    setUjians(
      ujians.map((u) => 
        u.id === activeUjian.id ? { ...u, status: "submitted" } : u
      )
    );
    
    toast.success("Berhasil dikirim!", {
      description: "Kertas Tasmi' berhasil dikirim. Menunggu penilaian Muhaffidz."
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Banner Status Ujian (Bisa gunakan komponen Card timer yang sama dengan guru) */}
      <Card className="p-4 bg-[#fdfbf7] flex justify-between items-center border-[#c5a059]/30">
         <div>
            <p className="text-sm font-bold text-[#1c2b3a]">
               Status Ujian: <span className="text-green-600">PERSIAPAN</span>
            </p>
            <p className="text-sm text-[#6b7a8d]">Jumlah Juz: {activeUjian.juz} Juz</p>
         </div>
         {/* Timer di sini */}
      </Card>

      <div className="text-center font-playfair font-bold text-[#113f59] text-xl mt-4">
        Kertas Tasmi'
      </div>

      <Card className="overflow-x-auto shadow-sm border-[#113f59]/20">
        <table className="w-full text-sm text-center" dir="rtl">
          <thead className="bg-[#113f59] text-white">
            <tr>
              <th className="py-3 px-2 border-l border-white/20 w-12">رقم</th>
              <th className="py-3 px-2 border-l border-white/20 w-24">جزء</th>
              <th className="py-3 px-2 border-l border-white/20 w-32">تنبيه</th>
              <th className="py-3 px-2 border-l border-white/20 w-32">خطأ</th>
              <th className="py-3 px-2 border-l border-white/20">تقدير</th>
              <th className="py-3 px-2 border-l border-white/20">مقبول/مردود</th>
              <th className="py-3 px-2">مستمع</th>
            </tr>
          </thead>
          <tbody>
            {activeUjian.kertasTasmi.map((row: any, i: number) => (
              <tr key={i} className="border-b border-[#c5a059]/20 bg-white">
                {/* Nomor Urut */}
                <td className="py-2 px-2 border-l border-[#c5a059]/20 font-bold">{i + 1}</td>
                
                {/* Nama Juz (Otomatis ulang angka 1 atau biarkan bisa diedit jika perlu) */}
                <td className="py-2 px-2 border-l border-[#c5a059]/20">
                  جزء {i < activeUjian.juz ? 1 : 1 /* Sesuaikan label juz */}
                </td>

                {/* Tanbih */}
                <td className="py-2 px-2 border-l border-[#c5a059]/20">
                  <div className="flex justify-center items-center gap-1">
                    <button onClick={() => ubahCount(i, "tanbih", -1)} className="px-2 bg-gray-100 border rounded shadow-sm hover:bg-gray-200">-</button>
                    <input readOnly value={row.tanbih} className="w-8 text-center bg-transparent font-bold" />
                    <button onClick={() => ubahCount(i, "tanbih", 1)} className="px-2 bg-gray-100 border rounded shadow-sm hover:bg-gray-200">+</button>
                  </div>
                </td>

                {/* Khoto' */}
                <td className="py-2 px-2 border-l border-[#c5a059]/20">
                  <div className="flex justify-center items-center gap-1">
                    <button onClick={() => ubahCount(i, "khoto", -1)} className="px-2 bg-gray-100 border rounded shadow-sm hover:bg-gray-200">-</button>
                    <input readOnly value={row.khoto} className="w-8 text-center bg-transparent font-bold" />
                    <button onClick={() => ubahCount(i, "khoto", 1)} className="px-2 bg-gray-100 border rounded shadow-sm hover:bg-gray-200">+</button>
                  </div>
                </td>

                {/* Taqdir */}
                <td className="py-2 px-2 border-l border-[#c5a059]/20">
                  <select 
                    value={row.taqdir} 
                    onChange={(e) => updateBaris(i, "taqdir", e.target.value)}
                    className="w-full bg-transparent border-none text-center outline-none cursor-pointer"
                  >
                    <option value="">- اختر -</option>
                    <option value="mumtaz">- ممتاز -</option>
                    <option value="jayyid_jiddan">- جيد جدا -</option>
                    <option value="jayyid">- جيد -</option>
                    <option value="maqbul">- مقبول -</option>
                  </select>
                </td>

                {/* Maqbul / Mardud */}
                <td className="py-2 px-2 border-l border-[#c5a059]/20">
                  <select 
                    value={row.status} 
                    onChange={(e) => updateBaris(i, "status", e.target.value)}
                    className="w-full bg-transparent border-none text-center outline-none cursor-pointer"
                  >
                    <option value="">- اختر -</option>
                    <option value="maqbul">- مقبول -</option>
                    <option value="mardud">- مردود -</option>
                  </select>
                </td>

                {/* Nama Mustami' */}
                <td className="py-2 px-2">
                  <input 
                    type="text"
                    placeholder="الأخ/الأستاذ" 
                    value={row.mustami}
                    onChange={(e) => updateBaris(i, "mustami", e.target.value)}
                    className="w-full text-center bg-transparent border-none outline-none" 
                  />

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {/* Tombol Kirim akan muncul hanya jika tasmi sudah selesai */}
      {activeUjian.status === "active" && isTasmiSelesai && (
        <div className="mt-6 flex justify-center">
          <button 
            onClick={kirimKeMuhaffidz}
            className="w-full md:w-1/2 py-3 bg-[#c5a059] hover:bg-[#b08d4a] text-white font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
          >
            🔔 Kirim ke Muhaffidz
          </button>
        </div>
      )}

      {/* Pesan info jika belum selesai */}
      {activeUjian.status === "active" && !isTasmiSelesai && (
        <div className="mt-6 text-center text-sm text-[#6b7a8d] italic">
          *Tombol kirim akan muncul setelah {activeUjian.juz} Juz diselesaikan (berstatus "مقبول").
        </div>
      )}
      
      {/* Tombol Kirim (Opsional jika santri butuh trigger manual) */}
    </div>
  );
}

// ============================= MAIN APP =============================
export default function App() {
  const [currentUser,setCurrentUserState] = useState<User|null>(null);
  const [authPage,setAuthPage] = useState<"login"|"register">("login");
  const [users,setUsers] = useState<User[]>(INIT_USERS);
  const [halaqahs,setHalaqahs] = useState<Halaqah[]>(INIT_HALAQAH);
  const [targets,setTargets] = useState<WeekTarget[]>(INIT_TARGETS);
  const [ziyadahs,setZiyadahs] = useState<ZiyadahRekap[]>(INIT_ZIYADAH);
  const [ujians,setUjians] = useState<Ujian[]>(INIT_UJIAN);

  const defaultPage = (u:User): Page =>
    u.role==="admin" ? "admin-users" : u.role==="muhaffidz" ? "muhaffidz-ziyadah" : "santri-ziyadah";

  const [currentPage,setCurrentPage] = useState<Page>("admin-users");

  const setCurrentUser = (u:User|null) => {
    setCurrentUserState(u);
    if (u) setCurrentPage(defaultPage(u));
  };

  if (!currentUser) {
    return authPage==="login"
      ? <LoginPage onLogin={u=>setCurrentUser(u)} onGoRegister={()=>setAuthPage("register")} />
      : <RegisterPage onBack={()=>setAuthPage("login")} />;
  }

  const state: AppState = {
    users,setUsers,halaqahs,setHalaqahs,targets,setTargets,ziyadahs,setZiyadahs,ujians,setUjians,
    currentUser,setCurrentUser,currentPage,setPage:setCurrentPage
  };

  const renderPage = () => {
    switch(currentPage) {
      case "admin-users":      return <AdminUsers state={state}/>;
      case "admin-halaqah":   return <AdminHalaqah state={state}/>;
      case "muhaffidz-ziyadah": return <MuhaffidzZiyadah state={state}/>;
      case "muhaffidz-target":  return <MuhaffidzTarget state={state}/>;
      case "muhaffidz-ujian":   return <MuhaffidzUjian state={state}/>;
      case "santri-ziyadah":  return <SantriZiyadah state={state}/>;
      case "santri-target":   return <SantriTarget state={state}/>;
      case "santri-ujian":    return <SantriUjian state={state}/>;
      default: return null;
    }
  };

  return (
    <Layout state={state}>
      {renderPage()}
    </Layout>
  );
}
