import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 md:p-10">
          <div className="mb-6">
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              ← Back to home
            </Link>
          </div>

          <h1 className="text-4xl font-bold mb-2 text-slate-900 dark:text-slate-50">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Last Updated: December 2024
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            {/* Agreement to Terms */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Agreement to Terms</h2>
              <p className="text-slate-700 dark:text-slate-300">
                By accessing or using Passage ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
              </p>
            </section>

            {/* Description of Service */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Description of Service</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-2">
                Passage is an AI-powered companion application designed to support users through difficult life transitions. The Service includes:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>AI-powered conversations via text and voice</li>
                <li>Pattern detection and insights</li>
                <li>Memory and tagging features</li>
                <li>Crisis resource information</li>
              </ul>
            </section>

            {/* IMPORTANT DISCLAIMERS */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-red-600 dark:text-red-400">IMPORTANT DISCLAIMERS</h2>
              
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3 text-red-900 dark:text-red-100">Not Medical or Mental Health Treatment</h3>
                  <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
                    PASSAGE IS NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL OR MENTAL HEALTH CARE.
                  </p>
                  <p className="text-red-800 dark:text-red-200 mb-2">The Service:</p>
                  <ul className="list-disc pl-6 space-y-1 text-red-800 dark:text-red-200">
                    <li>Is NOT therapy, counseling, or psychiatric treatment</li>
                    <li>Is NOT provided by licensed healthcare professionals</li>
                    <li>Does NOT diagnose, treat, cure, or prevent any medical or mental health condition</li>
                    <li>Does NOT provide medical advice</li>
                  </ul>
                  <p className="text-red-800 dark:text-red-200 mt-3">
                    The Service is a wellness and self-reflection tool only. If you have a medical or mental health condition, please consult a qualified healthcare provider.
                  </p>
                </div>

                <div className="border-t-2 border-red-300 dark:border-red-700 pt-4">
                  <h3 className="text-xl font-bold mb-3 text-red-900 dark:text-red-100">Not Crisis Intervention</h3>
                  <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
                    PASSAGE IS NOT A CRISIS INTERVENTION SERVICE.
                  </p>
                  <p className="text-red-800 dark:text-red-200 mb-2">If you are experiencing:</p>
                  <ul className="list-disc pl-6 space-y-1 text-red-800 dark:text-red-200">
                    <li>Thoughts of suicide or self-harm</li>
                    <li>A mental health emergency</li>
                    <li>Immediate danger to yourself or others</li>
                  </ul>
                  <p className="text-red-800 dark:text-red-200 mt-3 font-semibold">
                    PLEASE CONTACT EMERGENCY SERVICES (000 in Australia, 911 in US, 999 in UK) OR A CRISIS HELPLINE IMMEDIATELY.
                  </p>
                  <p className="text-red-800 dark:text-red-200 mt-2">
                    While Passage provides access to crisis resources, it is not equipped to handle emergencies and should not be relied upon in crisis situations.
                  </p>
                </div>

                <div className="border-t-2 border-red-300 dark:border-red-700 pt-4">
                  <h3 className="text-xl font-bold mb-3 text-red-900 dark:text-red-100">AI Limitations</h3>
                  <p className="text-red-800 dark:text-red-200 mb-2">
                    Passage uses artificial intelligence to generate responses. AI:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-red-800 dark:text-red-200">
                    <li>Can make mistakes or provide inaccurate information</li>
                    <li>Does not have human judgment or empathy</li>
                    <li>May not understand context or nuance perfectly</li>
                    <li>Should not be solely relied upon for important decisions</li>
                  </ul>
                  <p className="text-red-800 dark:text-red-200 mt-3">
                    Always use your own judgment and seek professional advice when needed.
                  </p>
                </div>
              </div>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Eligibility</h2>
              <p className="text-slate-700 dark:text-slate-300">
                You must be at least 18 years old to use the Service. By using Passage, you represent that you are at least 18 years of age.
              </p>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Account Registration</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-2">To use the Service, you must:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Provide a valid email address</li>
                <li>Create a secure password</li>
                <li>Provide accurate account information</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300 mt-4 mb-2">You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Maintaining the confidentiality of your account</li>
                <li>All activities under your account</li>
                <li>Notifying us immediately of unauthorized access</li>
              </ul>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Acceptable Use</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-2">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Use the Service for any illegal purpose</li>
                <li>Impersonate any person or entity</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Transmit viruses or malicious code</li>
                <li>Harass, abuse, or harm others through the Service</li>
                <li>Use the Service to generate content that is harmful, threatening, or hateful</li>
                <li>Reverse engineer or attempt to extract the source code</li>
                <li>Use the Service in any way that could damage or impair it</li>
                <li>Share your account with others</li>
              </ul>
            </section>

            {/* Subscription and Payments */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Subscription and Payments</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Free Trial</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>New users may receive a free trial period</li>
                <li>Full access to features during the trial</li>
                <li>No credit card required for trial</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Paid Subscription</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>After the trial, continued use requires a paid subscription</li>
                <li>Subscription fees are charged in advance</li>
                <li>Prices are subject to change with notice</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Cancellation</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>You may cancel your subscription at any time</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>No refunds for partial billing periods</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Refunds</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Refunds are provided at our discretion</li>
                <li>Contact us if you believe you are entitled to a refund</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Our Property</h3>
              <p className="text-slate-700 dark:text-slate-300">
                The Service, including its design, features, content, and code, is owned by Passage and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our permission.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Your Content</h3>
              <p className="text-slate-700 dark:text-slate-300">
                You retain ownership of the content you create (conversations, notes, etc.). By using the Service, you grant us a limited license to process, store, and analyze your content solely to provide the Service.
              </p>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Privacy</h2>
              <p className="text-slate-700 dark:text-slate-300">
                Your use of the Service is also governed by our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 underline">Privacy Policy</Link>, which is incorporated into these Terms by reference. Please review our Privacy Policy at passage.support/privacy.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Limitation of Liability</h2>
              <div className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-6 space-y-4">
                <p className="text-slate-800 dark:text-slate-200 font-semibold">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                
                <p className="text-slate-700 dark:text-slate-300">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>

                <p className="text-slate-700 dark:text-slate-300">WE DO NOT WARRANT THAT:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                  <li>The Service will be uninterrupted or error-free</li>
                  <li>The Service will meet your specific needs</li>
                  <li>Any content or insights will be accurate or reliable</li>
                </ul>

                <p className="text-slate-700 dark:text-slate-300">IN NO EVENT SHALL PASSAGE, ITS OWNERS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Any loss of profits, data, or goodwill</li>
                  <li>Any damages arising from your use of or inability to use the Service</li>
                  <li>Any damages arising from actions taken or not taken based on the Service</li>
                </ul>

                <p className="text-slate-700 dark:text-slate-300 font-semibold">
                  OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>

                <p className="text-slate-600 dark:text-slate-400 text-sm italic">
                  Some jurisdictions do not allow limitation of liability, so some of the above may not apply to you.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Indemnification</h2>
              <p className="text-slate-700 dark:text-slate-300">
                You agree to indemnify and hold harmless Passage, its owners, employees, and affiliates from any claims, damages, losses, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300 mt-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
              </ul>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Termination</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">By You</h3>
              <p className="text-slate-700 dark:text-slate-300">
                You may terminate your account at any time by deleting your account in Settings.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">By Us</h3>
              <p className="text-slate-700 dark:text-slate-300 mb-2">We may suspend or terminate your access if:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>You violate these Terms</li>
                <li>We are required to by law</li>
                <li>We discontinue the Service</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300 mt-4">
                Upon termination, your right to use the Service ceases immediately. We may delete your data in accordance with our Privacy Policy.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Changes to Terms</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-2">
                We may modify these Terms at any time. We will notify you of significant changes by:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Posting updated Terms on the website</li>
                <li>Sending an email notification</li>
                <li>Displaying a notice in the app</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300 mt-4">
                Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Governing Law</h3>
              <p className="text-slate-700 dark:text-slate-300">
                These Terms are governed by the laws of Queensland, Australia, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Informal Resolution</h3>
              <p className="text-slate-700 dark:text-slate-300">
                Before filing a claim, you agree to contact us and attempt to resolve the dispute informally for at least 30 days.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Jurisdiction</h3>
              <p className="text-slate-700 dark:text-slate-300">
                Any legal proceedings shall be brought in the courts of Queensland, Australia.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Severability</h2>
              <p className="text-slate-700 dark:text-slate-300">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in effect.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Entire Agreement</h2>
              <p className="text-slate-700 dark:text-slate-300">
                These Terms, together with the Privacy Policy, constitute the entire agreement between you and Passage regarding the Service.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Contact Us</h2>
              <p className="text-slate-700 dark:text-slate-300">
                If you have questions about these Terms, please contact us:
              </p>
              <ul className="list-none space-y-1 text-slate-700 dark:text-slate-300 mt-2">
                <li>Email: <a href="mailto:support@passage.support" className="text-blue-600 dark:text-blue-400 underline">support@passage.support</a></li>
                <li>Website: passage.support</li>
              </ul>
            </section>

            {/* Acknowledgment */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Acknowledgment</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <p className="text-blue-900 dark:text-blue-100 font-semibold mb-3">
                  BY USING PASSAGE, YOU ACKNOWLEDGE THAT:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-blue-800 dark:text-blue-200">
                  <li>You have read and understood these Terms</li>
                  <li>You understand Passage is NOT therapy or medical treatment</li>
                  <li>You understand Passage is NOT a crisis intervention service</li>
                  <li>You understand Passage uses AI which may make mistakes</li>
                  <li>You will seek professional help for medical or mental health conditions</li>
                  <li>You are at least 18 years old</li>
                </ul>
              </div>
            </section>

            <div className="border-t border-slate-300 dark:border-slate-600 mt-12 pt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                These Terms of Service are effective as of December 2024.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
