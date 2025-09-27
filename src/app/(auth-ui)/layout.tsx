"use client"
import ff from "@image/test.jpeg"
import Image from "next/image"

export default function AuthLayout({children}: {children: React.ReactNode}) {

  return (
    <div className={`min-h-screen dark bg-background flex relative overflow-hidden`}>
      <Image src={ff} alt='img' className="absolute w-[100%] h-full opacity-10 blur-sm" />
      <div className="w-full h-full bg-gradient-to-r from-transparent to-black absolute"></div>

      {/* Left Side - Application Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative z-20">
        <div className={`w-full metallic-bg flex flex-col justify-center items-center p-12 text-center relative overflow-hidden`}>
        <div className="absolute inset-0 dotted-pattern opacity-15"></div>
          <div className="relative z-10 max-w-lg">
            {/* Logo/Icon */}
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-t from-white/10 to-black border border-border/90 flex items-center justify-center backdrop-blur-sm shadow-2xl">
                <svg className="w-10 h-10 icon-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl font-bold text-accent-foreground/80 brightness-110 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white/20  via-accent-foreground/80 to-white/20 bg-clip-text text-transparent font-extrabold brightness-125 contrast-110">
                Transform Your Data Into
            </span>
              <br />
              <span className="bg-gradient-to-r from-white/20  via-accent-foreground/80 to-white/20  bg-clip-text text-transparent font-extrabold brightness-125 contrast-110">
                Intelligent Reports
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg mb-12 leading-relaxed font-medium text-silver " >
              AI-powered report generation from your Excel and PDF data. 
              Ask questions, get insights, create professional reports.
            </p>

            {/* Trust Badge */}
            <div className="mt-8 text-center p-2 flex justify-center">
              <div className="bg-black w-fit p-1 rounded-full">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-t from-white/10 to-black backdrop-blur-sm border border-accent-foreground/30 rounded-full px-4 py-2 text-sm text-primary-foreground/90 brightness-110 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" ></div>
                  <svg className="w-4 h-4 text-accent-foreground brightness-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium text-accent-foreground/80 relative z-10">Enterprise Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Input Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 z-20">
      {children}
      </div>
    </div>
  )
}


