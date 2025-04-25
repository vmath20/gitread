import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <div className="fixed top-4 left-4 z-50">
      <Link href="/" className="block">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <Image
            src="/GitReadLogo.jpeg"
            alt="GitRead Logo"
            width={64}
            height={64}
            className="rounded-lg"
          />
        </div>
      </Link>
    </div>
  );
} 