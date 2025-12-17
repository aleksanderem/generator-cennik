# Draft System Elimination - Quick Reference Guide

## Quick Stats

| Metric | Value |
|--------|-------|
| Files to Delete | 1 (pricelistDrafts.ts) |
| Files to Modify | 7 |
| Backend Functions to Delete | 9 |
| Frontend Components to Change | 5 |
| Key Breaking Changes | Login now required |
| Estimated Effort | 2-5 days (1 dev) |

---

## The Core Problem

**Current**: Application supports anonymous users creating temporary drafts that expire in 7 days

**Target**: All pricelist operations require login; direct pricelist creation (no intermediate draft)

---

## What Gets Deleted ❌

### Backend
- Entire `convex/pricelistDrafts.ts` file
- `pricelistDrafts` table from schema
- All 9 functions:
  - `getDraft()`
  - `saveDraft()`
  - `updateDraft()`
  - `deleteDraft()`
  - `getUserDrafts()`
  - `createDraftFromPricelist()`
  - `convertDraftToPricelist()`
  - `linkDraftToPurchase()`

### Frontend Props
- `draftId` prop from `TemplateEditor`
- `draftId` state from `StartGeneratorPage`
- All draft-related URL parameters

---

## What Changes ✏️

### Schema Changes
- Remove `pricelistDrafts` table
- Optional: Add `publicLinks` table for share links
- No changes to `pricelists` table structure

### StartGeneratorPage.tsx
- **Line 60**: Change `[draftId]` → `[pricelistId]`
- **Line 42-44**: Delete `generateDraftId()` function
- **Line 170**: Replace `saveDraft()` → `savePricelist()`
- **Line 201-211**: Replace `updateDraft()` → `updatePricelist()`
- **Line 244-271**: Delete `handleSaveToProfile()` (always saved)
- **Line 49**: Add `useUser()` check - redirect if not signed in
- **Line 273-287**: Update share link from `?draft=` → `?pricelist=`

### PreviewPage.tsx
- **Line 13**: Remove `draftId` extraction
- **Line 22-25**: Remove draft query entirely
- **Line 34-51**: Remove draft data handling effect
- Add login requirement

### OptimizationResultsPage.tsx
- **Line 249**: Remove `draftId` extraction
- **Line 290-292**: Remove draft query
- **Line 340-390**: Remove draft loading effect
- **Line 426-449**: Change `updateDraft()` → `updatePricelist()`
- **Line 302-337**: Simplify - only pricelist mode
- Add login requirement

### ProfilePage.tsx
- Remove `createDraftFromPricelist()` call
- Change edit button to pass `pricelistId` directly

### TemplateEditor.tsx
- **Line 186**: Delete `draftId?: string | null;` prop
- **Line 994-1000**: Remove draft preview link
- Keep `pricelistId` prop only

---

## Data Flow Transformation

### BEFORE: Generate → Draft → Optionally Save → Pricelist
```
[User inputs] 
  ↓
generateDraftId()
  ↓
saveDraft() [anonymous, expires in 7d]
  ↓
[User customizes]
  ↓
updateDraft() [each change]
  ↓
[User decides to save]
  ↓
convertDraftToPricelist() [becomes permanent]
  ↓
[Delete draft]
```

### AFTER: Generate → Direct to Pricelist → Always Saved
```
[User must login]
  ↓
[User inputs]
  ↓
savePricelist() [directly]
  ↓
[User customizes]
  ↓
updatePricelist() [each change]
  ↓
[Always saved, no extra step]
  ↓
[User views in profile]
```

---

## URL Changes

| Scenario | Before | After |
|----------|--------|-------|
| New pricelist | `/start-generator` | `/start-generator` (login required) |
| Share draft | `/preview?draft=abc123` | ❌ Not supported |
| Share pricelist | `/preview?pricelist=id` | `/preview?pricelist=id` |
| Optimize | `?draft=x&session_id=y` | `?pricelist=x&session_id=y` |
| Edit | `/start-generator?draft=x` | `/start-generator?pricelist=x` |

---

## Authentication Changes

