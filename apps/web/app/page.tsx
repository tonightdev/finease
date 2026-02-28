"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Target, BrainCircuit, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32 lg:pb-40 flex-grow">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-background-dark dark:via-[#111827] dark:to-[#0f172a]"></div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[500px] w-[500px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Now available in India
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl lg:leading-tight">
                Financial Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Center</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0">
                Comprehensive wealth management and goal tracking tailored for the modern Indian investor. Track your INR assets, investments, and expenses in one secure place.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href="/signup" 
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 dark:border-border-dark dark:bg-surface-dark dark:text-white dark:hover:bg-border-dark dark:focus:ring-offset-background-dark"
                >
                  Log in
                </Link>
              </div>

              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>

            <div className="relative mt-16 lg:col-span-6 lg:mt-0">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary to-emerald-500 rounded-2xl opacity-20 blur-lg"></div>
              <div className="relative rounded-2xl border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-2xl overflow-hidden aspect-[4/3] group flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 right-0 h-8 bg-gray-100 dark:bg-[#1f232b] border-b border-gray-200 dark:border-border-dark flex items-center px-4 gap-2">
                  <div className="size-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="size-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                  <div className="size-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                </div>
                
                {/* Mock dashboard visual */}
                <div className="mt-8 p-6 flex-grow flex flex-col justify-center items-center h-full w-full opacity-60 dark:opacity-40">
                  <div className="text-primary opacity-50 mb-4">
                     <span className="material-symbols-outlined !text-[80px]">monitoring</span>
                  </div>
                  <div className="text-xl font-bold">Interactive Dashboard</div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border border-gray-200 dark:border-border-dark rounded-xl shadow-xl transform transition-transform group-hover:-translate-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Balance</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ArrowRight className="w-3 h-3 mr-1 -rotate-45" /> +12.5%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-3">₹ 24,50,000</div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-emerald-400 w-3/4"></div>
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                    <span>Monthly Goal</span>
                    <span>75% Achieved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-[#0b0d11]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Why Choose FinEase?
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Designed specifically for the nuances of the Indian financial ecosystem, giving you control over your future.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all hover:shadow-lg dark:border-border-dark dark:bg-surface-dark dark:hover:border-primary/50">
              <div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Goal Tracking</h3>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Set specific financial milestones like buying a home or retirement. We calculate the monthly SIP needed to get you there.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all hover:shadow-lg dark:border-border-dark dark:bg-surface-dark dark:hover:border-primary/50">
              <div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Smart Insights</h3>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                AI-driven analysis of your spending habits. Get personalized recommendations to save tax and optimize investments.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all hover:shadow-lg dark:border-border-dark dark:bg-surface-dark dark:hover:border-primary/50">
              <div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure & Private</h3>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Bank-grade 256-bit encryption. Your financial data is encrypted locally and never sold to third-party advertisers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 dark:bg-surface-dark"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="mx-auto max-w-4xl relative text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl mb-6">
            Ready to master your finances?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of Indian investors who are taking control of their wealth with FinEase. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:bg-background-dark dark:border-border-dark">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-primary text-white text-xs">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">FinEase</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <a className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary" href="#">Privacy Policy</a>
              <a className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary" href="#">Terms of Service</a>
              <a className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary" href="#">Contact Us</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-500">
             © {new Date().getFullYear()} FinEase. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
