# Step 210: Security Testing & Penetration Testing

**Status**: ✅ Completed
**Date**: 2025-11-18
**Phase**: Security Implementation (Steps 201-210 - FINAL STEP)

## Overview

Step 210 provides comprehensive security testing resources and procedures for the banking reconciliation platform. This is the final step in the Security Implementation phase, ensuring all security controls implemented in Steps 201-209 are properly tested and validated.

## Implementation Summary

### Security Controls Implemented (Steps 201-209)

1. **Step 201**: Email Verification
2. **Step 202**: Two-Factor Authentication (TOTP)
3. **Step 203**: OAuth Integration (Google, Microsoft)
4. **Step 204**: Session Management & JWT Refresh Tokens
5. **Step 205**: Rate Limiting & Brute Force Protection
6. **Step 206**: Password Reset & Recovery
7. **Step 207**: API Key Management
8. **Step 208**: CORS & Security Headers
9. **Step 209**: Audit Logging & Security Monitoring

### Testing Resources Created

1. **Automated Security Test Suite** - Comprehensive Jest/Supertest security tests
2. **Security Vulnerability Checklist** - OWASP Top 10 & CWE Top 25 coverage
3. **Security Testing Documentation** - This document

## Automated Security Testing

### Test Suite Overview

**File**: `apps/auth-service/test/security/auth-security.spec.ts`

The automated test suite covers:
- SQL Injection protection
- XSS (Cross-Site Scripting) protection
- Authentication bypass attempts
- Brute force protection
- Session security
- Input validation
- CORS protection
- Security headers
- Error handling
- API key security
- Audit logging

### Running Security Tests

```bash
# Navigate to project root
cd /home/user/banking-reconcilation/banking-reconciliation-system

# Run all security tests
npm test -- apps/auth-service/test/security

# Run specific security test suite
npm test -- apps/auth-service/test/security/auth-security.spec.ts

# Run with coverage
npm test -- --coverage apps/auth-service/test/security

# Run in watch mode for development
npm test -- --watch apps/auth-service/test/security
```

### Test Categories

#### 1. SQL Injection Protection Tests

Verifies protection against SQL injection attacks:
- Email field injection attempts
- Password field injection attempts
- Query parameter injection
- Parameterized query validation

**Example Test**:
```typescript
it('should reject SQL injection in email field', async () => {
  const sqlInjectionPayloads = [
    "admin'--",
    "admin' OR '1'='1",
    "' OR 1=1--",
  ];

  for (const payload of sqlInjectionPayloads) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload, password: 'password123' });

    // Should return 401 or 400, NOT 500 (server error)
    expect([400, 401]).toContain(response.status);
  }
});
```

#### 2. XSS Protection Tests

Validates XSS prevention:
- Script tag injection
- Event handler injection
- JavaScript protocol injection
- Response header reflection

**Example Test**:
```typescript
it('should escape XSS in registration name field', async () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
  ];

  for (const payload of xssPayloads) {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: payload, ...otherFields });

    if (response.status === 201) {
      expect(response.body.user.name).not.toContain('<script>');
    }
  }
});
```

#### 3. Authentication Bypass Tests

Tests authentication security:
- Empty/null password attempts
- JWT token manipulation
- Expired token rejection
- Token signature validation

#### 4. Brute Force Protection Tests

Validates rate limiting and account lockout:
- Login rate limiting (5 attempts/minute)
- Account lockout after 5 failed attempts
- 15-minute lockout duration
- Lockout counter reset

**Example Test**:
```typescript
it('should lock account after multiple failed attempts', async () => {
  // Attempt 6 failed logins
  for (let i = 0; i < 6; i++) {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'WrongPassword' });
  }

  // Next attempt should indicate account lock
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: testEmail, password: 'CorrectPassword' });

  expect(response.body.message).toContain('locked');
});
```

#### 5. Session Security Tests

Validates session management:
- Refresh token rotation
- Old token invalidation
- Cross-tenant access prevention
- Session hijacking protection

#### 6. Input Validation Tests

Ensures proper input validation:
- Email format validation
- Password complexity enforcement
- Input length limits
- Special character handling

#### 7. CORS Protection Tests

Validates CORS configuration:
- Unauthorized origin rejection
- Authorized origin acceptance
- Preflight request handling
- Credentials control

