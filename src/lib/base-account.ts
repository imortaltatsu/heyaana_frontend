"use client";

import { createBaseAccountSDK } from "@base-org/account";
import { base, baseSepolia } from "viem/chains";

const APP_NAME = "HeyAnna";
const APP_LOGO = "https://www.heyanna.trade/heyannalogo.png";

export const baseAccountSDK = createBaseAccountSDK({
  appName: APP_NAME,
  appLogoUrl: APP_LOGO,
  appChainIds: [base.id, baseSepolia.id],
});

export const baseProvider = baseAccountSDK.getProvider();
