import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet: { name: string; value: string; options: CookieOptions }[]) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
          );
        },
      },
    }
  );

  // Sem timeout, um Supabase lento/pausado deixa a requisição pendurada até a
  // Vercel derrubar com 504 (MIDDLEWARE_INVOCATION_TIMEOUT). Em caso de demora
  // tratamos como "sem sessão": /dashboard vai ao login e /auth/login abre normal.
  const user = await Promise.race([
    supabase.auth.getUser().then(({ data }) => data.user).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
  ]);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/dashboard') && !user) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/auth/login') && user) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard/solicitacoes';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
