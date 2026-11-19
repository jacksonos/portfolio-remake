// TODO: todo el texto de este archivo es editable. Las etapas estan descritas de forma generica:
// reemplazalas con tus empleadores, fechas y logros reales cuando quieras.

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
  sub: 'Empecé en WordPress, crecí en sistemas legados de AS400/COBOL y hoy construyo productos full stack como semi senior, con un flujo de trabajo AI-first.',
  cta1: { label: 'Ver mi historia', href: '#historia' },
  cta2: { label: 'Escríbeme', href: '#contacto' },
}

export const bentoTitle = 'Lo que hago hoy'

export const bento = [
  { title: 'Full stack', text: 'Productos web de punta a punta: interfaz, backend y datos, con una experiencia fluida para quien los usa.', span: 'md:col-span-2 md:row-span-2' },
  { title: 'Flujo AI-first', text: 'La IA es mi copiloto para diseñar, escribir y revisar código, siempre con criterio humano al final.', span: 'md:col-span-2' },
  { title: 'Legado a moderno', text: 'Puente entre AS400/COBOL y APIs actuales.', span: 'md:col-span-1' },
  { title: 'Calidad continua', text: 'Pruebas, revisión y entregas pequeñas.', span: 'md:col-span-1' },
  { title: 'Producto antes que código', text: 'Entiendo el problema del negocio primero y elijo la solución más simple que funcione, para que el software sea fácil de mantener y de hacer crecer.', span: 'md:col-span-4' },
]

export const manifesto =
  'Empecé armando sitios, aprendí a pensar en sistemas, entré al mundo de los programas críticos que llevan décadas funcionando y hoy uso la inteligencia artificial como compañera de trabajo para llevar lo que funciona hacia lo que viene.'

// Cada etapa es un paso primario (indice 0..4). `until` = ultimo paso en que sigue ACTIVA (por defecto el suyo).
// Los trabajos en `parallel` no son pasos: viven en el intervalo from..to (indices de paso, inclusivo).
// Los carriles del riel y los clones del sprite se derivan solos de estos intervalos.
export interface Job {
  job: string // nombre AS400 de 8 caracteres
  title: string
  sub: string
  user: string
  num: string
  text: string
  points: string[]
  short?: string // una linea para las tarjetas compactas
}
export interface Stage extends Job {
  lesson: string
  until?: number
}
export interface Parallel extends Job {
  from: number
  to: number
  look: number // atuendo del clon (indice en sprites.ts gear/shirts)
}

export const stages: Stage[] = [
  {
    job: 'WORDPRS',
    sub: 'QINTER',
    user: 'DEVWEB',
    num: '000121',
    title: 'Desarrollo WordPress',
    text: 'Mi primer contacto profesional con el desarrollo: temas, plugins y sitios para clientes reales.',
    points: ['Maquetación y PHP del día a día', 'Hablar con quien usa el producto', 'Entregar rápido y con detalle'],
    lesson: 'Entregar algo visible y útil rápido me enseñó a escuchar al usuario antes de escribir una línea.',
  },
  {
    job: 'SWENGNR',
    sub: 'QBATCH',
    user: 'DEVSWE',
    num: '000122',
    title: 'Software Engineer',
    text: 'Di el salto a la ingeniería: lenguajes tipados, APIs, bases de datos y trabajo en equipo.',
    points: ['JavaScript, TypeScript y Node', 'Diseño de APIs y modelado de datos', 'Revisión de código y pruebas'],
    short: 'APIs, datos y código revisado en equipo, en paralelo.',
    until: 3,
    lesson: 'Un buen sistema se piensa en capas: lo simple y bien nombrado supera a lo ingenioso.',
  },
  {
    job: 'COBINTRN',
    sub: 'QCTL',
    user: 'QPGMR',
    num: '000123',
    title: 'Practicante AS400 / COBOL',
    text: 'Entré a un ecosistema distinto: pantallas verdes, RPG/COBOL y sistemas que no pueden fallar.',
    points: ['Leer código que otros escribieron hace años', 'Disciplina de lotes y procesos', 'Respeto por lo que ya funciona'],
    lesson: 'Aprender desde cero otra vez me volvió humilde: el código viejo casi siempre esconde una buena razón.',
  },
  {
    job: 'COBANLST',
    sub: 'QBATCH',
    user: 'QPGMR',
    num: '000124',
    title: 'Analista AS400 / COBOL',
    text: 'Pasé de ejecutar tareas a analizar, mejorar y documentar procesos críticos del negocio.',
    points: ['Análisis de requerimientos', 'Mejora y mantenimiento de programas', 'Documentar para quien venga después'],
    lesson: 'Entender el negocio detrás del programa vale más que dominar la sintaxis.',
  },
  {
    job: 'FULLSTCK',
    sub: 'QUSRWRK',
    user: 'DEVAI',
    num: '000125',
    title: 'Full Stack Semi Senior, AI-first',
    text: 'Hoy uno todo lo anterior: producto web de punta a punta, integración con sistemas legados y la IA dentro del flujo de trabajo.',
    points: ['Interfaz, backend y datos de extremo a extremo', 'Integración legado a servicios modernos', 'IA para acelerar, humano para decidir'],
    lesson: 'La IA multiplica a quien ya entiende los fundamentos; no los reemplaza.',
  },
]

export const parallel: Parallel[] = [
  {
    job: 'QAAUTO',
    sub: 'QINTER',
    user: 'QAUSER',
    num: '000126',
    title: 'QA Automation',
    text: 'En paralelo automatizaba pruebas para que cada entrega se verificara sola.',
    points: [
      'Casos de prueba repetibles en lugar de revisiones manuales',
      'Pensar en cómo se rompe antes de entregar',
      'Pruebas como parte del flujo, no al final',
    ],
    short: 'Pruebas automáticas: cada entrega se verifica sola.',
    from: 2,
    to: 3,
    look: 5,
  },
]

export const stack = [
  'WordPress / PHP',
  'JavaScript / TypeScript',
  'React',
  'Node',
  'SQL',
  'AS400 / RPG-COBOL',
  'LLM / AI tooling',
]

export const learningsTitle = 'Lo que cada etapa me enseñó'

export const cta = {
  title: 'Hablemos.',
  text: 'Si tienes un producto, un sistema heredado o una idea con IA, cuéntame.',
}
