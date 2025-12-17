# Draft System - Visual Component Map

## Current Architecture (What to Eliminate)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION ENTRY POINTS                      │
└─────────────────────────────────────────────────────────────────────┘
    │                          │                          │
    │                          │                          │
    v                          v                          v
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ StartGenerator   │   │    PreviewPage   │   │  ProfilePage     │
│  (NEW PRICELIST) │   │  (SHARE LINKS)   │   │ (EDIT/MANAGE)    │
│                  │   │                  │   │                  │
│ ❌ draftId      │   │ ❌ draftId      │   │ ❌ createDraft   │
│ ✅ pricelistId  │   │ ✅ pricelistId  │   │    FromPricelist │
│ ✅ pricingData  │   │                  │   │ ✅ pricelistId  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
    │                          │                          │
    │ saveDraft()             │ getDraft()              │ createDraft
    │ updateDraft()           │ getPricelistPublic()    │ FromPricelist()
    │ convertDraftTo          │                          │
    │ Pricelist()             │                          │
    │                          │                          │
    └──────────────────┬───────┴──────────┬──────────────┘
                       │                  │
                       v                  v
        ┌──────────────────────────────────────────┐
        │     CONVEX DATABASE (Backend)             │
        │                                          │
        │  ❌ pricelistDrafts TABLE                │
        │  ✅ pricelists TABLE                     │
        │                                          │
        │  Functions to Delete:                   │
        │  ❌ getDraft()                           │
        │  ❌ saveDraft()                          │
        │  ❌ updateDraft()                        │
        │  ❌ deleteDraft()                        │
        │  ❌ getUserDrafts()                      │
        │  ❌ createDraftFromPricelist()           │
        │  ❌ convertDraftToPricelist()            │
        │  ❌ linkDraftToPurchase()                │
        └──────────────────────────────────────────┘
```

---

## Current Data Flow (COMPLEX - Multiple Paths)

### Path 1: Anonymous User Creates and Shares
```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│ saveDraft()         │  (No userId, TTL=7 days)
│ Stores anonymously  │
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│ ?draft=abc123       │  (Public, shareable)
│ PreviewPage loads   │
└─────────────────────┘
       │
       ✅ WORKS (but only 7 days)
       ❌ Can't optimize (not logged in)
```

### Path 2: Logged-In User - Generate, Edit, Optimize
```
┌──────────────┐
│ User logs in │
└──────┬───────┘
       │
       v
┌──────────────────┐
│ saveDraft()      │  (With userId)
│ URL: ?draft=xxx  │
└──────┬───────────┘
       │
       v
┌──────────────────┐
│ updateDraft()    │  (Theme changes, etc.)
└──────┬───────────┘
       │
       v
┌──────────────────────────────────────────┐
│ Click "Optimize"                         │
│ Stripe checkout (draftId in metadata)    │
└──────┬───────────────────────────────────┘
       │
       v
┌──────────────────────────────────────────┐
│ /optimization-results?draft=x&session=y  │
│ • Verify payment (verifySession)         │
│ • User configures categories             │
│ • AI optimization runs                   │
│ • updateDraft(isOptimized=true)          │
└──────┬───────────────────────────────────┘
       │
       v
┌──────────────────────────────────────────┐
│ convertDraftToPricelist()                │
│ • Creates BOTH original + optimized      │
│ • Deletes draft                          │
│ • Returns pricelistId                    │
└──────┬───────────────────────────────────┘
       │
       v
┌──────────────────────────────────────────┐
│ Now stored as permanent pricelist        │
│ in pricelists table                      │
└──────┬───────────────────────────────────┘
       │
       v
┌──────────────────────────────────────────┐
│ Later: User wants to edit                │
│ ProfilePage → createDraftFromPricelist() │
│ → Creates NEW draft                      │
│ → Goes back to StartGenerator            │
│ → Cycle repeats                          │
└──────────────────────────────────────────┘
```

### Path 3: View Saved Optimization
```
┌──────────────────────────────────────┐
│ /optimization-results                │
│ ?pricelist=savedId (view-only mode)  │
│ • Load pricelist (owner-only)        │
│ • Load originalPricingDataJson       │
│ • Load optimizationResultJson        │
│ • Show comparison view               │
└──────────────────────────────────────┘
```

---

## After Refactoring (SIMPLIFIED)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION ENTRY POINTS                      │
└─────────────────────────────────────────────────────────────────────┘
    │
    └─────────┐
              v
        🔐 LOGIN WALL
              │
              v
┌─────────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATED USERS ONLY                            │
└─────────────────────────────────────────────────────────────────────┘
    │                          │                          │
    v                          v                          v
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ StartGenerator   │   │    PreviewPage   │   │  ProfilePage     │
│  (NEW PRICELIST) │   │  (SHARE LINKS)   │   │ (EDIT/MANAGE)    │
│                  │   │                  │   │                  │
│ ✅ pricelistId  │   │ ✅ pricelistId  │   │ ✅ Load direct   │
│ ✅ pricingData  │   │                  │   │    pricelistId   │
└──────────────────┘   └──────────────────┘   └──────────────────┘
    │                          │                          │
    │ savePricelist()         │ getPricelistPublic()    │ updatePricelist()
    │ updatePricelist()       │ (owner-only now)        │
    │                          │                          │
    └──────────────────┬───────┴──────────┬──────────────┘
                       │                  │
                       v                  v
        ┌──────────────────────────────────────────┐
        │     CONVEX DATABASE (Backend)             │
        │                                          │
        │  ✅ pricelists TABLE (only)              │
        │  ❌ pricelistDrafts TABLE removed        │
        │                                          │
        │  Simplified Functions:                  │
        │  ✅ savePricelist()                      │
        │  ✅ updatePricelist()                    │
        │  ✅ getPricelistPublic() [auth-required]│
        │  ✅ getUserPricelists()                  │
        │                                          │
        │  Optional: New table                    │
        │  ✅ publicLinks (for sharing)           │
        └──────────────────────────────────────────┘
```

