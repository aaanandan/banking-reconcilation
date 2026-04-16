#!/bin/bash
# Oracle Cloud Deployment Script
# Run this on your OCI VM after first login

set -e

echo "=================================================="
echo "🚀 Banking Reconciliation - OCI Deployment Setup"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_info() { echo -e "${YELLOW}➜${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   print_error "Please run as normal user (not root)"
   exit 1
fi

print_info "Starting automated setup..."
echo ""

# Step 1: Update system
print_info "Step 1/9: Updating system packages..."
sudo apt update -qq
sudo apt upgrade -y -qq
print_success "System updated"

# Step 2: Install Node.js
print_info "Step 2/9: Installing Node.js 18..."
if command -v node &> /dev/null; then
    print_success "Node.js already installed ($(node --version))"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed ($(node --version))"
fi

# Step 3: Install PostgreSQL
print_info "Step 3/9: Installing PostgreSQL 15..."
if command -v psql &> /dev/null; then
    print_success "PostgreSQL already installed"
else
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt update -qq
    sudo apt install -y postgresql-15
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    print_success "PostgreSQL 15 installed and started"
fi

# Step 4: Install Git
print_info "Step 4/9: Installing Git..."
sudo apt install -y git
print_success "Git installed ($(git --version))"

# Step 5: Install Docker
print_info "Step 5/9: Installing Docker..."
if command -v docker &> /dev/null; then
    print_success "Docker already installed"
else
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker $USER
    sudo systemctl start docker
    sudo systemctl enable docker
    print_success "Docker installed"
    print_info "Note: Logout and login again for docker group to take effect"
fi

# Step 6: Install PM2
print_info "Step 6/9: Installing PM2..."
if command -v pm2 &> /dev/null; then
    print_success "PM2 already installed"
else
    sudo npm install -g pm2
    print_success "PM2 installed globally"
fi

# Step 7: Setup PostgreSQL database
print_info "Step 7/9: Setting up database..."
DB_PASSWORD=$(openssl rand -base64 24)
sudo -u postgres psql -c "CREATE DATABASE banking_reconciliation;" 2>/dev/null || print_info "Database already exists"
sudo -u postgres psql -c "CREATE USER bankinguser WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null || print_info "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE banking_reconciliation TO bankinguser;" 2>/dev/null
print_success "Database configured"
echo "Database password: $DB_PASSWORD" > ~/.banking_db_password
print_info "Database password saved to ~/.banking_db_password"

# Step 8: Configure firewall
print_info "Step 8/9: Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5173/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable
print_success "Firewall configured"

# Step 9: Clone repository (if not already present)
print_info "Step 9/9: Repository setup..."
if [ -d "$HOME/banking-reconcilation" ]; then
    print_success "Repository already exists at ~/banking-reconcilation"
else
    print_info "Please clone your repository manually:"
    echo "  git clone https://github.com/yourusername/banking-reconcilation.git"
    echo "  Or copy files from your local machine"
fi

echo ""
echo "=================================================="
print_success "Base setup completed!"
echo "=================================================="
echo ""
echo "📝 Next steps:"
echo "1. Clone or copy your repository to ~/banking-reconcilation"
echo "2. cd ~/banking-reconcilation"
echo "3. Copy .env.example to .env"
echo "4. Edit .env with your settings (use password from ~/.banking_db_password)"
echo "5. Run deployment:"
echo "   cd banking-reconciliation-system"
echo "   npm install"
echo "   npm run migration:run"
echo "   npm run build"
echo ""
echo "6. Start services with PM2:"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "📊 Your database password is saved in: ~/.banking_db_password"
echo "🌐 Don't forget to update OCI Security List to allow inbound traffic!"
echo ""
print_success "Ready for application deployment!"
