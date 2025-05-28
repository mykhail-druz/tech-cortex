-- Create a function to automatically create user profiles when users are created
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a user is created
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_profile();

-- Create a trigger to update existing users that don't have profiles
CREATE OR REPLACE FUNCTION public.create_missing_user_profiles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.user_profiles)
  LOOP
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
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To run this function to create profiles for existing users, execute:
-- SELECT public.create_missing_user_profiles();
