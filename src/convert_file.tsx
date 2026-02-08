import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ConvertFilesIcon from "./assets/convertfiles.svg";
import FileIcon from "./assets/fileicon.svg";

interface FileNode {
  nodeId: string;
  filePath: string;
  riskScore: number;
  convertibilityScore: number;
  classification: string;
  metrics: {
    fanIn: number;
    fanOut: number;
  };
}

export default function ConvertFiles() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      const analysisModule = await import("./analysis.json");
      const analysis = analysisModule.default as Record<string, FileNode>;

      const greenFiles = Object.values(analysis)
        .filter((f) => f.classification === "GREEN")
        .sort((a, b) => a.riskScore - b.riskScore);

      setFiles(greenFiles);
      setLoading(false);
    };

    loadFiles();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060C1E] flex items-center justify-center text-white">
        Loading files…
      </div>
    );
  }

  const convertEnabled = selected.size > 0;

  return (
    <div className="min-h-screen bg-[#060C1E] px-10 py-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          <span className="text-[#10B981]">Shadow</span>Code
        </div>

        <button
          disabled={!convertEnabled}
          className={`px-8 py-2.5 rounded-md text-sm font-medium transition ${
            convertEnabled
              ? "bg-[#10B981] text-black hover:brightness-110"
              : "bg-gray-500 text-gray-300 cursor-not-allowed"
          }`}
        >
          Convert
        </button>
      </div>

      {/* Status banner */}
      <div className="mt-6 flex gap-4 rounded-xl border border-[#10B981]/30 bg-gradient-to-r from-[#0B1227] to-[#060C1E] p-6">
        <img src={ConvertFilesIcon} alt="" className="h-12 w-12 shrink-0" />

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            {files.length} Files Safe to Convert
          </h3>

          <p className="mt-1 text-sm text-gray-400 leading-relaxed">
            These files have no risky dependencies and can be safely converted.
            Lorem ipsum lorem ipsum. These files have no risky dependencies and
            can be safely converted. Lorem ipsum lorem ipsum.
          </p>
        </div>
      </div>

      {/* File grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => {
          const isSelected = selected.has(file.nodeId);

          return (
            <div
              key={file.nodeId}
              onClick={() => toggleSelect(file.nodeId)}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur hover:border-[#10B981]/40 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={FileIcon} alt="" className="h-8 w-8" />
                  <span className="text-sm font-medium">
                    {file.filePath.split("/").pop()}
                  </span>
                </div>

                <div
                  className={`h-3 w-3 rounded-sm border transition ${
                    isSelected
                      ? "bg-[#10B981] border-[#10B981]"
                      : "bg-transparent border-gray-500"
                  }`}
                />
              </div>

              <p className="mt-1 text-xs text-gray-400">{file.filePath}</p>

              <div className="mt-3 flex justify-between text-xs text-gray-300">
                <span>Risk: {file.riskScore}</span>
                <span>
                  Dependencies: {file.metrics.fanIn + file.metrics.fanOut}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-10">
        <button
          onClick={() => navigate("/map")}
          className="px-6 py-2 rounded-md bg-[#10B981] text-black text-sm font-medium hover:brightness-110 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