---

## New Simplified Data Flow

### Single Path: Generate → Edit → Optimize
```
┌──────────────────┐
│ User logs in     │
│ (REQUIRED)       │
└────────┬─────────┘
         │
         v
┌──────────────────────────┐
│ Paste data               │
│ savePricelist()          │
│ (immediate, permanent)   │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐
│ updatePricelist()        │
│ (on every change)        │
│ • Theme changes         │
│ • Service edits         │
│ • Category reorders     │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────────────────────┐
│ Click "Optimize"                         │
│ Stripe checkout (pricelistId in meta)    │
└────────┬────────────────────────────────┘
         │
         v
┌──────────────────────────────────────────┐
│ /optimization-results?pricelist=x        │
│ • Verify payment                         │
│ • User configures categories             │
│ • AI optimization runs                   │
│ • updatePricelist(isOptimized=true)      │
│   (store original, result, optimized)    │
└────────┬────────────────────────────────┘
         │
         v
┌──────────────────────────────────────────┐
│ Permanently saved                        │
│ (Single pricelist with all history)      │
└──────────────────────────────────────────┘
         │
         v
┌──────────────────────────────────────────┐
│ Later: Edit again?                       │
│ ProfilePage → Click edit                 │
│ → Load pricelistId directly              │
│ → Pass to StartGenerator                 │
│ → Load and edit                          │
│ → updatePricelist()                      │
│ → Done (no draft cycle)                  │
└──────────────────────────────────────────┘
```

---

## File-by-File Changes

### ✅ Files to DELETE
```
convex/
├── pricelistDrafts.ts              ❌ ENTIRE FILE
```

### ✏️ Files to MODIFY
```
convex/
├── schema.ts                        (remove pricelistDrafts table)
├── pricelists.ts                    (enhance for direct workflow)
└── stripe.ts                        (remove draftId parameter)

components/pages/
├── StartGeneratorPage.tsx           (major refactor)
├── OptimizationResultsPage.tsx      (major refactor)
├── PreviewPage.tsx                  (minor refactor)
└── ProfilePage.tsx                  (minor refactor)

lib/pricelist-templates/
└── components/TemplateEditor.tsx    (remove draftId prop)
```

### 🔄 Auto-Generated
```
convex/
└── _generated/
    └── api.d.ts                     (regenerates automatically)
```

---

## Component Communication Flow

### BEFORE (Complex with Drafts)
```
StartGeneratorPage
    ├─→ generates draftId
    ├─→ calls saveDraft()
    │   └─→ stores in pricelistDrafts table
    ├─→ on edit: updateDraft()
    │   └─→ updates pricelistDrafts
    └─→ on save: convertDraftToPricelist()
        ├─→ creates pricelist(s)
        ├─→ deletes draft
        └─→ returns pricelistId

OptimizationResultsPage
    ├─→ loads draft via getDraft()
    ├─→ runs optimization
    ├─→ calls updateDraft() with results
    └─→ calls convertDraftToPricelist()
        └─→ creates permanent pricelist(s)

ProfilePage
    ├─→ lists pricelists
    └─→ on edit: createDraftFromPricelist()
        └─→ creates new draft from pricelist
            └─→ navigates to StartGeneratorPage
```

### AFTER (Simple - Direct Pricelist)
```
StartGeneratorPage
    ├─→ requires login (redirect if not)
    ├─→ calls savePricelist()
    │   └─→ stores directly in pricelists table
    ├─→ on edit: updatePricelist()
    │   └─→ updates pricelists
    └─→ share link: /preview?pricelist=id
        (no "Save" button needed - already saved)

OptimizationResultsPage
    ├─→ requires login
    ├─→ loads pricelist via getPricelist()
    ├─→ runs optimization
    └─→ calls updatePricelist() with results
        (stays in same pricelist - no conversion needed)

ProfilePage
    ├─→ requires login
    ├─→ lists pricelists
    └─→ on edit: pass pricelistId to StartGeneratorPage
        └─→ Load directly, no draft creation
```

---

## Key Differences Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Public Access** | Draft URLs public | All require auth |
| **Workflow** | Draft → (Maybe Save) → Pricelist | Generate → Save → Always Pricelist |
| **Edit Flow** | Pricelist → CreateDraft → Save → Pricelist | Pricelist → Load → Edit → Save |
| **TTL** | Drafts: 7 days | None (permanent) |
| **Optimization** | Draft mode | Pricelist mode |
| **Database** | 2 tables (drafts + pricelists) | 1 table (pricelists only) |
| **Share Links** | Drafts: auto-public | Pricelists: auth-required |
| **Lines of Code** | +9 functions in pricelistDrafts | -9 functions deleted |

