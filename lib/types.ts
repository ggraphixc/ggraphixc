export type Project = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  image_url: string | null;
  result: string | null;
  description: string | null;
  link: string | null;
  featured: boolean;
  client_name: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  display_order: number;
  created_at: string;
};

export type ProjectImage = {
  id: string;
  project_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  created_at: string;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  quote: string;
  display_order: number;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  logo_url: string | null;
  display_order: number;
  created_at: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  created_at: string;
};

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  investment_range: string | null;
  message: string;
  status: string;
  created_at: string;
};

export type SiteSetting = {
  id: string;
  key: string;
  value: string;
  updated_at: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  content: string;
  tags: string | null;
  published: boolean;
  display_order: number;
  created_at: string;
};

// Supabase-generated schema typing (loosely). Used for client typing convenience.
export type Database = {
  public: {
    Tables: {
      projects: { Row: Project; Insert: Omit<Project, "id" | "created_at">; Update: Partial<Project> };
      project_images: { Row: ProjectImage; Insert: Omit<ProjectImage, "id" | "created_at">; Update: Partial<ProjectImage> };
      testimonials: { Row: Testimonial; Insert: Omit<Testimonial, "id" | "created_at">; Update: Partial<Testimonial> };
      inquiries: { Row: Inquiry; Insert: Omit<Inquiry, "id" | "created_at" | "status">; Update: Partial<Inquiry> };
      clients: { Row: Client; Insert: Omit<Client, "id" | "created_at">; Update: Partial<Client> };
      faqs: { Row: Faq; Insert: Omit<Faq, "id" | "created_at">; Update: Partial<Faq> };
      site_settings: { Row: SiteSetting; Insert: Omit<SiteSetting, "updated_at">; Update: Partial<SiteSetting> };
      blog_posts: { Row: BlogPost; Insert: Omit<BlogPost, "id" | "created_at">; Update: Partial<BlogPost> };
    };
  };
};
