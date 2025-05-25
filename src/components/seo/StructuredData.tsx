import React from 'react';

interface OrganizationStructuredDataProps {
  url: string;
  logo: string;
  name: string;
}

export const OrganizationStructuredData: React.FC<OrganizationStructuredDataProps> = ({
  url,
  logo,
  name,
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

interface WebsiteStructuredDataProps {
  url: string;
  name: string;
}

export const WebsiteStructuredData: React.FC<WebsiteStructuredDataProps> = ({ url, name }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url,
    name,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

interface ProductStructuredDataProps {
  name: string;
  image: string;
  description: string;
  sku: string;
  brand: string;
  price: number;
  priceCurrency: string;
  availability: string;
  url: string;
  reviewCount?: number;
  ratingValue?: number;
}

export const ProductStructuredData: React.FC<ProductStructuredDataProps> = ({
  name,
  image,
  description,
  sku,
  brand,
  price,
  priceCurrency,
  availability,
  url,
  reviewCount,
  ratingValue,
}) => {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image,
    description,
    sku,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      availability: `https://schema.org/${availability}`,
      url,
    },
  };

  // Add aggregate rating if review data is provided
  if (reviewCount && ratingValue) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    item: string;
  }>;
}

export const BreadcrumbStructuredData: React.FC<BreadcrumbStructuredDataProps> = ({ items }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
