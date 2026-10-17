"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { ChevronLeft, ChevronRight, Folder, Home, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { PROJECTS } from "@/data/portfolio";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  label: string;
  radius: number;
  connectionCount?: number;
  category?: string;
  type: "section" | "project";
  url?: string;
  technologies?: readonly string[];
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
  type: "content" | "tag";
  reason?: string;
}

// Homepage sections
const SECTIONS = [
  { id: "hero", title: "Introduction", label: "intro", type: "section" as const },
  { id: "about", title: "About Me", label: "about", type: "section" as const },
  { id: "research", title: "Research", label: "research", type: "section" as const },
  { id: "work", title: "Work Experience", label: "work", type: "section" as const },
  { id: "education", title: "Education", label: "education", type: "section" as const },
  { id: "tech-stack", title: "Technical Skills", label: "tech stack", type: "section" as const },
  { id: "projects", title: "Projects", label: "projects", type: "section" as const },
  { id: "credentials", title: "Recognition", label: "recognition", type: "section" as const },
  { id: "contact", title: "Contact", label: "contact", type: "section" as const },
];

const PROJECT_NODES = PROJECTS.map((project) => ({
  id: `project-${project.slug}`,
  title: project.title,
  label: project.shortTitle,
  type: "project" as const,
  url: `/projects/${project.slug}/`,
  technologies: project.technologies,
}));

type LinkDefinition = {
  source: string;
  target: string;
  reason: string;
  strength?: number;
  type?: "content" | "tag";
};

const SECTION_LINKS: LinkDefinition[] = [
  { source: "hero", target: "about", reason: "introduction → full story" },
  { source: "hero", target: "research", reason: "current focus" },
  { source: "research", target: "projects", reason: "research → earlier work" },
  { source: "hero", target: "work", reason: "recent role" },
  { source: "about", target: "contact", reason: "profile → contact" },
  { source: "work", target: "education", reason: "experience → foundation" },
  { source: "work", target: "projects", reason: "professional → portfolio" },
  { source: "work", target: "tech-stack", reason: "roles → skills" },
  { source: "work", target: "credentials", reason: "fellowship → experience" },
  { source: "education", target: "projects", reason: "learning → building" },
  { source: "projects", target: "tech-stack", reason: "projects → technologies" },
];

const PROJECT_SECTION_LINKS: LinkDefinition[] = PROJECT_NODES.flatMap((project) => [
  { source: project.id, target: "projects", reason: "project detail", strength: 2 },
  { source: project.id, target: "tech-stack", reason: "verified technologies", strength: 1.5 },
]);

const SHARED_TECH_LINKS: LinkDefinition[] = PROJECT_NODES.flatMap((project, index) =>
  PROJECT_NODES.slice(index + 1).flatMap((otherProject) => {
    const shared = project.technologies.filter((technology) =>
      otherProject.technologies.includes(technology)
    );
    return shared.length >= 2
      ? [{
          source: project.id,
          target: otherProject.id,
          reason: `shared: ${shared.join(", ")}`,
          strength: 1,
          type: "tag" as const,
        }]
      : [];
  })
);

const UNIFIED_LINKS: LinkDefinition[] = [
  ...SECTION_LINKS,
  ...PROJECT_SECTION_LINKS,
  ...SHARED_TECH_LINKS,
];

// Categories
const CATEGORIES: Record<string, { name: string; items: string[]; icon: any }> = {
  "identity": {
    name: "Profile",
    items: ["hero", "about", "contact"],
    icon: Home,
  },
  "professional": {
    name: "Professional",
    items: ["work", "education", "credentials"],
    icon: Sparkles,
  },
  "practice": {
    name: "Practice",
    items: ["research", "tech-stack", "projects"],
    icon: Folder,
  },
  "research": {
    name: "Research & RL",
    items: ["project-vision-ppo-racing-arena", "project-browser-control-qwen-grpo", "project-rl-alignment-tinystories"],
    icon: Sparkles,
  },
  "agents": {
    name: "Agents & Retrieval",
    items: [
      "project-shl-assessment-agent",
      "project-rag-agentic-ai-suite",
      "project-pdf-analysis-report-system",
      "project-iron-man-intelligence",
    ],
    icon: Sparkles,
  },
  "systems": {
    name: "Systems & Product",
    items: ["project-network-security-mlops", "project-hackfinder-extension"],
    icon: Folder,
  },
  "vision": {
    name: "Computer Vision",
    items: ["project-football-analysis-yolo"],
    icon: Folder,
  },
};

function getCategory(id: string): string {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.items.includes(id)) return key;
  }
  return "identity";
}

interface UnifiedGraphProps {
  showProjects: boolean;
}

