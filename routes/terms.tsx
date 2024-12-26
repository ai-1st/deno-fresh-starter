/**
 * Terms of Service page
 * Outlines terms for using the application, particularly regarding API keys
 */

export default function Terms() {
  return (
    <div class="container mx-auto px-4 py-8 prose prose-sm max-w-3xl">
      <h1 class="text-3xl font-bold mb-8">Terms of Service</h1>

      <div class="space-y-6">
        <section>
          <h2 class="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing or using our Deno Fresh Starter application, you agree to be bound by these Terms of Service
            and all applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">2. Third-Party API Keys</h2>
          <p>
            Our service requires the use of various third-party APIs. You are responsible for:
          </p>
          <ul class="list-disc pl-6">
            <li>Obtaining and managing your own API keys for:
              <ul class="list-disc pl-6 mt-2">
                <li>Amazon Web Services (AWS)</li>
                <li>Tavily API</li>
                <li>OpenAI API</li>
                <li>Firecrawl API</li>
              </ul>
            </li>
            <li>Ensuring your API keys remain confidential and secure</li>
            <li>All usage and charges incurred through your API keys</li>
            <li>Complying with each service provider's terms of service</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">3. API Key Usage and Storage</h2>
          <p>
            Regarding your provided API keys:
          </p>
          <ul class="list-disc pl-6">
            <li>We store your API keys securely using industry-standard encryption</li>
            <li>Keys are only used to make authorized API calls on your behalf</li>
            <li>You can delete your API keys from our system at any time</li>
            <li>We do not share your API keys with any third parties</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">4. Usage Limits and Costs</h2>
          <p>
            Please note:
          </p>
          <ul class="list-disc pl-6">
            <li>You are responsible for all costs associated with your API usage</li>
            <li>We do not provide refunds for any API charges</li>
            <li>You should monitor your own API usage and costs</li>
            <li>We recommend setting up usage limits and alerts with your API providers</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">5. Service Limitations</h2>
          <p>
            We strive to maintain reliable service, but:
          </p>
          <ul class="list-disc pl-6">
            <li>We cannot guarantee uninterrupted access to third-party APIs</li>
            <li>We are not responsible for any API service outages or changes</li>
            <li>Service quality depends on your API quota and rate limits</li>
            <li>We may impose our own rate limits to prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">6. User Responsibilities</h2>
          <p>
            You agree to:
          </p>
          <ul class="list-disc pl-6">
            <li>Use the service in compliance with all applicable laws</li>
            <li>Not attempt to circumvent any usage limitations</li>
            <li>Not share or sell access to your account</li>
            <li>Report any security vulnerabilities or misuse</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">7. Termination</h2>
          <p>
            We reserve the right to:
          </p>
          <ul class="list-disc pl-6">
            <li>Suspend or terminate access for terms violation</li>
            <li>Modify or discontinue the service at any time</li>
            <li>Change these terms with reasonable notice</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">8. Disclaimer of Warranties</h2>
          <p>
            The service is provided "as is" without warranties of any kind. We are not responsible for:
          </p>
          <ul class="list-disc pl-6">
            <li>Third-party API performance or reliability</li>
            <li>Data loss or service interruptions</li>
            <li>Any damages resulting from service use</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">Contact</h2>
          <p>
            For questions about these terms, please contact:
          </p>
          <div class="mt-2">
            <a href="mailto:support@example.com" class="link link-primary">
              support@example.com
            </a>
          </div>
        </section>

        <footer class="text-sm text-gray-500 mt-8">
          Last updated: {new Date().toLocaleDateString()}
        </footer>
      </div>
    </div>
  );
}
