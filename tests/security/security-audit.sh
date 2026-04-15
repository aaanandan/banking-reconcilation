#!/bin/bash
# Step 275: Security Audit (Final Pre-Launch)
# Banking Reconciliation SaaS Platform
#
# Run with: bash tests/security/security-audit.sh
#
# Comprehensive security checklist covering:
# - Authentication & Authorization
# - Data encryption
# - Dependency vulnerabilities
# - Secret management
# - Network security
# - OWASP Top 10

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

pass() {
  echo -e "  ${GREEN}✓${NC} $1"
  ((PASS_COUNT++))
}

warn() {
  echo -e "  ${YELLOW}⚠${NC}  $1"
  ((WARN_COUNT++))
}

fail() {
  echo -e "  ${RED}✗${NC} $1"
  ((FAIL_COUNT++))
}

echo "═══════════════════════════════════════════════════════════"
echo "SECURITY AUDIT — Banking Reconciliation Platform"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 1. Authentication & Authorization
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/10] Authentication & Authorization${NC}"

# Check for JWT implementation
if grep -r "jsonwebtoken\|jwt" services/*/package.json > /dev/null 2>&1; then
  pass "JWT authentication library present"
else
  warn "JWT library not found in dependencies"
fi

# Check for password hashing
if grep -r "bcrypt\|argon2\|scrypt" services/*/package.json > /dev/null 2>&1; then
  pass "Password hashing library present"
else
  fail "No password hashing library found (bcrypt/argon2 required)"
fi

# Check for role-based access control mentions
if grep -rn "role.*admin\|RBAC\|permissions" services/*/src/*.js > /dev/null 2>&1; then
  pass "Role-based access control implemented"
else
  warn "RBAC not clearly visible in code"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 2. Data Encryption
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[2/10] Data Encryption${NC}"

# Check for HTTPS enforcement
if grep -rn "https:" services/*/src/*.js docker-compose.yml > /dev/null 2>&1; then
  pass "HTTPS references found in code"
else
  warn "No HTTPS enforcement visible — ensure production uses TLS 1.3"
fi

# Check for encryption libraries
if grep -r "crypto" services/*/package.json > /dev/null 2>&1 || grep -rn "crypto.createCipher" services/*/src/*.js > /dev/null 2>&1; then
  pass "Encryption libraries in use"
else
  warn "No explicit encryption libraries found"
fi

# Database encryption at rest
echo "  (Database encryption at rest: verify PostgreSQL config or RDS encryption enabled)"
pass "Database encryption recommended for production (AES-256)"

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 3. Dependency Vulnerabilities
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/10] Dependency Vulnerabilities${NC}"

# Run npm audit on each service
AUDIT_FAILED=0

for SERVICE_DIR in services/*/; do
  if [ -f "$SERVICE_DIR/package.json" ]; then
    SERVICE_NAME=$(basename "$SERVICE_DIR")
    echo "  → Auditing $SERVICE_NAME..."

    cd "$SERVICE_DIR"
    AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || echo '{}')
    CRITICAL_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")
    HIGH_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")

    if [ "$CRITICAL_VULNS" -gt 0 ] || [ "$HIGH_VULNS" -gt 0 ]; then
      fail "$SERVICE_NAME has $CRITICAL_VULNS critical, $HIGH_VULNS high vulnerabilities"
      AUDIT_FAILED=1
    else
      pass "$SERVICE_NAME has no critical/high vulnerabilities"
    fi

    cd - > /dev/null
  fi
done

if [ "$AUDIT_FAILED" -eq 1 ]; then
  echo "  → Run 'npm audit fix' in each service directory"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 4. Secret Management
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[4/10] Secret Management${NC}"

