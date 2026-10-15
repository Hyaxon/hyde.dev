import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { githubProjectsLoader } from "./lib/projects/github-loader";

import { projectCategories, projectStatuses } from "./lib/projects/types";

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

    blurb: z.string().optional(),

    draft: z.boolean().default(false),

    tags: z.array(z.string()).default([]),
  }),
});

const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  category: z.enum(projectCategories).default("software"),
  publishedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  pushedAt: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  linkedPosts: z.array(reference("posts")).default([]),
  github: z.url().optional(),
  demo: z.url().optional(),
  docs: z.url().optional(),
  repositoryStats: z
    .object({
      stars: z.number().int().nonnegative(),
      forks: z.number().int().nonnegative(),
      watchers: z.number().int().nonnegative(),
      contributors: z.number().int().nonnegative().optional(),
    })
    .optional(),
  languages: z
    .array(
      z.object({
        name: z.string(),
        percentage: z.number().min(0).max(100),
      }),
    )
    .default([]),
  status: z.enum(projectStatuses).default("active"),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: projectSchema,
});

const githubProjects = defineCollection({
  loader: githubProjectsLoader(),
  schema: projectSchema.extend({
    repo: z.url(),
    repoOwner: z.string(),
    repoName: z.string(),
  }),
});

export const collections = { posts, projects, githubProjects };
