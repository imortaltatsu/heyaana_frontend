import { http, createConfig } from 'wagmi'
import { polygon } from 'wagmi/chains'
import { safe, injected, coinbaseWallet, metaMask } from 'wagmi/connectors'

export const config = createConfig({
    chains: [polygon],
    connectors: [
        safe({
            allowedDomains: [/https:\/\/app.safe.global/],
            debug: true,
        }),
        metaMask(),
        coinbaseWallet({ appName: 'HeyAna' }),
        injected({
            target: 'phantom',
        }),
        injected(),
    ],
    transports: {
        [polygon.id]: http(),
    },
})
