import GameCanvas from '@/components/GameCanvas';

export default function Home() {
  return (
    <main className="w-full h-screen bg-black">
      <GameCanvas />
      <div className="absolute top-4 left-4 bg-red-theme/90 border-2 border-border-dark rounded p-4 text-text-cream font-medieval text-sm z-10 pointer-events-auto max-w-[280px] leading-relaxed" style={{
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px #ffebc6'
      }}>
        <div className="mb-2 font-semibold text-base" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>Controls</div>
        <p className="mb-1" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>Shift to run</p>
        <p className="mb-1" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>Space to jump | Shift+Space to dodge</p>
        <p className="mb-1" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>Right-click to aim/zoom</p>
        <p className="mb-1" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>C - Character sheet</p>
        <p className="mb-1" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>Tab - Console</p>
        <p style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>Ctrl/Cmd+L - Save logs</p>
      </div>
    </main>
  );
}



