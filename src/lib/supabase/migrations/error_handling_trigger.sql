-- Create a function to automatically create user profiles when users are created
-- with improved error handling
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Add exception handling
  BEGIN
    INSERT INTO public.user_profiles (id, first_name, last_name, role_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'given_name', 
        CASE 
          WHEN NEW.raw_user_meta_data->>'name' IS NOT NULL 
          THEN split_part(NEW.raw_user_meta_data->>'name', ' ', 1)
          ELSE ''
        END
      ),
      COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'family_name', 
        CASE 
          WHEN NEW.raw_user_meta_data->>'name' IS NOT NULL AND position(' ' in NEW.raw_user_meta_data->>'name') > 0
          THEN substring(NEW.raw_user_meta_data->>'name' from position(' ' in NEW.raw_user_meta_data->>'name') + 1)
          ELSE ''
        END
      ),
      (SELECT id FROM user_roles WHERE name = 'customer')  -- Default to customer role
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Log successful insertion
    RAISE NOTICE 'User profile created for user %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error details
    RAISE WARNING 'Error creating user profile for user %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
      
    -- Continue with the transaction - don't block user creation
    -- The profile can be created later
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a user is created
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_profile();

-- Create a function to check if the user_roles table has the necessary roles
CREATE OR REPLACE FUNCTION public.ensure_user_roles_exist()
RETURNS void AS $$
DECLARE
  customer_role_exists BOOLEAN;
BEGIN
  -- Check if the customer role exists
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE name = 'customer') INTO customer_role_exists;
  
  -- If the customer role doesn't exist, create it
  IF NOT customer_role_exists THEN
    INSERT INTO user_roles (name, description)
    VALUES ('customer', 'Regular customer with standard access');
    
    RAISE NOTICE 'Created missing customer role';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to ensure RLS policies exist
CREATE OR REPLACE FUNCTION public.ensure_user_profiles_policies_exist()
RETURNS void AS $$
DECLARE
  insert_policy_exists BOOLEAN;
  service_role_policy_exists BOOLEAN;
BEGIN
  -- Check if the insert policy exists
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND operation = 'INSERT' 
    AND cmd = 'WITH CHECK (auth.uid() = id)'
  ) INTO insert_policy_exists;
  
  -- Check if the service role policy exists
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND operation = 'INSERT' 
    AND qualifier = 'service_role'
  ) INTO service_role_policy_exists;
  
  -- If the insert policy doesn't exist, create it
  IF NOT insert_policy_exists THEN
    EXECUTE 'CREATE POLICY "Users can create their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id)';
    RAISE NOTICE 'Created missing user profiles insert policy';
  END IF;
  
  -- If the service role policy doesn't exist, create it
  IF NOT service_role_policy_exists THEN
    EXECUTE 'CREATE POLICY "Service role can create any profile" ON user_profiles FOR INSERT TO service_role WITH CHECK (true)';
    RAISE NOTICE 'Created missing service role insert policy';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run all setup steps
CREATE OR REPLACE FUNCTION public.setup_user_profiles_system()
RETURNS void AS $$
BEGIN
  -- Ensure roles exist
  PERFORM public.ensure_user_roles_exist();
  
  -- Ensure policies exist
  PERFORM public.ensure_user_profiles_policies_exist();
  
  -- Create profiles for existing users
  PERFORM public.create_missing_user_profiles();
  
  RAISE NOTICE 'User profiles system setup complete';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To run the complete setup, execute:
-- SELECT public.setup_user_profiles_system();