#!/bin/bash

# Script to set up Stripe webhook for local development and production
# Usage: ./scripts/setup-stripe-webhook.sh [prod|dev]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Stripe Webhook Setup${NC}"
echo "================================"

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI is not installed.${NC}"
    echo ""
    echo "Install it with:"
    echo "  brew install stripe/stripe-cli/stripe  # macOS"
    echo "  or see https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if logged in to Stripe CLI
if ! stripe config --list &> /dev/null; then
    echo -e "${YELLOW}⚠️  You need to log in to Stripe CLI first.${NC}"
    echo "Run: stripe login"
    exit 1
fi

MODE=${1:-dev}

if [ "$MODE" == "dev" ]; then
    echo ""
    echo -e "${GREEN}📡 Starting webhook forwarding for local development...${NC}"
    echo ""
    echo "This will forward Stripe events to your local Convex dev server."
    echo "Keep this terminal open while developing."
    echo ""

    # Start webhook forwarding to Convex HTTP endpoint
    stripe listen --forward-to https://reliable-scorpion-10.convex.site/stripe-webhook \
        --events checkout.session.completed,checkout.session.expired,payment_intent.payment_failed

elif [ "$MODE" == "prod" ]; then
    echo ""
    echo -e "${GREEN}🚀 Creating production webhook...${NC}"
    echo ""

    WEBHOOK_URL="https://reliable-scorpion-10.convex.site/stripe-webhook"

    # Create webhook endpoint
    WEBHOOK_ID=$(stripe webhook_endpoints create \
        --url="$WEBHOOK_URL" \
        --enabled-events checkout.session.completed,checkout.session.expired,payment_intent.payment_failed \
        --format json | jq -r '.id')

    if [ -z "$WEBHOOK_ID" ] || [ "$WEBHOOK_ID" == "null" ]; then
        echo -e "${RED}❌ Failed to create webhook endpoint${NC}"
        exit 1
    fi

    # Get the webhook secret
    WEBHOOK_SECRET=$(stripe webhook_endpoints retrieve "$WEBHOOK_ID" --format json | jq -r '.secret')

    echo -e "${GREEN}✅ Webhook created successfully!${NC}"
    echo ""
    echo "Webhook ID: $WEBHOOK_ID"
    echo "Webhook URL: $WEBHOOK_URL"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Add this secret to your Convex environment:${NC}"
    echo ""
    echo "  npx convex env set STRIPE_WEBHOOK_SECRET $WEBHOOK_SECRET"
    echo ""
    echo "Or via Convex Dashboard: https://dashboard.convex.dev"

else
    echo "Usage: $0 [dev|prod]"
    echo ""
    echo "  dev  - Start webhook forwarding for local development"
    echo "  prod - Create production webhook endpoint"
    exit 1
fi
