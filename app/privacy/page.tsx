import Link from 'next/link'

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Last Updated: December 2024
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Introduction</h2>
              <p className="text-slate-700 dark:text-slate-300">
                Passage ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and application (collectively, the "Service").
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Information You Provide</h3>
              
              <h4 className="text-lg font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-50">Account Information</h4>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Name or preferred name</li>
                <li>Country (for crisis resource localization)</li>
              </ul>

              <h4 className="text-lg font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-50">Profile Information</h4>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Entry point/reason for using Passage (e.g., burnout, grief, divorce)</li>
                <li>Voice preference settings</li>
              </ul>

              <h4 className="text-lg font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-50">Conversation Data</h4>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Text conversations with Passage</li>
                <li>Voice recordings (temporarily processed for transcription)</li>
                <li>Tagged memories and notes</li>
                <li>Any other content you choose to share</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Information Collected Automatically</h3>
              
              <h4 className="text-lg font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-50">Usage Data</h4>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Pages and features accessed</li>
                <li>Time and date of visits</li>
                <li>Device type and browser information</li>
                <li>General location (country/region level)</li>
              </ul>

              <h4 className="text-lg font-semibold mt-4 mb-2 text-slate-900 dark:text-slate-50">Technical Data</h4>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">How We Use Your Information</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-2">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Provide and maintain the Service</li>
                <li>Create and manage your account</li>
                <li>Process your conversations and provide AI-powered responses</li>
                <li>Detect patterns in your conversations over time</li>
                <li>Generate personalized insights</li>
                <li>Provide localized crisis resources</li>
                <li>Improve and optimize the Service</li>
                <li>Communicate with you about the Service</li>
                <li>Process payments (if applicable)</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Third-Party Services</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                We use trusted third-party services to operate Passage. Your data may be processed by:
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-600">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700">
                      <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left text-slate-900 dark:text-slate-50">Service</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left text-slate-900 dark:text-slate-50">Purpose</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left text-slate-900 dark:text-slate-50">Data Shared</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Supabase</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Database and authentication</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Account info, conversations, all stored data</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Anthropic (Claude)</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">AI conversation processing</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Conversation content</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">OpenAI (Whisper)</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Voice transcription</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Voice recordings (temporary)</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Pinecone</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Pattern and memory search</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Conversation embeddings</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Vercel</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Website hosting</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Technical/usage data</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Stripe</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Payment processing</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Payment information (if applicable)</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Resend</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Email delivery</td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">Email address</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-slate-700 dark:text-slate-300 mt-4">
                Each third-party service has its own privacy policy governing their use of your data. We only share the minimum data necessary for each service to function.
              </p>
            </section>

            {/* AI and Your Data */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">AI and Your Data</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">How AI Processes Your Data</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Your conversations are sent to Anthropic's Claude AI to generate responses</li>
                <li>Voice recordings are sent to OpenAI's Whisper for transcription, then deleted</li>
                <li>Conversation patterns are analyzed to provide insights</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">What We Don't Do</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>We do NOT sell your data to anyone</li>
                <li>We do NOT use your conversations to train AI models</li>
                <li>We do NOT share your personal conversations with other users</li>
                <li>We do NOT allow human employees to read your conversations</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Data Retention</h2>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li><strong>Account data:</strong> Retained while your account is active</li>
                <li><strong>Conversations:</strong> Retained until you delete them or your account</li>
                <li><strong>Voice recordings:</strong> Temporarily processed for transcription, not permanently stored</li>
                <li><strong>Analytics data:</strong> Retained in anonymized form</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300 mt-4">
                You can delete your data at any time (see Your Rights below).
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Data Security</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-2">
                We implement appropriate technical and organizational measures to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Encryption in transit (HTTPS/TLS)</li>
                <li>Encryption at rest</li>
                <li>Secure authentication</li>
                <li>Regular security assessments</li>
                <li>Access controls limiting who can access systems</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300 mt-4">
                However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Your Rights</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-2">You have the right to:</p>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-50">Access</h4>
                  <p className="text-slate-700 dark:text-slate-300">View your data through the app's export feature</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-50">Export</h4>
                  <p className="text-slate-700 dark:text-slate-300">Download all your data in JSON format via Settings</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-50">Delete</h4>
                  <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300">
                    <li>Delete individual conversations</li>
                    <li>Delete all memories</li>
                    <li>Delete your entire account and all associated data</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-50">Correction</h4>
                  <p className="text-slate-700 dark:text-slate-300">Update your profile information at any time</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-50">Withdraw Consent</h4>
                  <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300">
                    <li>Stop using the Service at any time</li>
                    <li>Request account deletion</li>
                  </ul>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 mt-4">
                To exercise these rights, use the in-app settings or contact us at <a href="mailto:support@passage.support" className="text-blue-600 dark:text-blue-400 underline">support@passage.support</a>.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Children's Privacy</h2>
              <p className="text-slate-700 dark:text-slate-300">
                Passage is not intended for users under 18 years of age. We do not knowingly collect information from children under 18. If you believe we have collected information from a child under 18, please contact us immediately.
              </p>
            </section>

            {/* International Data Transfers */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">International Data Transfers</h2>
              <p className="text-slate-700 dark:text-slate-300">
                Your data may be transferred to and processed in countries other than your own, including the United States and Australia. These countries may have different data protection laws. By using the Service, you consent to such transfers.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Cookies and Tracking</h2>
              <p className="text-slate-700 dark:text-slate-300">
                We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Changes to This Policy</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-2">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Posting the new policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email notification for material changes</li>
              </ul>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Contact Us</h2>
              <p className="text-slate-700 dark:text-slate-300">
                If you have questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-none space-y-1 text-slate-700 dark:text-slate-300 mt-2">
                <li>Email: <a href="mailto:support@passage.support" className="text-blue-600 dark:text-blue-400 underline">support@passage.support</a></li>
                <li>Website: passage.support</li>
              </ul>
            </section>

            {/* Additional Rights by Region */}
            <section>
              <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50">Additional Rights by Region</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">European Union (GDPR)</h3>
              <p className="text-slate-700 dark:text-slate-300 mb-2">
                If you are in the EU, you have additional rights including:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Right to lodge a complaint with a supervisory authority</li>
                <li>Right to data portability</li>
                <li>Right to restriction of processing</li>
                <li>Right to object to processing</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300 mt-4 mb-2">
                Our legal basis for processing is:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Consent (for conversations and AI processing)</li>
                <li>Contract (to provide the Service)</li>
                <li>Legitimate interests (to improve the Service)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">California (CCPA)</h3>
              <p className="text-slate-700 dark:text-slate-300 mb-2">
                If you are a California resident, you have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Know what personal information is collected</li>
                <li>Know whether your personal information is sold or disclosed</li>
                <li>Say no to the sale of personal information (we don't sell data)</li>
                <li>Access your personal information</li>
                <li>Equal service and price (non-discrimination)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-slate-900 dark:text-slate-50">Australia</h3>
              <p className="text-slate-700 dark:text-slate-300">
                We comply with the Australian Privacy Principles (APPs) under the Privacy Act 1988. You may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) if you believe we have breached your privacy.
              </p>
            </section>

            <div className="border-t border-slate-300 dark:border-slate-600 mt-12 pt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                This Privacy Policy is effective as of December 2024.
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
