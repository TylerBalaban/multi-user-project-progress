'use client';

import Link from 'next/link';
import { useSession } from './SessionProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const { session, loading } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <nav className="bg-gray-800 text-white p-4">Loading...</nav>;
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex space-x-4">
        {session ? (
          <>
           <li>
            <Link href="/projects" className="hover:text-gray-300">Projects</Link>
          </li>
          <li>
            <Link href="/teams" className="hover:text-gray-300">Teams</Link>
          </li>
          <li>
            <button onClick={handleLogout} className="hover:text-gray-300">Logout</button>
          </li>
         
          </>
        ) : (
          <>
            <li><Link href="/" className="hover:text-gray-300">Home</Link></li>
            <li><Link href="/login" className="hover:text-gray-300">Login</Link></li>
            <li><Link href="/register" className="hover:text-gray-300">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}