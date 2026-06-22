#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "🔍 Verifying Authentication Module Setup"
echo "════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
    fi
}

# Check Auth Module Files
echo "📦 Checking Auth Module Files..."
check_file "src/modules/auth/auth.validation.js"
check_file "src/modules/auth/auth.repository.js"
check_file "src/modules/auth/auth.service.js"
check_file "src/modules/auth/auth.controller.js"
check_file "src/modules/auth/auth.routes.js"
echo ""

# Check Middleware Files
echo "🛡️ Checking Middleware Files..."
check_file "src/middleware/auth.middleware.js"
check_file "src/middleware/validation.middleware.js"
check_file "src/middleware/audit.middleware.js"
echo ""

# Check Test Files
echo "🧪 Checking Test Files..."
check_file "tests/auth.test.http"
check_file "tests/test-auth.js"
echo ""

# Check if zod is installed
echo "📚 Checking Dependencies..."
if grep -q '"zod"' package.json; then
    echo -e "${GREEN}✓${NC} zod installed"
else
    echo -e "${RED}✗${NC} zod NOT installed (run: npm install zod)"
fi
echo ""

# Check Prisma
echo "🗄️ Checking Prisma Setup..."
check_file "prisma/schema.prisma"
check_file "node_modules/.prisma/client/index.js"

if [ ! -f "node_modules/.prisma/client/index.js" ]; then
    echo -e "${YELLOW}⚠${NC}  Run: npx prisma generate"
fi
echo ""

# Check Environment
echo "⚙️ Checking Environment..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    if grep -q "DATABASE_URL" .env; then
        echo -e "${GREEN}✓${NC} DATABASE_URL configured"
    else
        echo -e "${RED}✗${NC} DATABASE_URL not set"
    fi
    
    if grep -q "JWT_SECRET" .env; then
        echo -e "${GREEN}✓${NC} JWT_SECRET configured"
    else
        echo -e "${RED}✗${NC} JWT_SECRET not set"
    fi
else
    echo -e "${RED}✗${NC} .env file missing (run: cp .env.example .env)"
fi
echo ""

echo "════════════════════════════════════════════════════════"
echo "📋 Next Steps:"
echo "════════════════════════════════════════════════════════"
echo ""
echo "1. Install dependencies (if not done):"
echo "   npm install"
echo ""
echo "2. Generate Prisma Client:"
echo "   npx prisma generate"
echo ""
echo "3. Push schema to MongoDB:"
echo "   npx prisma db push"
echo ""
echo "4. Seed database:"
echo "   npm run prisma:seed"
echo ""
echo "5. Start server:"
echo "   npm run dev"
echo ""
echo "6. Test endpoints:"
echo "   - Open tests/auth.test.http in VS Code"
echo "   - Or run: node tests/test-auth.js"
echo ""
echo "════════════════════════════════════════════════════════"
