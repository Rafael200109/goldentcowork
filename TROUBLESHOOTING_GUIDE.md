
# Supabase Troubleshooting Guide

## 🚨 CRITICAL: "Feature is disabled" Error in Live Environment

This guide helps diagnose and fix Supabase connection issues, especially when the app works in preview but fails in live deployment.

---

## 📋 Section 1: Root Cause Analysis

### Why "Feature is disabled" error occurs:

1. **Missing Environment Variables (Most Common)**
   - `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not configured in live environment
   - Variables work in preview because they're in `.env` file locally
   - Live deployment (Vercel/Netlify) requires variables to be set in platform settings

2. **Invalid Environment Variables**
   - Variables are set but contain incorrect values
   - Copy-paste errors (extra spaces, incomplete keys)
   - Using wrong project URL or key

3. **Realtime Not Enabled**
   - Supabase Realtime feature is disabled in project settings
   - Causes chat, notifications, and live updates to fail

4. **CORS Configuration**
   - Supabase project doesn't allow requests from your domain
   - Blocked by browser due to CORS policy

5. **RLS Policies**
   - Row Level Security policies are too restrictive
   - User doesn't have permission to access data

### How Vite Environment Variables Work:

- **Development (Preview):**
  - Vite reads `.env` file in project root
  - Variables prefixed with `VITE_` are exposed to client
  - Available at build time and runtime

- **Production (Live):**
  - `.env` file is NOT deployed (gitignored)
  - Platform (Vercel/Netlify) must inject variables
  - Variables must be set in platform settings
  - Requires rebuild/redeploy to take effect

### Why undefined variables break Supabase:

