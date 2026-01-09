import { Action } from './ActionData';

/**
 * Competence data definitions
 * 72 Compétences (CT) from the TTRPG system (3 per Action)
 */

export enum Competence {
  // Puissance - Frapper (3 competences)
  ARME = 'ARME',
  DESARME = 'DESARME',
  IMPROVISE = 'IMPROVISE',
  
  // Puissance - Neutraliser (3 competences)
  LUTTE = 'LUTTE',
  BOTTES = 'BOTTES',
  RUSES = 'RUSES',
  
  // Puissance - Tirer (3 competences)
  BANDE = 'BANDE',
  PROPULSE = 'PROPULSE',
  JETE = 'JETE',
  
  // Aisance - Réagir (3 competences)
  FLUIDITE = 'FLUIDITE',
  ESQUIVE = 'ESQUIVE',
  EVASION = 'EVASION',
  
  // Aisance - Dérober (3 competences)
  ESCAMOTAGE = 'ESCAMOTAGE',
  ILLUSIONS = 'ILLUSIONS',
  DISSIMULATION = 'DISSIMULATION',
  
  // Aisance - Coordonner (3 competences)
  GESTUELLE = 'GESTUELLE',
  MINUTIE = 'MINUTIE',
  EQUILIBRE = 'EQUILIBRE',
  
  // Précision - Manier (3 competences)
  VISEE = 'VISEE',
  CONDUITE = 'CONDUITE',
  HABILETE = 'HABILETE',
  
  // Précision - Façonner (3 competences)
  DEBROUILLARDISE = 'DEBROUILLARDISE',
  BRICOLAGE = 'BRICOLAGE',
  SAVOIR_FAIRE = 'SAVOIR_FAIRE',
  
  // Précision - Fignoler (3 competences)
  ARTIFICES = 'ARTIFICES',
  SECURITE = 'SECURITE',
  CASSE_TETES = 'CASSE_TETES',
  
  // Athlétisme - Traverser (3 competences)
  PAS = 'PAS',
  GRIMPE = 'GRIMPE',
  ACROBATIE = 'ACROBATIE',
  
  // Athlétisme - Efforcer (3 competences)
  POID = 'POID',
  SAUT = 'SAUT',
  NATATION = 'NATATION',
  
  // Athlétisme - Manœuvrer (3 competences)
  VOL = 'VOL',
  FOUISSAGE = 'FOUISSAGE',
  CHEVAUCHEMENT = 'CHEVAUCHEMENT',
  
  // Charisme - Captiver (3 competences)
  SEDUCTION = 'SEDUCTION',
  MIMETISME = 'MIMETISME',
  CHANT = 'CHANT',
  
  // Charisme - Convaincre (3 competences)
  NEGOCIATION = 'NEGOCIATION',
  TROMPERIE = 'TROMPERIE',
  PRESENTATION = 'PRESENTATION',
  
  // Charisme - Interpréter (3 competences)
  INSTRUMENTAL = 'INSTRUMENTAL',
  INSPIRATION = 'INSPIRATION',
  NARRATION = 'NARRATION',
  
  // Détection - Discerner (3 competences)
  VISION = 'VISION',
  ESTIMATION = 'ESTIMATION',
  TOUCHER = 'TOUCHER',
  
  // Détection - Découvrir (3 competences)
  INVESTIGATION = 'INVESTIGATION',
  GOUT = 'GOUT',
  RESSENTI = 'RESSENTI',
  
  // Détection - Dépister (3 competences)
  ODORAT = 'ODORAT',
  AUDITION = 'AUDITION',
  INTEROCEPTION = 'INTEROCEPTION',
  
  // Réflexion - Concevoir (3 competences)
  ARTISANAT = 'ARTISANAT',
  MEDECINE = 'MEDECINE',
  INGENIERIE = 'INGENIERIE',
  
  // Réflexion - Acculturer (3 competences)
  JEUX = 'JEUX',
  SOCIETE = 'SOCIETE',
  GEOGRAPHIE = 'GEOGRAPHIE',
  
  // Réflexion - Acclimater (3 competences)
  NATURE = 'NATURE',
  PASTORALISME = 'PASTORALISME',
  AGRONOMIE = 'AGRONOMIE',
  
  // Domination - Discipliner (3 competences)
  COMMANDEMENT = 'COMMANDEMENT',
  OBEISSANCE = 'OBEISSANCE',
  OBSTINANCE = 'OBSTINANCE',
  
  // Domination - Endurer (3 competences)
  GLOUTONNERIE = 'GLOUTONNERIE',
  BEUVERIE = 'BEUVERIE',
  ENTRAILLES = 'ENTRAILLES',
  
  // Domination - Dompter (3 competences)
  INTIMIDATION = 'INTIMIDATION',
  APPRIVOISEMENT = 'APPRIVOISEMENT',
  DRESSAGE = 'DRESSAGE',
}

