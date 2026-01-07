import GameCanvas from '@/components/GameCanvas';

export default function Home() {
  return (
    <main className="w-full h-screen bg-black">
      <GameCanvas />
      <div className="absolute top-4 left-4 bg-red-theme/90 border-2 border-border-dark rounded p-4 text-text-cream font-medieval text-sm z-10 pointer-events-auto max-w-[250px] leading-relaxed" style={{
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px #ffebc6'
      }}>
        <p className="mb-1" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>Click to lock pointer</p>
        <p className="mb-1" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>WASD to move | Shift to run</p>
        <p style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>C to open character sheet</p>
      </div>
    </main>
  );
}



