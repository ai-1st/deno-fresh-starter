/**
 * Privacy Policy page
 * Describes how user data is collected and used
 */

export default function Privacy() {
  return (
    <div class="container mx-auto px-4 py-8 prose prose-sm max-w-3xl">
      <h1 class="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div class="space-y-6">
        <section>
          <h2 class="text-2xl font-semibold">Overview</h2>
          <p>
            This Privacy Policy describes how your personal information is collected and used
            when you use our Deno Fresh Starter application.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">Information We Collect</h2>
          <div class="pl-4">
            <h3 class="text-xl font-medium">Authentication Data</h3>
            <p>
              When you sign in using Google Authentication, we receive:
            </p>
            <ul class="list-disc pl-6">
              <li>Your Google account email address</li>
              <li>Your Google account display name</li>
              <li>Your Google account profile picture (if available)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">How We Use Your Information</h2>
          <p>We use the collected information for:</p>
          <ul class="list-disc pl-6">
            <li>Authentication and account management</li>
            <li>Providing personalized user experience</li>
            <li>Maintaining application security</li>
            <li>Communication about your account and updates</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">Data Storage</h2>
          <p>
            Your data is stored securely in our database. We implement appropriate
            security measures to protect against unauthorized access, alteration,
            disclosure, or destruction of your information.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">Your Rights</h2>
          <p>You have the right to:</p>
          <ul class="list-disc pl-6">
            <li>Access your personal information</li>
            <li>Request correction of your personal information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt-out of communications</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
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
