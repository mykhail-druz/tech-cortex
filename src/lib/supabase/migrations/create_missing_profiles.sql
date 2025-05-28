-- Function to create profiles for existing users who don't have them
CREATE OR REPLACE FUNCTION public.create_missing_user_profiles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  success_count INT := 0;
  error_count INT := 0;
BEGIN
  RAISE NOTICE 'Starting to create missing user profiles...';
  
  FOR user_record IN 
    SELECT id, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.user_profiles)
  LOOP
    BEGIN
      INSERT INTO public.user_profiles (id, first_name, last_name, role_id)
      VALUES (
        user_record.id,
        COALESCE(user_record.raw_user_meta_data->>'first_name', user_record.raw_user_meta_data->>'given_name', 
          CASE 
            WHEN user_record.raw_user_meta_data->>'name' IS NOT NULL 
            THEN split_part(user_record.raw_user_meta_data->>'name', ' ', 1)
            ELSE ''
          END
        ),
        COALESCE(user_record.raw_user_meta_data->>'last_name', user_record.raw_user_meta_data->>'family_name', 
          CASE 
            WHEN user_record.raw_user_meta_data->>'name' IS NOT NULL AND position(' ' in user_record.raw_user_meta_data->>'name') > 0
            THEN substring(user_record.raw_user_meta_data->>'name' from position(' ' in user_record.raw_user_meta_data->>'name') + 1)
            ELSE ''
          END
        ),
        (SELECT id FROM user_roles WHERE name = 'customer')  -- Default to customer role
      );
      
      success_count := success_count + 1;
      RAISE NOTICE 'Created profile for user %', user_record.id;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Error creating profile for user %: % (SQLSTATE: %)', 
        user_record.id, SQLERRM, SQLSTATE;
    END;
  END LOOP;
  
  RAISE NOTICE 'Completed creating missing user profiles. Success: %, Errors: %', 
    success_count, error_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To run this function, execute:
-- SELECT public.create_missing_user_profiles();

-- Function to check if a specific user has a profile and create one if missing
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_exists BOOLEAN;
  user_data RECORD;
BEGIN
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = user_id) INTO profile_exists;
  
  -- If profile doesn't exist, create it
  IF NOT profile_exists THEN
    -- Get user data
    SELECT * FROM auth.users WHERE id = user_id INTO user_data;
    
    -- Create profile
    IF user_data.id IS NOT NULL THEN
      INSERT INTO public.user_profiles (id, first_name, last_name, role_id)
      VALUES (
        user_data.id,
        COALESCE(user_data.raw_user_meta_data->>'first_name', user_data.raw_user_meta_data->>'given_name', 
          CASE 
            WHEN user_data.raw_user_meta_data->>'name' IS NOT NULL 
            THEN split_part(user_data.raw_user_meta_data->>'name', ' ', 1)
            ELSE ''
          END
        ),
        COALESCE(user_data.raw_user_meta_data->>'last_name', user_data.raw_user_meta_data->>'family_name', 
          CASE 
            WHEN user_data.raw_user_meta_data->>'name' IS NOT NULL AND position(' ' in user_data.raw_user_meta_data->>'name') > 0
            THEN substring(user_data.raw_user_meta_data->>'name' from position(' ' in user_data.raw_user_meta_data->>'name') + 1)
            ELSE ''
          END
        ),
        (SELECT id FROM user_roles WHERE name = 'customer')  -- Default to customer role
      );
      
      RAISE NOTICE 'Created profile for user %', user_id;
      RETURN TRUE;
    ELSE
      RAISE WARNING 'User % not found in auth.users table', user_id;
      RETURN FALSE;
    END IF;
  ELSE
    RAISE NOTICE 'Profile already exists for user %', user_id;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To create a profile for a specific user, execute:
-- SELECT public.ensure_user_profile_exists('user-uuid-here');