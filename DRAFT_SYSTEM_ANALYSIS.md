# Draft System Analysis - Beauty Audit Application

## Executive Summary

The application currently uses a **dual-system architecture** where both drafts and pricelists coexist throughout the user journey. Drafts are temporary working copies that support anonymous users and logged-in users, while pricelists are permanent, user-owned saved versions. To eliminate drafts and require login, the system requires significant architectural changes across multiple components and data flows.

---

## 1. DRAFT SYSTEM OVERVIEW

### 1.1 Schema Design

**Drafts Table (`pricelistDrafts`)**
- `draftId`: UUID string used in URLs (public identifier)
- `userId`: Optional - Anonymous users have null, logged-in users have userId
- `sourcePricelistId`: Optional reference to original pricelist being edited
- `purchaseId`: Optional link to payment transaction (for paid optimizations)
- `pricingDataJson`: JSON string of PricingData
- `themeConfigJson`: Optional JSON string of ThemeConfig
- `templateId`: Template choice (modern, classic, minimal, etc.)
- `rawInputData`: Original user input for regeneration
- `isOptimized`: Boolean flag for AI-optimized drafts
- `originalPricingDataJson`: Pre-optimization data (for comparison)
- `optimizationResultJson`: AI optimization results
- `categoryConfigJson`: User's category configuration choices
- `expiresAt`: TTL for anonymous drafts (7 days), null for logged-in users

**Pricelists Table (`pricelists`)**
- `userId`: Required - ALWAYS present (user must be logged in)
- `name`: User-given name
- `source`: "manual" | "booksy" | "audit"
- All other fields mirror pricelistDrafts structure
- No expiration - permanent storage

### 1.2 Key Difference: Access Control

**Drafts**: Publicly readable via `getDraft(draftId)` - NO authentication required
**Pricelists**: Only readable by owner via `getPricelist(pricelistId)` - Requires authentication
- Exception: `getPricelistPublic(pricelistId)` returns minimal data (no userId needed)

---

## 2. COMPONENT-BY-COMPONENT DRAFT USAGE

### 2.1 StartGeneratorPage.tsx

**Primary Function**: Main entry point for pricelist creation and editing

#### Current Draft Flow:
1. **Generate New Pricelist**
   - User pastes data → Parses to PricingData
   - Generates unique `draftId` = `draft_${Date.now()}_${random}`
   - Calls `saveDraft(draftId, pricingDataJson, ...)`
   - URL updates to `?draft=draftId`
   - Sets state: `draftId`, `pricingData`

2. **Load from URL**
   - Reads `draft` param from URL via `useSearchParams()`
   - Calls `getDraft(draftId)` query
   - Hydrates all form state from draft data

3. **Auto-save on Changes**
   - Theme changes → `updateDraft({draftId, themeConfigJson})`
   - Template changes → `updateDraft({draftId, templateId})`
   - Data edits → `updateDraft({draftId, pricingDataJson})`
   - Runs debounced on every user interaction

4. **Save to Profile (Conversion)**
   - Requires `isSignedIn` check
   - Calls `convertDraftToPricelist({draftId, name})`
   - Creates pricelist and deletes draft
   - Only then displays "Zapisano!" confirmation

5. **Copy Link (Share)**
   - If `draftId` exists: `window.location.origin/preview?draft=${draftId}`
   - If `sourcePricelistId` exists (editing saved pricelist): `/preview?pricelist=${sourcePricelistId}`
   - Uses draft for sharing unsigned work

6. **Authentication Handling**
   - Anonymous users can generate and share drafts
   - When user logs in mid-session, draft is NOT auto-assigned to them
   - Only on `saveDraft` or `updateDraft` call is userId assigned
   - Draft gets TTL removed when userId is assigned

