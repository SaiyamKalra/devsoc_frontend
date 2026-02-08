import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useState } from "react";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init) return null;

  return (
    <div
      className="fixed inset-0 z-0 w-full h-full min-h-screen pointer-events-none"
      aria-hidden
    >
      <Particles
        id="tsparticles"
        className="absolute inset-0 w-full h-full"
        options={{
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 60,
          fullScreen: false,
          particles: {
            color: {
              value: "#10B981",
            },
            links: {
              color: "#10B981",
              distance: 140,
              enable: true,
              opacity: 0.35,
              width: 1,
            },
            move: {
              enable: true,
              speed: 0.8,
              direction: "none",
              random: true,
              straight: false,
              outModes: {
                default: "bounce",
              },
            },
            number: {
              value: 60,
              density: {
                enable: true,
                width: 1920,
                height: 1080,
              },
            },
            opacity: {
              value: { min: 0.2, max: 0.6 },
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 4 },
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
}
