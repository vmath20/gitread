import Link from 'next/link';

export default function BackToHome() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Link 
        href="/" 
        className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-full shadow-sm hover:shadow-md transition-all duration-300"
      >
        <span className="text-purple-600 dark:text-purple-400 font-medium">← Back to Home</span>
      </Link>
    </div>
  );
} 