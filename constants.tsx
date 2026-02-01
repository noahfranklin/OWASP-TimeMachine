
import { Era, Difficulty, Vulnerability } from './types';

export const OWASP_2025_LIST: Vulnerability[] = [
  {
    id: '2025-A01',
    rank: 'A01',
    name: 'Broken Access Control',
    era: Era.Y2025,
    description: 'Allowing users to access unauthorized data or perform actions outside their permissions.',
    theory: 'In 2025, modern apps often fail at granular permission checks in microservices. A common error is relying solely on JWT payload attributes without server-side validation against the database state.',
    flag: 'TM{BAC_BYPASS_2025}',
    exploitHint: 'Try accessing /api/admin/config without being an admin. Can you manipulate the user_id in the URL?',
    codeSnippets: {
      [Difficulty.EASY]: `// Vulnerable: Direct ID reference without ownership check
app.get('/api/user/:id/settings', (req, res) => {
  const userSettings = db.query(\`SELECT * FROM settings WHERE user_id = \${req.params.id}\`);
  res.json(userSettings);
});`,
      [Difficulty.INTERMEDIATE]: `// Intermediate: Check for auth, but weak validation
app.get('/api/user/:id/settings', (req, res) => {
  if (!req.session.user) return res.status(401).send();
  // Blacklist check can be bypassed with URL encoding or different param types
  if (req.params.id === 'admin') return res.status(403).send();
  const userSettings = db.query(\`SELECT * FROM settings WHERE user_id = ?\`, [req.params.id]);
  res.json(userSettings);
});`,
      [Difficulty.IMPOSSIBLE]: `// Secure: Enforce strict ownership and session-based ID lookup
app.get('/api/me/settings', (req, res) => {
  const currentUserId = req.user.id; // From trusted, verified session/JWT
  const settings = db.settings.findOne({ where: { userId: currentUserId } });
  res.json(settings);
});`
    },
    bypassLogic: 'Easy: Simply change the ID in the URL. Intermediate: Use path traversal or parameter pollution to reach restricted IDs.'
  },
  {
    id: '2025-A03',
    rank: 'A03',
    name: 'Supply Chain Failures',
    era: Era.Y2025,
    description: 'Vulnerabilities introduced through third-party libraries, CI/CD pipelines, or shadowing.',
    theory: 'Dependency Confusion occurs when an internal private package name is registered on a public registry (like npm). The build system might prioritize the higher-versioned public package, leading to RCE.',
    flag: 'TM{DEPENDENCY_CONFUSION_PWNED}',
    exploitHint: 'The internal package @internal/auth-utils version is 1.0.0. Check if a newer version exists in the "public" simulated repo.',
    codeSnippets: {
      [Difficulty.EASY]: `// Vulnerable: package.json with loose versions
{
  "dependencies": {
    "@internal/auth-utils": "^1.0.0" 
  }
}`,
      [Difficulty.INTERMEDIATE]: `// Intermediate: Lockfile present but registry scope not enforced
{
  "dependencies": {
    "@internal/auth-utils": "1.0.0"
  },
  // If the internal registry fails, it defaults to public npm
}`,
      [Difficulty.IMPOSSIBLE]: `// Secure: Scoped registry configuration and checksum verification
// .npmrc
@internal:registry=https://internal-repo.corp/
always-auth=true
// Use exact versions and verify integrity hashes in lockfiles.`
    },
    bypassLogic: 'Easy: The builder fetches 1.1.0 from the public hub automatically. Intermediate: A malicious actor can force a version bump that bypasses the lockfile in certain CI/CD misconfigurations.'
  },
  {
    id: '2025-A10',
    rank: 'A10',
    name: 'Mishandling Exceptions',
    era: Era.Y2025,
    description: 'Improper error handling leads to unexpected application states or information disclosure.',
    theory: 'Modern high-concurrency apps often face race conditions or database deadlocks. If the exception handler is too generic, it might default to a "success" state to avoid crashing the transaction.',
    flag: 'TM{DEADLOCK_PROFITS}',
    exploitHint: 'Trigger a database deadlock during checkout. Does the app fail open?',
    codeSnippets: {
      [Difficulty.EASY]: `// Vulnerable: Fail-open on database error
async function checkout(cart) {
  try {
    await db.processPayment(cart);
  } catch (err) {
    console.error("Payment error:", err);
    // Generic error handling assumes success to keep user in the funnel
  }
  return { status: 'success', orderId: 123 };
}`,
      [Difficulty.INTERMEDIATE]: `// Intermediate: Log error but still doesn't stop the flow
async function checkout(cart) {
  try {
    await db.processPayment(cart);
  } catch (err) {
    if (err.code === 'DEADLOCK') {
       // Just retry once, but still return success if it hangs
       return { status: 'success', retry: true };
    }
    throw err;
  }
}`,
      [Difficulty.IMPOSSIBLE]: `// Secure: Fail-closed and explicit transaction management
async function checkout(cart) {
  const transaction = await db.transaction();
  try {
    await db.processPayment(cart, { transaction });
    await transaction.commit();
    return { status: 'success' };
  } catch (err) {
    await transaction.rollback();
    logger.error("Transaction failed", { error: err, cartId: cart.id });
    throw new PaymentProcessingError("Transaction could not be completed.");
  }
}`
    }
  }
];
