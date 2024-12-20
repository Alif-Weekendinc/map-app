/* eslint-disable @next/next/no-sync-scripts */
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <link
          rel='stylesheet'
          href='https://unpkg.com/leaflet@1.2.0/dist/leaflet.css'
        />
        <link
          rel='stylesheet'
          href='https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css'
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
