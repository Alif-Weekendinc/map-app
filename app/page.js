import dynamic from 'next/dynamic';
const MapLeaf = dynamic(() => import('./components/map/map.jsx'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between'>
      <MapLeaf />
    </main>
  );
}