export const COMPETENCE_NAMES: Record<Competence, string> = {
  [Competence.ARME]: '[Armé]',
  [Competence.DESARME]: '[Désarmé]',
  [Competence.IMPROVISE]: '[Improvisé]',
  [Competence.LUTTE]: '[Lutte]',
  [Competence.BOTTES]: '[Bottes]',
  [Competence.RUSES]: '[Ruses]',
  [Competence.BANDE]: '[Bandé]',
  [Competence.PROPULSE]: '[Propulsé]',
  [Competence.JETE]: '[Jeté]',
  [Competence.FLUIDITE]: '[Fluidité]',
  [Competence.ESQUIVE]: '[Esquive]',
  [Competence.EVASION]: '[Évasion]',
  [Competence.ESCAMOTAGE]: '[Escamotage]',
  [Competence.ILLUSIONS]: '[Illusions]',
  [Competence.DISSIMULATION]: '[Dissimulation]',
  [Competence.GESTUELLE]: '[Gestuelle]',
  [Competence.MINUTIE]: '[Minutie]',
  [Competence.EQUILIBRE]: '[Équilibre]',
  [Competence.VISEE]: '[Visée]',
  [Competence.CONDUITE]: '[Conduite]',
  [Competence.HABILETE]: '[Habileté]',
  [Competence.DEBROUILLARDISE]: '[Débrouillardise]',
  [Competence.BRICOLAGE]: '[Bricolage]',
  [Competence.SAVOIR_FAIRE]: '[Savoir-Faire]',
  [Competence.ARTIFICES]: '[Artifices]',
  [Competence.SECURITE]: '[Sécurité]',
  [Competence.CASSE_TETES]: '[Casse-Têtes]',
  [Competence.PAS]: '[Pas]',
  [Competence.GRIMPE]: '[Grimpe]',
  [Competence.ACROBATIE]: '[Acrobatie]',
  [Competence.POID]: '[Poid]',
  [Competence.SAUT]: '[Saut]',
  [Competence.NATATION]: '[Natation]',
  [Competence.VOL]: '[Vol]',
  [Competence.FOUISSAGE]: '[Fouissage]',
  [Competence.CHEVAUCHEMENT]: '[Chevauchement]',
  [Competence.SEDUCTION]: '[Séduction]',
  [Competence.MIMETISME]: '[Mimétisme]',
  [Competence.CHANT]: '[Chant]',
  [Competence.NEGOCIATION]: '[Négociation]',
  [Competence.TROMPERIE]: '[Tromperie]',
  [Competence.PRESENTATION]: '[Présentation]',
  [Competence.INSTRUMENTAL]: '[Instrumental]',
  [Competence.INSPIRATION]: '[Inspiration]',
  [Competence.NARRATION]: '[Narration]',
  [Competence.VISION]: '[Vision]',
  [Competence.ESTIMATION]: '[Estimation]',
  [Competence.TOUCHER]: '[Toucher]',
  [Competence.INVESTIGATION]: '[Investigation]',
  [Competence.GOUT]: '[Goût]',
  [Competence.RESSENTI]: '[Ressenti]',
  [Competence.ODORAT]: '[Odorat]',
  [Competence.AUDITION]: '[Audition]',
  [Competence.INTEROCEPTION]: '[Interoception]',
  [Competence.ARTISANAT]: '[Artisanat]',
  [Competence.MEDECINE]: '[Médecine]',
  [Competence.INGENIERIE]: '[Ingénierie]',
  [Competence.JEUX]: '[Jeux]',
  [Competence.SOCIETE]: '[Société]',
  [Competence.GEOGRAPHIE]: '[Géographie]',
  [Competence.NATURE]: '[Nature]',
  [Competence.PASTORALISME]: '[Pastoralisme]',
  [Competence.AGRONOMIE]: '[Agronomie]',
  [Competence.COMMANDEMENT]: '[Commandement]',
  [Competence.OBEISSANCE]: '[Obéissance]',
  [Competence.OBSTINANCE]: '[Obstinance]',
  [Competence.GLOUTONNERIE]: '[Gloutonnerie]',
  [Competence.BEUVERIE]: '[Beuverie]',
  [Competence.ENTRAILLES]: '[Entrailles]',
  [Competence.INTIMIDATION]: '[Intimidation]',
  [Competence.APPRIVOISEMENT]: '[Apprivoisement]',
  [Competence.DRESSAGE]: '[Dressage]',
};