| Feature | Before | After |
|---------|--------|-------|
| Generate | ✅ Anonymous | 🔐 Login required |
| Share | ✅ Anonymous draft link | 🔐 Logged-in only |
| Optimize | 🔐 Login required | 🔐 Login required |
| Save | 🔐 Login required | (Auto-saved) |
| Edit | 🔐 Login required | 🔐 Login required |

---

## Breaking Changes for Users

1. **Anonymous users cannot create pricelists** - Must sign up/log in
2. **Shared draft links stop working** - `/preview?draft=...` URLs will 404
3. **Auto-expiration removed** - Pricelists no longer auto-delete after 7 days
4. **Edit workflow changes** - Direct edit, not draft-create-save cycle

---

## Migration Path

For existing drafts in database:
1. **Option A**: Delete all drafts (users lose them)
2. **Option B**: Auto-convert active drafts to pricelists + notify users
3. **Option C**: Keep migration period where old draft URLs redirect to login

---

## Stripe Integration Changes

### Before
```typescript
createCheckoutSession({
  product: 'pricelist_optimization',
  draftId: 'draft_12345'  // ❌ Remove this
})
```

### After
```typescript
createCheckoutSession({
  product: 'pricelist_optimization',
  // draftId removed, create pricelist on redirect
})
```

The redirect creates the pricelist with a temporary flag, then user configures/optimizes.

---

## Key Implementation Decisions

### Decision 1: Temporary State During Optimization
- ✅ **Recommended**: Client-side only state (simplest)
- Page reload during optimization = lost state (acceptable)
- Alt: Create "temp" pricelists with cleanup (more complex)

### Decision 2: Sharing Pricelists
- ✅ **Recommended**: Create `publicLinks` table
- Each link has expiration and limited permissions
- Alt: Allow anyone to view if they know pricelistId (less secure)

### Decision 3: Anonymous Workflow
- ✅ **Recommended**: Require login before generate
- Simplest, cleanest UX
- Alt: Allow anonymous until optimization (hybrid approach)

---

## Testing Checklist

### Must Test
- [ ] Unauthenticated user redirected on /start-generator
- [ ] Authenticated: Generate → Creates pricelist immediately
- [ ] Authenticated: Edit theme → pricelist updates
- [ ] Authenticated: Edit services → pricelist updates
- [ ] Authenticated: Payment flow → Creates optimized pricelist
- [ ] Old draft URLs show error page
- [ ] Share link works for owner only

### Nice to Have
- [ ] Delete pricelist → links return 404
- [ ] Page reload mid-optimization → state lost (expected)
- [ ] Multi-device editing → latest changes win

---

## Rollout Plan

### Day 1: Backend Preparation
- [ ] Create and test new schema
- [ ] Deploy new Convex functions
- [ ] Verify existing data integrity

### Day 2-3: Frontend Migration
- [ ] Update StartGeneratorPage
- [ ] Update OptimizationResultsPage
- [ ] Update PreviewPage
- [ ] Update ProfilePage
- [ ] Update TemplateEditor

### Day 4: Integration & Testing
- [ ] Full workflow testing
- [ ] Payment integration testing
- [ ] Edge case testing

### Day 5: Cleanup & Monitoring
- [ ] Delete old draft records
- [ ] Monitor for errors
- [ ] User communication

---

## Rollback Plan

If serious issues discovered:
1. Revert Convex functions from git
2. Keep `pricelistDrafts` table available
3. Redeploy frontend with draft support
4. Document what failed

---

## Questions to Ask Before Starting

1. **Share links**: Who should be able to view pricelists?
   - Owner only? (current after refactor)
   - Anyone with link? (need publicLinks table)
   - Public if published? (need new field)

2. **Temporary pricelists**: What happens if user closes tab mid-optimization?
   - Lost state OK? (use client-side only)
   - Recover state? (need temp pricelists)

3. **Backward compatibility**: What about users with old draft URLs?
   - Show error? (simplest)
   - Auto-login + regenerate? (complex)

4. **Database cleanup**: When to delete old drafts?
   - Before deploy? (data loss risk)
   - After deploy with grace period? (safer)

---

## Success Criteria

✅ All pricelist operations require login
✅ No draft table in database
✅ pricelistDrafts.ts file deleted
✅ All tests passing
✅ No new draft-related code
✅ Share links work for owner
✅ Optimization flow works end-to-end