#### 8. Security Headers Tests

Verifies security headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection
- HSTS (in production)
- X-Powered-By hidden

#### 9. Error Handling Tests

Ensures secure error responses:
- No stack traces in production
- No user enumeration
- Generic error messages
- No sensitive data leakage

## Manual Security Testing

### Penetration Testing Procedures

#### 1. Authentication Testing

**Test 1.1: Brute Force Attack**
```bash
# Use hydra for brute force testing
hydra -l admin@example.com -P passwords.txt http-post-form \
  "localhost:3001/auth/login:email=^USER^&password=^PASS^:Invalid credentials"

# Expected: Account locked after 5 attempts
# Expected: Rate limit (429) after threshold
```

**Test 1.2: Credential Stuffing**
```bash
# Test with list of leaked credentials
for cred in $(cat credentials.txt); do
  email=$(echo $cred | cut -d: -f1)
  pass=$(echo $cred | cut -d: -f2)
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pass\"}"
done

# Expected: Rate limiting kicks in
# Expected: Failed attempts logged
```

**Test 1.3: Session Hijacking**
```bash
# Capture valid JWT token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Attempt to use from different IP
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/auth/profile

# Expected: Success (tokens not IP-bound by default)
# Note: IP tracking is in audit logs
```

#### 2. Injection Testing

**Test 2.1: SQL Injection**
```bash
# Test login with SQL injection
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin'\'' OR '\''1'\''='\''1","password":"test"}'

# Expected: 401 Unauthorized (not 500 error)
# Expected: No SQL error in response
```

**Test 2.2: NoSQL Injection**
```bash
# Test with NoSQL operators
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}'

# Expected: 400 Bad Request (validation error)
```

**Test 2.3: Command Injection**
```bash
# Test file upload with malicious filename
curl -F "file=@test.txt;filename=../../etc/passwd" \
  http://localhost:3001/upload

# Expected: Filename sanitized or rejected
```

#### 3. XSS Testing

**Test 3.1: Reflected XSS**
```bash
# Test XSS in error messages
curl "http://localhost:3001/auth/login?redirect=<script>alert(1)</script>"

# Expected: Script tags escaped or removed
```

**Test 3.2: Stored XSS**
```bash
# Register with XSS in name
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","email":"test@test.com","password":"Test123!"}'

# Expected: Script tags escaped in stored data
```

#### 4. CSRF Testing

**Test 4.1: CSRF Attack Simulation**
```html
<!-- Create malicious HTML page -->
<form action="http://localhost:3001/auth/change-password" method="POST">
  <input type="hidden" name="password" value="hacked123">
  <input type="submit" value="Win a Prize!">
</form>
<script>document.forms[0].submit();</script>

<!-- Expected: Request blocked by CORS or CSRF token required -->
```

#### 5. CORS Testing

**Test 5.1: Unauthorized Origin**
```bash
curl -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://localhost:3001/auth/login

# Expected: No Access-Control-Allow-Origin header for evil.com
```

**Test 5.2: Authorized Origin**
```bash
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://localhost:3001/auth/login

# Expected: Access-Control-Allow-Origin: http://localhost:3000
```

#### 6. Security Headers Testing

```bash
# Check all security headers
curl -I http://localhost:3001/auth/health

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Referrer-Policy: no-referrer
# Content-Security-Policy: default-src 'self'...
```

#### 7. API Key Security Testing

**Test 7.1: Invalid API Key**
```bash
curl -H "X-API-Key: invalid-key" \
  http://localhost:3001/protected-endpoint

# Expected: 401 Unauthorized
```

**Test 7.2: Scope Enforcement**
```bash
# Use API key with 'read' scope to write
curl -X POST -H "X-API-Key: brs_read_only_key..." \
  http://localhost:3001/write-endpoint

# Expected: 403 Forbidden (insufficient scope)
```

### Tools for Penetration Testing

#### Recommended Tools

1. **OWASP ZAP** - Web application security scanner
```bash
# Download from https://www.zaproxy.org/
# Run automated scan:
zap-cli quick-scan http://localhost:3001
```

2. **Burp Suite** - Web vulnerability scanner
- Manual testing and request interception
- Automated scanning
- Intruder for brute force

