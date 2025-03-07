import Chat from '../components/Chat';
import Navigation from '../components/Navigation';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Chat />
    </main>
  );
}
