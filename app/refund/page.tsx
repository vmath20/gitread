import BackToHome from '../components/BackToHome';

export default function RefundPage() {
  return (
    <>
      <BackToHome />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-gray-900 dark:text-white">Refund Policy</h1>
        <div className="prose dark:prose-invert max-w-none">
          <h2>1. Refund Reasons</h2>
          <p>Refunds will not be issued once the service has been delivered, regardless of the quality of the generated README files or whether they meet your specific expectations or requirements.</p>
          
          <h2>2. Technical Issues</h2>
          <p>If you encounter any issues with failed README generations, please contact our customer support team at <a href="mailto:koyalhq@gmail.com" className="text-purple-600 hover:text-purple-700 transition-colors">koyalhq@gmail.com</a>. Include your account details and a description of the technical issue. We'll restore any lost credits to your account, though monetary refunds are not issued for failed generations.</p>
          
          <h2>3. Processing Time</h2>
          <p>We typically respond to support queries within 5-7 business days.</p>
        </div>
      </div>
    </>
  );
} 