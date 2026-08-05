import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { deleteTempAccountIfExpired } from '@/lib/tempAccountCleanup'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_temp_account, temp_expires_at')
      .eq('id', user.id)
      .single()

    if (profile?.is_temp_account && profile.temp_expires_at && new Date(profile.temp_expires_at) < new Date()) {
      await deleteTempAccountIfExpired(user.id)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('expired', '1')
      const res = NextResponse.redirect(url)
      return res
    }
  }

  // Guard protected routes if necessary
  const path = request.nextUrl.pathname
  if (!user && (path.startsWith('/master') || path.startsWith('/clinic') || path.startsWith('/ethics') || path.startsWith('/ip-application'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
