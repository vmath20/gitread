import BackToHome from '../components/BackToHome';

export default function SupportPage() {
  return (
    <>
      <BackToHome />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center">Support</h1>
        <div className="prose dark:prose-invert max-w-none">
          <h2>Contact Us</h2>
          <p>Contact our customer service team at <a href="mailto:koyalhq@gmail.com" className="text-purple-600 hover:text-purple-700 transition-colors">koyalhq@gmail.com</a>.</p>
        </div>
      </div>
    </>
  );
} 