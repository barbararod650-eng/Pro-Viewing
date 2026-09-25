'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Camera,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileCheck,
  UserCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { number: 1, title: 'Upload ID', icon: FileCheck },
  { number: 2, title: 'Take Selfie', icon: Camera },
  { number: 3, title: 'Verify', icon: ShieldCheck },
];

export default function VerifyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieTaken, setSelfieTaken] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { user, booking, setVerified } = useApp();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentStep === 3 && !verifying) {
      setVerifying(true);
      const timer = setTimeout(() => {
        setVerified();
        router.push('/payment');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, verifying, setVerified, router]);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIdUploaded(true);
    }
  };

  const handleSelfie = () => {
    setSelfieTaken(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Identity Verification</h1>
          <p className="mt-2 text-muted-foreground">
            Complete the steps below to verify your identity before your viewing.
          </p>
        </div>

        {user && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <UserCheck className="h-4 w-4 text-accent" />
            Signed in as {user.email}
          </div>
        )}

        {/* Step indicator */}
        <div className="mt-10 flex items-center justify-center gap-2 sm:gap-4">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all duration-300',
                    currentStep > step.number
                      ? 'border-accent bg-accent text-accent-foreground'
                      : currentStep === step.number
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground'
                  )}
                >
                  {currentStep > step.number ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-8 sm:w-16',
                    currentStep > step.number ? 'bg-accent' : 'bg-border'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="mt-10">
          <AnimatePresence mode="wait">
            {/* Step 1: Upload ID */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-border bg-card p-8 shadow-sm"
              >
                <h2 className="text-xl font-semibold text-primary">Upload your ID</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a clear photo of your government-issued ID (driver's license, passport, or state ID).
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'mt-6 flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 transition-all',
                    idUploaded
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50 hover:bg-secondary'
                  )}
                >
                  {idUploaded ? (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                        <Check className="h-8 w-8 text-accent-foreground" />
                      </div>
                      <p className="font-medium text-accent">ID uploaded successfully</p>
                      <p className="text-xs text-muted-foreground">Click to upload a different file</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-primary">Click to upload your ID</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, or PDF — max 10MB</p>
                    </>
                  )}
                </button>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="ghost" disabled>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!idUploaded}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Continue
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Take Selfie */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-border bg-card p-8 shadow-sm"
              >
                <h2 className="text-xl font-semibold text-primary">Take a selfie</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll use your selfie to match it against your ID. Make sure you're in a well-lit area.
                </p>

                <div className="mt-6 flex flex-col items-center">
                  <div className="relative h-56 w-56 overflow-hidden rounded-full border-4 border-border bg-secondary">
                    {selfieTaken ? (
                      <div className="flex h-full w-full items-center justify-center bg-accent/10">
                        <Check className="h-20 w-20 text-accent" />
                      </div>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                        <Camera className="h-16 w-16 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Camera preview</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSelfie}
                    disabled={selfieTaken}
                    className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {selfieTaken ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Selfie captured
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Capture Selfie
                      </span>
                    )}
                  </Button>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!selfieTaken}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Continue
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Verification in progress */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-12 text-center shadow-sm"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-accent" />
                </motion.div>
                <h2 className="text-xl font-semibold text-primary">Verification in progress</h2>
                <p className="mt-2 max-w-sm text-muted-foreground">
                  We're comparing your ID and selfie. This usually takes a few seconds.
                </p>

                <div className="mt-8 w-full max-w-xs space-y-3">
                  {[
                    { label: 'ID document check', done: true },
                    { label: 'Facial match', done: true },
                    { label: 'Liveness detection', done: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-left">
                      {item.done ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                          <Check className="h-3.5 w-3.5 text-accent-foreground" />
                        </div>
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                      <span className={cn('text-sm', item.done ? 'text-primary' : 'text-muted-foreground')}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Please don't close this window.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
