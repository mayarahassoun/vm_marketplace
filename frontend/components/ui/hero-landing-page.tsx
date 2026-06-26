'use client'

export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,132,255,0.18)] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-bl from-[rgba(0,132,255,0.12)] via-transparent to-transparent" />
      </div>

      {/* Video background — fixed, always covers the full window */}
      <video
        className="fixed inset-0 w-full h-full object-cover z-0 opacity-40"
        autoPlay
        muted
        loop
        playsInline
      >
        <source
          src="https://mybycketvercelprojecttest.s3.sa-east-1.amazonaws.com/animation-bg.mp4"
          type="video/mp4"
        />
      </video>

      {/* Page content sits above the video */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  )
}
