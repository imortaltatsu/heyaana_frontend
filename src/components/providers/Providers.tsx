'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useState, useEffect } from 'react'
import { TOKEN_STORAGE_KEY } from '@/lib/auth-api'
import { config } from '@/lib/wagmi'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    useEffect(() => {
        if (typeof window === 'undefined') return
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token') || params.get('jwt') || params.get('access_token')

        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token)
            const url = new URL(window.location.href)
            url.searchParams.delete('token')
            url.searchParams.delete('jwt')
            url.searchParams.delete('access_token')
            window.history.replaceState({}, '', url.toString())
            window.location.reload()
        }
    }, [])

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}
