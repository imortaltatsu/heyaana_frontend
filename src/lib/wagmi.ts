import { http, createConfig } from 'wagmi'
import { polygon } from 'wagmi/chains'
import { base, baseSepolia } from 'wagmi/chains'

export const config = createConfig({
    chains: [polygon, base, baseSepolia],
    transports: {
        [polygon.id]: http(),
        [base.id]: http(),
        [baseSepolia.id]: http(),
    },
})
