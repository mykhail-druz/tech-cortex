-- Add RLS policy for inserting records into the user_profiles table
CREATE POLICY "Users can create their own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Add RLS policy for service role to create profiles for any user
CREATE POLICY "Service role can create any profile"
ON user_profiles
FOR INSERT
TO service_role
WITH CHECK (true);