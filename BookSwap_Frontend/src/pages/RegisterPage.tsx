import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await authService.register(data.name, data.email, data.password);
      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      // Clean backend conflict/duplicate error checking
      const status = error.response?.status;
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (status === 409 || error.response?.data?.message?.toLowerCase().includes('already exists')) {
        errorMessage = 'An account with this email address already exists.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border border-border shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Create an account</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Join BookSwap today and start swapping books with readers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <User className="h-4 w-4" />
                  </span>
                  <Input
                    {...register('name')}
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    className={`pl-10 ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs font-semibold text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    {...register('email')}
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    className={`pl-10 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-semibold text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-semibold text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    {...register('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs font-semibold text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-10 mt-2 font-medium" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
