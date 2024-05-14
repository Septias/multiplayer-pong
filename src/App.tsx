import { createSignal, type Component } from 'solid-js';

const App: Component = () => {
  const [player1, setPlayer1] = createSignal<string>('sebi');
  const [player2, setPlayer2] = createSignal<string>('holgi');

  return (
    <div class="custom-grid h-screen">
      <div class="flex flex-col items-stretch gap-3 p-4 max-h-screen">
        <p class="player"> Player 1: { player1() }</p>
        <div style="aspect-ratio: 0.6" class="bg-slate-900 w-full rounded">
        </div> 
        <p class="player"> Player 1: {player2()}</p>
      </div>
    </div>
  );
};

export default App;

