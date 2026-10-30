'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Public-site analytics only. Admin traffic is intentionally excluded so
// internal operator activity does not contaminate customer acquisition data.
export function Analytics() {
  const pathname = usePathname();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId || pathname?.startsWith('/admin')) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          try {
            if (localStorage.getItem('afaq-cookies') === 'true') {
              gtag('consent', 'update', {
                analytics_storage: 'granted',
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted'
              });
            }
          } catch (e) {}
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: true });`}
      </Script>
    </>
  );
}
