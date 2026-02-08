import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/* ===================== TYPES ===================== */

interface FileNode {
  nodeId: string;
  filePath: string;
  className: string;
  riskScore: number;
  convertibilityScore: number;
  classification: string;
  blastRadius: {
    affectedNodes: number;
    totalNodes: number;
    percentage: number;
  };
  metrics: {
    fanIn: number;
    fanOut: number;
    readsFromDb: boolean;
    writesToDb: boolean;
    inCycle: boolean;
  };
  reasons: string[];
  recommendations: string[];
}

interface GraphEdge {
  from: string;
  to: string;
  type: "CALLS" | "DEPENDS_ON";
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  filePath: string;
  classification: string;
  riskScore: number;
  convertibilityScore: number;
  metrics: FileNode["metrics"];
  blastRadius: FileNode["blastRadius"];
  reasons: string[];
  recommendations: string[];
}

/* ===================== COMPONENT ===================== */

const InteractiveGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<
    { source: string; target: string; type: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ===================== LOAD DATA ===================== */

  useEffect(() => {
    const loadData = async () => {
      const analysisModule = await import("./analysis.json");
      const graphModule = await import("./graph.json");

      const analysis = analysisModule.default as Record<string, FileNode>;
      const graph = graphModule.default as { edges: GraphEdge[] };

      const graphNodes: GraphNode[] = Object.values(analysis).map((f) => ({
        id: f.nodeId,
        name: f.filePath.split("/").pop() || f.className,
        filePath: f.filePath,
        classification: f.classification,
        riskScore: f.riskScore,
        convertibilityScore: f.convertibilityScore,
        metrics: f.metrics,
        blastRadius: f.blastRadius,
        reasons: f.reasons,
        recommendations: f.recommendations,
      }));

      const graphLinks = graph.edges.map((e) => ({
        source: e.from,
        target: e.to,
        type: e.type,
      }));

      setNodes(graphNodes);
      setLinks(graphLinks);
      setIsLoading(false);
    };

    loadData();
  }, []);

  /* ===================== COLOR ===================== */

  const nodeColor = (c: string) =>
    c === "RED" ? "#EF4444" : c === "YELLOW" ? "#F59E0B" : "#10B981";

  /* ===================== D3 GRAPH ===================== */

  useEffect(() => {
    if (!svgRef.current || isLoading) return;

    const width = 900;
    const height = 600;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    const g = svg.append("g");

    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3])
        .on("zoom", (e) => g.attr("transform", e.transform)),
    );

    /* ---------- SIMULATION ---------- */
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(140),
      )
      .force("charge", d3.forceManyBody().strength(-450))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(34));

    /* ---------- CURVED LINKS ---------- */
    const link = g
      .append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", (d: any) => (d.type === "CALLS" ? "#3B82F6" : "#6B7280"))
      .attr("stroke-width", (d: any) => (d.type === "CALLS" ? 2.5 : 1.5))
      .attr("stroke-opacity", 0.35);

    /* ---------- NODES ---------- */
    const node = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<any, any>()
          .on("start", (e) => {
            if (!e.active) simulation.alphaTarget(0.3).restart();
            e.subject.fx = e.subject.x;
            e.subject.fy = e.subject.y;
          })
          .on("drag", (e) => {
            e.subject.fx = e.x;
            e.subject.fy = e.y;
          })
          .on("end", (e) => {
            if (!e.active) simulation.alphaTarget(0);
            e.subject.fx = null;
            e.subject.fy = null;
          }),
      );

    node
      .append("circle")
      .attr("r", (d: any) => 14 + d.riskScore / 10)
      .attr("fill", (d: any) => nodeColor(d.classification))
      .attr("stroke", "#0F172A")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 0 6px rgba(16,185,129,0.35))")
      .attr("opacity", 0.9);

    node
      .append("text")
      .text((d: any) => d.name)
      .attr("y", 24)
      .attr("text-anchor", "middle")
      .attr("fill", "#E5E7EB")
      .attr("font-size", "10px")
      .attr("pointer-events", "none");

    /* ---------- HOVER HIGHLIGHT ---------- */
    node.on("mouseenter", function (_, d: any) {
      const connected = new Set<string>([d.id]);

      links.forEach((l: any) => {
        const s = typeof l.source === "object" ? l.source.id : l.source;
        const t = typeof l.target === "object" ? l.target.id : l.target;
        if (s === d.id) connected.add(t);
        if (t === d.id) connected.add(s);
      });

      node
        .select("circle")
        .attr("opacity", (n: any) => (connected.has(n.id) ? 1 : 0.2));

      link
        .attr("stroke-opacity", (l: any) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === d.id || t === d.id ? 0.9 : 0.05;
        })
        .attr("stroke-width", (l: any) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === d.id || t === d.id ? 3.5 : 1;
        });
    });

    node.on("mouseleave", () => {
      node.select("circle").attr("opacity", 0.9);
      link
        .attr("stroke-opacity", 0.35)
        .attr("stroke-width", (d: any) => (d.type === "CALLS" ? 2.5 : 1.5));
    });

    /* ---------- TICK ---------- */
    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;

        return `M ${d.source.x},${d.source.y}
                A ${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
  }, [nodes, links, isLoading]);

  /* ===================== UI ===================== */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1525] flex items-center justify-center text-white">
        Loading graph…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1525] p-6">
      <div className="bg-[#0F1C2E] rounded-lg border border-gray-700">
        <svg ref={svgRef} className="w-full h-[600px]" />
      </div>
    </div>
  );
};

export default InteractiveGraph;
