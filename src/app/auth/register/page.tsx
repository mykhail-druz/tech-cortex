'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New state variables for enhanced UI/UX
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4 scale
  const [validations, setValidations] = useState({
    email: { valid: false, message: '' },
    password: { 
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false
    },
    passwordsMatch: false
  });

  const { signUp, signInWithOAuth } = useAuth();
  const router = useRouter();

  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    setValidations(prev => ({
      ...prev,
      email: {
        valid: isValid,
        message: email && !isValid ? 'Please enter a valid email address' : ''
      }
    }));
  }, [email]);

  // Password validation and strength calculation
  useEffect(() => {
    const validations = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    setValidations(prev => ({
      ...prev,
      password: validations
    }));

    // Calculate password strength (0-4)
    const criteriaCount = Object.values(validations).filter(Boolean).length;
    setPasswordStrength(criteriaCount);

  }, [password]);

  // Confirm password validation
  useEffect(() => {
    setValidations(prev => ({
      ...prev,
      passwordsMatch: password === confirmPassword && confirmPassword !== ''
    }));
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check email validation
    if (!validations.email.valid) {
      setError('Please enter a valid email address');
      return;
    }

    // Check password requirements
    if (passwordStrength < 3) {
      setError('Please use a stronger password that meets the requirements');
      return;
    }

    // Validate passwords match
    if (!validations.passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Show success message and redirect to login page after a delay
      setSuccess('Registration successful! A confirmation email has been sent to your email address. Please check your inbox and confirm your account.');

      // Redirect after a short delay to allow the user to see the success message
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google') => {
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError('An error occurred with Google login. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-md mb-4 border border-green-200 shadow-sm animate-fadeIn flex items-center">
            <svg className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <div>
              {success}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="John"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-3 py-2 border ${
                  email && !validations.email.valid 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : email && validations.email.valid 
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
                      : 'border-gray-300 focus:ring-primary focus:border-primary'
                } rounded-md focus:outline-none`}
                placeholder="your@email.com"
              />
              {email && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {validations.email.valid ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                </span>
              )}
            </div>
            {validations.email.message && (
              <p className="mt-1 text-xs text-red-500">{validations.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-3 py-2 border ${
                  password && passwordStrength < 3
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : password && passwordStrength >= 3
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
                      : 'border-gray-300 focus:ring-primary focus:border-primary'
                } rounded-md focus:outline-none`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-500" />
                ) : (
                  <FaEye className="text-gray-500" />
                )}
              </button>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex mb-1">
                  <div className="text-xs text-gray-600 mb-1">Password strength:</div>
                  <div className="ml-auto text-xs">
                    {passwordStrength === 0 && "Very weak"}
                    {passwordStrength === 1 && "Weak"}
                    {passwordStrength === 2 && "Fair"}
                    {passwordStrength === 3 && "Good"}
                    {passwordStrength === 4 && "Strong"}
                    {passwordStrength === 5 && "Very strong"}
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ease-in-out ${
                      passwordStrength === 0 ? 'w-0' :
                      passwordStrength === 1 ? 'w-1/5 bg-red-500' :
                      passwordStrength === 2 ? 'w-2/5 bg-orange-500' :
                      passwordStrength === 3 ? 'w-3/5 bg-yellow-500' :
                      passwordStrength === 4 ? 'w-4/5 bg-lime-500' :
                      'w-full bg-green-500'
                    }`}
                  ></div>
                </div>
              </div>
            )}

            {/* Password requirements */}
            <div className="mt-2 grid grid-cols-2 gap-1">
              <div className="flex items-center text-xs">
                <span className={`mr-1 ${validations.password.minLength ? 'text-green-500' : 'text-gray-400'}`}>
                  {validations.password.minLength ? <FaCheck /> : '•'}
                </span>
                <span className={validations.password.minLength ? 'text-green-500' : 'text-gray-500'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center text-xs">
                <span className={`mr-1 ${validations.password.hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
                  {validations.password.hasUppercase ? <FaCheck /> : '•'}
                </span>
                <span className={validations.password.hasUppercase ? 'text-green-500' : 'text-gray-500'}>
                  Uppercase letter
                </span>
              </div>
              <div className="flex items-center text-xs">
                <span className={`mr-1 ${validations.password.hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
                  {validations.password.hasLowercase ? <FaCheck /> : '•'}
                </span>
                <span className={validations.password.hasLowercase ? 'text-green-500' : 'text-gray-500'}>
                  Lowercase letter
                </span>
              </div>
              <div className="flex items-center text-xs">
                <span className={`mr-1 ${validations.password.hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
                  {validations.password.hasNumber ? <FaCheck /> : '•'}
                </span>
                <span className={validations.password.hasNumber ? 'text-green-500' : 'text-gray-500'}>
                  Number
                </span>
              </div>
              <div className="flex items-center text-xs">
                <span className={`mr-1 ${validations.password.hasSpecialChar ? 'text-green-500' : 'text-gray-400'}`}>
                  {validations.password.hasSpecialChar ? <FaCheck /> : '•'}
                </span>
                <span className={validations.password.hasSpecialChar ? 'text-green-500' : 'text-gray-500'}>
                  Special character
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full px-3 py-2 border ${
                  confirmPassword && !validations.passwordsMatch
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : confirmPassword && validations.passwordsMatch
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
                      : 'border-gray-300 focus:ring-primary focus:border-primary'
                } rounded-md focus:outline-none`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="text-gray-500" />
                ) : (
                  <FaEye className="text-gray-500" />
                )}
              </button>
            </div>
            {confirmPassword && !validations.passwordsMatch && (
              <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
            )}
            {confirmPassword && validations.passwordsMatch && (
              <p className="mt-1 text-xs text-green-500">Passwords match</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => handleOAuthSignIn('google')}
              className="flex items-center justify-center py-2 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.798-1.677-4.203-2.701-6.735-2.701-5.539 0-10.032 4.493-10.032 10.032s4.493 10.032 10.032 10.032c8.445 0 10.283-7.919 9.455-11.73h-9.455z" />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
