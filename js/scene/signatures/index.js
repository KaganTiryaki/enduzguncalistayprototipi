import { quantum } from './quantum.js';
import { neuro } from './neuro.js';
import { aiNlp } from './ai-nlp.js';
import { aero } from './aero.js';
import { molbio } from './molbio.js';
import { forensic } from './forensic.js';
import { smart } from './smart.js';

export const signatures = {
    quantum,
    neuro,
    'ai-nlp': aiNlp,
    aero,
    molbio,
    forensic,
    smart,
};

export const signatureOrder = [
    'quantum',
    'neuro',
    'ai-nlp',
    'aero',
    'molbio',
    'forensic',
    'smart',
];
