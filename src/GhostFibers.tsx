import React, { useEffect, useRef } from 'react';

export interface GhostFibersProps {
  lineColor?: string;
  glowColor?: string;
  speed?: number;
  scale?: number;
  rotation?: number;
  rotationSpeed?: number;
  layers?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
  layerSpeed?: number;
  twist?: number;
  twistFrequency?: number;
  twistSpeed?: number;
  lineFrequency?: number;
  lineSpacing?: number;
  lineSharpness?: number;
  glowFalloff?: number;
  glowIntensity?: number;
  brightness?: number;
  blueBoost?: number;
  vignette?: number;
  grain?: number;
  dpr?: number;
  lightMode?: boolean;
  fps?: number;
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Converte cor Hex (#rrggbb) em [r, g, b] normalizado (0 a 1)
function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [0.35, 0.74, 0.36];
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return [r, g, b];
}

const VERTEX_SHADER_SRC = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_lineColor;
  uniform vec3 u_glowColor;
  uniform float u_scale;
  uniform float u_rotation;
  uniform float u_rotationSpeed;
  uniform int u_layers;
  uniform float u_waveAmplitude;
  uniform float u_waveFrequency;
  uniform float u_waveSpeed;
  uniform float u_layerSpeed;
  uniform float u_twist;
  uniform float u_twistFrequency;
  uniform float u_twistSpeed;
  uniform float u_lineFrequency;
  uniform float u_lineSpacing;
  uniform float u_lineSharpness;
  uniform float u_glowFalloff;
  uniform float u_glowIntensity;
  uniform float u_brightness;
  uniform float u_blueBoost;
  uniform float u_vignette;
  uniform float u_grain;
  uniform bool u_lightMode;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  mat2 rotate2d(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    uv *= u_scale;

    // Rotação angular base
    float angle = u_rotation + u_time * u_rotationSpeed;
    uv = rotate2d(angle) * uv;

    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // Efeito de torção radial (twist)
    float twistOffset = sin(r * u_twistFrequency - u_time * u_twistSpeed) * u_twist;
    a += twistOffset;

    // Reconstrói coordenadas com torção
    vec2 twistedUV = vec2(cos(a), sin(a)) * r;

    vec3 finalColor = vec3(0.0);

    // Múltiplas camadas de fibras recursivas
    for (int i = 0; i < 8; i++) {
      if (i >= u_layers) break;
      float fi = float(i);
      float t = u_time * (u_waveSpeed + fi * u_layerSpeed);

      vec2 p = twistedUV;
      // Deslocamento ondulatório recursivo
      p.x += sin(p.y * u_waveFrequency + t + fi * 1.3) * u_waveAmplitude * 20.0;
      p.y += cos(p.x * u_waveFrequency + t * 0.8 + fi * 0.9) * u_waveAmplitude * 20.0;

      // Distância periódica para o núcleo da fibra
      float wave = sin(p.x * u_lineFrequency + sin(p.y * u_lineSpacing + t * 1.5));
      float d = abs(wave);

      // Núcleo fino e nítido
      float core = exp(-d * u_lineSharpness);

      // Faixas de halo luminoso difuso
      float glow = exp(-d * u_glowFalloff) * u_glowIntensity;

      vec3 layerCol = u_lineColor * core + u_glowColor * glow;
      finalColor += layerCol / float(u_layers);
    }

    finalColor *= u_brightness;
    finalColor.b *= u_blueBoost;

    // Vinheta suave nas bordas
    vec2 vigUV = gl_FragCoord.xy / u_resolution.xy;
    float vig = vigUV.x * (1.0 - vigUV.x) * vigUV.y * (1.0 - vigUV.y) * 16.0;
    vig = clamp(pow(vig, max(0.1, u_vignette * 0.5)), 0.0, 1.0);
    finalColor *= vig;

    // Granulação cinematográfica (grain)
    float noise = (random(gl_FragCoord.xy + fract(u_time)) - 0.5) * u_grain;
    finalColor += noise;

    if (u_lightMode) {
      finalColor = 1.0 - finalColor;
    }

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
`;

export const GhostFibers: React.FC<GhostFibersProps> = ({
  lineColor = '#5abc5c',
  glowColor = '#248438',
  speed = 0.2,
  scale = 2,
  rotation = 0,
  rotationSpeed = 0.25,
  layers = 4,
  waveAmplitude = 0.015,
  waveFrequency = 3,
  waveSpeed = 0.15,
  layerSpeed = 0.08,
  twist = 0.1,
  twistFrequency = 5,
  twistSpeed = 1.2,
  lineFrequency = 5,
  lineSpacing = 2,
  lineSharpness = 16,
  glowFalloff = 10,
  glowIntensity = 1.6,
  brightness = 2,
  blueBoost = 1.25,
  vignette = 0.8,
  grain = 0.05,
  dpr = 1,
  lightMode = false,
  fps = 60,
  paused = false,
  className = '',
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext('webgl', { preserveDrawingBuffer: false, alpha: true }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      console.warn('WebGL not supported, rendering fallback canvas.');
      return;
    }

    // Compilação dos shaders
    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Buffer do quad de tela cheia
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Obtenção das localizações das uniforms
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uLineColor = gl.getUniformLocation(program, 'u_lineColor');
    const uGlowColor = gl.getUniformLocation(program, 'u_glowColor');
    const uScale = gl.getUniformLocation(program, 'u_scale');
    const uRotation = gl.getUniformLocation(program, 'u_rotation');
    const uRotationSpeed = gl.getUniformLocation(program, 'u_rotationSpeed');
    const uLayers = gl.getUniformLocation(program, 'u_layers');
    const uWaveAmplitude = gl.getUniformLocation(program, 'u_waveAmplitude');
    const uWaveFrequency = gl.getUniformLocation(program, 'u_waveFrequency');
    const uWaveSpeed = gl.getUniformLocation(program, 'u_waveSpeed');
    const uLayerSpeed = gl.getUniformLocation(program, 'u_layerSpeed');
    const uTwist = gl.getUniformLocation(program, 'u_twist');
    const uTwistFrequency = gl.getUniformLocation(program, 'u_twistFrequency');
    const uTwistSpeed = gl.getUniformLocation(program, 'u_twistSpeed');
    const uLineFrequency = gl.getUniformLocation(program, 'u_lineFrequency');
    const uLineSpacing = gl.getUniformLocation(program, 'u_lineSpacing');
    const uLineSharpness = gl.getUniformLocation(program, 'u_lineSharpness');
    const uGlowFalloff = gl.getUniformLocation(program, 'u_glowFalloff');
    const uGlowIntensity = gl.getUniformLocation(program, 'u_glowIntensity');
    const uBrightness = gl.getUniformLocation(program, 'u_brightness');
    const uBlueBoost = gl.getUniformLocation(program, 'u_blueBoost');
    const uVignette = gl.getUniformLocation(program, 'u_vignette');
    const uGrain = gl.getUniformLocation(program, 'u_grain');
    const uLightMode = gl.getUniformLocation(program, 'u_lightMode');

    let animationId: number;
    let startTime = performance.now();
    let lastFrameTime = startTime;
    const frameInterval = 1000 / (fps || 60);

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = dpr || Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * pixelRatio));
      const height = Math.max(1, Math.floor(rect.height * pixelRatio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const render = (now: number) => {
      if (paused) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const elapsed = now - lastFrameTime;
      if (elapsed >= frameInterval) {
        lastFrameTime = now - (elapsed % frameInterval);

        resize();

        gl.useProgram(program);

        const currentTime = ((now - startTime) * 0.001) * speed;
        gl.uniform1f(uTime, currentTime);
        gl.uniform2f(uResolution, canvas.width, canvas.height);

        const lColor = hexToRgb(lineColor);
        const gColor = hexToRgb(glowColor);
        gl.uniform3f(uLineColor, lColor[0], lColor[1], lColor[2]);
        gl.uniform3f(uGlowColor, gColor[0], gColor[1], gColor[2]);

        gl.uniform1f(uScale, scale);
        gl.uniform1f(uRotation, (rotation * Math.PI) / 180);
        gl.uniform1f(uRotationSpeed, rotationSpeed);
        gl.uniform1i(uLayers, Math.min(8, Math.max(1, Math.floor(layers))));
        gl.uniform1f(uWaveAmplitude, waveAmplitude);
        gl.uniform1f(uWaveFrequency, waveFrequency);
        gl.uniform1f(uWaveSpeed, waveSpeed);
        gl.uniform1f(uLayerSpeed, layerSpeed);
        gl.uniform1f(uTwist, twist);
        gl.uniform1f(uTwistFrequency, twistFrequency);
        gl.uniform1f(uTwistSpeed, twistSpeed);
        gl.uniform1f(uLineFrequency, lineFrequency);
        gl.uniform1f(uLineSpacing, lineSpacing);
        gl.uniform1f(uLineSharpness, lineSharpness);
        gl.uniform1f(uGlowFalloff, glowFalloff);
        gl.uniform1f(uGlowIntensity, glowIntensity);
        gl.uniform1f(uBrightness, brightness);
        gl.uniform1f(uBlueBoost, blueBoost);
        gl.uniform1f(uVignette, vignette);
        gl.uniform1f(uGrain, grain);
        gl.uniform1i(uLightMode, lightMode ? 1 : 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      if (gl) {
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
      }
    };
  }, [
    lineColor,
    glowColor,
    speed,
    scale,
    rotation,
    rotationSpeed,
    layers,
    waveAmplitude,
    waveFrequency,
    waveSpeed,
    layerSpeed,
    twist,
    twistFrequency,
    twistSpeed,
    lineFrequency,
    lineSpacing,
    lineSharpness,
    glowFalloff,
    glowIntensity,
    brightness,
    blueBoost,
    vignette,
    grain,
    dpr,
    lightMode,
    fps,
    paused,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  );
};

export default GhostFibers;