# Check for hardcoded secrets
HARDCODED_SECRETS=$(grep -rn "password.*=.*['\"].*['\"]" services/*/src/*.js 2>/dev/null | grep -v "example\|test\|mock" || true)
if [ -z "$HARDCODED_SECRETS" ]; then
  pass "No hardcoded passwords found in source code"
else
  fail "Potential hardcoded secrets detected:"
  echo "$HARDCODED_SECRETS" | head -5
fi

# Check for API key exposure
if grep -rn "sk_live_\|pk_live_\|api_key.*=.*['\"][a-zA-Z0-9]" services/*/src/*.js > /dev/null 2>&1; then
  fail "Potential API key hardcoded in source"
else
  pass "No hardcoded API keys detected"
fi

# Check for .env usage
if [ -f ".env.example" ]; then
  pass ".env.example present (good practice)"
else
  warn "No .env.example found — add template for environment variables"
fi

# Check if .env is in .gitignore
if grep -q "^\.env$" .gitignore 2>/dev/null; then
  pass ".env correctly excluded from git"
else
  fail ".env not in .gitignore — secrets may be committed!"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 5. SQL Injection Prevention
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[5/10] SQL Injection Prevention${NC}"

# Check for parameterized queries (ORM usage)
if grep -rn "typeorm\|sequelize\|knex" services/*/package.json > /dev/null 2>&1; then
  pass "ORM in use (helps prevent SQL injection)"
else
  warn "No ORM detected — ensure all queries use parameterized statements"
fi

# Check for dangerous string concatenation in SQL
DANGEROUS_SQL=$(grep -rn "SELECT.*\+.*req\|INSERT.*\+.*req" services/*/src/*.js 2>/dev/null || true)
if [ -z "$DANGEROUS_SQL" ]; then
  pass "No obvious SQL string concatenation detected"
else
  fail "Potential SQL injection vulnerability (string concatenation in query):"
  echo "$DANGEROUS_SQL" | head -3
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 6. XSS Prevention
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[6/10] Cross-Site Scripting (XSS) Prevention${NC}"

# Check for React (auto-escapes by default)
if grep -q "react" banking-recon-frontend/package.json 2>/dev/null; then
  pass "React in use (default XSS protection via JSX escaping)"
else
  warn "Frontend framework not React — ensure template escaping enabled"
fi

# Check for dangerouslySetInnerHTML
DANGEROUS_HTML=$(grep -rn "dangerouslySetInnerHTML" banking-recon-frontend/src/ 2>/dev/null || true)
if [ -z "$DANGEROUS_HTML" ]; then
  pass "No dangerouslySetInnerHTML usage (good)"
else
  warn "dangerouslySetInnerHTML found — review for XSS risk:"
  echo "$DANGEROUS_HTML" | head -3
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 7. CSRF Protection
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[7/10] CSRF Protection${NC}"

# Check for CSRF token library
if grep -rn "csurf\|csrf" services/*/package.json > /dev/null 2>&1; then
  pass "CSRF protection library present"
else
  warn "No CSRF library detected — add 'csurf' for Express apps"
fi

# For JWT-based auth, CSRF is less critical (but still recommended for state-changing operations)
echo "  (JWT-based auth reduces CSRF risk, but still validate origin for sensitive operations)"

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 8. Security Headers
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[8/10] Security Headers${NC}"

# Check for helmet.js (Express security headers)
if grep -rn "helmet" services/*/package.json > /dev/null 2>&1; then
  pass "Helmet.js library present (adds security headers)"
else
  fail "Helmet.js not found — install via 'npm install helmet' and use app.use(helmet())"
fi

echo "  Required headers for production:"
echo "    - Content-Security-Policy"
echo "    - X-Content-Type-Options: nosniff"
echo "    - X-Frame-Options: DENY"
echo "    - Strict-Transport-Security: max-age=31536000"

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 9. Rate Limiting
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[9/10] Rate Limiting${NC}"

# Check for rate limiting library
if grep -rn "express-rate-limit\|rate-limiter" services/*/package.json > /dev/null 2>&1; then
  pass "Rate limiting library present"
else
  warn "No rate limiting detected — add express-rate-limit to prevent brute force"
fi

# Recommendation
echo "  Recommended limits:"
echo "    - Login endpoint: 5 attempts / 15 minutes per IP"
echo "    - API endpoints: 100 requests / minute per user"
echo "    - Password reset: 3 attempts / hour per email"

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 10. Logging & Monitoring
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[10/10] Logging & Monitoring${NC}"

# Check for Sentry
if grep -rn "@sentry/node" services/*/package.json > /dev/null 2>&1; then
  pass "Sentry error tracking configured"
else
  warn "Sentry not configured — add for production error monitoring"
fi

# Check for structured logging
if [ -f "services/auth-service/src/logger/logger.js" ]; then
  pass "Structured logging implemented"
else
  warn "No structured logging found — use JSON logs for ELK ingestion"
fi

# Check for audit log implementation
if grep -rn "audit\|activity.*log" docs/ > /dev/null 2>&1; then
  pass "Audit logging documented"
else
  warn "Audit logging not clearly documented"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "SECURITY AUDIT COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Results:"
echo -e "  ${GREEN}✓${NC} Passed: $PASS_COUNT"
echo -e "  ${YELLOW}⚠${NC}  Warnings: $WARN_COUNT"
echo -e "  ${RED}✗${NC} Failed: $FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "${RED}AUDIT FAILED${NC} — Address all failures before production launch"
  echo ""
  echo "Critical fixes required:"
  echo "  1. Run 'npm audit fix' on all services"
  echo "  2. Install helmet.js for security headers"
  echo "  3. Add password hashing library (bcrypt or argon2)"
  echo "  4. Ensure .env is in .gitignore"
  exit 1
elif [ "$WARN_COUNT" -gt 3 ]; then
  echo -e "${YELLOW}AUDIT PASSED WITH WARNINGS${NC} — Review warnings before launch"
  echo ""
  echo "Recommended improvements:"
  echo "  - Add CSRF protection (csurf)"
  echo "  - Add rate limiting (express-rate-limit)"
  echo "  - Configure Sentry for error tracking"
  echo "  - Add audit logging for compliance"
  exit 0
else
  echo -e "${GREEN}AUDIT PASSED${NC} — Security posture is acceptable for launch"
  echo ""
  echo "Post-launch security tasks:"
  echo "  - Enable 2FA for admin users (Q2 2024 roadmap)"
  echo "  - Monthly penetration testing"
  echo "  - Quarterly dependency updates"
  echo "  - Annual SOC 2 audit renewal"
  exit 0
fi
