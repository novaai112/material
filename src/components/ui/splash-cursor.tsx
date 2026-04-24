"use client";
import React, { useEffect, useRef } from 'react';

export function SplashCursor({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1440,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 2,
  PRESSURE = 0.1,
  CURL = 3,
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  COLOR_UPDATE_SPEED = 10
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let simulation: any = null;

    import('webgl-fluid').then(({ default: webGLFluidEnhanced }) => {
      simulation = webGLFluidEnhanced(canvas, {
        SIM_RESOLUTION,
        DYE_RESOLUTION,
        DENSITY_DISSIPATION,
        VELOCITY_DISSIPATION,
        PRESSURE,
        CURL,
        SPLAT_RADIUS,
        SPLAT_FORCE,
        COLOR_UPDATE_SPEED,
        BACK_COLOR: { r: 0, g: 0, b: 0 },
        TRANSPARENT: true,
        BLOOM: true,
        SUNRAYS: true,
        COLORFUL: true
      });
    }).catch(err => console.error("Failed to load webgl-fluid", err));

    return () => {
      if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (gl) {
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
      }
    };
  }, [SIM_RESOLUTION, DYE_RESOLUTION, DENSITY_DISSIPATION, VELOCITY_DISSIPATION, PRESSURE, CURL, SPLAT_RADIUS, SPLAT_FORCE, COLOR_UPDATE_SPEED]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0, // Behind the UI
        pointerEvents: 'auto' // Important: this must catch the events that fall through the UI
      }}
    />
  );
}