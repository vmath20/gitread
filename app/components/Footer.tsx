import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-4 mt-8 border-t border-gray-300 dark:border-gray-800 bg-[#FBF9F5] dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/refund" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            Refund Policy
          </Link>
          <Link href="/support" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
} 