// Exercise Tiering - A/B/C prioritization by movement pattern and goal profile
// Helps rank clinically stronger and performance-oriented options.

type GoalProfile = 'hipertrofia' | 'forca' | 'emagrecimento' | 'saude';
type Tier = 'A' | 'B' | 'C' | 'NEUTRAL';

interface TierBuckets {
  A: string[];
  B: string[];
  C: string[];
}

type PatternTierMap = Record<string, Record<GoalProfile, TierBuckets>>;

const TIER_MATRIX: PatternTierMap = {
  empurrar_horizontal: {
    hipertrofia: {
      A: ['supino reto', 'supino inclinado', 'chest press', 'crossover', 'crucifixo maquina'],
      B: ['paralela', 'crucifixo', 'peck deck'],
      C: ['flexao', 'push up', 'polichinelo']
    },
    forca: {
      A: ['supino reto barra', 'supino inclinado barra', 'supino'],
      B: ['supino halter', 'chest press'],
      C: ['flexao', 'push up']
    },
    emagrecimento: {
      A: ['supino halter', 'supino maquina', 'crossover'],
      B: ['paralela', 'crucifixo'],
      C: ['flexao', 'push up', 'polichinelo']
    },
    saude: {
      A: ['chest press', 'supino maquina', 'crossover leve'],
      B: ['supino halter', 'crucifixo'],
      C: ['flexao explosiva', 'burpee']
    }
  },
  puxar_horizontal: {
    hipertrofia: {
      A: ['remada baixa', 'remada curvada', 'remada unilateral', 'remada maquina'],
      B: ['remada cavalinho', 'remada'],
      C: ['superman', 'isometria costas']
    },
    forca: {
      A: ['remada curvada barra', 'remada cavalinho', 'remada baixa'],
      B: ['remada unilateral halter'],
      C: ['superman']
    },
    emagrecimento: {
      A: ['remada baixa', 'remada unilateral', 'remada maquina'],
      B: ['remada curvada'],
      C: ['superman']
    },
    saude: {
      A: ['remada maquina', 'remada baixa cabo'],
      B: ['remada halter'],
      C: ['superman']
    }
  },
  puxar_vertical: {
    hipertrofia: {
      A: ['puxada alta', 'pulldown', 'barra fixa assistida'],
      B: ['barra fixa'],
      C: ['scapular pull-up']
    },
    forca: {
      A: ['barra fixa', 'pulldown pesado', 'puxada alta'],
      B: ['barra fixa assistida'],
      C: ['scapular pull-up']
    },
    emagrecimento: {
      A: ['pulldown', 'puxada alta'],
      B: ['barra fixa assistida'],
      C: ['scapular pull-up']
    },
    saude: {
      A: ['pulldown maquina', 'puxada frente'],
      B: ['barra fixa assistida'],
      C: ['barra fixa estrita']
    }
  },
  empurrar_vertical: {
    hipertrofia: {
      A: ['desenvolvimento halter', 'desenvolvimento maquina', 'shoulder press'],
      B: ['arnold press', 'elevacao frontal'],
      C: ['pike push up', 'handstand push up']
    },
    forca: {
      A: ['desenvolvimento barra', 'shoulder press', 'push press'],
      B: ['desenvolvimento halter'],
      C: ['pike push up']
    },
    emagrecimento: {
      A: ['shoulder press maquina', 'desenvolvimento halter'],
      B: ['arnold press'],
      C: ['pike push up']
    },
    saude: {
      A: ['desenvolvimento maquina', 'elevacao lateral cabo'],
      B: ['desenvolvimento halter leve'],
      C: ['push press']
    }
  },
  agachar: {
    hipertrofia: {
      A: ['agachamento livre', 'leg press', 'hack squat', 'agachamento smith'],
      B: ['agachamento goblet', 'passada', 'afundo'],
      C: ['agachamento sem carga', 'jump squat']
    },
    forca: {
      A: ['agachamento livre barra', 'agachamento frontal', 'leg press'],
      B: ['agachamento smith'],
      C: ['agachamento sem carga']
    },
    emagrecimento: {
      A: ['leg press', 'agachamento goblet', 'afundo com halter'],
      B: ['agachamento livre'],
      C: ['agachamento sem carga']
    },
    saude: {
      A: ['leg press', 'agachamento smith', 'cadeira extensora'],
      B: ['goblet squat leve'],
      C: ['jump squat']
    }
  },
  hinge: {
    hipertrofia: {
      A: ['levantamento terra romeno', 'stiff', 'hip thrust', 'mesa flexora'],
      B: ['good morning', 'kettlebell swing'],
      C: ['ponte gluteo sem carga']
    },
    forca: {
      A: ['levantamento terra', 'terra romeno', 'hip thrust'],
      B: ['stiff', 'rack pull'],
      C: ['ponte gluteo sem carga']
    },
    emagrecimento: {
      A: ['stiff halter', 'hip thrust', 'mesa flexora'],
      B: ['kettlebell swing'],
      C: ['ponte gluteo sem carga']
    },
    saude: {
      A: ['mesa flexora', 'hip thrust maquina', 'stiff leve'],
      B: ['ponte gluteo com halter'],
      C: ['good morning pesado']
    }
  },
  core: {
    hipertrofia: {
      A: ['ab wheel', 'cable crunch', 'prancha com carga'],
      B: ['prancha', 'dead bug', 'abdominal infra'],
      C: ['crunch curto sem controle']
    },
    forca: {
      A: ['ab wheel', 'pallof press', 'farmer walk'],
      B: ['prancha', 'dead bug'],
      C: ['crunch curto sem controle']
    },
    emagrecimento: {
      A: ['cable crunch', 'prancha', 'mountain climber'],
      B: ['abdominal tradicional', 'dead bug'],
      C: ['crunch curto sem controle']
    },
    saude: {
      A: ['dead bug', 'bird dog', 'pallof press', 'prancha'],
      B: ['abdominal tradicional'],
      C: ['sit up balistico']
    }
  }
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferGoalProfile(goal?: string): GoalProfile {
  const text = normalize(goal || '');
  if (text.includes('forca')) return 'forca';
  if (text.includes('emagrec') || text.includes('perda') || text.includes('condicion')) return 'emagrecimento';
  if (text.includes('saude') || text.includes('reabil') || text.includes('qualidade de vida')) return 'saude';
  return 'hipertrofia';
}

function matchTier(name: string, bucket: TierBuckets): Tier {
  const normalizedName = normalize(name);
  const hasMatch = (keywords: string[]) =>
    keywords.some(keyword => normalizedName.includes(normalize(keyword)));

  if (hasMatch(bucket.A)) return 'A';
  if (hasMatch(bucket.B)) return 'B';
  if (hasMatch(bucket.C)) return 'C';
  return 'NEUTRAL';
}

export function evaluateExerciseTier(
  exerciseName: string,
  movementPattern: string,
  goal?: string
): { tier: Tier; score: number } {
  const goalProfile = inferGoalProfile(goal);
  const patternRules = TIER_MATRIX[movementPattern]?.[goalProfile];
  if (!patternRules) {
    return { tier: 'NEUTRAL', score: 0 };
  }

  const tier = matchTier(exerciseName, patternRules);

  if (tier === 'A') return { tier, score: 22 };
  if (tier === 'B') return { tier, score: 10 };
  if (tier === 'C') return { tier, score: -24 };
  return { tier, score: 0 };
}
