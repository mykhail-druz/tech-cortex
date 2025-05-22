# User Profiles in TechCortex

This document explains how to fix issues with user profiles not being created automatically after registration.

## The Issue

When users register, their information is stored in the `auth.users` table, but a corresponding record is not automatically created in the `user_profiles` table. This prevents users from updating their profile information.

## Solution

There are two ways to fix this issue:

### 1. Manual Fix for Existing Users

If you already have users in your system without profiles, you can manually insert profiles for them using the `insert_user_profile.sql` script:

1. Go to the Supabase dashboard and navigate to Authentication -> Users
2. Find the user ID of the user you want to create a profile for
3. Open the SQL Editor in Supabase
4. Copy the contents of `insert_user_profile.sql`
5. Replace the placeholder values with the actual user ID, first name, last name, and role
6. Execute the SQL query

Example:
```sql
INSERT INTO user_profiles (id, first_name, last_name, role_id)
VALUES (
  '851085f9-7234-4cb3-afd0-0be584557825',  -- Replace with your actual user ID from Auth -> Users
  'Mykhail',         -- Replace with your first name
  'Druz',          -- Replace with your last name
  (SELECT id FROM user_roles WHERE name = 'admin')  -- This gets the admin role ID
);
```

### 2. Automatic Fix for All Users

To ensure that user profiles are automatically created for all users (both new and existing):

1. Open the SQL Editor in Supabase
2. Copy the contents of `fixed_user_profiles_trigger.sql`
3. Execute the SQL query
4. To create profiles for existing users, execute:
   ```sql
   SELECT public.create_missing_user_profiles();
   ```

This will:
- Create a trigger that automatically creates a user profile when a new user registers
- Create a function that can be run to create profiles for existing users that don't have them

## Verifying the Fix

After applying either solution, you can verify that the user profile was created by:

1. Going to the Supabase dashboard and navigating to Table Editor
2. Selecting the `user_profiles` table
3. Checking if there's a record with the user ID you're interested in

## Troubleshooting

If you encounter issues:

1. Check that the RLS policies for the `user_profiles` table allow inserting records:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```

2. If there are no INSERT policies, add them using the `user_profiles_policy.sql` script:
   ```sql
   CREATE POLICY "Users can create their own profile"
   ON user_profiles
   FOR INSERT
   WITH CHECK (auth.uid() = id);

   CREATE POLICY "Service role can create any profile"
   ON user_profiles
   FOR INSERT
   TO service_role
   WITH CHECK (true);
   ```

3. Make sure the `user_roles` table has the necessary roles:
   ```sql
   SELECT * FROM user_roles;
   ```

4. If the roles are missing, add them:
   ```sql
   INSERT INTO user_roles (name, description) VALUES
     ('admin', 'Administrator with full access to all features'),
     ('manager', 'Manager with access to most administrative features'),
     ('customer', 'Regular customer with standard access');
   ```