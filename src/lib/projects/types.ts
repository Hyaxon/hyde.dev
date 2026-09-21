export const projectCategories = [
  "robotics",
  "game-dev",
  "roblox",
  "networking",
  "iot",
  "software",
  "web",
  "tools",
  "experiments",
  "hackathons",
] as const;
export const projectStatuses = [
  "active",
  "complete",
  "archived",
  "experimental",
] as const;
export type ProjectCategory = (typeof projectCategories)[number];
export type ProjectStatus = (typeof projectStatuses)[number];

export interface ProjectDefinition {
  slug: string;

  // Local projects live only in src/content/projects.
  repo: string;

  // Optional metadata overrides.
  title?: string;
  description?: string;

  category: ProjectCategory;
  tags?: string[];

  featured?: boolean;
  visible?: boolean;
  status?: ProjectStatus;
}
