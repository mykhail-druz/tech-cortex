# Test Plan for Unsaved Changes Preservation

## Issue Description
When editing profile on /account page, if user makes changes but doesn't save them, then switches to another browser tab and returns, all unsaved changes are lost and replaced with previously saved profile information.

## Solution Implemented
Added `hasUnsavedChanges` state to track form modifications and prevent form reset when user has unsaved changes.

## Test Cases

### Test Case 1: Basic Form Field Changes
1. Navigate to /account page
2. Click "Edit Profile" 
3. Modify any text field (e.g., first name, phone, address)
4. Switch to another browser tab
5. Return to the account page tab
6. **Expected**: Changes should be preserved
7. **Previous Behavior**: Changes would be lost

### Test Case 2: State Dropdown Changes
1. Navigate to /account page
2. Click "Edit Profile"
3. Change the state dropdown selection
4. Switch to another browser tab
5. Return to the account page tab
6. **Expected**: State selection should be preserved
7. **Previous Behavior**: State would reset to saved value

### Test Case 3: Avatar Changes
1. Navigate to /account page
2. Click "Edit Profile"
3. Upload a new avatar or select Google avatar
4. Switch to another browser tab
5. Return to the account page tab
6. **Expected**: Avatar changes should be preserved
7. **Previous Behavior**: Avatar would reset

### Test Case 4: Save Functionality
1. Make changes to profile
2. Click "Save Changes"
3. Switch tabs and return
4. **Expected**: Form should show saved values, hasUnsavedChanges should be false

### Test Case 5: Cancel Functionality
1. Make changes to profile
2. Click "Cancel"
3. Switch tabs and return
4. **Expected**: Form should show original saved values, hasUnsavedChanges should be false

### Test Case 6: Mixed Changes
1. Make text field changes
2. Change avatar
3. Modify state dropdown
4. Switch tabs and return
5. **Expected**: All changes should be preserved

## Implementation Details

### Key Changes Made:
1. **Added state tracking**: `const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);`

2. **Modified useEffect**: Only resets form when no unsaved changes exist
   ```typescript
   useEffect(() => {
     if (profile && !hasUnsavedChanges) {
       setFormData({...});
     }
   }, [profile, hasUnsavedChanges]);
   ```

3. **Updated change handlers**: All form change functions now set `setHasUnsavedChanges(true)`
   - `handleChange` - for text inputs and selects
   - `handleAvatarChange` - for avatar uploads
   - `removeAvatar` - for avatar removal
   - `useGoogleAvatar` - for Google avatar selection

4. **Reset flag appropriately**:
   - `handleSubmit` - resets to false after successful save
   - `handleCancelEdit` - resets to false when canceling

## Expected Behavior After Fix:
- ✅ Form changes are preserved when switching browser tabs
- ✅ Normal save functionality works correctly
- ✅ Cancel functionality properly resets form
- ✅ Form initializes correctly when entering edit mode
- ✅ All types of changes (text, dropdown, avatar) are preserved

## Status: Ready for Testing
The implementation is complete and ready for manual testing to verify the fix works as expected.