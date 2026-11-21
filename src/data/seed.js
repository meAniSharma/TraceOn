import { H, D } from '../lib/analyze.js';

/** Demo data. Built with a function so timestamps are relative to "now". */
export function makeSeed() {
  const now = Date.now();
  return {
    accounts: [
      { ids: ['ig:trendy_store123', 'upi:rahul123@okaxis', 'ph:9876543210'] },
      { ids: ['ig:fashion_deals_01', 'upi:rahul123@okaxis'] },
      { ids: ['ig:premium_store', 'upi:rahul123@okaxis'] },
      { ids: ['ig:shop_with_trust', 'upi:trustshop@oksbi'], verified: true, name: 'Shop With Trust' },
      { ids: ['ig:glow_cosmetics_in', 'upi:glowpay@ybl'], verified: true, name: 'Glow Cosmetics' },
      { ids: ['ig:cheap_gadgets_hub', 'upi:gadgetking@paytm', 'ph:9123456780'] },
    ],
    reports: [
      { id: 'ig:trendy_store123', proof: true, note: 'Paid in advance, got blocked.', ts: now - 2 * H },
      { id: 'upi:rahul123@okaxis', proof: true, note: 'Same UPI under a new page name.', ts: now - 3 * D },
      { id: 'ph:9876543210', proof: false, note: 'Never delivered.', ts: now - 5 * H },
      { id: 'ig:fashion_deals_01', proof: true, note: 'Receipt attached, no delivery.', ts: now - 9 * D },
      { id: 'upi:gadgetking@paytm', proof: false, note: 'Asked for full payment first.', ts: now - 3 * H },
    ],
  };
}