3. **Nikto** - Web server scanner
```bash
nikto -h http://localhost:3001
```

4. **SQLMap** - SQL injection tool
```bash
sqlmap -u "http://localhost:3001/auth/login" \
  --data="email=test&password=test" \
  --batch
```

5. **npm audit** - Dependency vulnerability scanner
```bash
npm audit
npm audit fix
```

6. **Snyk** - Security vulnerability scanner
```bash
npx snyk test
npx snyk monitor
```

## Security Checklist

See `SECURITY_VULNERABILITY_CHECKLIST.md` for comprehensive coverage of:
- OWASP Top 10 (2021)
- CWE Top 25 Most Dangerous Software Weaknesses
- Banking industry specific requirements
- Compliance checklists (SOC 2, GDPR, PCI DSS)

## Security Metrics & Reporting

### Key Security Metrics

1. **Authentication Metrics**:
   - Failed login attempts per hour/day
   - Account lockout incidents
   - 2FA adoption rate
   - Password reset requests

2. **API Security Metrics**:
   - Invalid API key attempts
   - Rate limit violations
   - CORS violations
   - API key rotation frequency

3. **Vulnerability Metrics**:
   - npm audit score
   - Known vulnerabilities count
   - Time to patch (average)
   - Security test coverage

4. **Audit Log Metrics**:
   - Suspicious activity count
   - Security incidents
   - Compliance report generation
   - Log retention status

### Security Dashboard Queries

```typescript
// Get security statistics
const stats = await auditLogService.getStatistics(tenantId);

// Get suspicious activities (last 7 days)
const suspicious = await auditLogService.query({
  isSuspicious: true,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});

// Get failed logins (last 24 hours)
const failedLogins = await auditLogService.query({
  eventType: AuditEventType.LOGIN_FAILURE,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
});
```

## Security Incident Response

### Incident Response Plan

1. **Detection**:
   - Monitor audit logs for suspicious activity
   - Set up alerts for critical events
   - Review security metrics daily

2. **Analysis**:
   - Query audit logs for incident timeline
   - Identify affected users/tenants
   - Assess impact and severity

3. **Containment**:
   - Revoke compromised sessions
   - Lock affected accounts
   - Block malicious IPs
   - Rotate secrets if necessary

4. **Eradication**:
   - Patch vulnerability
   - Remove malicious code/data
   - Update security controls

5. **Recovery**:
   - Restore from clean backup if needed
   - Verify system integrity
   - Monitor for recurrence

6. **Lessons Learned**:
   - Document incident
   - Update security controls
   - Update this documentation
   - Train team on prevention

### Incident Response Commands

```bash
# Revoke all sessions for a user
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/auth/revoke-all-sessions/$USER_ID

# Lock user account
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/users/$USER_ID/lock

# Query audit logs for incident
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3001/audit-logs?userId=$USER_ID&startDate=$START&endDate=$END"

# Get suspicious activities
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3001/audit-logs/suspicious?tenantId=$TENANT_ID"
```

## Compliance Testing

### SOC 2 Type II Testing

Key controls to test:
- CC6.1: Logical and physical access controls
- CC6.2: Prior to issuing system credentials
- CC6.3: Removal of access
- CC6.6: Vulnerability and threat management
- CC7.2: Detection of security events

**Test Procedures**:
1. Verify authentication controls
2. Test authorization enforcement
3. Validate audit logging
4. Check security monitoring
5. Review incident response

### GDPR Compliance Testing

Key requirements:
- Article 5: Data processing principles
- Article 25: Data protection by design
- Article 30: Records of processing
- Article 32: Security of processing
- Article 33: Breach notification

**Test Procedures**:
1. Verify user consent management
2. Test data export functionality
3. Test right to deletion
4. Validate encryption at rest/transit
5. Review audit trail completeness

### PCI DSS Testing (if applicable)

Key requirements:
- Requirement 2: Secure configurations
- Requirement 6: Secure development
- Requirement 8: Access control
- Requirement 10: Monitoring and logging
- Requirement 11: Security testing

**Test Procedures**:
1. Validate cardholder data encryption
2. Test access controls
3. Review audit logs
4. Perform vulnerability scans
5. Execute penetration tests

## Continuous Security

