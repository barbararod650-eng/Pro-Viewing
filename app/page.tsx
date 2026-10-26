'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface PropertySummary {
  id: string;
  name: string;
  address: string;
  price: number;
  currency: string;
  beds: number;
  baths: number;
  sqft: number;
  image_url: string | null;
  verified: boolean;
}

export default function HomePage() {
  const [properties, setProperties] = useState<PropertySummary[] | 'loading' | 'error'>('loading');

  const loadProperties = useCallback(() => {
    setProperties('loading');
    fetch('/api/properties')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Request failed');
        setProperties(data.properties || []);
      })
      // A failed load must not look like "no listings": show a retry instead.
      .catch(() => setProperties('error'));
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <Badge variant="secondary" className="mx-auto mb-4 gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Verified Listings
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            Find your next home
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Every listing is reviewed by our team before it's published, so you can book a
            viewing with confidence.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {properties === 'loading' && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {properties === 'error' && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">
              We couldn't load the listings just now. Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={loadProperties}
              className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
            >
              Try again
            </button>
          </div>
        )}

        {Array.isArray(properties) && properties.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No listings are available right now — check back soon.
          </p>
        )}

        {Array.isArray(properties) && properties.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, i) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link
                  href={`/property/${property.id}`}
                  className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative h-48 overflow-hidden bg-secondary">
                    {property.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={property.image_url}
                        alt={property.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {property.verified && (
                      <div className="absolute left-3 top-3">
                        <Badge className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-primary">{property.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {property.address}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Bed className="h-4 w-4" /> {property.beds}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4" /> {property.baths}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize className="h-4 w-4" /> {property.sqft.toLocaleString()} sqft
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-primary">
                        {formatMoney(property.price, property.currency)}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
