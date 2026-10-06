import 'server-only';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export type Role = 'admin' | 'tecnico';

export interface AuthedUser {
  id: string;
  email: string | undefined;
  role: Role;
}

/**
 * Valida o usuário no servidor (getUser verifica o JWT no Supabase Auth)
 * e confere que existe um profile com papel permitido.
 */
export async function requireUser(
  allowed: Role[] = ['admin', 'tecnico']
): Promise<{ user: AuthedUser } | { error: NextResponse }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !allowed.includes(profile.role as Role)) {
    return { error: NextResponse.json({ error: 'Acesso negado.' }, { status: 403 }) };
  }

  return { user: { id: user.id, email: user.email, role: profile.role as Role } };
}

/** Lê o corpo JSON sem lançar exceção. */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
