import GameCanvas from '@/components/GameCanvas';

export default function Home() {
  return (
    <main className="w-full h-screen bg-black">
      <GameCanvas />
      <div className="absolute top-4 left-4 text-white text-sm font-mono pointer-events-none">
        <p>Click to lock pointer</p>
        <p>WASD to move | Shift to run</p>
        <p>C to open character sheet</p>
      </div>
    </main>
  );
}



