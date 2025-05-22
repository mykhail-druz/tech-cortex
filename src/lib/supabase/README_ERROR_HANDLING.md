# Fixing 500 Error During User Registration

This document explains how to fix the 500 error that occurs during user registration in the TechCortex application.

## The Issue

When users try to register, they encounter a 500 error with the following details:

```
{
  "event_message": "POST | 500 | ... | https://qaugzgfnfndwilolhjdi.supabase.co/auth/v1/signup | ...",
  "metadata": [
    {
      "response": [
        {
          "headers": [
            {
              "x_sb_error_code": "unexpected_failure"
            }
          ],
          "status_code": 500
        }
      ]
    }
  ]
}
```

This error occurs because:

1. The user is successfully created in the `auth.users` table
2. The trigger that should create a corresponding record in the `user_profiles` table is failing
3. The failure is causing the entire transaction to roll back, resulting in a 500 error

## The Solution

The solution has three components:

1. **Improved Error Handling**: Update the trigger function to catch and log errors without failing the transaction
2. **Database Setup Verification**: Add functions to ensure all necessary database objects exist
3. **RLS Policy Verification**: Check and create required RLS policies if they're missing

## How to Apply the Fix

1. Open the SQL Editor in your Supabase dashboard
2. Copy the contents of `error_handling_trigger.sql`
3. Execute the SQL query
4. Run the setup function to ensure everything is properly configured:
   ```sql
   SELECT public.setup_user_profiles_system();
   ```

## What the Fix Does

The improved trigger function:

1. Uses a nested BEGIN/EXCEPTION block to catch errors
2. Logs detailed error information for debugging
3. Continues the transaction even if profile creation fails
4. Includes helper functions to verify database setup

## Verifying the Fix

After applying the fix:

1. Try registering a new user
2. The registration should complete without errors
3. Check the `user_profiles` table to confirm a profile was created
4. If there are still issues, check the Supabase logs for detailed error messages

## Troubleshooting

If you still encounter issues:

1. Check the Supabase logs for error messages from the trigger function
2. Verify that the `user_roles` table has a 'customer' role:
   ```sql
   SELECT * FROM user_roles WHERE name = 'customer';
   ```
3. Check that RLS policies are correctly applied:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```
4. Ensure the trigger is properly installed:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'create_user_profile_trigger';
   ```

## Additional Notes

- The fix is designed to be non-disruptive and can be applied to a production database
- Existing users without profiles will not be affected
- You can create profiles for existing users by running:
  ```sql
  SELECT public.create_missing_user_profiles();
  ```