#### Code Locations:
- Line 42-44: `generateDraftId()` function
- Line 60: `draftId` state
- Line 79: `urlDraftId` from search params
- Line 82-85: `useQuery(getDraft)` with conditional skip
- Line 87-120: Effect to load draft from URL
- Line 170-176: `saveDraft()` mutation on generate
- Line 201-211: `handleThemeChange()` with `updateDraft()`
- Line 213-227: `handleTemplateChange()` with `updateDraft()`
- Line 229-242: `handleDataChange()` with `updateDraft()`
- Line 244-271: `handleSaveToProfile()` with `convertDraftToPricelist()`
- Line 273-287: `handleCopyLink()` - uses draft or pricelist ID

#### Key Dependencies:
- `api.pricelistDrafts.saveDraft`
- `api.pricelistDrafts.getDraft`
- `api.pricelistDrafts.updateDraft`
- `api.pricelistDrafts.convertDraftToPricelist`
- `useUser()` from Clerk (isSignedIn)

---

### 2.2 PreviewPage.tsx

**Primary Function**: Standalone preview/share link viewer

#### Current Flow:
1. **URL Routing**
   - Accepts `?draft=draftId` OR `?pricelist=pricelistId`
   - NOT mutually exclusive - handles both

2. **Query Data**
   ```tsx
   const draft = useQuery(api.pricelistDrafts.getDraft, draftId ? {draftId} : "skip");
   const pricelist = useQuery(api.pricelists.getPricelistPublic, pricelistId ? {pricelistId} : "skip");
   ```
   - Both queries run independently
   - Draft is public (no auth needed)
   - Pricelist uses public accessor

3. **Render Logic**
   - Conditionally loads data from whichever query returns data
   - Draft data takes precedence if both provided (not explicitly handled, just whichever loads first)
   - Renders template with loaded data

#### Code Locations:
- Line 13: `draftId` from search params
- Line 14: `pricelistId` from search params
- Line 22-25: Draft query (no skip condition)
- Line 28-31: Pricelist query (no skip condition)
- Line 34-51: Draft data handling effect
- Line 54-71: Pricelist data handling effect
- Line 74: Checks if neither provided

#### Key Dependencies:
- `api.pricelistDrafts.getDraft`
- `api.pricelists.getPricelistPublic`

---

### 2.3 OptimizationResultsPage.tsx

**Primary Function**: AI optimization workflow with dual mode support

#### Current Flow - Mode 1: New Optimization (Draft-Based)
1. **Entry**: `?draft=draftId&session_id={CHECKOUT_SESSION_ID}`
   - User arrives after Stripe payment redirect
   - `isViewOnlyMode = false` (editing mode)

2. **Load Draft**
   ```tsx
   const existingDraft = useQuery(api.pricelistDrafts.getDraft, draftId ? {draftId} : "skip");
   ```
   - Loads saved draft data
   - If already optimized: skip to results
   - If not: show category configuration UI

3. **Category Configuration**
   - User configures categories and aggregations
   - On completion: `handleCategoryConfigComplete(config)`
   - Saves config to state: `categoryConfig`

4. **AI Optimization**
   ```tsx
   const result = await optimizePricelist(configuredData);
   await updateDraft({
     draftId,
     isOptimized: true,
     originalPricingDataJson: JSON.stringify(original),
     pricingDataJson: JSON.stringify(optimized),
     optimizationResultJson: JSON.stringify(result),
     categoryConfigJson: JSON.stringify(config),
   });
   ```
   - Runs AI on configured data
   - Stores both original and optimized in draft
   - Marks draft as optimized

5. **Save to Profile (Conversion)**
   ```tsx
   await convertDraftToPricelist({draftId, name: "Custom Name"});
   ```
   - If draft was optimized: Creates TWO pricelists
     - Original pricelist with `originalPricingDataJson`
     - Optimized pricelist with `optimizedFromPricelistId` ref
   - If not optimized: Creates single pricelist
   - Deletes draft after conversion

#### Current Flow - Mode 2: View Saved Results (Pricelist-Based)
1. **Entry**: `?pricelist=pricelistId`
   - User is viewing previously saved optimization
   - `isViewOnlyMode = true` (view mode)