// Mapping: Each Competence belongs to an Action
export const COMPETENCE_ACTION: Record<Competence, Action> = {
  // Puissance - Frapper
  [Competence.ARME]: Action.FRAPPER,
  [Competence.DESARME]: Action.FRAPPER,
  [Competence.IMPROVISE]: Action.FRAPPER,
  
  // Puissance - Neutraliser
  [Competence.LUTTE]: Action.NEUTRALISER,
  [Competence.BOTTES]: Action.NEUTRALISER,
  [Competence.RUSES]: Action.NEUTRALISER,
  
  // Puissance - Tirer
  [Competence.BANDE]: Action.TIRER,
  [Competence.PROPULSE]: Action.TIRER,
  [Competence.JETE]: Action.TIRER,
  
  // Aisance - Réagir
  [Competence.FLUIDITE]: Action.REAGIR,
  [Competence.ESQUIVE]: Action.REAGIR,
  [Competence.EVASION]: Action.REAGIR,
  
  // Aisance - Dérober
  [Competence.ESCAMOTAGE]: Action.DEROBER,
  [Competence.ILLUSIONS]: Action.DEROBER,
  [Competence.DISSIMULATION]: Action.DEROBER,
  
  // Aisance - Coordonner
  [Competence.GESTUELLE]: Action.COORDONNER,
  [Competence.MINUTIE]: Action.COORDONNER,
  [Competence.EQUILIBRE]: Action.COORDONNER,
  
  // Précision - Manier
  [Competence.VISEE]: Action.MANIER,
  [Competence.CONDUITE]: Action.MANIER,
  [Competence.HABILETE]: Action.MANIER,
  
  // Précision - Façonner
  [Competence.DEBROUILLARDISE]: Action.FACONNER,
  [Competence.BRICOLAGE]: Action.FACONNER,
  [Competence.SAVOIR_FAIRE]: Action.FACONNER,
  
  // Précision - Fignoler
  [Competence.ARTIFICES]: Action.FIGNOLER,
  [Competence.SECURITE]: Action.FIGNOLER,
  [Competence.CASSE_TETES]: Action.FIGNOLER,
  
  // Athlétisme - Traverser
  [Competence.PAS]: Action.TRAVERSER,
  [Competence.GRIMPE]: Action.TRAVERSER,
  [Competence.ACROBATIE]: Action.TRAVERSER,
  
  // Athlétisme - Efforcer
  [Competence.POID]: Action.EFFORCER,
  [Competence.SAUT]: Action.EFFORCER,
  [Competence.NATATION]: Action.EFFORCER,
  
  // Athlétisme - Manœuvrer
  [Competence.VOL]: Action.MANOEUVRER,
  [Competence.FOUISSAGE]: Action.MANOEUVRER,
  [Competence.CHEVAUCHEMENT]: Action.MANOEUVRER,
  
  // Charisme - Captiver
  [Competence.SEDUCTION]: Action.CAPTIVER,
  [Competence.MIMETISME]: Action.CAPTIVER,
  [Competence.CHANT]: Action.CAPTIVER,
  
  // Charisme - Convaincre
  [Competence.NEGOCIATION]: Action.CONVAINCRE,
  [Competence.TROMPERIE]: Action.CONVAINCRE,
  [Competence.PRESENTATION]: Action.CONVAINCRE,
  
  // Charisme - Interpréter
  [Competence.INSTRUMENTAL]: Action.INTERPRETER,
  [Competence.INSPIRATION]: Action.INTERPRETER,
  [Competence.NARRATION]: Action.INTERPRETER,
  
  // Détection - Discerner
  [Competence.VISION]: Action.DISCERNER,
  [Competence.ESTIMATION]: Action.DISCERNER,
  [Competence.TOUCHER]: Action.DISCERNER,
  
  // Détection - Découvrir
  [Competence.INVESTIGATION]: Action.DECOUVRIR,
  [Competence.GOUT]: Action.DECOUVRIR,
  [Competence.RESSENTI]: Action.DECOUVRIR,
  
  // Détection - Dépister
  [Competence.ODORAT]: Action.DEPISTER,
  [Competence.AUDITION]: Action.DEPISTER,
  [Competence.INTEROCEPTION]: Action.DEPISTER,
  
  // Réflexion - Concevoir
  [Competence.ARTISANAT]: Action.CONCEVOIR,
  [Competence.MEDECINE]: Action.CONCEVOIR,
  [Competence.INGENIERIE]: Action.CONCEVOIR,
  
  // Réflexion - Acculturer
  [Competence.JEUX]: Action.ACCULTURER,
  [Competence.SOCIETE]: Action.ACCULTURER,
  [Competence.GEOGRAPHIE]: Action.ACCULTURER,
  
  // Réflexion - Acclimater
  [Competence.NATURE]: Action.ACCLIMATER,
  [Competence.PASTORALISME]: Action.ACCLIMATER,
  [Competence.AGRONOMIE]: Action.ACCLIMATER,
  
  // Domination - Discipliner
  [Competence.COMMANDEMENT]: Action.DISCIPLINER,
  [Competence.OBEISSANCE]: Action.DISCIPLINER,
  [Competence.OBSTINANCE]: Action.DISCIPLINER,
  
  // Domination - Endurer
  [Competence.GLOUTONNERIE]: Action.ENDURER,
  [Competence.BEUVERIE]: Action.ENDURER,
  [Competence.ENTRAILLES]: Action.ENDURER,
  
  // Domination - Dompter
  [Competence.INTIMIDATION]: Action.DOMPTER,
  [Competence.APPRIVOISEMENT]: Action.DOMPTER,
  [Competence.DRESSAGE]: Action.DOMPTER,
};

export function getCompetenceName(competence: Competence): string {
  return COMPETENCE_NAMES[competence] || 'Unknown';
}

export function getCompetenceAction(competence: Competence): Action {
  return COMPETENCE_ACTION[competence] || Action.FRAPPER;
}

