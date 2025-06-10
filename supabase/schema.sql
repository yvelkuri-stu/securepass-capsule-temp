-- 📁 supabase/schema.sql (Run this in Supabase SQL Editor)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  display_name text,
  profile_picture text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login_at timestamp with time zone,
  mfa_enabled boolean default false not null,
  security_score integer default 75 not null check (security_score >= 0 and security_score <= 100)
);

-- Create capsules table
create table public.capsules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  data_types text[] not null default '{}',
  content jsonb default '{}' not null,
  metadata jsonb default '{}' not null,
  sharing jsonb default '{}' not null,
  security jsonb default '{}' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_accessed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create shared_capsules table (for sharing functionality)
create table public.shared_capsules (
  id uuid default uuid_generate_v4() primary key,
  capsule_id uuid references public.capsules(id) on delete cascade not null,
  shared_by uuid references public.profiles(id) on delete cascade not null,
  shared_with_email text not null,
  permissions text[] not null default '{"view"}',
  shared_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  accessed_at timestamp with time zone
);

-- Create activity_log table (for tracking access)
create table public.activity_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  capsule_id uuid references public.capsules(id) on delete cascade,
  action text not null, -- 'created', 'accessed', 'modified', 'shared', 'deleted'
  description text not null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.capsules enable row level security;
alter table public.shared_capsules enable row level security;
alter table public.activity_log enable row level security;

-- Profiles policies
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Capsules policies
create policy "Users can view own capsules" 
  on public.capsules for select 
  using (auth.uid() = user_id);

create policy "Users can insert own capsules" 
  on public.capsules for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own capsules" 
  on public.capsules for update 
  using (auth.uid() = user_id);

create policy "Users can delete own capsules" 
  on public.capsules for delete 
  using (auth.uid() = user_id);

-- Shared capsules policies
create policy "Users can view capsules shared with them" 
  on public.shared_capsules for select 
  using (
    auth.uid() = shared_by or 
    auth.email() = shared_with_email
  );

create policy "Users can insert sharing records for own capsules" 
  on public.shared_capsules for insert 
  with check (auth.uid() = shared_by);

create policy "Users can update sharing records they created" 
  on public.shared_capsules for update 
  using (auth.uid() = shared_by);

create policy "Users can delete sharing records they created" 
  on public.shared_capsules for delete 
  using (auth.uid() = shared_by);

-- Activity log policies
create policy "Users can view own activity" 
  on public.activity_log for select 
  using (auth.uid() = user_id);

create policy "Users can insert own activity" 
  on public.activity_log for insert 
  with check (auth.uid() = user_id);

-- Functions

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at() 
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_capsules_updated_at before update on public.capsules
  for each row execute procedure public.handle_updated_at();

-- Function to log activity
create or replace function public.log_activity(
  p_capsule_id uuid,
  p_action text,
  p_description text,
  p_metadata jsonb default '{}'
) returns void as $$
begin
  insert into public.activity_log (user_id, capsule_id, action, description, metadata)
  values (auth.uid(), p_capsule_id, p_action, p_description, p_metadata);
end;
$$ language plpgsql security definer;

-- Indexes for better performance
create index idx_capsules_user_id on public.capsules(user_id);
create index idx_capsules_created_at on public.capsules(created_at desc);
create index idx_shared_capsules_shared_with on public.shared_capsules(shared_with_email);
create index idx_activity_log_user_id on public.activity_log(user_id);
create index idx_activity_log_created_at on public.activity_log(created_at desc);

-- Insert some example data (optional)
-- This will only work after you have users signed up
/*
-- Example capsule (replace user_id with actual user ID)
insert into public.capsules (
  user_id, 
  title, 
  description, 
  data_types, 
  metadata,
  security
) values (
  'your-user-id-here',
  'Personal Documents',
  'Important personal documents and IDs',
  '{"text", "images", "attachments"}',
  '{"itemCount": 0, "totalSize": 0, "tags": ["personal", "documents"], "category": "Documents", "aiTags": ["identity", "official"], "securityLevel": "high", "version": 1}',
  '{"encryptionEnabled": true, "passwordProtected": true, "biometricLock": false, "accessLogging": true}'
);
*/

-- 📁 Supabase Storage Setup (Run in SQL Editor)

-- Create storage bucket for capsule files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'capsule-files',
  'capsule-files',
  false, -- Private bucket
  52428800, -- 50MB limit per file
  array[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
);

-- Storage policies for capsule files
create policy "Users can upload files to their own folders"
on storage.objects for insert
with check (
  bucket_id = 'capsule-files' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own files"
on storage.objects for select
using (
  bucket_id = 'capsule-files' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own files"
on storage.objects for update
using (
  bucket_id = 'capsule-files' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own files"
on storage.objects for delete
using (
  bucket_id = 'capsule-files' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add file_attachments table for metadata
create table public.file_attachments (
  id uuid default uuid_generate_v4() primary key,
  capsule_id uuid references public.capsules(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  storage_path text not null,
  thumbnail_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for file_attachments
alter table public.file_attachments enable row level security;

create policy "Users can view own file attachments"
on public.file_attachments for select
using (auth.uid() = user_id);

create policy "Users can insert own file attachments"
on public.file_attachments for insert
with check (auth.uid() = user_id);

create policy "Users can update own file attachments"
on public.file_attachments for update
using (auth.uid() = user_id);

create policy "Users can delete own file attachments"
on public.file_attachments for delete
using (auth.uid() = user_id);

-- Indexes
create index idx_file_attachments_capsule_id on public.file_attachments(capsule_id);
create index idx_file_attachments_user_id on public.file_attachments(user_id);

-- Trigger for updated_at
create trigger handle_file_attachments_updated_at before update on public.file_attachments
  for each row execute procedure public.handle_updated_at();

  --For encryption purpose
  -- Update all existing capsules to have proper security metadata
UPDATE capsules 
SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'), 
    '{isEncrypted}', 
    'false'
  ),
  security = jsonb_set(
    COALESCE(security, '{}'), 
    '{passwordProtected}', 
    'false'
  )
WHERE 
  metadata->>'isEncrypted' IS NULL 
  OR security->>'passwordProtected' IS NULL;