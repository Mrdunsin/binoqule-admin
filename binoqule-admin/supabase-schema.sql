-- Binoqule Admin Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Authors (Team Members)
CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL, -- e.g., "Co-Founder & Editor"
  bio TEXT,
  focus_area TEXT, -- e.g., "Data & Internet Policy"
  photo_url TEXT,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  deck TEXT, -- subtitle/description
  content JSONB NOT NULL, -- TipTap JSON format
  author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- e.g., "Policy Review", "Startup Law"
  tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  read_time INTEGER, -- in minutes
  status TEXT DEFAULT 'draft', -- draft | published
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscribers
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active', -- active | unsubscribed
  source TEXT DEFAULT 'website', -- website | manual | import
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ask A Lawyer Submissions
CREATE TABLE lawyer_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  area_of_law TEXT NOT NULL,
  issue TEXT NOT NULL,
  urgency TEXT,
  status TEXT DEFAULT 'pending', -- pending | assigned | resolved | closed
  assigned_to UUID REFERENCES authors(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  content JSONB NOT NULL, -- TipTap JSON
  html_content TEXT, -- rendered HTML for sending
  recipient_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft | sent
  sent_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_lawyer_submissions_status ON lawyer_submissions(status);
CREATE INDEX idx_lawyer_submissions_created ON lawyer_submissions(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated users can do everything for now)
-- You'll want to refine these based on roles later

CREATE POLICY "Authenticated users can read authors" 
  ON authors FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage authors" 
  ON authors FOR ALL 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read posts" 
  ON posts FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage posts" 
  ON posts FOR ALL 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read subscribers" 
  ON subscribers FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage subscribers" 
  ON subscribers FOR ALL 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read submissions" 
  ON lawyer_submissions FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage submissions" 
  ON lawyer_submissions FOR ALL 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read campaigns" 
  ON email_campaigns FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage campaigns" 
  ON email_campaigns FOR ALL 
  USING (auth.role() = 'authenticated');

-- Public policies for the live website to fetch published content
CREATE POLICY "Anyone can read published posts" 
  ON posts FOR SELECT 
  USING (status = 'published');

CREATE POLICY "Anyone can read authors" 
  ON authors FOR SELECT 
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyer_submissions_updated_at BEFORE UPDATE ON lawyer_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial team members (from your existing site)
INSERT INTO authors (name, email, role, focus_area, bio, order_position) VALUES
(
  'Rotimi Owolabi',
  'rotimi@binoqule.com',
  'Co-Founder & Editor',
  'Data & Internet Policy',
  'Rotimi is a legal professional and digital policy enthusiast specialising in the intersection of technology, law and policy. A Research Analyst at DigitA, his work focuses on advancing ethical and inclusive digital transformation within African contexts. He has served as a Research Fellow at Digspace Africa and the Center for AI and Digital Policy (CAIDP), and is a member of the organising team for the Nigeria Youth Internet Governance Forum.',
  1
),
(
  'Abosede Hassan',
  'abosede@binoqule.com',
  'Co-Founder & Editor',
  'IP & Corporate Finance',
  'Abosede is a legal professional at Banwo & Ighodalo, where she practises across Corporate Securities & Finance, Intellectual Property & Data Protection, and Litigation, Arbitration & ADR. An alumna of Obafemi Awolowo University and the Nigerian Law School, she believes there is no box in thinking. Her particular passion lies in intellectual property law.',
  2
),
(
  'Oluwadunsin Ogunsemoyin',
  'dunsin@binoqule.com',
  'Co-Founder & Editor',
  'Fintech & AI Law',
  'Dunsin is a legal professional with a focus spanning startups, artificial intelligence, innovation law, human rights, and dispute resolution. An alumnus of Obafemi Awolowo University, he represented the university at moot and mock competitions. He is an Associate Member of the Nigerian Institute of Chartered Arbitrators. Beyond his legal practice, Dunsin is a brand, product and web designer.',
  3
);

-- Sample post (you can delete this after testing)
INSERT INTO posts (title, slug, deck, content, author_id, category, tags, read_time, status) VALUES
(
  'Welcome to Binoqule Admin',
  'welcome-to-binoqule-admin',
  'Your content management system is ready to use.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is a sample post. You can edit or delete it from the admin panel."}]}]}',
  (SELECT id FROM authors WHERE email = 'dunsin@binoqule.com'),
  'Announcement',
  ARRAY['admin', 'welcome'],
  1,
  'draft'
);
