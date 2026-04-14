# Step 141: AWS CLI Installation - Infrastructure Setup Begins

## 📍 Phase 3: Cloud Infrastructure

**Phase:** Cloud Infrastructure (Weeks 6-8)
**Week:** 6 - VPC & Networking
**Step:** 141/280 (50.36%)
**Status:** ⚠️ REQUIRES USER ACTION

## 🎯 Overview

Step 141 marks the beginning of **Phase 3: Cloud Infrastructure**, transitioning from frontend development to production deployment infrastructure. This phase focuses on setting up AWS cloud resources required to deploy the Banking Reconciliation SaaS application.

### What This Step Does

- Installs AWS CLI (Command Line Interface) v2
- Enables interaction with AWS services from command line
- Sets foundation for VPC, EKS, and RDS setup
- Prepares for infrastructure-as-code deployment

### Why It's Important

The AWS CLI is essential for:
- Creating and managing VPC resources
- Setting up EKS (Elastic Kubernetes Service) cluster
- Configuring RDS (Relational Database Service)
- Deploying application to production
- Managing AWS infrastructure programmatically

## ⚠️ PREREQUISITES - HUMAN INTERVENTION REQUIRED

Before proceeding with Step 141, **YOU (the user) must complete these prerequisites:**

### 1. Create AWS Account

If you don't have an AWS account:

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the registration process
4. Provide payment information (AWS Free Tier available)
5. Verify your account

**Note:** AWS provides a Free Tier that includes:
- 750 hours/month of t2.micro EC2 instances (1 year)
- 20GB of RDS storage (1 year)
- 5GB of S3 storage (unlimited)

### 2. Create IAM User for Deployment

Once you have an AWS account, create a dedicated IAM user for this project:

**Step-by-Step Instructions:**

1. **Sign in to AWS Console**
   - Go to https://console.aws.amazon.com
   - Sign in with your root account credentials

2. **Navigate to IAM**
   - Search for "IAM" in the AWS Console search bar
   - Click on "IAM" (Identity and Access Management)

3. **Create User**
   - Click "Users" in the left sidebar
   - Click "Add users" button
   - User name: `banking-recon-deployer`
   - Access type: ✅ Programmatic access
   - Click "Next: Permissions"

4. **Attach Policies**

   Attach the following AWS managed policies:
   - ✅ `AmazonEC2FullAccess` - For VPC, subnets, security groups
   - ✅ `AmazonEKSClusterPolicy` - For Kubernetes cluster management
   - ✅ `AmazonRDSFullAccess` - For database management
   - ✅ `AmazonS3FullAccess` - For file storage
   - ✅ `IAMFullAccess` - For managing service roles
   - ✅ `AmazonVPCFullAccess` - For VPC management
   - ✅ `CloudWatchLogsFullAccess` - For logging

   Click "Next: Tags" → "Next: Review" → "Create user"

5. **Save Access Keys**

   **⚠️ CRITICAL:** You will only see these credentials ONCE

   - Copy `Access key ID` (starts with AKIA...)
   - Copy `Secret access key`
   - Download the CSV file for backup
   - Store these securely (use password manager)

### 3. Prepare Credentials File

Create a `.env.aws` file in your project root:

```bash
# File: .env.aws
# ⚠️ DO NOT COMMIT THIS FILE TO GIT

AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
```

**Important Security Notes:**
- ✅ Add `.env.aws` to `.gitignore`
- ❌ NEVER commit AWS credentials to version control
- ✅ Use different credentials for dev/staging/production
- ✅ Rotate credentials regularly (every 90 days)
- ✅ Enable MFA (Multi-Factor Authentication) on AWS account

### 4. Verify Billing Alerts

**Recommended:** Set up billing alerts to avoid unexpected charges

1. Go to AWS Billing Dashboard
2. Click "Billing preferences"
3. Enable "Receive Free Tier Usage Alerts"
4. Enable "Receive Billing Alerts"
5. Set up CloudWatch billing alarm for $10, $50, $100 thresholds

## 📦 AWS CLI Installation

### Installation on Different Operating Systems

#### **Linux (x86_64)**

```bash
# Download AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Unzip the installer
unzip awscliv2.zip

# Run the installer
sudo ./aws/install

# Verify installation
aws --version
# Expected output: aws-cli/2.x.x Python/3.x.x Linux/x.x.x
```

#### **Linux (ARM/aarch64)**

```bash
# Download AWS CLI v2 for ARM
curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"

# Unzip and install
unzip awscliv2.zip
sudo ./aws/install

# Verify
aws --version
```