2. **Load Pricelist**
   ```tsx
   const existingPricelist = useQuery(api.pricelists.getPricelist, pricelistId ? {pricelistId} : "skip");
   ```
   - Loads saved optimized pricelist
   - Loads `originalPricingDataJson` for comparison
   - Shows optimization result from `optimizationResultJson`

3. **No Edit/Save Options**
   - User can only view and export
   - Cannot further optimize or save changes

#### Code Locations:
- Line 249-250: Extract draft and pricelist IDs
- Line 253: `isViewOnlyMode` boolean
- Line 290-296: Query drafts and pricelists
- Line 302-337: Load pricelist data effect
- Line 340-390: Load draft data effect
- Line 426-449: Category config completion handler
- Line 447-465: Update draft with optimization results

#### Key Dependencies:
- `api.pricelistDrafts.getDraft`
- `api.pricelists.getPricelist`
- `api.pricelistDrafts.updateDraft`
- `api.pricelistDrafts.convertDraftToPricelist`
- `api.stripe.verifySession`

---

### 2.4 ProfilePage.tsx

**Primary Function**: User dashboard showing saved pricelists

#### Current Flow:
1. **Query User Pricelists**
   ```tsx
   const pricelists = useQuery(api.pricelists.getUserPricelists);
   ```
   - Requires authentication
   - Returns all pricelists for logged-in user

2. **Edit Pricelist**
   - User clicks "Edytuj" button
   - Currently: Navigates to StartGeneratorPage with pricelist ID
   - Code pattern (implied from README): `createDraftFromPricelist(pricelistId)`
   - Creates a NEW draft from pricelist
   - Navigates to `?draft=newDraftId`

3. **Other Actions**
   - Preview, Copy Code, Delete, AI Optimize, View Results
   - All work on pricelists directly

#### Code Locations:
- `onEdit` callback (line 228): Calls `onEdit(pricelist._id)`
- This callback is defined in parent page component (not fully shown in excerpt)

#### Key Dependencies:
- `api.pricelists.getUserPricelists`
- `api.pricelistDrafts.createDraftFromPricelist` (called on edit)

---

### 2.5 TemplateEditor.tsx (lib/pricelist-templates/components)

**Primary Function**: Reusable template editor component

#### Current Flow:
1. **Props Received**
   ```tsx
   draftId?: string | null;
   pricelistId?: string | null;
   ```
   - Can receive either draft ID or pricelist ID
   - Used to generate appropriate embed code

2. **Embed Code Generation**
   - If `pricelistId` exists: Generate embed snippet
   - If `draftId` exists: Generate shareable preview link
   - Code on line 299-307: `generateEmbedSnippet()` vs `generateEmbedHTML()`

3. **Share Functionality**
   - Line 994-1000: Preview button for drafts
   - Opens `/preview?draft=${draftId}` in new window

#### Code Locations:
- Line 186: `draftId` prop
- Line 193: `pricelistId` prop
- Line 298-310: Embed snippet generation logic
- Line 994-1000: Preview link button

---

## 3. DATA FLOW DIAGRAMS

### 3.1 Current Draft-Based Flow (Anonymous User)

```
StartGeneratorPage
    ↓ [User inputs data]
    ↓ saveDraft() → stores in pricelistDrafts (no userId, with TTL)
    ↓ [User modifies theme/template]
    ↓ updateDraft() → updates pricelistDrafts
    ↓ [Share link]
    ↓ PreviewPage ?draft=draftId → getDraft() (public)
    ↓ [Link expires in 7 days]
```

### 3.2 Current Draft-to-Pricelist Flow (Authenticated User)

```
StartGeneratorPage
    ↓ [User generates cennik]
    ↓ saveDraft() → stores (userId assigned)
    ↓ [User customizes]
    ↓ updateDraft() 
    ↓ [User clicks "Save to Profile"]
    ↓ convertDraftToPricelist() → creates pricelists, deletes draft
    ↓ Pricelists table (permanent)
    ↓ [User can edit again]
    ↓ ProfilePage onEdit → createDraftFromPricelist() → new draft
    ↓ StartGeneratorPage ?draft=newDraftId
    ↓ [Round trip again to convertDraftToPricelist()]
```