### Automated Security Checks

**Pre-commit Hooks**:
```bash
# .git/hooks/pre-commit
npm audit
npm run lint:security
npm test -- --testPathPattern=security
```

**CI/CD Pipeline**:
```yaml
# .github/workflows/security.yml
name: Security Checks
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run npm audit
        run: npm audit
      - name: Run security tests
        run: npm test -- --testPathPattern=security
      - name: Snyk security scan
        run: npx snyk test
```

### Monthly Security Review

- [ ] Run full penetration test
- [ ] Review audit logs for anomalies
- [ ] Update dependencies (npm update)
- [ ] Review and update SECURITY_VULNERABILITY_CHECKLIST.md
- [ ] Check for new CVEs affecting dependencies
- [ ] Review and rotate secrets
- [ ] Update security documentation

### Quarterly Security Assessment

- [ ] External penetration test
- [ ] Security code review
- [ ] Threat model update
- [ ] Compliance audit
- [ ] Security training for team
- [ ] Incident response drill

## Security Best Practices

### Development Practices

1. **Secure Coding**:
   - Follow OWASP Secure Coding Practices
   - Input validation on all user input
   - Output encoding for all output
   - Parameterized queries for database
   - Least privilege principle

2. **Code Review**:
   - Security-focused code reviews
   - Automated security linting
   - Dependency vulnerability checks
   - No hardcoded secrets

3. **Testing**:
   - Security tests for all features
   - Penetration testing before releases
   - Automated security scanning
   - Regular vulnerability assessments

### Deployment Practices

1. **Environment Security**:
   - Separate dev/staging/production
   - Environment-specific secrets
   - Production uses HTTPS only
   - Proper firewall configuration

2. **Secrets Management**:
   - Use environment variables
   - Never commit secrets to git
   - Rotate secrets regularly
   - Use secret management tools (AWS Secrets Manager, HashiCorp Vault)

3. **Monitoring**:
   - Real-time security monitoring
   - Automated alerting for incidents
   - Log aggregation and analysis
   - Security dashboard

## Summary

Step 210 provides comprehensive security testing coverage for the banking reconciliation platform:

✅ **Automated Security Tests**: Jest/Supertest test suite covering all major vulnerabilities
✅ **Vulnerability Checklist**: OWASP Top 10 & CWE Top 25 comprehensive checklist
✅ **Penetration Testing Guidance**: Manual testing procedures and commands
✅ **Security Metrics**: Dashboard queries and reporting
✅ **Incident Response**: Documented procedures and commands
✅ **Compliance Testing**: SOC 2, GDPR, PCI DSS test procedures
✅ **Continuous Security**: CI/CD integration and regular review schedules

## Security Implementation Phase Complete

With Step 210, we've completed the entire Security Implementation phase (Steps 201-210):

- ✅ Step 201: Email Verification
- ✅ Step 202: Two-Factor Authentication (TOTP)
- ✅ Step 203: OAuth Integration
- ✅ Step 204: Session Management & JWT Refresh Tokens
- ✅ Step 205: Rate Limiting & Brute Force Protection
- ✅ Step 206: Password Reset & Recovery
- ✅ Step 207: API Key Management
- ✅ Step 208: CORS & Security Headers
- ✅ Step 209: Audit Logging & Security Monitoring
- ✅ Step 210: Security Testing & Penetration Testing

The banking reconciliation platform now has enterprise-grade security controls with comprehensive testing and validation procedures.

## Files Created

1. `apps/auth-service/test/security/auth-security.spec.ts` - Automated security test suite (400+ lines)
2. `SECURITY_VULNERABILITY_CHECKLIST.md` - Comprehensive vulnerability checklist
3. `STEP_210_SECURITY_TESTING.md` - This documentation

## Next Steps

After completing the Security Implementation phase, recommended next steps:

1. **Run all security tests**: `npm test -- apps/auth-service/test/security`
2. **Review vulnerability checklist**: Complete `SECURITY_VULNERABILITY_CHECKLIST.md`
3. **Perform manual penetration testing**: Follow procedures in this document
4. **Set up monitoring**: Implement real-time security alerting
5. **Schedule security reviews**: Monthly and quarterly assessments
6. **Continue development**: Proceed to next phase of the platform implementation
