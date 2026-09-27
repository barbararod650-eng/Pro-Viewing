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
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { number: 1, title: 'Upload ID', icon: FileCheck },
  { number: 2, title: 'Take Selfie', icon: Camera },
  { number: 3, title: 'Verify', icon: ShieldCheck },
];

type ReviewStatus = 'submitting' | 'pending' | 'approved' | 'rejected' | 'error';

export default function VerifyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const { user, setVerified } = useApp();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!user) router.push('/auth');
  }, [user, router]);

  useEffect(() => {
    if (currentStep !== 2 && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 3 && !reviewStatus) {
      submitForReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (reviewStatus !== 'pending' || !user) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/verify/status?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        const status = data.verification?.status;
        if (status === 'approved') {
          setReviewStatus('approved');
          clearInterval(interval);
          setVerified();
          setTimeout(() => router.push('/payment'), 1200);
        } else if (status === 'rejected') {
          setReviewStatus('rejected');
          clearInterval(interval);
        }
      } catch {
        // Keep polling silently; a transient network hiccup shouldn't fail the flow.
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [reviewStatus, user, setVerified, router]);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIdFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(
        "Couldn't access your camera. Check your browser's camera permissions and try again."
      );
    }
  };

  // Attach the camera stream once the <video> element actually exists in the
  // page (it only renders after cameraActive becomes true).
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setSelfieBlob(blob);
          setSelfiePreview(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.9
    );
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const retakeSelfie = () => {
    setSelfieBlob(null);
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(null);
    startCamera();
  };

  const submitForReview = async () => {
    if (!idFile || !selfieBlob || !user) {
      setReviewStatus('error');
      setErrorMessage('Missing your ID or selfie — please go back and try again.');
      return;
    }
    setReviewStatus('submitting');
    try {
      const formData = new FormData();
      formData.append('email', user.email);
      formData.append('name', user.name);
      formData.append('idFile', idFile);
      formData.append('selfieFile', selfieBlob, 'selfie.jpg');

      const res = await fetch('/api/verify/submit', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setReviewStatus('error');
        setErrorMessage(data.error || 'Something went wrong submitting your documents.');
        return;
      }
      setReviewStatus('pending');
    } catch {
      setReviewStatus('error');
      setErrorMessage('Network error — please check your connection and try again.');
    }
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

        <div className="mt-10">
          <AnimatePresence mode="wait">
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
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'mt-6 flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 transition-all',
                    idFile
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50 hover:bg-secondary'
                  )}
                >
                  {idFile ? (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                        <Check className="h-8 w-8 text-accent-foreground" />
                      </div>
                      <p className="font-medium text-accent">{idFile.name}</p>
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
                    disabled={!idFile}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Continue
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

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
                    {selfiePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selfiePreview}
                        alt="Your selfie"
                        className="h-full w-full object-cover"
                      />
                    ) : cameraActive ? (
                      <video
                        ref={videoRef}
                        className="h-full w-full scale-x-[-1] object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                        <Camera className="h-16 w-16 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Camera preview</p>
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  {cameraError && (
                    <p className="mt-3 max-w-xs text-center text-xs text-destructive">
                      {cameraError}
                    </p>
                  )}

                  {selfiePreview ? (
                    <div className="mt-6 flex gap-3">
                      <Button variant="outline" onClick={retakeSelfie}>
                        <Camera className="mr-1.5 h-4 w-4" />
                        Retake
                      </Button>
                      <span className="flex items-center gap-2 text-sm font-medium text-accent">
                        <Check className="h-4 w-4" />
                        Selfie captured
                      </span>
                    </div>
                  ) : cameraActive ? (
                    <Button
                      onClick={captureSelfie}
                      className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capture
                    </Button>
                  ) : (
                    <Button
                      onClick={startCamera}
                      className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Turn on camera
                    </Button>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!selfieBlob}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Continue
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-12 text-center shadow-sm"
              >
                {(reviewStatus === 'submitting' || reviewStatus === 'pending') && (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10"
                    >
                      <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    </motion.div>
                    <h2 className="text-xl font-semibold text-primary">
                      {reviewStatus === 'submitting'
                        ? 'Submitting your documents...'
                        : 'Your verification is under review'}
                    </h2>
                    <p className="mt-2 max-w-sm text-muted-foreground">
                      {reviewStatus === 'submitting'
                        ? 'Uploading your ID and selfie securely.'
                        : "A member of our team is reviewing your ID and selfie. This page will update automatically once it's approved — no need to refresh."}
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Please don't close this window.
                    </div>
                  </>
                )}

                {reviewStatus === 'approved' && (
                  <>
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
                      <Check className="h-10 w-10 text-accent-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-primary">You're verified!</h2>
                    <p className="mt-2 text-muted-foreground">Taking you to payment...</p>
                  </>
                )}

                {reviewStatus === 'rejected' && (
                  <>
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                      <XCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h2 className="text-xl font-semibold text-primary">Verification not approved</h2>
                    <p className="mt-2 max-w-sm text-muted-foreground">
                      We couldn't confirm your identity from the documents provided. Please try again with clearer photos.
                    </p>
                    <Button
                      className="mt-6"
                      onClick={() => {
                        setIdFile(null);
                        setSelfieBlob(null);
                        setSelfiePreview(null);
                        setReviewStatus(null);
                        setCurrentStep(1);
                      }}
                    >
                      Try again
                    </Button>
                  </>
                )}

                {reviewStatus === 'error' && (
                  <>
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                      <XCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h2 className="text-xl font-semibold text-primary">Something went wrong</h2>
                    <p className="mt-2 max-w-sm text-muted-foreground">{errorMessage}</p>
                    <Button className="mt-6" onClick={submitForReview}>
                      Try again
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}