# Test: PSU Power Loading Issue

## Issue Description
When loading a configuration from configurations/[id] page using "Load in PC Builder", the Recommended PSU Power shows 0 instead of the correct value.

## Root Cause Analysis
1. Configuration is loaded with correct `recommendedPsuPower` value
2. `useEffect` for validation triggers immediately when `configuration.components` changes
3. `fetchAndCacheProducts` is asynchronous and hasn't completed yet
4. `performValidation` runs with empty `productsCache`
5. Fallback logic sets `recommendedPsuPower = undefined`
6. This `undefined` value gets preserved instead of the original loaded value

## Test Steps
1. Go to configurations page
2. Find a configuration that has a GPU with recommended PSU power
3. Click "Load in PC Builder"
4. Check if PSU power shows correctly in ConfigurationSummary

## Expected Behavior
- PSU power should display the correct wattage from the saved configuration

## Current Behavior
- PSU power shows 0 or is not displayed at all

## Code Locations
- Loading: `loadConfigurationFromStorage` function (lines 120-189)
- Validation: `performValidation` function (lines 226-364)
- Display: ConfigurationSummary component (lines 188-194)