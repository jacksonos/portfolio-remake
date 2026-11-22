// Copy y datos. Cada modulo edita SOLO su seccion.
// Toda afirmacion visible debe constar en CLAIMS.md (raiz del proyecto).

// ---------------------------------------------------------------- identidad (compartida, solo A)
export const site = {
  name: 'Michel Poma',
  email: 'michelpoma457@gmail.com',
  city: 'Lima, Perú',
  tz: 'America/Lima', // zona horaria IANA editable
  role: 'Full Stack Engineer · Aybar Corp',
  links: { github: 'https://github.com/jacksonos', linkedin: 'https://www.linkedin.com/in/michelpoma/' },
}

// ---------------------------------------------------------------- hero [A]
export const hero = {
  labels: { now: 'Actualmente', based: 'Basado en', nav: 'Navegación' },
  nowSub: 'más de tres años en software, año y medio en banca',
  nav: ['Recorrido', 'Principios, método y datos', 'Contacto'],
  blurb:
    'Ingeniería de software en banca y servicios financieros: de COBOL y AS/400 a Java, Spring Batch y full stack, con IA en todo el ciclo y revisión humana en cada cambio.',
  cta: 'Ver el recorrido',
}

// ---------------------------------------------------------------- fly [B]
export const fly = {
  stations: [
    {
      id: 'cobol',
      title: 'COBOL',
      lesson: 'El dinero no es un float.',
      meta: ['Unibanca', '2025 a 2026', 'IBM i · COBOL · CL · DB2', 'tarjetas de crédito'],
      text: 'Mantuve y evolucioné aplicaciones de tarjetas de crédito y procesamiento transaccional en IBM i con COBOL, CL y DB2: mejoras funcionales, incidencias, procesos automatizados con CL y herramientas en Python.',
    },
    {
      id: 'spring',
      title: 'Spring',
      lesson: 'Primero se entiende el flujo; después se optimiza.',
      meta: ['BBVA vía Softtek', '2025 a 2026', 'Java 8 · Spring Boot · Spring Batch', 'Oracle'],
      text: 'Mantuve un monolito legacy en Java 8 con mucho proceso batch. Corregí bugs y, sobre todo, identifiqué cuellos de botella y los resolví con refactors y algoritmos más eficientes, que aceleraron el procesamiento batch. Con Copilot seguía las transacciones de punta a punta para descubrir el flujo completo y proponer optimizaciones.',
    },
    {
      id: 'rendimiento',
      title: 'Rendimiento',
      lesson: 'Lo que no se mide, no está listo.',
      meta: ['BanBif vía Softtek', '2026', 'JMeter · Postman'],
      text: 'Diseñé escenarios de carga con JMeter y Postman, analicé métricas y trabajé con desarrollo para mejorar escalabilidad y confiabilidad.',
    },
    {
      id: 'fullstack',
      title: 'Full Stack',
      lesson: 'El lenguaje es una herramienta; la arquitectura es la decisión.',
      meta: ['Aybar Corp', '2026 a hoy'],
      text: 'En una inmobiliaria construimos aplicaciones web, plataformas para clientes, entornos 3D interactivos con Three.js y realidad virtual. El stack base del equipo es Spring y Angular, pero el lenguaje pasó a segundo plano: con IA y criterio de ingeniería, propongo y decido la arquitectura.',
    },
    {
      id: 'ai',
      title: 'AI-first',
      lesson: 'La IA propone. Yo decido.',
      meta: ['spec-driven', 'TDD y DDD', 'agentes por modelo', 'revisión humana'],
      text: '',
      parts: [
        ['En el desarrollo', 'No acepto lo que me dan los agentes: uso mi criterio, hago contrapropuestas y encamino el resultado.'],
        ['En producción', 'Trabajo con agentes en producción: tienen restricciones claras, cumplen flujos completos y piden aprobación humana cuando falta información o no hay una decisión segura.'],
      ] as [string, string][],
    },
  ],
  float: { bad: '0.1 + 0.2 = 0.30000000000000004', good: '0.10 + 0.20 = 0.30', badK: 'float', goodK: 'COMP-3' },
  tag: 'ilustración',
  // Estacion 2: el monolito bajo la lupa (ilustracion; nombres de modulo genericos, sin datos).
  mono: {
    note: 'el monolito bajo la lupa',
    modules: { '0,0': 'lote', '3,1': 'clientes', '3,3': 'facturación' } as Record<string, string>,
    assistant: 'Copilot',
    assistantNote: 'asistente usado en el proyecto',
    phases: ['descubrir', 'medir', 'optimizar'],
    hot: 'punto caliente',
    before: 'antes',
    after: 'después',
    full: 'recorrido completo',
    indexed: 'búsqueda indexada',
    index: 'índice',
    formula: 'N×N → N',
    batch: 'ejecución del lote',
    label:
      'Ilustración del trabajo sobre un monolito legacy con mucho proceso batch, con nombres de módulo genéricos. Primero, el asistente Copilot sigue una transacción módulo a módulo para descubrir el flujo completo. Después se marcan tres módulos de la traza como puntos calientes. Por último, un punto caliente pasa de un recorrido completo, N por N líneas, a una búsqueda indexada, N líneas a un índice, y las barras de la ejecución del lote se acortan. Sin cifras.',
  },
  // Graficos centrales del vuelo (ilustraciones; escala por scroll). Sin cifras: el importe es solo un ejemplo.
  pack: {
    note: 'decimal empaquetado COMP-3',
    sample: 'ejemplo 000012345.67',
    caption: 'PIC S9(9)V99 COMP-3 · 11 dígitos + signo = 6 bytes',
    dot: 'el punto decimal no se guarda',
    ruler: 'columnas 1-80',
    label:
      'Ilustración del decimal empaquetado COMP-3: los once dígitos de un importe de ejemplo, 000012345.67, se guardan de dos en dos en bytes, el punto decimal implícito no ocupa ningún medio byte y el signo positivo, C, se añade al final. Resultado: 00 00 12 34 56 7C, seis bytes.',
  },
  knee: {
    note: 'la rodilla de la curva',
    x: 'usuarios virtuales',
    y: 'tiempo de respuesta',
    threshold: 'umbral',
    knee: 'rodilla',
    capacity: 'capacidad antes del límite',
    label:
      'Ilustración de una prueba de carga, sin valores: al subir los usuarios virtuales, el tiempo de respuesta se mantiene plano y luego se curva bruscamente hacia arriba en la rodilla, al cruzar el umbral. La capacidad útil es la que queda antes del límite.',
  },
  loop: {
    note: 'bucle con humano',
    dev: 'desarrollo',
    prod: 'producción',
    devSteps: ['Especificación', 'Pruebas', 'Propuesta del agente', 'Contrapropuesta', 'Aprobación', 'Integración'],
    prodSteps: ['Flujo', 'Agente con restricciones', '¿falta información?', 'espera aprobación humana', 'continúa'],
    approved: 'aprobado',
    margin: 'aprobación humana',
    label:
      'Ilustración de dos carriles. En desarrollo: especificación, pruebas, propuesta del agente, contrapropuesta que vuelve a la propuesta, aprobación e integración. En producción: un flujo con un agente con restricciones; si falta información se detiene en una compuerta hasta que una persona aprueba, y entonces continúa.',
  },
  // Estacion 4: un inmueble, cuatro superficies (ilustracion; sin precios ni cifras).
  tower: {
    note: 'un inmueble, cuatro superficies',
    env: 'entorno 3D interactivo',
    vr: 'realidad virtual',
    web: 'aplicación web',
    platform: 'plataforma de clientes',
    label:
      'Ilustración de un edificio de líneas finas. Sus plantas se levantan una a una y gira como en un entorno 3D interactivo. Luego se divide en dos vistas estereoscópicas dentro de dos lentes, como en realidad virtual. Por último se aplana en un plano de planta junto a la ficha de un inmueble: aplicación web y plataforma de clientes. Sin precios ni cifras.',
  },
  // Estacion 4: stack por funcion. [funcion, tecnologias, contexto opcional]
  stack: {
    note: 'mapa por función',
    groups: [
      ['Backend y base', 'Spring · Java', 'la base del equipo'],
      ['Interfaces', 'Angular · TypeScript · Next · React · Three.js', ''],
      ['Entornos 3D y realidad virtual', 'Three.js', ''],
      ['Escritorio', 'Rust', ''],
      ['Datos', 'PostgreSQL · MongoDB · Redis', 'relacional, documentos y caché'],
      ['Mensajería y colas', 'Kafka · BullMQ', 'eventos y trabajos en cola'],
      ['Nube', 'Azure · GCP', ''],
      ['IA', 'LLMs y agentes', ''],
    ] as [string, string, string][],
  },
  diff: {
    file: 'ilustración · propuesta de la IA',
    hunks: [
      {
        id: 'decimal',
        title: 'Dinero en decimal, no en float',
        head: 'cobro.ts @@ -12,1 +12,1 @@',
        lines: [
          ['-', 'const total = items.reduce((s, i) => s + i.price * i.qty, 0)'],
          ['+', 'const total = items.reduce((s, i) => s.add(i.price.times(i.qty)), Money.zero())'],
        ],
      },
      {
        id: 'idem',
        title: 'Reintento seguro con clave idempotente',
        head: 'ledger.ts @@ -31,1 +31,3 @@',
        lines: [
          ['+', 'const hit = await ledger.find(req.idempotencyKey)'],
          ['+', 'if (hit) return hit.result'],
          [' ', 'return ledger.apply(req)'],
        ],
      },
    ] as { id: string; title: string; head: string; lines: [string, string][] }[],
  },
}

