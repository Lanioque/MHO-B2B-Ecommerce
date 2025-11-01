#!/bin/bash
# Script to find all compilation errors in the MHO project

echo "🔍 Checking for compilation errors..."
echo ""

# Navigate to web app directory
cd apps/web || exit 1

echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔎 Running TypeScript type check (no emit)..."
pnpm exec tsc --noEmit 2>&1 | tee /tmp/tsc-errors.log

TS_ERRORS=$(grep -c "error TS" /tmp/tsc-errors.log 2>/dev/null || echo "0")
if [ "$TS_ERRORS" -gt 0 ]; then
    echo ""
    echo "❌ Found $TS_ERRORS TypeScript errors"
    echo "📄 Full output saved to /tmp/tsc-errors.log"
else
    echo "✅ No TypeScript errors found"
fi

echo ""
echo "🔨 Running Next.js build..."
pnpm build 2>&1 | tee /tmp/build-errors.log

BUILD_ERRORS=$(grep -c "error\|Error" /tmp/build-errors.log 2>/dev/null || echo "0")
if [ "$BUILD_ERRORS" -gt 0 ]; then
    echo ""
    echo "❌ Found build errors"
    echo "📄 Full output saved to /tmp/build-errors.log"
    echo ""
    echo "📋 Summary of errors:"
    grep -E "error|Error" /tmp/build-errors.log | head -20
else
    echo "✅ Build completed successfully"
fi

echo ""
echo "📊 Summary:"
echo "  - TypeScript errors: $TS_ERRORS"
echo "  - Build errors found: $BUILD_ERRORS"
echo ""
echo "💡 To view full logs:"
echo "  - TypeScript: cat /tmp/tsc-errors.log"
echo "  - Build: cat /tmp/build-errors.log"

