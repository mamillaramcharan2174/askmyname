import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseService } from '../data/supabaseClient.js';

export const authRouter = Router();

// In-memory registered user cache for instant demo & offline fallback
interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // for demo storage
  name: string;
  createdAt: string;
}

const localUsers = new Map<string, UserRecord>();

// Pre-seed a default demo user for instant evaluation
localUsers.set('demo@askmydata.com', {
  id: 'usr_demo_001',
  username: 'demo_user',
  email: 'demo@askmydata.com',
  passwordHash: 'demo123',
  name: 'Demo Analyst',
  createdAt: new Date().toISOString(),
});

// Login Schema
const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Register Schema
const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

// Forgot Password Schema
const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

// 1. LOGIN
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || 'Invalid input' });
      return;
    }

    const { usernameOrEmail, password } = parseResult.data;
    const lowerTarget = usernameOrEmail.trim().toLowerCase();

    // Check local / demo users first
    let matchedUser: UserRecord | undefined = undefined;
    for (const u of localUsers.values()) {
      if (u.email.toLowerCase() === lowerTarget || u.username.toLowerCase() === lowerTarget) {
        matchedUser = u;
        break;
      }
    }

    if (matchedUser) {
      if (matchedUser.passwordHash === password) {
        res.json({
          success: true,
          token: `token_${matchedUser.id}_${Date.now()}`,
          user: {
            id: matchedUser.id,
            email: matchedUser.email,
            username: matchedUser.username,
            name: matchedUser.name,
          },
        });
        return;
      } else {
        res.status(401).json({ error: 'Incorrect password. Please try again or use Forgot Password.' });
        return;
      }
    }

    // Try Supabase Auth if configured
    try {
      const client = supabaseService.getClient();
      if (client && lowerTarget.includes('@')) {
        const { data, error } = await client.auth.signInWithPassword({
          email: lowerTarget,
          password,
        });

        if (!error && data?.user) {
          res.json({
            success: true,
            token: data.session?.access_token || `token_${data.user.id}`,
            user: {
              id: data.user.id,
              email: data.user.email,
              username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
              name: data.user.user_metadata?.name || 'Supabase User',
            },
          });
          return;
        }
      }
    } catch {
      // Continue to default error if Supabase check fails
    }

    // Default error
    res.status(401).json({
      error: 'User not found or invalid credentials. You can use demo@askmydata.com / demo123 or sign up.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// 2. REGISTER / SIGN UP
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || 'Invalid input' });
      return;
    }

    const { username, email, password, name } = parseResult.data;
    const lowerEmail = email.trim().toLowerCase();
    const lowerUsername = username.trim().toLowerCase();

    // Check if already exists in local users
    for (const u of localUsers.values()) {
      if (u.email.toLowerCase() === lowerEmail) {
        res.status(400).json({ error: 'An account with this email address already exists.' });
        return;
      }
      if (u.username.toLowerCase() === lowerUsername) {
        res.status(400).json({ error: 'This username is already taken. Please choose another.' });
        return;
      }
    }

    // Attempt Supabase sign up if available
    try {
      const client = supabaseService.getClient();
      if (client) {
        await client.auth.signUp({
          email: lowerEmail,
          password,
          options: {
            data: { username, name: name || username },
          },
        });
      }
    } catch {
      // Best effort; local storage guarantees immediate login
    }

    // Save to local cache
    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username,
      email: lowerEmail,
      passwordHash: password,
      name: name || username,
      createdAt: new Date().toISOString(),
    };
    localUsers.set(lowerEmail, newUser);

    res.json({
      success: true,
      token: `token_${newUser.id}_${Date.now()}`,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// 3. FORGOT PASSWORD
authRouter.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = ForgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || 'Invalid input' });
      return;
    }

    const { email } = parseResult.data;
    const lowerEmail = email.trim().toLowerCase();

    // If Supabase auth configured, trigger password reset email
    try {
      const client = supabaseService.getClient();
      if (client) {
        await client.auth.resetPasswordForEmail(lowerEmail);
      }
    } catch {
      // ignore
    }

    // Always return safe friendly success message (prevents user enumeration attacks)
    res.json({
      success: true,
      message: `Password reset instructions have been sent to ${email}. If an account exists, you will receive an email shortly. (For demo accounts, use password "demo123")`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process forgot password request' });
  }
});
