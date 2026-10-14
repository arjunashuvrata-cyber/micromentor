-- MicroMentor database schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

-- Users of the app (passwords are stored as salted PBKDF2 hashes, never plain text)
create table if not exists public.app_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- One mentee profile per user
create table if not exists public.profiles (
  user_id          uuid primary key references public.app_users(id) on delete cascade,
  name             text not null,
  learning_goal    text not null,
  experience_level text not null check (experience_level in ('Beginner', 'Intermediate', 'Advanced')),
  updated_at       timestamptz not null default now()
);

-- Mentors and the 15-minute slots they offer
create table if not exists public.mentors (
  id    text primary key,
  name  text not null,
  title text not null,
  tags  text[] not null default '{}',
  bio   text not null,
  slots text[] not null default '{}'
);

-- Bookings. unique(mentor_id, slot) means a slot can only ever be booked once.
create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.app_users(id) on delete cascade,
  mentor_id  text not null references public.mentors(id) on delete cascade,
  slot       text not null,
  status     text not null default 'confirmed',
  created_at timestamptz not null default now(),
  unique (mentor_id, slot)
);

-- Security: turn on Row Level Security with NO policies.
-- The public "anon" key can therefore read/write nothing. Only the Python API,
-- which uses the secret service_role key from its environment variables, can.
alter table public.app_users enable row level security;
alter table public.profiles  enable row level security;
alter table public.mentors   enable row level security;
alter table public.bookings  enable row level security;

-- Seed mentors
insert into public.mentors (id, name, title, tags, bio, slots) values
  ('mentor-1', 'Ava Chen', 'Senior Product Manager @ Nimbus',
   array['Product Strategy','Career Switching','PM Interviews'],
   'Ava spent 8 years shipping consumer products and loves helping students figure out if PM is the right path for them.',
   array['Mon 10:00 AM','Mon 2:00 PM','Wed 4:30 PM']),
  ('mentor-2', 'Marcus Reid', 'Staff Software Engineer @ Delta Systems',
   array['Frontend','System Design','Job Search'],
   'Marcus mentors early-career engineers on system design fundamentals and how to stand out in technical interviews.',
   array['Tue 9:00 AM','Tue 1:00 PM','Thu 11:00 AM']),
  ('mentor-3', 'Priya Nair', 'UX Design Lead @ Northwind',
   array['UX Research','Portfolio Review','Design Careers'],
   'Priya reviews portfolios and shares how she transitioned from graphic design into UX leadership.',
   array['Mon 3:00 PM','Wed 10:00 AM','Fri 9:30 AM']),
  ('mentor-4', 'Diego Alvarez', 'Data Science Manager @ Alto Analytics',
   array['Data Science','Machine Learning','Grad School'],
   'Diego helps students choose between grad school and industry, and breaks down what a real DS job looks like.',
   array['Thu 1:00 PM','Thu 3:30 PM','Fri 11:00 AM']),
  ('mentor-5', 'Sofia Romano', 'Founder & CEO @ Lattice Health',
   array['Entrepreneurship','Fundraising','Early Career'],
   'Sofia has raised two rounds of funding and enjoys demystifying startup life for aspiring founders.',
   array['Tue 4:00 PM','Wed 1:30 PM','Fri 2:00 PM'])
on conflict (id) do nothing;
