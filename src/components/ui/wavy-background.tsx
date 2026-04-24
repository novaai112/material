"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}: any) => {
  const noise = () => Math.random() * 2 - 1;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getSpeed = () => (speed === "fast" ? 0.002 : 0.001);

  const init = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const waveColors = colors ?? ["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"];
    let w = (ctx.canvas.width = window.innerWidth);
    let h = (ctx.canvas.height = window.innerHeight);
    ctx.filter = `blur(${blur}px)`;
    let nt = 0;

    window.onresize = function () {
      w = ctx.canvas.width = window.innerWidth;
      h = ctx.canvas.height = window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };

    const render = () => {
      ctx.fillStyle = backgroundFill || "#050508";
      ctx.globalAlpha = waveOpacity || 0.5;
      ctx.fillRect(0, 0, w, h);
      drawWave(5);
      requestAnimationFrame(render);
    };

    const drawWave = (n: number) => {
      nt += getSpeed();
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.lineWidth = waveWidth || 50;
        ctx.strokeStyle = waveColors[i % waveColors.length];
        for (let x = 0; x < w; x += 5) {
          const y = noise() * 10 + Math.sin(x * 0.005 + nt + i) * 100 + h * 0.5;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.closePath();
      }
    };

    render();
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div className={cn("h-screen flex flex-col items-center justify-center relative overflow-hidden", containerClassName)}>
      <canvas className="absolute inset-0 z-0" ref={canvasRef} id="canvas" />
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
};