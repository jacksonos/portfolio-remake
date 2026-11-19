import type { Icon } from '@phosphor-icons/react'
import {
  BracketsCurly, FileTs, Atom, Hexagon, Database, TerminalWindow, Sparkle,
} from '@phosphor-icons/react'

// TODO: todo el texto de este archivo es editable. Las etapas estan descritas de forma generica:
// reemplazalas con tus empleadores, fechas y logros reales cuando quieras.

export const pic = (seed: string) => `https://picsum.photos/seed/${seed}/1920/1080`

export const profile = {
  name: 'Nombre Apellido',
  email: 'hola@tudominio.dev',
  links: [
    { label: 'GitHub', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'CV', href: '#' },
  ],
}

export const nav = [
  { label: 'Hoy', href: '#hoy', mobile: true },
  { label: 'Historia', href: '#historia', mobile: true },
  { label: 'Stack', href: '#stack', mobile: false },
  { label: 'Aprendizajes', href: '#aprendizajes', mobile: false },
  { label: 'Contacto', href: '#contacto', mobile: true },
]

export const hero = {
  lineA: 'Software',
  lineB: 'que escala.',
  pillSeed: 'circuit',
  floatSeed: 'workspace',
  sub: 'Empecé en WordPress, crecí en sistemas legados de AS400/COBOL y hoy construyo productos full stack como semi senior, con un flujo de trabajo AI-first.',
  cta1: { label: 'Ver mi historia', href: '#historia' },
  cta2: { label: 'Escríbeme', href: '#contacto' },
}

export const bentoTitle = 'Lo que hago hoy'

export const bento = [
  { title: 'Full stack', text: 'Productos web de punta a punta: interfaz, backend y datos, con una experiencia fluida para quien los usa.', seed: 'server', span: 'md:col-span-2 md:row-span-2' },
  { title: 'Flujo AI-first', text: 'La IA es mi copiloto para diseñar, escribir y revisar código, siempre con criterio humano al final.', seed: 'neural', span: 'md:col-span-2' },
  { title: 'Legado a moderno', text: 'Puente entre AS400/COBOL y APIs actuales.', seed: 'mainframe', span: 'md:col-span-1' },
  { title: 'Calidad continua', text: 'Pruebas, revisión y entregas pequeñas.', seed: 'quality', span: 'md:col-span-1' },
  { title: 'Producto antes que código', text: 'Entiendo el problema del negocio primero y elijo la solución más simple que funcione, para que el software sea fácil de mantener y de hacer crecer.', seed: 'product', span: 'md:col-span-4' },
]

export const manifesto =
  'Empecé armando sitios, aprendí a pensar en sistemas, entré al mundo de los programas críticos que llevan décadas funcionando y hoy uso la inteligencia artificial como compañera de trabajo para llevar lo que funciona hacia lo que viene.'

export const stages = [
  {
    title: 'Desarrollo WordPress', hue: '#1d2b4f', seed: 'wordpress',
    text: 'Mi primer contacto profesional con el desarrollo: temas, plugins y sitios para clientes reales.',
    points: ['Maquetación y PHP del día a día', 'Hablar con quien usa el producto', 'Entregar rápido y con detalle'],
    lesson: 'Entregar algo visible y útil rápido me enseñó a escuchar al usuario antes de escribir una línea.',
  },
  {
    title: 'Software Engineer', hue: '#15383a', seed: 'engineer',
    text: 'Di el salto a la ingeniería: lenguajes tipados, APIs, bases de datos y trabajo en equipo.',
    points: ['JavaScript, TypeScript y Node', 'Diseño de APIs y modelado de datos', 'Revisión de código y pruebas'],
    lesson: 'Un buen sistema se piensa en capas: lo simple y bien nombrado supera a lo ingenioso.',
  },
  {
    title: 'Practicante AS400 / COBOL', hue: '#3a2a14', seed: 'terminal',
    text: 'Entré a un ecosistema distinto: pantallas verdes, RPG/COBOL y sistemas que no pueden fallar.',
    points: ['Leer código que otros escribieron hace años', 'Disciplina de lotes y procesos', 'Respeto por lo que ya funciona'],
    lesson: 'Aprender desde cero otra vez me volvió humilde: el código viejo casi siempre esconde una buena razón.',
  },
  {
    title: 'Analista AS400 / COBOL', hue: '#3b1d2e', seed: 'analyst',
    text: 'Pasé de ejecutar tareas a analizar, mejorar y documentar procesos críticos del negocio.',
    points: ['Análisis de requerimientos', 'Mejora y mantenimiento de programas', 'Documentar para quien venga después'],
    lesson: 'Entender el negocio detrás del programa vale más que dominar la sintaxis.',
  },
  {
    title: 'Full Stack Semi Senior, AI-first', hue: '#2b1d4a', seed: 'future',
    text: 'Hoy uno todo lo anterior: producto web de punta a punta, integración con sistemas legados y la IA dentro del flujo de trabajo.',
    points: ['Interfaz, backend y datos de extremo a extremo', 'Integración legado a servicios modernos', 'IA para acelerar, humano para decidir'],
    lesson: 'La IA multiplica a quien ya entiende los fundamentos; no los reemplaza.',
  },
]

export const stack: { label: string; icon: Icon }[] = [
  { label: 'WordPress / PHP', icon: BracketsCurly },
  { label: 'JavaScript / TypeScript', icon: FileTs },
  { label: 'React', icon: Atom },
  { label: 'Node', icon: Hexagon },
  { label: 'SQL', icon: Database },
  { label: 'AS400 / RPG-COBOL', icon: TerminalWindow },
  { label: 'LLM / AI tooling', icon: Sparkle },
]

export const learningsTitle = 'Lo que cada etapa me enseñó'

export const cta = {
  title: 'Hablemos.',
  text: 'Si tienes un producto, un sistema heredado o una idea con IA, cuéntame.',
}