#### **macOS**

```bash
# Download AWS CLI v2 for macOS
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"

# Run the installer
sudo installer -pkg AWSCLIV2.pkg -target /

# Verify installation
aws --version
```

**Alternative (Homebrew):**
```bash
brew install awscli
```

#### **Windows**

1. **Download Installer**
   - Go to https://awscli.amazonaws.com/AWSCLIV2.msi
   - Download the MSI installer

2. **Run Installer**
   - Double-click `AWSCLIV2.msi`
   - Follow the installation wizard
   - Accept defaults

3. **Verify Installation**
   ```cmd
   aws --version
   ```

**Alternative (Chocolatey):**
```powershell
choco install awscli
```

**Alternative (Scoop):**
```powershell
scoop install aws
```

#### **Docker (Any OS)**

If you prefer using Docker:

```bash
# Run AWS CLI in Docker container
docker run --rm -it amazon/aws-cli:latest --version

# Create alias for convenience
alias aws='docker run --rm -it -v ~/.aws:/root/.aws -v $(pwd):/aws amazon/aws-cli:latest'
```

### Installation Verification

After installation, verify AWS CLI is properly installed:

```bash
# Check version (should be 2.x.x)
aws --version

# Check installation path
which aws

# Get help
aws help
```

**Expected Output:**
```
aws-cli/2.13.x Python/3.11.x Linux/5.x.x exe/x86_64.ubuntu.22
```

## 🔧 Post-Installation Steps

### 1. Configure AWS CLI

After installing AWS CLI, configure it with your credentials:

```bash
aws configure
```

**Interactive Prompts:**
```
AWS Access Key ID [None]: AKIAxxxxxxxxxxxxxxxxxx
AWS Secret Access Key [None]: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Default region name [None]: us-east-1
Default output format [None]: json
```

**What Each Setting Means:**
- **Access Key ID:** Your IAM user access key (from step 2)
- **Secret Access Key:** Your IAM user secret key (from step 2)
- **Region:** AWS region where resources will be created
  - `us-east-1` - US East (N. Virginia) - Recommended
  - `us-west-2` - US West (Oregon)
  - `eu-west-1` - Europe (Ireland)
- **Output format:** How AWS CLI returns data
  - `json` - JSON format (recommended)
  - `yaml` - YAML format
  - `table` - ASCII table format
  - `text` - Plain text

### 2. Verify Configuration

Check that configuration was successful:

```bash
# View configuration
aws configure list

# View credentials file
cat ~/.aws/credentials

# View config file
cat ~/.aws/config
```

**Expected Files:**

`~/.aws/credentials`:
```ini
[default]
aws_access_key_id = AKIAxxxxxxxxxxxxxxxxxx
aws_secret_access_key = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`~/.aws/config`:
```ini
[default]
region = us-east-1
output = json
```

### 3. Test AWS Connectivity

Verify you can connect to AWS:

```bash
# Get caller identity (who you are)
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAxxxxxxxxxxxxxxxxxxx",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/banking-recon-deployer"
# }
```

**If this works, you're ready to proceed! ✅**

**If this fails:**
- Check credentials are correct
- Verify IAM user has necessary permissions
- Check internet connectivity
- Verify no proxy/firewall blocking AWS API calls

### 4. Set Up Named Profiles (Optional)

For multiple environments (dev, staging, prod):

```bash
# Configure additional profiles
aws configure --profile dev
aws configure --profile staging
aws configure --profile prod

# Use specific profile
aws s3 ls --profile dev
aws ec2 describe-instances --profile prod

