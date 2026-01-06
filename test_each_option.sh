#!/bin/bash

# Test each optimization option individually
AUDIT_ID="j571vadqvpzpwftetzsw74e9v57yqv9g"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  OPTIMIZATION OPTIONS INDIVIDUAL TEST                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Audit ID: $AUDIT_ID"
echo ""

# Function to wait for optimization result to appear
wait_for_result() {
    local max_attempts=36  # 36 * 5s = 180s = 3 min
    for i in $(seq 1 $max_attempts); do
        result=$(npx convex run dev:getOptimizationResultDev "{\"auditId\": \"$AUDIT_ID\"}" 2>/dev/null)

        if echo "$result" | grep -q '"hasOptimization": true'; then
            echo "$result"
            return 0
        fi

        # Also check job status for errors
        job_result=$(npx convex run dev:getOptimizationJobStatusDev "{\"auditId\": \"$AUDIT_ID\"}" 2>/dev/null)
        job_status=$(echo "$job_result" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)

        if [ "$job_status" = "failed" ]; then
            error_msg=$(echo "$job_result" | grep -o '"errorMessage": "[^"]*"' | cut -d'"' -f4)
            echo "JOB_FAILED: $error_msg"
            return 1
        fi

        echo -n "."
        sleep 5
    done
    echo ""
    echo "TIMEOUT"
    return 1
}

# Function to test a single option
test_option() {
    local option_key="$1"
    local option_name="$2"

    echo ""
    echo "============================================================"
    echo "Testing: $option_name ($option_key)"
    echo "============================================================"

    # 1. Reset optimization
    echo ""
    echo "📋 1. Resetting optimization..."
    npx convex run dev:resetOptimizationDev "{\"auditId\": \"$AUDIT_ID\"}" 2>/dev/null >/dev/null
    sleep 2  # Wait for reset to complete
    echo "  ✅ Reset complete"

    # 2. Verify reset worked
    verify=$(npx convex run dev:getOptimizationResultDev "{\"auditId\": \"$AUDIT_ID\"}" 2>/dev/null)
    if echo "$verify" | grep -q '"hasOptimization": true'; then
        echo "  ⚠️  Warning: Reset may not have cleared previous optimization"
    fi

    # 3. Run with ONLY this option
    echo ""
    echo "📋 2. Running optimization with ONLY \"$option_key\" enabled..."
    npx convex run dev:runOptimizationDev "{\"auditId\": \"$AUDIT_ID\", \"selectedOptions\": [\"$option_key\"]}" 2>/dev/null >/dev/null

    echo "  ⏳ Waiting for optimization result (max 3 min)..."
    result=$(wait_for_result)

    if echo "$result" | grep -q "TIMEOUT\|JOB_FAILED"; then
        echo "  ❌ $result"
        return 1
    fi

    changes=$(echo "$result" | grep -o '"totalChanges": [0-9]*' | grep -o '[0-9]*')
    descriptions=$(echo "$result" | grep -o '"descriptionsAdded": [0-9]*' | grep -o '[0-9]*')
    names=$(echo "$result" | grep -o '"namesImproved": [0-9]*' | grep -o '[0-9]*')
    categories=$(echo "$result" | grep -o '"categoriesOptimized": [0-9]*' | grep -o '[0-9]*')
    duplicates=$(echo "$result" | grep -o '"duplicatesFound": [0-9]*' | grep -o '[0-9]*')
    options=$(echo "$result" | grep -o '"selectedOptions": \[[^]]*\]')

    echo ""
    echo "  📊 Results:"
    echo "     totalChanges: $changes"
    echo "     descriptionsAdded: $descriptions"
    echo "     namesImproved: $names"
    echo "     categoriesOptimized: $categories"
    echo "     duplicatesFound: $duplicates"
    echo "     $options"

    # 4. Validate
    echo ""
    if [ -z "$changes" ] || [ "$changes" = "0" ]; then
        echo "  ❌ FAIL: \"$option_key\" produces 0 changes"
        return 1
    else
        echo "  ✅ PASS: \"$option_key\" produces $changes changes"
        return 0
    fi
}

# Track results
passed=0
failed=0
results=()

# Test each option
OPTIONS=("descriptions" "seo" "categories" "order" "prices" "duplicates" "duration" "tags")
NAMES=("Opisy usług" "SEO keywords" "Struktura kategorii" "Kolejność usług" "Formatowanie cen" "Duplikaty" "Czas trwania" "Tagi")

for i in "${!OPTIONS[@]}"; do
    if test_option "${OPTIONS[$i]}" "${NAMES[$i]}"; then
        ((passed++))
        results+=("✅ ${OPTIONS[$i]}")
    else
        ((failed++))
        results+=("❌ ${OPTIONS[$i]}")
    fi
done

# Final summary
echo ""
echo ""
echo "════════════════════════════════════════════════════════════"
echo "FINAL SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo ""
for r in "${results[@]}"; do
    echo "  $r"
done
echo ""
echo "✅ Passed: $passed/8"
echo "❌ Failed: $failed/8"
echo ""

# Reset to all options at the end
echo "📋 Resetting and running with ALL options..."
npx convex run dev:resetOptimizationDev "{\"auditId\": \"$AUDIT_ID\"}" 2>/dev/null >/dev/null
sleep 2
npx convex run dev:runOptimizationDev "{\"auditId\": \"$AUDIT_ID\", \"selectedOptions\": [\"descriptions\",\"seo\",\"categories\",\"order\",\"prices\",\"duplicates\",\"duration\",\"tags\"]}" 2>/dev/null >/dev/null
echo "✅ Done"
