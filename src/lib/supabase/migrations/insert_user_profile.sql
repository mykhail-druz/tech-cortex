-- SQL script to manually insert a user profile for an existing user
-- Replace the values with your actual user ID, first name, last name, and role ID

-- First, get your user ID from the Authentication -> Users page
-- Then, get the admin role ID
INSERT INTO user_profiles (id, first_name, last_name, role_id)
VALUES (
  '851085f9-7234-4cb3-afd0-0be584557825',  -- Replace with your actual user ID from Auth -> Users
  'Mykhail',         -- Replace with your first name
  'Druz',          -- Replace with your last name
  (SELECT id FROM user_roles WHERE name = 'admin')  -- This gets the admin role ID
);

-- If you want to use a different role, replace 'admin' with 'manager' or 'customer'
-- For example, to use the customer role:
-- (SELECT id FROM user_roles WHERE name = 'customer')

-- If you get an error about the user profile already existing, you can update it instead:
-- UPDATE user_profiles
-- SET 
--   first_name = 'Mykhail',
--   last_name = 'Druz',
--   role_id = (SELECT id FROM user_roles WHERE name = 'admin')
-- WHERE id = '851085f9-7234-4cb3-afd0-0be584557825';