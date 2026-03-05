-- Supabase Schema for Digital Invitations Module

CREATE TABLE IF NOT EXISTS public.invitation_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features JSONB -- { "has_music": true, "max_photos": 10 }
);

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID, -- REFERENCE TO AUTH se aplicável futuramente
    slug VARCHAR(255) UNIQUE NOT NULL, -- Ex: "casamento-ana-e-joao"
    title VARCHAR(255),
    event_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending_approval', -- pending, active, inactive
    template_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.invitations_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    bride_name VARCHAR(255),
    groom_name VARCHAR(255),
    event_location TEXT,
    maps_url TEXT,
    music_url TEXT,
    gallery_images TEXT[],
    tables_layout JSONB
);

CREATE TABLE IF NOT EXISTS public.invitations_rsvp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    is_attending BOOLEAN NOT NULL,
    adult_count INT DEFAULT 1,
    child_count INT DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.invitations_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    is_purchased BOOLEAN DEFAULT false,
    link_to_buy TEXT,
    purchased_by VARCHAR(255)
);

-- RLS
ALTER TABLE public.invitation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations_rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations_gifts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to plans and active invitations
CREATE POLICY "Public Read Plans" ON public.invitation_plans FOR SELECT USING (true);
CREATE POLICY "Public Read Invitations" ON public.invitations FOR SELECT USING (status = 'active');
CREATE POLICY "Public Read Invitation Details" ON public.invitations_details FOR SELECT USING (true);
CREATE POLICY "Public Read Gifts" ON public.invitations_gifts FOR SELECT USING (true);

-- Allow public insert to RSVP
CREATE POLICY "Public Insert RSVP" ON public.invitations_rsvp FOR INSERT WITH CHECK (true);

-- Allow admins full access via Node.js server (Bypasses RLS with Service Role Key)
