import React from "react";

interface FooterProps {
  onOpenGuide?: () => void;
}

export default function Footer({ onOpenGuide }: FooterProps) {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-main">
        {/* Brand & Project Info */}
        <div className="footer-brand-section">
          <div className="footer-brand">
            <div className="brand-mark">L</div>
            <div className="brand-title">
              <span>Luma</span>
              <small>STUDENT SUPPORT OPERATIONS</small>
            </div>
          </div>
          <p className="footer-description">
            High-leverage K-12 MTSS & Tier 2/3 Caseload Workspace engineered for school
            counselors, learning specialists, and academic advisors.
          </p>
          <div className="footer-compliance">
            <span className="status-indicator">
              <span className="status-dot"></span>
              System Operational
            </span>
            <span className="compliance-separator">•</span>
            <span className="compliance-tag">FERPA & COPPA Mindful</span>
          </div>
        </div>

        {/* Developer Spotlight & Social Profiles */}
        <div className="footer-dev-card">
          <div className="footer-dev-header">
            <div className="dev-avatar">SD</div>
            <div>
              <span className="dev-caption">Designed & Developed By</span>
              <h3 className="dev-name">Sumit Durgam</h3>
            </div>
          </div>
          <p className="dev-bio">
            Fullstack Software Engineer specializing in modern Next.js architectures,
            resilient data systems, and human-centered educational software.
          </p>
          <div className="dev-links">
            <a
              href="https://github.com/Sumitdurgam"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn github"
              aria-label="Sumit Durgam's GitHub Profile"
              id="footer-github-link"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
              <svg
                className="external-icon"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17l9.2-9.2M17 17V8H8" />
              </svg>
            </a>

            <a
              href="https://www.linkedin.com/in/sumit-durgam-4b4444199/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn linkedin"
              aria-label="Sumit Durgam's LinkedIn Profile"
              id="footer-linkedin-link"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span>LinkedIn</span>
              <svg
                className="external-icon"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17l9.2-9.2M17 17V8H8" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Sub-bar */}
      <div className="footer-bottom">
        <p className="copyright-text">
          © {new Date().getFullYear()} <strong>Sumit Durgam</strong>. Crafted with Next.js 16, React 19 & TypeScript.
        </p>
        <div className="footer-actions">
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="footer-link-btn"
              title="View full architectural specifications and assignment evaluation guide"
            >
              Architecture & Rubric Guide
            </button>
          )}
          <a
            href="https://github.com/Sumitdurgam"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-sublink"
          >
            Sumit Durgam on GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/sumit-durgam-4b4444199/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-sublink"
          >
            Sumit Durgam on LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
