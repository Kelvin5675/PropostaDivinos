-- SECURITY & SCHEMA FIX: Wedding Invitations (Robusto)

-- 1. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS public.invitation_faq (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invitation_guestbook (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invitation_mural (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    guest_name TEXT,
    image_url TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 2. ENABLE RLS on all related tables
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations_rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_mural ENABLE ROW LEVEL SECURITY;


-- 3. DROP ALL POSSIBLE POLICIES (to avoid "already exists" errors)
-- Invitations
DROP POLICY IF EXISTS "Admin Full Access Invitations" ON public.invitations;
DROP POLICY IF EXISTS "Public Read Active Invitations" ON public.invitations;
DROP POLICY IF EXISTS "Enable ALL for Invitations" ON public.invitations;
DROP POLICY IF EXISTS "Public Read Invitations" ON public.invitations;

-- Plans
DROP POLICY IF EXISTS "Admin Full Access Plans" ON public.invitation_plans;
DROP POLICY IF EXISTS "Public Read Plans" ON public.invitation_plans;
DROP POLICY IF EXISTS "Enable ALL for Plans" ON public.invitation_plans;

-- RSVP
DROP POLICY IF EXISTS "Admin Full Access RSVP" ON public.invitations_rsvp;
DROP POLICY IF EXISTS "Public Insert RSVP" ON public.invitations_rsvp;
DROP POLICY IF EXISTS "Public Insert" ON public.invitations_rsvp;

-- Gifts
DROP POLICY IF EXISTS "Admin Full Access Gifts" ON public.invitations_gifts;
DROP POLICY IF EXISTS "Public Read Gifts" ON public.invitations_gifts;
DROP POLICY IF EXISTS "Public Read Select Gifts" ON public.invitations_gifts;

-- Details
DROP POLICY IF EXISTS "Admin Full Access Details" ON public.invitations_details;
DROP POLICY IF EXISTS "Public Read Details" ON public.invitations_details;
DROP POLICY IF EXISTS "Public Read" ON public.invitations_details;

-- FAQ
DROP POLICY IF EXISTS "Admin Full Access FAQ" ON public.invitation_faq;
DROP POLICY IF EXISTS "Public Read FAQ" ON public.invitation_faq;

-- Guestbook
DROP POLICY IF EXISTS "Admin Full Access Guestbook" ON public.invitation_guestbook;
DROP POLICY IF EXISTS "Public Read Moderated Guestbook" ON public.invitation_guestbook;
DROP POLICY IF EXISTS "Public Insert Guestbook" ON public.invitation_guestbook;

-- Mural
DROP POLICY IF EXISTS "Admin Full Access Mural" ON public.invitation_mural;
DROP POLICY IF EXISTS "Public Read Moderated Mural" ON public.invitation_mural;
DROP POLICY IF EXISTS "Public Insert Mural" ON public.invitation_mural;


-- 4. APPLY STRICT POLICIES

-- ADMIN ACCESS: Authenticated users (logged in as Admin)
CREATE POLICY "Admin Full Access Invitations" ON public.invitations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Plans" ON public.invitation_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access RSVP" ON public.invitations_rsvp FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Gifts" ON public.invitations_gifts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Details" ON public.invitations_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access FAQ" ON public.invitation_faq FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Guestbook" ON public.invitation_guestbook FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Mural" ON public.invitation_mural FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PUBLIC ACCESS: Restricted read and moderated insert
CREATE POLICY "Public Read Active Invitations" ON public.invitations FOR SELECT TO public USING (is_public = true AND status = 'active');
CREATE POLICY "Public Read Plans" ON public.invitation_plans FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert RSVP" ON public.invitations_rsvp FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Read Gifts" ON public.invitations_gifts FOR SELECT TO public USING (true);
CREATE POLICY "Public Read Details" ON public.invitations_details FOR SELECT TO public USING (true);
CREATE POLICY "Public Read FAQ" ON public.invitation_faq FOR SELECT TO public USING (true);

-- Guestbook Public access
CREATE POLICY "Public Read Moderated Guestbook" ON public.invitation_guestbook FOR SELECT TO public USING (is_moderated = true);
CREATE POLICY "Public Insert Guestbook" ON public.invitation_guestbook FOR INSERT TO public WITH CHECK (true);

-- Mural Public access
CREATE POLICY "Public Read Moderated Mural" ON public.invitation_mural FOR SELECT TO public USING (is_moderated = true);
CREATE POLICY "Public Insert Mural" ON public.invitation_mural FOR INSERT TO public WITH CHECK (true);
