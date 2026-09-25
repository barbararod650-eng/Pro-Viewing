'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScheduleModal } from '@/components/schedule-modal';
import { PROPERTY } from '@/lib/property';
import { useApp } from '@/lib/app-context';
import {
  Bed,
  Bath,
  Maximize,
  ShieldCheck,
  Lock,
  Calendar,
  MapPin,
  Check,
  ArrowRight,
  Star,
  Sparkles,
} from 'lucide-react';

const featureIcons = [
  Bed,
  Bath,
  Maximize,
];

export default function LandingPage() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { booking } = useApp();

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Available Now
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
                {PROPERTY.name}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 text-accent" />
                <span className="text-base">{PROPERTY.address}</span>
              </div>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                {PROPERTY.description}
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setScheduleOpen(true)}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule Viewing
                </Button>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">${PROPERTY.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              {booking.status !== 'idle' && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                  <Check className="h-4 w-4" />
                  You have a viewing scheduled for{' '}
                  {booking.date ? new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}{' '}
                  at {booking.timeSlot}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-xl shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PROPERTY.imageUrl}
                  alt={PROPERTY.name}
                  className="h-[300px] w-full object-cover sm:h-[400px] lg:h-[500px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              </div>
              <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card p-4 shadow-lg sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">Verified Access</p>
                    <p className="text-xs text-muted-foreground">Identity-protected viewing</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:gap-8">
          {[
            { icon: Bed, label: 'Bedrooms', value: PROPERTY.beds },
            { icon: Bath, label: 'Bathrooms', value: PROPERTY.baths },
            { icon: Maximize, label: 'Square Feet', value: PROPERTY.sqft.toLocaleString() },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <stat.icon className="h-6 w-6 text-accent" />
              <div>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Amenities */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Property Amenities</h2>
          <p className="mt-2 text-muted-foreground">Everything you need for comfortable living</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROPERTY.amenities.map((amenity, i) => (
            <motion.div
              key={amenity}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Check className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm font-medium text-primary">{amenity}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Gallery</h2>
          <p className="mt-2 text-muted-foreground">Take a look inside the property</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PROPERTY.galleryImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-xl border border-border shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Gallery image ${i + 1}`}
                className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-64"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-secondary/50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary">How It Works</h2>
            <p className="mt-2 text-muted-foreground">Secure access in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: Calendar, title: '1. Schedule', desc: 'Pick a date and time for your property viewing.' },
              { icon: ShieldCheck, title: '2. Verify & Pay', desc: 'Confirm your identity and pay the $25 inspection fee.' },
              { icon: Lock, title: '3. Access', desc: 'Get your time-gated access code revealed only during the viewing window.' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-accent shadow-lg">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-primary">{step.title}</h3>
                <p className="mt-2 max-w-xs text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-primary p-8 text-center shadow-xl lg:flex-row lg:text-left"
        >
          <div>
            <h2 className="text-2xl font-bold text-primary-foreground lg:text-3xl">
              Ready to see {PROPERTY.name}?
            </h2>
            <p className="mt-2 text-primary-foreground/70">
              Schedule your viewing today and get secure, verified access.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => setScheduleOpen(true)}
          >
            Schedule Viewing
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      <ScheduleModal open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  );
}
