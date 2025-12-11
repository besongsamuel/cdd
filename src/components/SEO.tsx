import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { CHURCH_ADDRESS, SOCIAL_MEDIA_LINKS } from '../utils/constants';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  structuredData?: object;
}

export const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  structuredData,
}: SEOProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const alternateLang = currentLang === 'en' ? 'fr' : 'en';
  
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const defaultTitle = currentLang === 'en' 
    ? 'City of David - A Bilingual Christian Church in Montreal'
    : 'Cité de David - Une Église Chrétienne Bilingue à Montréal';
  const defaultDescription = currentLang === 'en'
    ? 'A bilingual Christian church in Montreal, founded in 2004 by Pastors Mireille and John BISOKA. Join us for worship, prayer, and community.'
    : 'Une église chrétienne bilingue située à Montréal, fondée en 2004 par les Pasteurs Mireille et John BISOKA. Rejoignez-nous pour l\'adoration, la prière et la communauté.';
  const defaultImage = image || `${siteUrl}/og-image.jpg`;
  const defaultKeywords = keywords || (currentLang === 'en'
    ? 'City of David, church, Montreal, Christian, bilingual, worship, prayer, community'
    : 'Cité de David, église, Montréal, chrétien, bilingue, adoration, prière, communauté');

  const pageTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const pageDescription = description || defaultDescription;

  // Default structured data for Organization
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: defaultTitle,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CHURCH_ADDRESS.split(',')[0],
      addressLocality: 'Montreal',
      addressRegion: 'Quebec',
      postalCode: 'H2G 2X2',
      addressCountry: 'CA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-514-712-2927',
      contactType: 'Customer Service',
    },
    sameAs: [
      SOCIAL_MEDIA_LINKS.facebook,
      SOCIAL_MEDIA_LINKS.instagram,
      SOCIAL_MEDIA_LINKS.youtube,
    ],
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={currentLang} />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={defaultKeywords} />
      <link rel="canonical" href={fullUrl} />

      {/* Language Alternates */}
      <link rel="alternate" hrefLang={currentLang} href={fullUrl} />
      <link rel="alternate" hrefLang={alternateLang} href={`${siteUrl}${url || ''}?lang=${alternateLang}`} />
      <link rel="alternate" hrefLang="x-default" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={defaultImage} />
      <meta property="og:locale" content={currentLang === 'en' ? 'en_CA' : 'fr_CA'} />
      <meta property="og:locale:alternate" content={currentLang === 'en' ? 'fr_CA' : 'en_CA'} />
      <meta property="og:site_name" content={defaultTitle} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={defaultImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};