// ---------------------------------------------------------------- chrome [C] (placeholder editable)
export const chrome = {
  closing: {
    title: 'Hablemos.',
    kicker: 'Contacto',
    lead: 'Cuéntame qué sistema quieres construir o modernizar.',
    copy: 'Copiar',
    copied: 'Copiado',
    copyFail: 'No se pudo copiar; el correo quedó seleccionado (Ctrl+C).',
    top: 'Volver al inicio',
  },
  modal: {
    title: 'Principios, método y datos',
    lead: 'Seis equivalencias entre el core bancario y el producto de hoy, cómo trabajo con IA y mis datos de formación.',
    close: 'Cerrar',
    cols: ['Origen', 'Práctica moderna'],
  },
  // [término, práctica moderna, una línea de explicación] (principios ilustrativos, no hechos)
  principios: [
    ['PIC COMP-3', 'Tipos estrictos y validación en los bordes', 'Un campo declara su forma exacta; el dato inválido no pasa de la puerta.'],
    ['copybook', 'Contratos y tipos compartidos', 'Una sola definición del registro, usada por quien lo escribe y quien lo lee.'],
    ['JCL / ventana batch', 'Colas, jobs idempotentes y CI/CD', 'Trabajo repetible: si corre dos veces, el resultado no se duplica.'],
    ['Pantalla 5250 (campos, F-keys)', 'Estados de UI, atajos y accesibilidad', 'Cada pantalla sabe qué hacer en vacío, en error y solo con teclado.'],
    ['Journal / auditoría', 'Observabilidad y trazas', 'Si algo mueve dinero o datos, deja rastro que se puede seguir.'],
    ['Escenarios de carga (JMeter, Postman)', 'Rendimiento medido antes de producción', 'Un cambio no está listo hasta que se sabe cómo responde bajo carga.'],
  ] as [string, string, string][],
  method: {
    title: 'Método con IA',
    lead: 'Cómo uso la IA en el ciclo de desarrollo, y dónde la reviso.',
    items: [
      ['Ciclo completo', 'La IA acompaña planificación, diseño, implementación, revisión y despliegue, no solo la escritura de código.'],
      ['Especificación y pruebas primero', 'Spec-driven development con TDD y DDD: el agente implementa contra una especificación y unas pruebas que yo defino.'],
      ['Agentes orquestados', 'Reparto el trabajo por modelo y nivel de esfuerzo para equilibrar calidad y consumo de tokens.'],
      ['Contexto bajo control', 'Uso forks y limpio el contexto cuando cambia el objetivo, para que el agente no arrastre ruido.'],
      ['Herramientas propias', 'Skills que escribo yo y MCPs conectados al flujo de trabajo.'],
      ['Revisión humana', 'Reviso cada cambio, contrapropongo y encamino el resultado. Lo que no verifico, no lo integro.'],
      ['Agentes en producción', 'Restricciones explícitas y una puerta de aprobación humana cuando faltan datos o la decisión no es segura.'],
    ] as [string, string][],
  },
  datos: {
    title: 'Datos',
    items: [
      ['Educación', 'Bachiller en Ingeniería de Sistemas e Informática, UTP, tercio superior'],
      ['Idiomas', 'Español nativo · Inglés C1 (EF SET 67/100, 2024)'],
      ['Certificaciones', 'Java y Spring Framework (Alura ONE, 2025) · Scrum Fundamentals y Scrum for Ops and DevOps (SCRUMstudy, 2025)'],
    ] as [string, string][],
  },
  footer: {
    links: [
      ['GitHub', 'github'],
      ['LinkedIn', 'linkedin'],
    ] as [string, 'github' | 'linkedin'][],
    hint: [
      ['P', 'principios, método y datos'],
      ['C', 'contacto'],
      ['T', 'volver al inicio'],
    ] as [string, string][],
  },
}
