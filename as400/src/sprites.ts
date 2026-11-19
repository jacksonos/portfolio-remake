// Bitmaps en cadenas. Paleta: p=fosforo, d=fosforo tenue, w blanco, c turquesa, y amarillo,
// r rojo, m rosa, b azul, s=camisa (se sobreescribe), '.'=transparente.
export const bm = (rows: string[]) => {
  const w = rows[0].length
  rows.forEach((r, i) => {
    if (r.length !== w) throw new Error(`bitmap fila ${i}: ${r.length} != ${w}`)
  })
  return rows
}

const towerF = (led: string) =>
  bm([
    '.wwwwwwwwww.',
    '.wddddddddw.',
    '.wdwwwwwwdw.',
    '.wddddddddw.',
    `.wd${led}dddddw.`,
    '.wddddddddw.',
    '.wdwwwwwwdw.',
    '.wddddddddw.',
    '.wddddddddw.',
    '.wwwwwwwwww.',
    '..ww....ww..',
  ])
export const tower = [towerF('yy'), towerF('pp')]

const diskF = (l: string) =>
  bm([
    'bbbbbbbbbbbb',
    'bb.wwwwww.bb',
    'bb.wwwwww.bb',
    'bb.wwwdww.bb',
    'bbbbbbbbbbbb',
    'bbbbbbbbbbbb',
    'bbwwwwwwwwbb',
    `bbw${l}wbb`,
    'bbwwwwwwwwbb',
    'bbwwwwwwwwbb',
    'bbbbbbbbbbbb',
  ])
export const disk = [diskF('cccccc'), diskF('ccyycc'), diskF('yyyycc')]

export const cursor = [
  bm(['pppppp', 'pppppp', 'pppppp', 'pppppp', 'pppppp', 'pppppp', 'pppppp', 'pppppp']),
  bm(['dddddd', 'd....d', 'd....d', 'd....d', 'd....d', 'd....d', 'd....d', 'dddddd']),
]

export const wblock = [
  bm(['pppppppp', 'p......p', 'p.p..p.p', 'p.p..p.p', 'p.p.pp.p', 'p.pppp.p', 'p..pp..p', 'pppppppp']),
  bm(['dddddddd', 'd......d', 'd.d..d.d', 'd.d..d.d', 'd.d.dd.d', 'd.dddd.d', 'd..dd..d', 'dddddddd']),
]

export const sparkle = [
  bm(['...m...', '...m...', '..mmm..', 'mmmmmmm', '..mmm..', '...m...', '...m...']),
  bm(['m.....m', '.m...m.', '..m.m..', '...m...', '..m.m..', '.m...m.', 'm.....m']),
  bm(['.......', '...m...', '..mmm..', '.mmmmm.', '..mmm..', '...m...', '.......']),
]

const robotF = (a: string) =>
  bm([
    `....${a}${a}....`,
    '....pp....',
    '.pppppppp.',
    '.pwwppwwp.',
    '.pppppppp.',
    '.pp.pp.pp.',
    '..pppppp..',
    '.pppppppp.',
    '.p.pppp.p.',
    '...p..p...',
  ])
export const robot = [robotF('y'), robotF('.')]

// desarrollador: cuerpo comun + 4 cuadros de caminata
const top = [
  '...dddd...',
  '..dddddd..',
  '..pppppp..',
  '..pwppwp..',
  '..pppppp..',
  '...pppp...',
  '.ssssssss.',
  'pssssssssp',
  'pssssssssp',
  '.ssssssss.',
  '..ssssss..',
]
const legs = {
  a: ['..pp..pp..', '..pp...pp.', '.ppp...ppp'],
  b: ['...pppp...', '...pppp...', '...pppp...'],
  c: ['..pp..pp..', '.pp...pp..', 'ppp...ppp.'],
}
export const dev = [legs.a, legs.b, legs.c, legs.b].map((l) => bm([...top, ...l]))

// accesorios por etapa (WordPress, ingenieria, terminal, analisis, IA)
export const gear = [
  bm(['b.....b', 'b.....b', 'b..b..b', 'b.b.b.b', 'bb...bb', 'b.....b']),
  bm(['.cc.cc.', '.c...c.', 'cc...cc', '.c...c.', '.cc.cc.']),
  bm(['p......', 'pp.....', '.pp....', 'pp.....', 'p..pppp']),
  bm(['..yyy..', 'yyyyyyy', 'y.....y', 'y.yyy.y', 'y.....y', 'yyyyyyy']),
  sparkle[0],
  bm(['......w', '.....ww', 'w...ww.', 'ww.ww..', '.www...', '..w....']), // QA: marca de verificacion
]
export const shirts = ['#6a8bff', '#40f0e8', '#ffe03a', '#ff6ad5', '#ff5555', '#ff9a3c']

// estallido al bifurcarse o fusionarse un clon
export const puff = bm([
  'p...p...p',
  '.p..p..p.',
  '..p.p.p..',
  '...ppp...',
  'pppp.pppp',
  '...ppp...',
  '..p.p.p..',
  '.p..p..p.',
  'p...p...p',
])
