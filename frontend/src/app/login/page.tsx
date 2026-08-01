'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Lock, Mail, Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';
import Logo from '../../components/common/Logo';

const loginSchema = zod.object({
  email: zod.string().email({ message: 'Enter a valid corporate email address' }),
  password: zod.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: zod.boolean().optional(),
});

type LoginFormInput = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'compliance@tetra.com',
      password: 'password123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormInput) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    
    // Simulate API call authentication
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // Route to dashboard
      router.push('/dashboard');
    } catch {
      setErrorMsg('Invalid compliance credentials. Please check and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Grids are handled by global layout */}
      
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Greeting */}
        <div className="flex flex-col items-center justify-center text-center">
          <Logo className="mb-6 scale-110" />
          <h2 className="text-xl font-bold tracking-tight text-slate-800">
            Compliance Security Portal
          </h2>
          <p className="mt-1.5 text-xs font-medium text-slate-400">
            Enter your credentials to access the invoice risk scan telemetry.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-8 shadow-xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 font-medium">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs outline-none transition-all duration-200 ${
                    errors.email 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20' 
                      : 'border-slate-200 focus:border-[#3E0856] focus:ring-1 focus:ring-[#3E0856] bg-slate-50/50 focus:bg-white'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] font-semibold text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Security Password
                </label>
                <a href="#" className="text-[10px] font-bold text-[#3E0856] hover:text-[#FAAE62] hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-xs outline-none transition-all duration-200 ${
                    errors.password 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20' 
                      : 'border-slate-200 focus:border-[#3E0856] focus:ring-1 focus:ring-[#3E0856] bg-slate-50/50 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] font-semibold text-rose-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between py-1">
              <label className="relative flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 rounded border-slate-200 text-[#3E0856] focus:ring-[#3E0856]"
                />
                <span className="text-[11px] font-semibold text-slate-500">Remember credentials</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E0856] py-3 text-xs font-bold text-white shadow-md hover:bg-[#3E0856]/90 focus:outline-none focus:ring-2 focus:ring-[#3E0856] focus:ring-offset-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#FAAE62]" />
                  <span>Authorize & Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] font-semibold text-slate-400">
          SECURE WORKSTATION CONSOLE • ISO 27001 AUDITED
        </p>
      </div>
    </div>
  );
}