### 3.3 Current Optimization Flow

```
StartGeneratorPage (draft exists)
    ↓ [User clicks "Optimize"]
    ↓ [Not signed in] → Show login prompt
    ↓ [Signed in] → Stripe checkout with draftId in metadata
    ↓ Stripe → redirect to /optimization-results?draft=draftId&session_id=...
    ↓ OptimizationResultsPage
    ↓ verifySession() → confirms payment
    ↓ [User configures categories]
    ↓ handleCategoryConfigComplete() → optimizePricelist() (AI)
    ↓ updateDraft() with isOptimized=true, originalData, optimizationResult
    ↓ [User reviews optimization]
    ↓ [User clicks "Save"]
    ↓ convertDraftToPricelist() → creates BOTH original + optimized pricelists
    ↓ Pricelists table (permanent)
    ↓ [User can view on OptimizationResultsPage ?pricelist=id]
```

---

## 4. REFACTORING IMPACT ANALYSIS

### 4.1 Files That Will Change

**Backend (convex/)**
- ❌ `pricelistDrafts.ts` - ENTIRE FILE CAN BE DELETED
- ✏️ `pricelists.ts` - Modify savePricelist, add temp state handling
- ✏️ `schema.ts` - Remove pricelistDrafts table
- ✏️ `stripe.ts` - Remove draftId parameter

**Frontend Components**
- ✏️ `components/pages/StartGeneratorPage.tsx` - Large changes
- ✏️ `components/pages/OptimizationResultsPage.tsx` - Medium changes
- ✏️ `components/pages/PreviewPage.tsx` - Minor changes
- ✏️ `components/pages/ProfilePage.tsx` - Minor changes
- ✏️ `lib/pricelist-templates/components/TemplateEditor.tsx` - Remove draftId prop

**Type Definitions**
- ✏️ `types/` - Remove draft-related types if any

**API Generated Files**
- 🔄 `convex/_generated/api.d.ts` - Regenerated automatically

### 4.2 Functional Changes Required

#### 4.2.1 Remove Draft Concept Entirely

