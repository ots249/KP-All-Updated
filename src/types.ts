export interface Subject {
  id: string;
  name: string;
  slug: string;
  apiUrl: string;
}

export interface WebsiteConfig {
  subjects: Subject[];
  defaultSubjectId?: string;
  apiAuthorization?: string;
  lastUpdated?: string;
}

export interface CourseContent {
  id: string | number;
  title: string;
  type: 'video' | 'pdf' | 'live' | 'whatsapp' | 'file';
  link?: string;
  slug?: string;
  available_from?: string;
  paid?: boolean;
  resource?: {
    link?: string;
    resourceable?: {
      link?: string;
      start_time?: string;
      end_time?: string;
    };
  };
}

export interface CourseSection {
  id: string | number;
  title: string;
  contents: CourseContent[];
}

export interface CourseData {
  title: string;
  subtitle?: string;
  image?: { link: string };
  sections: CourseSection[];
}
