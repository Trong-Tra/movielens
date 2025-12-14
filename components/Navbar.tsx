'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaFilm, FaCompass, FaRocket } from 'react-icons/fa';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold hover:opacity-80 transition-opacity">
            <FaFilm className="text-2xl" />
            <span>MovieLens Recommender</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isActive('/') 
                  ? 'bg-white bg-opacity-20 font-semibold' 
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <FaCompass />
              <span>Explore</span>
            </Link>

            <Link
              href="/create"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isActive('/create') 
                  ? 'bg-white bg-opacity-20 font-semibold' 
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <FaRocket />
              <span>Try It Yourself</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
