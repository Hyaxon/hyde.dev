import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.{md,mdx}",
  }),

  schema: z.object({
    title: z.string(),
    description: z.string(),

    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),

    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "**/*.{md,mdx}",
  }),

  schema: z.object({
    title: z.string(),
    description: z.string(),

    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),

    draft: z.boolean().default(false),
    featured: z.boolean().default(false),

    tags: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),

    github: z.url().optional(),
    demo: z.url().optional(),

    status: z
      .enum(["active", "complete", "experimental", "archived"])
      .default("active"),
  }),
});

export const collections = {
  posts,
  projects,
};
