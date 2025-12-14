'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaPlay } from 'react-icons/fa';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-95">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand - Netflix style */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <span className="text-[#e50914] text-3xl font-black tracking-tighter">MOVIELENS</span>
          </Link>

          {/* Navigation Links - Netflix style */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-white font-bold' 
                  : 'text-gray-300 hover:text-gray-100'
              }`}
            >
              Explore
            </Link>

            <Link
              href="/create"
              className={`flex items-center space-x-2 px-4 py-2 rounded bg-[#e50914] hover:bg-[#f40612] transition-colors ${
                isActive('/create') ? 'font-bold' : ''
              }`}
            >
              <FaPlay className="text-xs" />
              <span className="text-sm font-semibold">Try It</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
