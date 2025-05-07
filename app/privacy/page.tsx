import BackToHome from '../components/BackToHome';

export default function PrivacyPage() {
  return (
    <>
      <BackToHome />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-gray-900 dark:text-white">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 italic">Last Updated: April 24, 2025</p>
          
          <p>This Privacy Policy explains how Koyal Labs, LLC ("Koyal Labs", "we", "our", "us") collects, uses, shares, and protects user ("you," "your") Personal Information when you the GitRead desktop application and related services (collectively, the "Services"). "Personal Information" refers to any data that identifies, relates to, describes, or can reasonably be associated with or linked—either directly or indirectly—to a specific individual or household.</p>
          
          <p>By using the Service, you consent to the practices described in this Privacy Policy.</p>

          <h2>1. Personal Information We Collect</h2>
          <p>Depending on how you interact with our Services, we may collect the following information:</p>
          <ul>
            <li>Personal identifiers and contact information, such as your name, email address, phone number, and any other information you submit through our Services.</li>
            <li>Account information used to create your online account (e.g., username and password).</li>
            <li>Communications between you and us. When you communicate with us, we may collect and save a record of your communication and any Personal Information provided during the communication.</li>
            <li>Repository data includes code, metadata, README files, descriptions, and any other information that is provided by GitHub.</li>
            <li>Billing and financial information when you purchase our Services (e.g., billing contact name, billing address, payment details including credit card information, payment status, subscription plan, and your purchase history).</li>
          </ul>

          <h2>2. How We Use Personal Information</h2>
          <p>We use your Personal Information to:</p>
          <ul>
            <li>Authenticate and manage your account</li>
            <li>Generate README files based on submitted GitHub repositories</li>
            <li>Improve the quality, accuracy, and performance of our models</li>
            <li>Respond to support requests and debug technical issues</li>
            <li>Analyze aggregated usage metrics to improve the Services</li>
            <li>Comply with legal obligations</li>
            <li>Communicate with you about updates, offers, and service-related notices</li>
            <li>Perform analytics to better understand user behavior and preferences</li>
            <li>Ensure the security and integrity of our systems and infrastructure</li>
            <li>Provide, maintain, and enhance the overall functionality of the Service</li>
          </ul>

          <h2>3. Disclosure of Personal Information</h2>
          <h3>3.1 Service Providers</h3>
          <p>We may share your Personal Information with trusted third-party service providers that help us operate, improve, and deliver our services. These include providers of hosting and database infrastructure, authentication and user management, API and model services, code repository integration, customer support, payment processing, and analytics. These service providers are bound by contractual obligations to use your Personal Information solely to provide services on our behalf and in accordance with our instructions.</p>

          <h3>3.2 Business Transfers</h3>
          <p>In the event of a corporate transaction such as a merger, acquisition, financing, reorganization, bankruptcy, or sale of assets, your Personal Information may be disclosed or transferred as part of that transaction. We will notify you of any change in ownership or control that affects your Personal Information.</p>

          <h3>3.3 Legal Requirements</h3>
          <p>We may disclose your Personal Information if required to do so by law or in response to valid legal requests from public authorities (e.g., courts, regulatory agencies, or law enforcement). We may also disclose information when we believe in good faith that such disclosure is necessary to:</p>
          <ul>
            <li>Comply with a legal obligation</li>
            <li>Protect and enforce our legal rights or property</li>
            <li>Investigate or prevent suspected fraud, abuse, or other unlawful activity related to the Services</li>
            <li>Safeguard the personal safety of users or the public</li>
            <li>Protect ourselves from legal liability</li>
          </ul>

          <h2>5. Personal Information Security</h2>
          <p>We implement technical and organizational safeguards to protect your Personal Information. However, no system is completely secure, and we cannot guarantee absolute data security.</p>

          <h2>6. Your Privacy Rights</h2>
          <p>Depending on your location, you may have rights to:</p>
          <ul>
            <li>Access, correct, or delete your personal data</li>
            <li>Request export of your data</li>
            <li>Opt out of data collection (where applicable)</li>
          </ul>

          <h2>7. Privacy Rights for California Residents</h2>
          <p>If you are a California resident, the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA) grant you the right to:</p>
          <ul>
            <li>Know what personal information we collect, use, and share</li>
            <li>Request the deletion of your personal information</li>
            <li>Opt out of the sale of your personal information</li>
            <li>Non-discrimination for exercising your privacy rights</li>
          </ul>

          <p>Categories of personal information we may collect:</p>
          <ul>
            <li>Identifiers (name, email, GitHub ID)</li>
            <li>Commercial information (transaction history, subscriptions)</li>
            <li>Internet activity (IP address, device/browser metadata)</li>
            <li>Inferences (preferences based on usage behavior)</li>
          </ul>

          <p>You may submit a verifiable consumer request by:</p>
          <p>Emailing <a href="mailto:koyalhq@gmail.com" className="text-purple-600 hover:text-purple-700 transition-colors">koyalhq@gmail.com</a> with the subject line "CCPA Request"</p>

          <p>We do not sell your Personal Information as defined under the CCPA/CPRA.</p>

          <h2>8. Privacy Rights for European Users</h2>
          <p>If you are located in the European Economic Area (EEA), the United Kingdom, or Switzerland, you have the following rights under the General Data Protection Regulation (GDPR):</p>
          <ul>
            <li>Right of Access: You can request access to your personal data.</li>
            <li>Right to Rectification: You can request correction of inaccurate or incomplete data.</li>
            <li>Right to Erasure (Right to be Forgotten): You can request deletion of your data under certain conditions.</li>
            <li>Right to Restrict Processing: You can request we limit the way we use your data.</li>
            <li>Right to Data Portability: You can request a copy of your data in a machine-readable format.</li>
            <li>Right to Object: You can object to our use of your data for direct marketing or other purposes.</li>
            <li>Right to Withdraw Consent: Where processing is based on consent, you can withdraw it at any time.</li>
          </ul>

          <p>We process your personal data under the following lawful bases:</p>
          <ul>
            <li>Consent (e.g., to use your GitHub account or generate README content)</li>
            <li>Contract (e.g., to deliver services you request)</li>
            <li>Legitimate Interest (e.g., to maintain security, analyze usage trends)</li>
            <li>Legal Obligation (e.g., for tax or compliance reporting)</li>
          </ul>

          <p>To exercise your rights, email <a href="mailto:koyalhq@gmail.com" className="text-purple-600 hover:text-purple-700 transition-colors">koyalhq@gmail.com</a> with the subject line "GDPR Request".</p>

          <h2>8. Data Transfer for Users Outside the United States</h2>
          <p>If you are located outside the United States and choose to use our Services, you acknowledge and agree that your data may be processed and stored in the United States or other jurisdictions where we or our third-party service providers operate.</p>

          <h2>9. Data Retention</h2>
          <p>We retain your Personal Information only for as long as necessary to fulfill the purposes for which it was collected, including to meet any legal, accounting, or reporting obligations.</p>

          <h2>10. Children's Privacy</h2>
          <p>Our Services are not intended for use by children under the age of 13, and we do not knowingly collect Personal Information from children under 13.</p>

          <h2>12. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time in response to changing legal, technical, or business developments. The date at the top of this Privacy Policy indicates when it was last updated. We encourage you to periodically review this Privacy Policy to stay informed about how we are protecting your Personal Information.</p>

          <h2>13. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, reach out to us at:</p>
          <p>Koyal Labs, LLC<br />
          Email: <a href="mailto:koyalhq@gmail.com" className="text-purple-600 hover:text-purple-700 transition-colors">koyalhq@gmail.com</a></p>
        </div>
      </div>
    </>
  );
} 