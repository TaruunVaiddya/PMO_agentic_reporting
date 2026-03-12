"use client"

import Image from 'next/image'

export default function Topbar() {
  return (
    <div className="bg-white w-full h-12 flex items-center px-4 shadow-md">
      <div className="flex items-center gap-2">
        <Image
          src="/SDZlogomark1.svg"
          alt="StrategyDotZero Logo"
          width={28}
          height={28}
          priority
        />
        <span className="font-bold text-[#1a2456] text-lg">StrategyDotZero</span>
      </div>
    </div>
  )
}