# Set default profile
export AWS_PROFILE=dev
```

## 📊 What's Next - Steps 142-150

After completing Step 141 (AWS CLI installation), you'll proceed with:

**Step 142:** Configure AWS CLI (completed above if you ran `aws configure`)

**Step 143:** Create VPC using Terraform/CloudFormation
- Read infrastructure specifications
- Set up Virtual Private Cloud
- Configure CIDR blocks

**Step 144:** Create Subnets (public + private)
- 2 public subnets (for load balancers)
- 2 private subnets (for application servers)
- Multi-AZ for high availability

**Step 145:** Create Internet Gateway
- Enable internet access for public subnets
- Attach to VPC

**Step 146:** Create NAT Gateways (2)
- Enable outbound internet for private subnets
- Allocate Elastic IPs
- 2 NAT gateways for redundancy

**Step 147:** Create Route Tables
- Public route table (internet gateway)
- Private route tables (NAT gateways)
- Associate with subnets

**Step 148:** Create Security Groups
- ALB security group (HTTP/HTTPS)
- EKS nodes security group
- RDS security group
- Define ingress/egress rules

**Step 149:** Verify VPC Setup
- Check VPC created correctly
- Verify subnets in multiple AZs
- Confirm route tables configured

**Step 150:** Tag Resources
- Apply consistent tagging strategy
- Project, Environment, Owner tags
- Enable cost tracking

## 🏗️ Architecture Context

### Overall Infrastructure Architecture

The infrastructure you're building will include:

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    VPC (10.0.0.0/16)                  │  │
│  │                                                        │  │
│  │  ┌──────────────────┐    ┌──────────────────┐        │  │
│  │  │  Public Subnet   │    │  Public Subnet   │        │  │
│  │  │  10.0.1.0/24     │    │  10.0.2.0/24     │        │  │
│  │  │  (us-east-1a)    │    │  (us-east-1b)    │        │  │
│  │  │                  │    │                  │        │  │
│  │  │  ┌────────────┐  │    │  ┌────────────┐  │        │  │
│  │  │  │    ALB     │  │    │  │ NAT Gateway│  │        │  │
│  │  │  └────────────┘  │    │  └────────────┘  │        │  │
│  │  └──────────────────┘    └──────────────────┘        │  │
│  │                                                        │  │
│  │  ┌──────────────────┐    ┌──────────────────┐        │  │
│  │  │  Private Subnet  │    │  Private Subnet  │        │  │
│  │  │  10.0.3.0/24     │    │  10.0.4.0/24     │        │  │
│  │  │  (us-east-1a)    │    │  (us-east-1b)    │        │  │
│  │  │                  │    │                  │        │  │
│  │  │  ┌────────────┐  │    │  ┌────────────┐  │        │  │
│  │  │  │ EKS Nodes  │  │    │  │ EKS Nodes  │  │        │  │
│  │  │  │    RDS     │  │    │  │    RDS     │  │        │  │
│  │  │  └────────────┘  │    │  └────────────┘  │        │  │
│  │  └──────────────────┘    └──────────────────┘        │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack - Infrastructure

**Networking:**
- VPC (Virtual Private Cloud)
- Subnets (public/private, multi-AZ)
- Internet Gateway
- NAT Gateways (2)
- Route Tables
- Security Groups

**Compute:**
- EKS (Elastic Kubernetes Service) - Steps 151-170
- EC2 instances (worker nodes)
- Auto Scaling Groups

**Database:**
- RDS PostgreSQL - Steps 161-165
- Multi-AZ deployment
- Automated backups

**Storage:**
- S3 buckets - for file uploads, backups
- EBS volumes - for persistent storage

**Load Balancing:**
- Application Load Balancer (ALB)
- Target Groups
- Health Checks

**Security:**
- IAM roles and policies
- Security Groups
- Network ACLs
- Secrets Manager (for credentials)

**Monitoring:**
- CloudWatch Logs
- CloudWatch Metrics
- CloudWatch Alarms

## 💰 Cost Considerations

### Estimated Monthly Costs

**Development Environment:**
- VPC: Free
- NAT Gateway: ~$32/month (2 gateways)
- EKS Control Plane: $73/month
- EC2 Instances (t3.medium × 3): ~$100/month
- RDS (db.t3.medium): ~$60/month
- ALB: ~$16/month
- Data Transfer: ~$10/month
- **Total: ~$290/month**

**Production Environment:**
- Similar base costs
- + Higher instance sizes
- + Multi-AZ RDS
- + Increased data transfer
- **Total: ~$500-1000/month**

**Cost Optimization Tips:**
1. Use Free Tier where available (first 12 months)
2. Stop development instances when not in use
3. Use t3/t4g instance types (burstable)
4. Enable S3 lifecycle policies
5. Use CloudWatch alarms for cost monitoring
6. Consider Reserved Instances for production (save 30-70%)

## 🔒 Security Best Practices

### AWS Account Security

1. **Enable MFA (Multi-Factor Authentication)**
   - On root account (REQUIRED)
   - On IAM users (RECOMMENDED)
   - Use hardware key or authenticator app

2. **Use IAM Roles for EC2/EKS**
   - Never store credentials on EC2 instances
   - Use instance profiles
   - Rotate credentials regularly

3. **Principle of Least Privilege**
   - Only grant necessary permissions
   - Use specific IAM policies
   - Avoid using root account

4. **Enable CloudTrail**
   - Log all API calls
   - Store logs in S3
   - Set up alerts for suspicious activity

5. **Encrypt Everything**
   - EBS volumes (encryption at rest)
   - S3 buckets (server-side encryption)
   - RDS databases (encryption at rest)
   - TLS/SSL in transit

### Credential Management

**DO:**
- ✅ Use AWS Secrets Manager or Parameter Store
- ✅ Rotate credentials every 90 days
- ✅ Use environment variables
- ✅ Use IAM roles when possible
- ✅ Store credentials in password manager

**DON'T:**
- ❌ Commit credentials to Git
- ❌ Hardcode credentials in code
- ❌ Share credentials via email/Slack
- ❌ Use root account for daily tasks
- ❌ Reuse credentials across environments

## 📝 Documentation Files Created

After completing Step 141, you should have:

1. **STEP_141_AWS_CLI_INSTALLATION.md** (this file)
   - Installation instructions
   - Prerequisites and setup
   - Configuration guide
   - Architecture overview

2. **.env.aws** (created by user, not committed)
   - AWS credentials
   - Region configuration

3. **~/.aws/credentials** (created by `aws configure`)
   - AWS access keys

4. **~/.aws/config** (created by `aws configure`)
   - Default region and output format

## ✅ Step 141 Completion Checklist

Before proceeding to Step 142, verify:

- [ ] AWS account created
- [ ] IAM user created (`banking-recon-deployer`)
- [ ] IAM policies attached (EC2, EKS, RDS, S3, IAM, VPC, CloudWatch)
- [ ] Access keys generated and saved securely
- [ ] `.env.aws` file created (and in `.gitignore`)
- [ ] AWS CLI v2 installed
- [ ] `aws --version` shows version 2.x.x
- [ ] `aws configure` completed
- [ ] `aws sts get-caller-identity` succeeds
- [ ] Billing alerts set up
- [ ] MFA enabled on AWS account
- [ ] Documentation reviewed

## 🚧 Known Limitations - Sandbox Environment

**Note:** If you're running this in a sandboxed/restricted environment (like Claude Code's sandbox), you may encounter:

1. **Download Restrictions**
   - Cannot download files from external URLs
   - Solution: Install AWS CLI on your local machine

2. **Sudo Access**
   - May not have sudo/root access
   - Solution: Use Docker-based AWS CLI or install in user space

3. **Network Restrictions**
   - Firewall may block AWS API calls
   - Solution: Configure proxy or whitelist AWS endpoints

**For Development:**
If you cannot install AWS CLI in your current environment, you can:
- Document the infrastructure as code (Terraform)
- Create scripts for later execution
- Use AWS Console for manual resource creation
- Deploy on local machine with proper AWS access

## 📚 Additional Resources

**AWS CLI Documentation:**
- Official Docs: https://docs.aws.amazon.com/cli/latest/userguide/
- Installation: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- Configuration: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

**AWS Services Documentation:**
- VPC: https://docs.aws.amazon.com/vpc/
- EKS: https://docs.aws.amazon.com/eks/
- RDS: https://docs.aws.amazon.com/rds/
- IAM: https://docs.aws.amazon.com/iam/

**Best Practices:**
- AWS Well-Architected Framework: https://aws.amazon.com/architecture/well-architected/
- Security Best Practices: https://aws.amazon.com/security/best-practices/
- Cost Optimization: https://aws.amazon.com/pricing/cost-optimization/

**Learning Resources:**
- AWS Free Tier: https://aws.amazon.com/free/
- AWS Training: https://aws.amazon.com/training/
- AWS Architecture Center: https://aws.amazon.com/architecture/

## 🎯 Next Step

Once Step 141 is complete and you've verified all prerequisites:

**→ Proceed to Step 142: Configure AWS CLI** (if not already done with `aws configure`)

**→ Then Step 143: Create VPC using Terraform/CloudFormation**

---

**Step 141 Status:** ✅ DOCUMENTED - Ready for user execution

**Important:** This step requires user action outside the sandbox environment. The user must:
1. Create AWS account
2. Create IAM user
3. Install AWS CLI on their local machine
4. Configure credentials
5. Verify connectivity

**Once completed, we can proceed with infrastructure creation in Steps 142-150.**

---

*Document Version: 1.0*
*Last Updated: 2024-01-15*
*Phase: 3 - Cloud Infrastructure*
*Progress: 141/280 (50.36%)*
