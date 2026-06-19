'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck, ClipboardList, Building2, LogOut, User,
  LayoutDashboard, FileText, AlertTriangle, Settings, Users
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface SidebarProps { profile: Profile; }

const navMain = [
  { href: '/dashboard/solicitacoes', label: 'Solicitações', icon: ClipboardList },
  { href: '/dashboard/empresas',     label: 'Empresas',     icon: Building2 },
];

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  const initials = profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full" style={{background:'#0F2647'}}>
      {/* Brand */}
      <div className="px-5 py-5 border-b" style={{borderColor:'rgba(255,255,255,0.07)'}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{background:'linear-gradient(135deg,#3B82F6,#10B981)'}}>
            🛡️
          </div>
          <div>
            <p className="text-white font-bold text-[13px] leading-tight">Opusmed SST</p>
            <p className="text-[10px] uppercase tracking-widest" style={{color:'rgba(255,255,255,0.35)'}}>Gestão de PPP</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2" style={{color:'rgba(255,255,255,0.3)'}}>Principal</p>
        {navMain.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mb-0.5',
                active ? 'text-white' : 'hover:text-white/90'
              )}
              style={active
                ? { background: 'rgba(59,130,246,0.2)', color: '#fff' }
                : { color: 'rgba(255,255,255,0.5)' }
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 1.8} />
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3" style={{borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1" style={{cursor:'default'}}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{background:'linear-gradient(135deg,#2A5298,#3B82F6)'}}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-semibold truncate">{profile.nome}</p>
            <p className="text-[10px] truncate capitalize" style={{color:'rgba(255,255,255,0.4)'}}>{profile.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors"
          style={{color:'rgba(255,255,255,0.4)'}}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#FCA5A5'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
