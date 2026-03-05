'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { config } from '@/lib/wagmi'
import { polygon } from 'viem/chains'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cm78y0lyj0382j20qjpsl40ic" // Placeholder

    return (
        <PrivyProvider
            appId={appId}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#2E5CFF',
                    logo: '/heyannalogo.png',
                },
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets',
                },
                defaultChain: polygon,
                supportedChains: [polygon]
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={config}>
                    {children}
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    )
}
