import React, { useState, useEffect, useRef } from 'react';
import { createDefaultPendulum, updatePendulum } from './physics';
import type { Link, Energy } from './physics';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [links, setLinks] = useState<Link[]>(createDefaultPendulum(2));
  const [useDrag, setUseDrag] = useState(false);
  const [energy, setEnergy] = useState<Energy>({ kinetic: 0, potential: 0, workDrag: 0, });
  const [trail, setTrail] = useState<{ x: number; y: number; }[]>([]);
  const animationRef = useRef<number>(0);
  const workDragRef = useRef(0);

  const reset = () => {
    setLinks(createDefaultPendulum(links.length));
    setTrail([]);
    workDragRef.current = 0;
  };

  const addLink = () => {
    const newLinks = [...links, {
      length: Math.max(50, links[links.length - 1].length - 10),
      mass: 10,
      angle: Math.PI / 2,
      angularVelocity: 0,
    }];
    setLinks(newLinks);
  };

  const removeLink = () => {
    if (links.length > 1) {
      const newLinks = [...links];
      newLinks.pop();
      setLinks(newLinks);
    }
  };

  const updateLink = (index: number, field: keyof Link, value: number) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      const result = updatePendulum(links, useDrag);
      setLinks(result.links);
      workDragRef.current += result.energy.workDrag;
      setEnergy({
        kinetic: result.energy.kinetic,
        potential: result.energy.potential,
        workDrag: workDragRef.current,
      });

      ctx.fillStyle = 'rgba(17, 24, 39, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let x = canvas.width / 2;
      let y = canvas.height / 2;
      const points = [{ x, y }];

      for (const link of result.links) {
        x += link.length * Math.sin(link.angle);
        y += link.length * Math.cos(link.angle);
        points.push({ x, y });
      }

      setTrail(prev => {
        const newTrail = [...prev, points[points.length - 1]];
        return newTrail.length > 500 ? newTrail.slice(1) : newTrail;
      });

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }

      //mass drawing
      points.slice(1).forEach((pt, i) => {
        ctx.fillStyle = i === points.length - 2 ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.sqrt(result.links[i].mass) * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      //trail drawing
      if (trail.length > 1) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current);
  }, [links, useDrag]);

  return (
    <div className="relative h-screen w-screen flex">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute top-4 left-4 bg-gray-800/80 p-4 rounded-lg max-w-xs space-y-4">
        <h2 className="text-xl font-bold">Multi-Pendulum</h2>

        <div className="flex gap-2">
          <button onClick={reset} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700">
            Reset
          </button>
          <button onClick={addLink} className="px-3 py-1 bg-green-600 rounded hover:bg-green-700">
            + Link
          </button>
          <button onClick={removeLink} className="px-3 py-1 bg-red-600 rounded hover:bg-red-700" disabled={links.length <= 1}>
            - Link
          </button>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useDrag}
              onChange={(e) => setUseDrag(e.target.checked)}
              className="rounded"
            />
            <span>Air Resistance</span>
          </label>
        </div>

        <div className="text-sm space-y-1 font-mono">
          <div>Kinetic: {energy.kinetic.toFixed(2)} J</div>
          <div>Potential: {energy.potential.toFixed(2)} J</div>
          {useDrag && <div>Work (Drag): {energy.workDrag.toFixed(2)} J</div>}
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {links.map((link, i) => (
            <div key={i} className="bg-gray-700/50 p-2 rounded text-xs">
              <div className="font-bold">Link {i + 1}</div>
              <div className="flex gap-1 mt-1">
                <input
                  type="number"
                  value={link.mass}
                  onChange={(e) => updateLink(i, 'mass', parseFloat(e.target.value) || 1)}
                  className="w-16 p-1 text-black"
                  min="1"
                  step="1"
                />
                <span>mass</span>
              </div>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={link.length}
                  onChange={(e) => updateLink(i, 'length', parseFloat(e.target.value) || 50)}
                  className="w-16 p-1 text-black"
                  min="20"
                  step="5"
                />
                <span>length</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;