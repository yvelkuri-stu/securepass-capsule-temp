# SecurePass Capsule - Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:
- A Supabase project set up with database tables
- Environment variables configured
- Domain name (for production deployment)
- SSL certificate (automatically handled by most platforms)

## 🌐 Platform-Specific Deployment Instructions

### 1. Vercel (Recommended for Next.js)

#### Step 1: Connect Repository
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel
```

#### Step 2: Configure Environment Variables
In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add the following variables:

```env
# Required Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Optional
NODE_ENV=production
```

#### Step 3: Deploy
```bash
# Production deployment
vercel --prod
```

#### Vercel Configuration (`vercel.json`)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

### 2. Netlify

#### Step 1: Build Configuration (`netlify.toml`)
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### Step 2: Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify init
netlify deploy --prod
```

#### Step 3: Environment Variables
In Netlify Dashboard:
1. Site Settings → Environment Variables
2. Add the same variables as Vercel

---

### 3. Railway

#### Step 1: Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Step 2: Configure Domain
```bash
# Generate domain
railway domain

# Or use custom domain
railway domain add yourdomain.com
```

#### Environment Variables in Railway:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
PORT=3000
```

---

### 4. DigitalOcean App Platform

#### Step 1: App Spec (`app.yaml`)
```yaml
name: securepass-capsule
services:
- name: web
  source_dir: /
  github:
    repo: your-username/securepass-capsule
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NEXT_PUBLIC_SUPABASE_URL
    value: https://your-project.supabase.co
  - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
    value: your_anon_key
  - key: SUPABASE_SERVICE_ROLE_KEY
    value: your_service_key
  - key: NEXT_PUBLIC_APP_URL
    value: https://your-app.ondigitalocean.app
  routes:
  - path: /
```

#### Step 2: Deploy
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy from DigitalOcean dashboard

---

### 5. AWS Amplify

#### Step 1: Build Settings (`amplify.yml`)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

#### Step 2: Deploy
1. Connect repository in AWS Amplify Console
2. Configure build settings
3. Add environment variables
4. Deploy

---

### 6. Heroku

#### Step 1: Prepare for Heroku
```json
// In package.json, add:
{
  "scripts": {
    "heroku-postbuild": "npm run build"
  },
  "engines": {
    "node": "18.x"
  }
}
```

#### Step 2: Deploy
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_service_key
heroku config:set NEXT_PUBLIC_APP_URL=https://your-app.herokuapp.com

# Deploy
git push heroku main
```

---

## 🗄️ Database Setup (Supabase)

### Required SQL Schema
Run this in your Supabase SQL editor:

```sql
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  security_score INTEGER DEFAULT 75
);

-- Create capsules table
CREATE TABLE capsules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data_types TEXT[] DEFAULT '{}',
  content JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  sharing JSONB DEFAULT '{}',
  security JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file_attachments table
CREATE TABLE file_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  capsule_id UUID REFERENCES capsules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  encryption_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_log table
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  capsule_id UUID REFERENCES capsules(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('capsule-files', 'capsule-files', false);

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own capsules" ON capsules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own files" ON file_attachments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON activity_log FOR SELECT USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'capsule-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT USING (bucket_id = 'capsule-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'capsule-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### Storage Configuration
1. Go to Storage in Supabase Dashboard
2. Create bucket named `capsule-files`
3. Set bucket to private (not public)

---

## 🔐 Environment Variables Reference

### Required Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Optional Variables
```env
# Analytics (if using)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Error Monitoring (if using Sentry)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
NEXT_PUBLIC_ENABLE_DEMO_MODE=false
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Database schema created in Supabase
- [ ] Storage bucket configured
- [ ] RLS policies enabled
- [ ] Environment variables ready
- [ ] Custom domain purchased (optional)

### Post-Deployment
- [ ] Test user registration/login
- [ ] Test capsule creation
- [ ] Test file upload
- [ ] Verify PWA installation
- [ ] Test offline functionality
- [ ] Check SSL certificate
- [ ] Configure custom domain (if applicable)
- [ ] Set up monitoring/analytics

### Performance Optimization
- [ ] Enable gzip compression
- [ ] Configure CDN (if applicable)
- [ ] Optimize images
- [ ] Set proper cache headers
- [ ] Enable service worker caching

### Security Checklist
- [ ] Environment variables secured
- [ ] Database RLS policies tested
- [ ] File upload restrictions in place
- [ ] HTTPS enforced
- [ ] Security headers configured

---

## 🔧 Troubleshooting Common Issues

### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules
npm install

# Check for TypeScript errors
npm run type-check
```

### Environment Variable Issues
- Ensure `NEXT_PUBLIC_` prefix for client-side variables
- Restart deployment after adding new variables
- Check for typos in variable names

### Database Connection Issues
- Verify Supabase URL and keys
- Check RLS policies are enabled
- Ensure user has proper permissions

### PWA Issues
- Verify `manifest.json` is accessible
- Check service worker registration
- Ensure HTTPS in production

---

## 📊 Monitoring & Analytics

### Recommended Tools
- **Vercel Analytics** (if using Vercel)
- **Google Analytics 4**
- **Sentry** for error tracking
- **Supabase Dashboard** for database monitoring

### Custom Domain Setup
1. **Purchase domain** from registrar
2. **Configure DNS** to point to hosting platform
3. **Set up SSL** certificate (usually automatic)
4. **Update environment variable** `NEXT_PUBLIC_APP_URL`

---

## 🔄 CI/CD Setup

### GitHub Actions Example (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📝 Notes

- **PWA Features**: Service worker and manifest.json are included for offline functionality
- **Security**: Client-side encryption ensures zero-knowledge architecture
- **Scalability**: Supabase handles database scaling automatically
- **Performance**: Next.js provides automatic optimizations and static generation

Choose the deployment platform that best fits your needs. Vercel is recommended for its seamless Next.js integration and automatic deployments.