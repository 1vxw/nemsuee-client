export type LegalSection = {
  heading: string;
  body: string[];
};

export type LegalDocument = {
  slug: "privacy-policy" | "terms-of-service";
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const LEGAL_LAST_UPDATED = "2026-03-23";

export const PRIVACY_POLICY: LegalDocument = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: "Information We Collect",
      body: [
        "We collect account details such as full name, email address, and encrypted credentials to create and maintain your account.",
        "Academic records and course activity, including enrollments, submissions, scores, and progress, are stored to deliver learning features.",
        "If enabled by your institution, integrations such as Google Drive may process files and metadata required to support coursework.",
      ],
    },
    {
      heading: "How We Use Information",
      body: [
        "To authenticate users, authorize access by role, and secure platform sessions.",
        "To provide core learning workflows including course management, assignments, quizzes, grading, and notifications.",
        "To operate, monitor, and improve service reliability, security, and product quality.",
      ],
    },
    {
      heading: "Data Sharing",
      body: [
        "Data is shared only with authorized platform users and administrators based on role permissions and institutional policy.",
        "We do not sell personal information to third parties.",
        "Service providers are used strictly for infrastructure or integration support and are expected to protect data under applicable agreements.",
      ],
    },
    {
      heading: "Retention and Security",
      body: [
        "Data is retained only as long as needed for educational operations, legal obligations, or institutional requirements.",
        "Reasonable technical and organizational safeguards are used to protect stored information.",
        "No method of transmission or storage is fully risk-free, and users should also protect account credentials.",
      ],
    },
    {
      heading: "Your Rights and Contact",
      body: [
        "You may request access, correction, or deletion of your data subject to institutional and legal constraints.",
        "For privacy concerns, contact your system administrator or institution support channel.",
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  slug: "terms-of-service",
  title: "Terms of Service",
  lastUpdated: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: "Acceptance of Terms",
      body: [
        "By accessing or using this platform, you agree to follow these Terms of Service and all applicable policies.",
        "If you do not agree with these terms, do not use the service.",
      ],
    },
    {
      heading: "Account Responsibilities",
      body: [
        "You are responsible for keeping your login credentials secure and for all activity under your account.",
        "You must provide accurate information and promptly update account details when needed.",
        "Unauthorized access attempts, account sharing, or misuse may result in suspension or termination.",
      ],
    },
    {
      heading: "Acceptable Use",
      body: [
        "Use the platform only for lawful and educational purposes aligned with institutional rules.",
        "You must not upload malicious code, attempt to disrupt services, or access data without authorization.",
        "Content that is abusive, discriminatory, or violates intellectual property rights is prohibited.",
      ],
    },
    {
      heading: "Platform Availability",
      body: [
        "The service may be updated, changed, or temporarily unavailable for maintenance or operational reasons.",
        "We may modify or discontinue features at any time to maintain service quality and security.",
      ],
    },
    {
      heading: "Limitation and Changes",
      body: [
        "To the extent allowed by law, the service is provided on an as-is and as-available basis without warranties.",
        "These terms may be updated from time to time. Continued use after changes means you accept the updated terms.",
      ],
    },
  ],
};

export function getLegalDocument(slug: LegalDocument["slug"]) {
  return slug === "privacy-policy" ? PRIVACY_POLICY : TERMS_OF_SERVICE;
}
