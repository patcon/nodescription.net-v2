import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    date: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    start_date: z.object({
      year: z.number(),
      month: z.number().optional(),
      day: z.number().optional(),
    }),
    end_date: z.object({
      year: z.number(),
      month: z.number().optional(),
      day: z.number().optional(),
    }).optional(),
    display_date: z.string().optional(),
    media_url: z.string().optional(),
    media_credit: z.string().optional(),
    media_caption: z.string().optional(),
    media_thumbnail: z.string().optional(),
    group: z.string().optional(),
    background: z.string().optional(),
    source_url: z.string().nullable().optional(),
    homepage_url: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    collaborators: z.array(z.string()).optional(),
    status: z.string().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
  }),
});

export const collections = { notes, projects, posts };
