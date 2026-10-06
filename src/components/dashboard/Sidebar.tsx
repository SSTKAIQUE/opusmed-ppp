'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, Building2, LogOut } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import type { Profile } from '@/types';

interface SidebarProps { profile: Profile; pendentes?: number; }

const navMain = [
  { href: '/dashboard/solicitacoes', label: 'Solicitações', icon: ClipboardList, badge: true },
  { href: '/dashboard/empresas',     label: 'Empresas',     icon: Building2,     badge: false },
];

export default function Sidebar({ profile, pendentes = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-[248px] flex-shrink-0 flex-col h-full bg-gradient-to-b from-[#07182c] to-[#0b2545] border-r border-[#0f2f52] px-3.5 py-5 text-[#c7d6e8]">
        <div className="flex items-center gap-2.5 px-2 pb-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-cyan-400 to-cyan-700 text-[13px] font-bold text-[#04202e] shadow-[0_0_18px_rgba(34,211,238,0.35)]">
            OS
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">Opusmed SST</p>
            <p className="text-xs text-[#7f9bb8]">Gestão de PPP</p>
          </div>
        </div>

        <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5f7d9c]">Principal</p>
        <nav className="space-y-0.5" aria-label="Navegação principal">
          {navMain.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-gradient-to-r from-cyan-400/15 to-transparent text-white shadow-[inset_2px_0_0_#22d3ee]'
                    : 'text-[#9fb6cf] hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-cyan-400')} strokeWidth={1.8} />
                {item.label}
                {item.badge && pendentes > 0 && (
                  <span className="ml-auto rounded-full bg-cyan-400 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#04202e]">{pendentes}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 pt-4">
          <Avatar nome={profile.nome} className="bg-cyan-400/15 text-cyan-300" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-white">{profile.nome}</p>
            <p className="truncate text-xs capitalize text-[#7f9bb8]">{profile.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            aria-label="Sair"
            className="rounded-lg p-2 text-[#7f9bb8] transition-colors hover:bg-white/5 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {/* Mobile: barra inferior */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#0f2f52] bg-[#07182c] lg:hidden"
      >
        {navMain.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                active ? 'text-cyan-400' : 'text-[#9fb6cf]'
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
        <button onClick={handleLogout} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-[#9fb6cf]">
          <LogOut className="h-5 w-5" strokeWidth={1.8} />
          Sair
        </button>
      </nav>
    </>
  );
}
