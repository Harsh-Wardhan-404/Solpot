#!/bin/bash

# Universal Pot Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Universal Pot Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install pnpm"
        exit 1
    fi
    
    if ! command -v solana &> /dev/null; then
        print_error "Solana CLI is not installed. Please install Solana CLI"
        exit 1
    fi
    
    if ! command -v anchor &> /dev/null; then
        print_error "Anchor CLI is not installed. Please install Anchor CLI"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI is not installed. Installing..."
        npm install -g vercel
    fi
    
    print_status "All dependencies are available ✅"
}

# Deploy Solana program
deploy_program() {
    print_status "Deploying Solana program..."
    
    cd anchor
    
    # Build the program
    print_status "Building Anchor program..."
    anchor build
    
    # Deploy to devnet first
    print_status "Deploying to devnet..."
    anchor deploy --provider.cluster devnet
    
    # Get the program ID
    PROGRAM_ID=$(solana address --keypair target/deploy/universal_pot-keypair.json)
    print_status "Program deployed with ID: $PROGRAM_ID"
    
    # Update .env.local with new program ID
    if [ -f "../.env.local" ]; then
        sed -i.bak "s/NEXT_PUBLIC_PROGRAM_ID=.*/NEXT_PUBLIC_PROGRAM_ID=$PROGRAM_ID/" ../.env.local
        print_status "Updated .env.local with new program ID"
    fi
    
    cd ..
}

# Initialize the pot
init_pot() {
    print_status "Initializing pot..."
    
    # Wait a moment for deployment to settle
    sleep 5
    
    # Run init script
    node scripts/initPot.js
    
    print_status "Pot initialized successfully ✅"
}

# Deploy frontend
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    # Install dependencies
    pnpm install
    
    # Build the project
    pnpm build
    
    # Deploy to Vercel
    vercel --prod --yes
    
    print_status "Frontend deployed successfully ✅"
}

# Main deployment function
main() {
    echo "🎰 Universal Pot Deployment Script"
    echo "=================================="
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "anchor" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check dependencies
    check_dependencies
    
    # Ask for deployment target
    echo ""
    echo "Select deployment target:"
    echo "1) Devnet (for testing)"
    echo "2) Mainnet (for production)"
    read -p "Enter choice (1 or 2): " choice
    
    case $choice in
        1)
            print_status "Deploying to devnet..."
            # Set devnet
            solana config set --url https://api.devnet.solana.com
            ;;
        2)
            print_status "Deploying to mainnet..."
            # Set mainnet
            solana config set --url https://api.mainnet-beta.solana.com
            print_warning "Make sure you have enough SOL for deployment fees!"
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    # Deploy program
    deploy_program
    
    # Initialize pot
    init_pot
    
    # Deploy frontend
    deploy_frontend
    
    echo ""
    print_status "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update Vercel environment variables with your program ID"
    echo "2. Set up your platform treasury address"
    echo "3. Configure cron secret for automated pot management"
    echo "4. Test the deployed application"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT.md"
}

# Run main function
main "$@"
