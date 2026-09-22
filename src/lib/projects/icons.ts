import type { ProjectCategory } from "./types";
import robotics from "../../assets/pixel/project-types/robotics.png";
import games from "../../assets/pixel/project-types/games.png";
import roblox from "../../assets/pixel/project-types/roblox.png";
import software from "../../assets/pixel/project-types/software.png";
import iot from "../../assets/pixel/project-types/iot.png";
import web from "../../assets/pixel/project-types/web.png";
import tools from "../../assets/pixel/project-types/tools.png";
import hackathons from "../../assets/pixel/project-types/hackathons.png";
import experiments from "../../assets/pixel/project-types/experiments.png";

// TODO: Replace default icons

export const projectIcons: Record<ProjectCategory, string> = {
  robotics: robotics.src,
  "game-dev": games.src,
  roblox: roblox.src,
  networking: software.src,
  iot: iot.src,
  software: software.src,
  web: web.src,
  tools: tools.src,
  hackathons: hackathons.src,
  experiments: experiments.src,
};
