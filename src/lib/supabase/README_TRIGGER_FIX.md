# User Profile Trigger Fix

This document explains the fix for the syntax error in the user profile creation trigger.

## The Issue

The original trigger function had a syntax error in the array handling:

```sql
ERROR: 42601: syntax error at or near ":"
LINE 12: THEN array_to_string((NEW.raw_user_meta_data->>'name')::text[][1:], ' ') 
```

The problem was in the array slicing syntax `[1:]`, which is not valid in PostgreSQL.

## The Solution

The fix replaces the problematic array operations with standard PostgreSQL string functions:

1. For extracting the first name from a full name:
   - Used `split_part(name, ' ', 1)` instead of array casting

2. For extracting the last name (everything after the first space):
   - Used `substring(name from position(' ' in name) + 1)` instead of array slicing

## Files Updated

1. `user_profiles_trigger.sql` - The original trigger file
2. `fixed_user_profiles_trigger.sql` - The comprehensive solution with functions for both new and existing users
3. `fixed_create_user_profile.sql` - A standalone version of just the fixed trigger function

## How to Apply the Fix

1. Open the SQL Editor in your Supabase dashboard
2. Copy the contents of `fixed_user_profiles_trigger.sql`
3. Execute the SQL query
4. To create profiles for existing users, execute:
   ```sql
   SELECT public.create_missing_user_profiles();
   ```

## Verifying the Fix

After applying the fix, you can verify it works by:

1. Creating a new user through registration
2. Checking the `user_profiles` table to confirm a profile was created
3. Verifying that the first and last names were correctly extracted from OAuth providers

## Additional Notes

- The fix handles various metadata formats from different authentication methods (email, Google OAuth)
- It gracefully handles cases where name parts might be missing
- The trigger uses `SECURITY DEFINER` to ensure it has the necessary permissions