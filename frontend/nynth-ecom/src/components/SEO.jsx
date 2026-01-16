import React from "react";
import { Helmet } from "react-helmet-async";

export default function SEO({
    title = "NYNTH - Premium Streetwear",
    description = "Minimal streetwear built with craftsmanship. Limited drops. Premium materials.",
    image = "/og-image.jpg",
    type = "website",
    url,
    structuredData
}) {
    const siteUrl = import.meta.env.VITE_SITE_URL || "http://localhost:5173";
    const siteName = import.meta.env.VITE_SITE_NAME || "NYNTH";
    const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
    const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{title}</title>
            <meta name="title" content={title} />
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={fullUrl} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={fullImage} />

            {/* Additional SEO Tags */}
            <link rel="canonical" href={fullUrl} />

            {/* Structured Data (JSON-LD) */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
}
