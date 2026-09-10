'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, Building2, LogOut } from 'lucide-react';
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
    <aside className="w-[232px] flex-shrink-0 flex flex-col h-full bg-navy-dark">
      {/* Brand */}
      <div className="px-[22px] py-6 border-b border-white/[0.08] flex items-center gap-3">
        <div className="w-[34px] h-[34px] rounded-full border-[1.3px] border-brass-soft flex items-center justify-center flex-shrink-0 text-brass-soft font-serif font-semibold text-[13px]">
          OS
        </div>
        <div>
          <p className="text-white font-serif font-semibold text-sm leading-tight">Opusmed SST</p>
          <p className="text-[9.5px] uppercase tracking-[0.1em] text-navy-light/70 mt-1">Gestão de PPP</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 pt-[18px]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] px-2.5 pb-2.5 text-[#3C566B]">Principal</p>
        {navMain.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-[11px] px-3 py-2.5 rounded-r text-[13px] font-medium border-l-2 mb-px transition-colors',
                active
                  ? 'bg-white/[0.045] text-white border-brass-soft'
                  : 'text-[#7E96A8] border-transparent hover:text-white/90'
              )}
            >
              <item.icon className={cn('w-[15px] h-[15px] flex-shrink-0', active ? 'opacity-100' : 'opacity-75')} strokeWidth={1.6} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-3 pt-4 pb-5 border-t border-white/[0.08]">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-0.5">
          <div className="w-7 h-7 rounded-full bg-navy-mid border border-brass-soft flex items-center justify-center text-white text-[10.5px] font-semibold font-mono flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12.5px] font-semibold leading-tight truncate">{profile.nome}</p>
            <p className="text-[10.5px] capitalize truncate text-[#5C7A91]">{profile.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-2 py-2 rounded text-xs font-medium text-[#5C7A91] hover:text-red-300 hover:bg-red-500/[0.08] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.6} />
          Sair
        </button>
      </div>
    </aside>
  );
}