export function UnifiedGraph({ showProjects }: UnifiedGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORIES))
  );
  const router = useRouter();

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleSidebarHover = useCallback((id: string | null) => {
    setHighlightedId(id);
    
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const nodes = svg.selectAll<SVGCircleElement, GraphNode>("circle");
    const labels = svg.selectAll<SVGTextElement, GraphNode>("text");
    const links = svg.selectAll<SVGLineElement, GraphLink>("line");
    
    if (id === null) {
      nodes.transition().duration(150)
        .attr("opacity", 1)
        .attr("r", (d) => d.radius)
        .style("filter", (d) => {
          const count = d.connectionCount || 0;
          return count >= 3 ? "drop-shadow(0 0 6px rgba(142, 177, 194, 0.4))" : "none";
        });
      labels.transition().duration(150).attr("opacity", 1);
      links.transition().duration(150)
        .attr("stroke-opacity", (d) => d.type === "content" ? 0.6 : 0.25);
    } else {
      nodes.transition().duration(150)
        .attr("opacity", (d) => d.id === id ? 1 : 0.25)
        .attr("r", (d) => d.id === id ? d.radius * 1.4 : d.radius)
        .style("filter", (d) => d.id === id ? "drop-shadow(0 0 12px rgba(142, 177, 194, 0.7))" : "none");
      labels.transition().duration(150)
        .attr("opacity", (d) => d.id === id ? 1 : 0.15);
      links.transition().duration(150)
        .attr("stroke-opacity", (d) => {
          const sourceId = typeof d.source === "object" ? d.source.id : d.source;
          const targetId = typeof d.target === "object" ? d.target.id : d.target;
          return sourceId === id || targetId === id ? 1 : 0.08;
        });
    }
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setDimensions({ width, height: Math.min(600, width * 0.7) });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.type === "project") {
      router.push(node.url!);
    } else {
      const element = document.getElementById(node.id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [router]);

  useEffect(() => {
    if (!svgRef.current) return;

    const { width, height } = dimensions;

    const allNodes = showProjects
      ? [...SECTIONS, ...PROJECT_NODES]
      : SECTIONS;

    // Build links
    const links: GraphLink[] = [];
    const connectionCounts: Record<string, number> = {};
    const nodeIds = new Set(allNodes.map(n => n.id));

    UNIFIED_LINKS.forEach(({ source, target, reason, strength = 1, type = "content" }) => {
      if (nodeIds.has(source) && nodeIds.has(target)) {
        links.push({
          source,
          target,
          strength: strength * 1.5,
          type,
          reason,
        });
        connectionCounts[source] = (connectionCounts[source] || 0) + 1;
        connectionCounts[target] = (connectionCounts[target] || 0) + 1;
      }
    });

    const nodes: GraphNode[] = allNodes.map((item) => ({
      ...item,
      radius: item.type === "project" ? 8 : 6 + Math.min((connectionCounts[item.id] || 0) * 2, 10),
      connectionCount: connectionCounts[item.id] || 0,
      category: getCategory(item.id),
    }));

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height);

    const container = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(showProjects ? 100 : 80)
          .strength((d) => 0.3)
      )
      .force("charge", d3.forceManyBody().strength(showProjects ? -350 : -250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => d.radius + 35))
      .force("x", d3.forceX(width / 2).strength(0.03))
      .force("y", d3.forceY(height / 2).strength(0.03));

    simulationRef.current = simulation;

    const link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#8eb1c2")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", (d) => Math.sqrt(d.strength));

    const node = container
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        if (d.type === "project") return "#a78bfa";
        const count = d.connectionCount || 0;
        if (count >= 4) return "#6a9aad";
        if (count >= 2) return "#8eb1c2";
        if (count >= 1) return "#a7c8d4";
        return "#d4e5eb";
      })
      .attr("stroke", (d) => d.type === "project" ? "#7c3aed" : "#5a8a9d")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all duration-200")
      .style("filter", "drop-shadow(0 0 4px rgba(142, 177, 194, 0.3))")
      .on("mouseenter", function (event, d) {
        setHoveredNode(d);
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", d.radius * 1.5)
          .style("filter", "drop-shadow(0 0 12px rgba(142, 177, 194, 0.8))");

        link
          .transition()
          .duration(150)
          .attr("stroke-opacity", (l) => {
            const sourceId = typeof l.source === "object" ? l.source.id : l.source;
            const targetId = typeof l.target === "object" ? l.target.id : l.target;
            return sourceId === d.id || targetId === d.id ? 1 : 0.08;
          })
          .attr("stroke-width", (l) => {
            const sourceId = typeof l.source === "object" ? l.source.id : l.source;
            const targetId = typeof l.target === "object" ? l.target.id : l.target;
            return sourceId === d.id || targetId === d.id ? Math.sqrt(l.strength) * 1.5 : Math.sqrt(l.strength);
          });

        node.transition().duration(150).attr("opacity", (n) => {
          if (n.id === d.id) return 1;
          const isConnected = links.some((l) => {
            const sourceId = typeof l.source === "object" ? l.source.id : l.source;
            const targetId = typeof l.target === "object" ? l.target.id : l.target;
            return (sourceId === d.id && targetId === n.id) || (targetId === d.id && sourceId === n.id);
          });
          return isConnected ? 1 : 0.25;
        });

        labels.transition().duration(150).attr("opacity", (n) => {
          if (n.id === d.id) return 1;
          const isConnected = links.some((l) => {
            const sourceId = typeof l.source === "object" ? l.source.id : l.source;
            const targetId = typeof l.target === "object" ? l.target.id : l.target;
            return (sourceId === d.id && targetId === n.id) || (targetId === d.id && sourceId === n.id);
          });
          return isConnected ? 1 : 0.15;
        });
      })
      .on("mouseleave", function (event, d) {
        setHoveredNode(null);
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", d.radius)
          .style("filter", "drop-shadow(0 0 4px rgba(142, 177, 194, 0.3))");

        link
          .transition()
          .duration(150)
          .attr("stroke-opacity", 0.4)
          .attr("stroke-width", (l) => Math.sqrt(l.strength));

        node.transition().duration(150).attr("opacity", 1);
        labels.transition().duration(150).attr("opacity", 1);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      })
      .call(
        d3
          .drag<SVGCircleElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const labels = container
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.label)
      .attr("font-size", (d) => d.type === "project" ? "9px" : "10px")
      .attr("font-weight", (d) => d.type === "project" ? "600" : "500")
      .attr("fill", "currentColor")
      .attr("class", "text-foreground/70 pointer-events-none select-none")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.radius + 14);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      labels.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    const initialScale = 0.85;
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width * (1 - initialScale) / 2, height * (1 - initialScale) / 2)
        .scale(initialScale)
    );

    return () => {
      simulation.stop();
    };
  }, [dimensions, handleNodeClick, showProjects]);

  const visibleCategories = showProjects
    ? CATEGORIES 
    : Object.fromEntries(
        Object.entries(CATEGORIES).filter(([key]) =>
          ["identity", "professional", "practice"].includes(key)
        )
      );

  return (
    <div
      ref={containerRef}
      className="relative w-full mb-12 rounded-xl border border-border/50 bg-gradient-to-br from-violet-50/50 via-background to-purple-50/30 dark:from-violet-950/20 dark:via-background dark:to-purple-950/10 overflow-hidden"
    >
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-3 left-3 z-30 p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted/80 transition-colors"
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      <div
        className={`absolute left-0 top-0 bottom-0 z-20 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-48 opacity-100" : "w-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="h-full bg-background/90 backdrop-blur-sm border-r border-border/50 overflow-hidden">
          <div className="p-3 pt-12 h-full overflow-y-auto">
            <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {showProjects ? "Portfolio Graph" : "Sections"}
            </h3>
            
            <div className="space-y-1">
              {Object.entries(visibleCategories).map(([key, category]) => {
                const allItems = showProjects
                  ? [...SECTIONS, ...PROJECT_NODES]
                  : SECTIONS;
                const categoryItems = allItems.filter(item => category.items.includes(item.id));
                if (categoryItems.length === 0) return null;
                
                const isExpanded = expandedCategories.has(key);
                
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggleCategory(key)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded-md hover:bg-muted/50 transition-colors group"
                    >
                      <category.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-foreground/80 font-medium text-xs truncate">
                        {category.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {categoryItems.length}
                      </span>
                      <ChevronRight
                        className={`w-3 h-3 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {categoryItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleNodeClick(item as GraphNode)}
                            onMouseEnter={() => handleSidebarHover(item.id)}
                            onMouseLeave={() => handleSidebarHover(null)}
                            className={`w-full flex items-center gap-1.5 px-2 py-1 text-left text-xs rounded-md transition-colors ${
                              highlightedId === item.id
                                ? item.type === "project"
                                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                  : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                : "hover:bg-muted/50 text-foreground/70"
                            }`}
                          >
                            <span className="truncate">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <svg
        ref={svgRef}
        className={`w-full relative z-10 transition-all duration-300 ${
          sidebarOpen ? "pl-48" : ""
        }`}
        style={{ minHeight: "400px" }}
      />

      {hoveredNode && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 pointer-events-none z-20">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-foreground">
              {hoveredNode.title}
            </h4>
            {hoveredNode.type === "project" && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                project
              </span>
            )}
          </div>
          {hoveredNode.connectionCount !== undefined && hoveredNode.connectionCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {hoveredNode.connectionCount} connection{hoveredNode.connectionCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      <div className="absolute top-3 right-3 text-xs text-muted-foreground/60 hidden sm:block">
        {showProjects ? `${SECTIONS.length + PROJECT_NODES.length} nodes` : `${SECTIONS.length} sections`} • drag • zoom • click
      </div>
    </div>
  );
}