**What to Delete:**
- `saveDraft()` mutation - NO REPLACEMENT
- `getDraft()` query - NO REPLACEMENT
- `updateDraft()` mutation - NO REPLACEMENT (use `updatePricelist()` instead)
- `deleteDraft()` mutation - NO REPLACEMENT
- `getUserDrafts()` query - NO REPLACEMENT (pricelists already has getUserPricelists)
- `createDraftFromPricelist()` mutation - NO REPLACEMENT (just load pricelist, don't create draft)
- `convertDraftToPricelist()` mutation - NO REPLACEMENT (work directly with pricelists)
- `linkDraftToPurchase()` internalMutation - NO REPLACEMENT

**What Changes in Existing Functions:**
- `createCheckoutSession()` - Remove `draftId` parameter
- `verifySession()` - Remove returning `draftId`
- Remove pricelistDrafts schema table

#### 4.2.2 Require Login for All Pricelist Operations

**Authentication Changes:**
- StartGeneratorPage: Move login check from "Save to Profile" to "Generate"
- PreviewPage: Require login to view pricelist
- Add login wall at entry point or progressively load

**Specific Changes:**
- `getPricelistPublic()` - Either:
  - Option A: DELETE (all pricelist viewing requires auth)
  - Option B: KEEP but require `userId` be null/different (view-only read-once)
- All saves must create pricelist immediately, not draft first

#### 4.2.3 Handle Temporary State During AI Optimization

**Current Problem**: Drafts allow temporary state storage while AI optimizes
**New Approach Options:**

**Option 1: Client-Side Only (Simplest)**
- Keep all state in React component memory
- Optimize in browser: `setState()` only
- Only save final result to backend
- Loss: Can't reload page mid-optimization

**Option 2: Create Temporary Pricelists**
- On generate, create pricelist immediately
- Mark with `status: "temp" | "permanent"` (new field)
- Optimize in place, update status to "permanent"
- Pro: Persistent optimization state
- Con: More database writes

**Option 3: Use Sessions/Cache Table**
- Create temporary cache table
- TTL-based cleanup
- Hybrid approach - requires new table

**Recommended**: Option 1 (Client-Side) for MVP, Option 2 (Temporary Pricelists) for production

#### 4.2.4 Edit/Re-edit Flow

**Current**:
```
Pricelist → createDraftFromPricelist() → Draft → edit → convertDraftToPricelist() → Pricelist
```

**New**:
```
Pricelist → Load directly (client state) → Edit in UI → updatePricelist() → Pricelist
```

**Changes:**
- Remove `createDraftFromPricelist()` - not needed
- Load pricelist directly into React state
- On every change: `updatePricelist(pricelistId, {...})`
- No intermediate draft object

#### 4.2.5 Sharing Non-Owner Pricelists

**Current**: Drafts use draftId in URL - publicly accessible
**New Problem**: Pricelists are owner-locked via `userId`

**Solution Options:**
1. Create public links table with TTL - recommended
2. Use JWT tokens in URL - complex
3. Remove sharing entirely - not viable
4. Allow "published" pricelists - different schema

**Recommended**: Public links table
```typescript
table: {
  linkId: string (UUID),
  pricelistId: Id<"pricelists">,
  expiresAt: number,
  createdBy: Id<"users">,
}
```

---

## 5. IMPLEMENTATION CHECKLIST

### Phase 1: Database Changes
- [ ] Delete `pricelistDrafts` table from schema
- [ ] Add `publicLinks` table (for sharing) if choosing that approach
- [ ] Regenerate Convex API types

### Phase 2: Backend Mutations
- [ ] Delete all draft-related functions from `pricelistDrafts.ts`
- [ ] Delete `pricelistDrafts.ts` file
- [ ] Update `stripe.ts` to remove draftId parameter
- [ ] Update `pricelists.ts` to handle optimization flow

### Phase 3: Frontend - StartGeneratorPage
- [ ] Add login requirement at top of component
- [ ] Remove all `draftId` state and logic
- [ ] Remove `generateDraftId()` function
- [ ] Change `handleGenerate()` to:
  - Create pricelist immediately (not draft)
  - Store pricelistId instead of draftId
  - Keep pricingData in state for UI
- [ ] Change `handleThemeChange()` to call `updatePricelist()`
- [ ] Change `handleTemplateChange()` to call `updatePricelist()`
- [ ] Change `handleDataChange()` to call `updatePricelist()`
- [ ] Remove `handleSaveToProfile()` button (always saved)
- [ ] Change share link to use `?pricelist=id` instead of `?draft=id`

### Phase 4: Frontend - PreviewPage
- [ ] Add login requirement
- [ ] Keep only `?pricelist=id` parameter (remove draft handling)
- [ ] Remove draft query
- [ ] Simplify to pricelist-only logic

### Phase 5: Frontend - OptimizationResultsPage
- [ ] Add login requirement at top
- [ ] Remove draft mode entirely
- [ ] Only accept `?pricelist=id` for new and saved optimizations
- [ ] Change to create temp pricelist on payment redirect
- [ ] Update category config to work on pricelist directly
- [ ] Remove `convertDraftToPricelist()` - work with pricelist ID directly

### Phase 6: Frontend - ProfilePage
- [ ] Remove draft-related imports
- [ ] Remove `createDraftFromPricelist()` call on edit
- [ ] Change edit to navigate to StartGeneratorPage with `?pricelist=id`
- [ ] Adjust UI to pass pricelistId instead of creating draft

### Phase 7: Frontend - TemplateEditor
- [ ] Remove `draftId` prop
- [ ] Keep `pricelistId` prop only
- [ ] Remove draft preview link logic
- [ ] Simplify embed code generation

### Phase 8: Testing & Migration
- [ ] Test full flow: login → generate → edit → optimize → save
- [ ] Test payment integration with new flow
- [ ] Test share links with public link table
- [ ] Delete old drafts from database (cleanup)
- [ ] Update documentation

---

## 6. DETAILED REFACTORING PATTERNS

### 6.1 StartGeneratorPage.tsx Refactoring

**Before (Current)**:
```typescript
const [draftId, setDraftId] = useState<string | null>(null);
const [pricingData, setPricingData] = useState<PricingData | null>(null);

const handleGenerate = async () => {
  const data = await parsePricingData(inputText);
  const newDraftId = generateDraftId();
  await saveDraft({draftId: newDraftId, pricingDataJson: ...});
  setDraftId(newDraftId);
  setPricingData(data);
};

const handleThemeChange = async (newTheme: ThemeConfig) => {
  if (draftId) await updateDraft({draftId, themeConfigJson: ...});
};

const handleSaveToProfile = async () => {
  await convertDraftToPricelist({draftId, name});
};
```

**After (Required)**:
```typescript
const [pricelistId, setpricelistId] = useState<string | null>(null);
const [pricingData, setPricingData] = useState<PricingData | null>(null);

// Add login check at top
useEffect(() => {
  if (!isSignedIn) {
    // Redirect or show login wall
  }
}, [isSignedIn]);

const handleGenerate = async () => {
  const data = await parsePricingData(inputText);
  const pricelistId = await savePricelist({
    name: `Cennik ${new Date().toLocaleDateString()}`,
    source: "manual",
    pricingDataJson: JSON.stringify(data),
  });
  setpricelistId(pricelistId);
  setPricingData(data);
};

const handleThemeChange = async (newTheme: ThemeConfig) => {
  if (pricelistId) await updatePricelist({
    pricelistId, 
    themeConfigJson: JSON.stringify(newTheme)
  });
};

// Remove handleSaveToProfile - always saved

const handleCopyLink = () => {
  if (pricelistId) {
    const url = `${window.location.origin}/preview?pricelist=${pricelistId}`;
    navigator.clipboard.writeText(url);
  }
};
```

### 6.2 OptimizationResultsPage.tsx Refactoring

**Before (Current)**:
```typescript
const draftId = searchParams.get('draft');
const existingDraft = useQuery(api.pricelistDrafts.getDraft, draftId ? {draftId} : "skip");

const handleCategoryConfigComplete = async (config) => {
  const result = await optimizePricelist(configuredData);
  await updateDraft({draftId, isOptimized: true, ...});
  setFlowStep('results');
};

const handleSave = async () => {
  await convertDraftToPricelist({draftId, name});
};
```

**After (Required)**:
```typescript
const sessionId = searchParams.get('session_id');
const pricelistId = searchParams.get('pricelist') as Id<"pricelists"> | null;
const existingPricelist = useQuery(api.pricelists.getPricelist, pricelistId ? {pricelistId} : "skip");

// On redirect from payment, create temp pricelist
useEffect(() => {
  if (sessionId && !pricelistId) {
    // Verify payment happened
    const verify = await verifySession({sessionId});
    if (verify.success) {
      // Create temporary pricelist (user hasn't clicked "Save" yet)
      // Could be marked as temp/unsaved
    }
  }
}, [sessionId, pricelistId]);

const handleCategoryConfigComplete = async (config) => {
  const result = await optimizePricelist(configuredData);
  await updatePricelist({
    pricelistId,
    isOptimized: true,
    // Save all optimization data to pricelist
    originalPricingDataJson: ...,
    optimizationResultJson: ...,
  });
  setFlowStep('results');
};

// Remove handleSave - always saved
```

---

## 7. KEY MIGRATION CONSIDERATIONS

### 7.1 Backward Compatibility
- Existing draft URLs will break (URLs like `?draft=...`)
- Existing pricelist sharing via drafts will stop working
- Migration path: Redirect old draft URLs → show login + regenerate prompt?

### 7.2 Anonymous User Experience
- Currently: Complete journey without login
- After: **Must login to start** (breaking change)
- Consider: Allow anonymous workflow until optimization, then require login

### 7.3 Draft Expiration (TTL)
- Currently: Anonymous drafts auto-delete after 7 days
- After: All pricelists are permanent (until user deletes)
- Consideration: Add option to delete old pricelists?

### 7.4 Performance Impact
- Before: Each keystroke → updateDraft (new update)
- After: Each keystroke → updatePricelist (same pattern)
- No significant performance difference expected

### 7.5 Data Volume
- Before: Lots of short-lived draft records
- After: Fewer but longer-lived records
- Database size will be similar or slightly smaller

---

## 8. RECOMMENDED IMPLEMENTATION STRATEGY

### 8.1 Minimal MVP (Simplest Path)

**What to Keep:**
- Client-side state for optimization
- Direct pricelist creation and updates
- Simple login requirement

**What to Remove:**
- All draft tables and functions
- DraftId everywhere

**Timeline**: 2-3 days for 1 developer

### 8.2 Production-Ready (With Polish)

**Additional Components:**
- Public links table for sharing
- Temporary pricelist marking
- Better error handling for mid-optimization reload
- Confirmation dialogs for destructive actions

**Timeline**: 4-5 days for 1 developer

---

## 9. TESTING STRATEGY

### Critical Paths to Test
1. **Unauthenticated Flow**
   - [ ] Cannot start generator (login required)
   
2. **Authenticated Generate Flow**
   - [ ] User generates → pricelist created immediately
   - [ ] User customizes theme → pricelist updated
   - [ ] User edits services → pricelist updated
   - [ ] Share link works (shows pricelist)
   - [ ] User can edit again from profile
   
3. **Optimization Flow**
   - [ ] Generate → Pay → Verify payment
   - [ ] Configure categories → AI runs → Saves to pricelist
   - [ ] View results on optimization page
   - [ ] Edit optimized pricelist
   - [ ] Generate share link for optimized pricelist

4. **Edge Cases**
   - [ ] Page reload mid-optimization (data lost - expected)
   - [ ] Delete pricelist → link returns error
   - [ ] User logs out and back in → can see pricelists
   - [ ] Multiple optimizations of same pricelist

---

## 10. SUMMARY OF COMPONENT CHANGES

| Component | Current | After | Impact |
|-----------|---------|-------|--------|
| StartGeneratorPage | Draft-based workflow | Pricelist-based workflow | Major refactor |
| OptimizationResultsPage | Draft mode + Pricelist mode | Pricelist mode only | Major refactor |
| PreviewPage | Draft + Pricelist viewer | Pricelist + Auth viewer | Minor refactor |
| ProfilePage | Pricelists + edit-via-draft | Pricelists + edit-direct | Minor refactor |
| TemplateEditor | draftId + pricelistId props | pricelistId prop only | Minor refactor |
| Backend | pricelistDrafts.ts exists | File deleted | Deletion |
| Schema | pricelistDrafts table | Removed | Deletion |
| Auth | Optional for most flows | Required for all flows | Major change |

---

## 11. CODE INTERDEPENDENCIES

```
StartGeneratorPage
├── uses: saveDraft ❌
├── uses: getDraft (URL load) ❌
├── uses: updateDraft ❌
├── uses: convertDraftToPricelist ❌
└── uses: savePricelist ✅ (new)

OptimizationResultsPage
├── uses: getDraft ❌
├── uses: updateDraft ❌
├── uses: convertDraftToPricelist ❌
└── uses: updatePricelist ✅ (new)

ProfilePage
├── uses: createDraftFromPricelist ❌
└── uses: pricelists ✅

PreviewPage
├── uses: getDraft ❌
└── uses: getPricelistPublic ✅

TemplateEditor
├── uses: draftId prop ❌
└── uses: pricelistId prop ✅

Stripe Integration
├── uses: draftId in metadata ❌
└── clean removal
```

