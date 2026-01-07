extends Resource
class_name CompetenceData

## Enum for the 72 Compétences (CT)
enum Competence {
	# Puissance - Frapper (3 competences)
	ARME,        # [Armé]
	DESARME,     # [Désarmé]
	IMPROVISE,   # [Improvisé]
	
	# Puissance - Neutraliser (3 competences)
	LUTTE,       # [Lutte]
	BOTTES,      # [Bottes]
	RUSES,       # [Ruses]
	
	# Puissance - Tirer (3 competences)
	BANDE,       # [Bandé]
	PROPULSE,    # [Propulsé]
	JETE,        # [Jeté]
	
	# Aisance - Réagir (3 competences)
	FLUIDITE,    # [Fluidité]
	ESQUIVE,     # [Esquive]
	MINUTIE,     # [Minutie]
	
	# Aisance - Dérober (3 competences)
	ESCAMOTAGE,  # [Escamotage]
	ILLUSIONS,   # [Illusions]
	DISSIMULATION, # [Dissimulation]
	
	# Aisance - Coordonner (3 competences)
	GESTUELLE,   # [Gestuelle]
	EVASION,     # [Évasion]
	EQUILIBRE,   # [Équilibre]
	
	# Précision - Manier (3 competences)
	VISEE,       # [Visée]
	CONDUITE,    # [Conduite]
	HABILETE,    # [Habileté]
	
	# Précision - Façonner (3 competences)
	DEBROUILLARDISE, # [Débrouillardise]
	BRICOLAGE,   # [Bricolage]
	SAVOIR_FAIRE, # [Savoir-Faire]
	
	# Précision - Fignoler (3 competences)
	ARTIFICES,   # [Artifices]
	SECURITE,    # [Sécurité]
	CASSE_TETES, # [Casse-Têtes]
	
	# Athlétisme - Traverser (3 competences)
	PAS,         # [Pas]
	GRIMPE,      # [Grimpe]
	ACROBATIE,   # [Acrobatie]
	
	# Athlétisme - Efforcer (3 competences)
	POID,        # [Poid]
	SAUT,        # [Saut]
	NATATION,    # [Natation]
	
	# Athlétisme - Manœuvrer (3 competences)
	VOL,         # [Vol]
	FOUISSAGE,   # [Fouissage]
	CHEVAUCHEMENT, # [Chevauchement]
	
	# Charisme - Captiver (3 competences)
	SEDUCTION,   # [Séduction]
	MIMETISME,   # [Mimétisme]
	CHANT,       # [Chant]
	
	# Charisme - Convaincre (3 competences)
	NEGOCIATION, # [Négociation]
	TROMPERIE,   # [Tromperie]
	PRESENTATION, # [Présentation]
	
	# Charisme - Interpréter (3 competences)
	INSTRUMENTAL, # [Instrumental]
	INSPIRATION, # [Inspiration]
	NARRATION,   # [Narration]
	
	# Détection - Discerner (3 competences)
	VISION,      # [Vision]
	ESTIMATION,  # [Estimation]
	TOUCHER,     # [Toucher]
	
	# Détection - Découvrir (3 competences)
	INVESTIGATION, # [Investigation]
	GOUT,        # [Goût]
	RESSENTI,    # [Ressenti]
	
	# Détection - Dépister (3 competences)
	ODORAT,      # [Odorat]
	AUDITION,    # [Audition]
	INTEROCEPTION, # [Interoception]
	
	# Réflexion - Concevoir (3 competences)
	ARTISANAT,   # [Artisanat]
	MEDECINE,    # [Médecine]
	INGENIERIE,  # [Ingénierie]
	
	# Réflexion - Acculturer (3 competences)
	JEUX,        # [Jeux]
	SOCIETE,     # [Société]
	GEOGRAPHIE,  # [Géographie]
	
	# Réflexion - Acclimater (3 competences)
	NATURE,      # [Nature]
	PASTORALISME, # [Pastoralisme]
	AGRONOMIE,   # [Agronomie]
	
	# Domination - Discipliner (3 competences)
	COMMANDEMENT, # [Commandement]
	OBEISSANCE,  # [Obéissance]
	OBSTINANCE,  # [Obstinance]
	
	# Domination - Endurer (3 competences)
	GLOUTONNERIE, # [Gloutonnerie]
	BEUVERIE,    # [Beuverie]
	ENTRAILLES,  # [Entrailles]
	
	# Domination - Dompter (3 competences)
	INTIMIDATION, # [Intimidation]
	APPRIVOISEMENT, # [Apprivoisement]
	DRESSAGE     # [Dressage]
}

## Competence names in French (with brackets as shown in book)
const COMPETENCE_NAMES: Dictionary = {
	Competence.ARME: "[Armé]",
	Competence.DESARME: "[Désarmé]",
	Competence.IMPROVISE: "[Improvisé]",
	Competence.LUTTE: "[Lutte]",
	Competence.BOTTES: "[Bottes]",
	Competence.RUSES: "[Ruses]",
	Competence.BANDE: "[Bandé]",
	Competence.PROPULSE: "[Propulsé]",
	Competence.JETE: "[Jeté]",
	Competence.FLUIDITE: "[Fluidité]",
	Competence.ESQUIVE: "[Esquive]",
	Competence.MINUTIE: "[Minutie]",
	Competence.ESCAMOTAGE: "[Escamotage]",
	Competence.ILLUSIONS: "[Illusions]",
	Competence.DISSIMULATION: "[Dissimulation]",
	Competence.GESTUELLE: "[Gestuelle]",
	Competence.EVASION: "[Évasion]",
	Competence.EQUILIBRE: "[Équilibre]",
	Competence.VISEE: "[Visée]",
	Competence.CONDUITE: "[Conduite]",
	Competence.HABILETE: "[Habileté]",
	Competence.DEBROUILLARDISE: "[Débrouillardise]",
	Competence.BRICOLAGE: "[Bricolage]",
	Competence.SAVOIR_FAIRE: "[Savoir-Faire]",
	Competence.ARTIFICES: "[Artifices]",
	Competence.SECURITE: "[Sécurité]",
	Competence.CASSE_TETES: "[Casse-Têtes]",
	Competence.PAS: "[Pas]",
	Competence.GRIMPE: "[Grimpe]",
	Competence.ACROBATIE: "[Acrobatie]",
	Competence.POID: "[Poid]",
	Competence.SAUT: "[Saut]",
	Competence.NATATION: "[Natation]",
	Competence.VOL: "[Vol]",
	Competence.FOUISSAGE: "[Fouissage]",
	Competence.CHEVAUCHEMENT: "[Chevauchement]",
	Competence.SEDUCTION: "[Séduction]",
	Competence.MIMETISME: "[Mimétisme]",
	Competence.CHANT: "[Chant]",
	Competence.NEGOCIATION: "[Négociation]",
	Competence.TROMPERIE: "[Tromperie]",
	Competence.PRESENTATION: "[Présentation]",
	Competence.INSTRUMENTAL: "[Instrumental]",
	Competence.INSPIRATION: "[Inspiration]",
	Competence.NARRATION: "[Narration]",
	Competence.VISION: "[Vision]",
	Competence.ESTIMATION: "[Estimation]",
	Competence.TOUCHER: "[Toucher]",
	Competence.INVESTIGATION: "[Investigation]",
	Competence.GOUT: "[Goût]",
	Competence.RESSENTI: "[Ressenti]",
	Competence.ODORAT: "[Odorat]",
	Competence.AUDITION: "[Audition]",
	Competence.INTEROCEPTION: "[Interoception]",
	Competence.ARTISANAT: "[Artisanat]",
	Competence.MEDECINE: "[Médecine]",
	Competence.INGENIERIE: "[Ingénierie]",
	Competence.JEUX: "[Jeux]",
	Competence.SOCIETE: "[Société]",
	Competence.GEOGRAPHIE: "[Géographie]",
	Competence.NATURE: "[Nature]",
	Competence.PASTORALISME: "[Pastoralisme]",
	Competence.AGRONOMIE: "[Agronomie]",
	Competence.COMMANDEMENT: "[Commandement]",
	Competence.OBEISSANCE: "[Obéissance]",
	Competence.OBSTINANCE: "[Obstinance]",
	Competence.GLOUTONNERIE: "[Gloutonnerie]",
	Competence.BEUVERIE: "[Beuverie]",
	Competence.ENTRAILLES: "[Entrailles]",
	Competence.INTIMIDATION: "[Intimidation]",
	Competence.APPRIVOISEMENT: "[Apprivoisement]",
	Competence.DRESSAGE: "[Dressage]"
}

## Mapping: Each Competence belongs to an Action
const COMPETENCE_ACTION: Dictionary = {
	# Puissance - Frapper
	Competence.ARME: ActionData.Action.FRAPPER,
	Competence.DESARME: ActionData.Action.FRAPPER,
	Competence.IMPROVISE: ActionData.Action.FRAPPER,
	
	# Puissance - Neutraliser
	Competence.LUTTE: ActionData.Action.NEUTRALISER,
	Competence.BOTTES: ActionData.Action.NEUTRALISER,
	Competence.RUSES: ActionData.Action.NEUTRALISER,
	
	# Puissance - Tirer
	Competence.BANDE: ActionData.Action.TIRER,
	Competence.PROPULSE: ActionData.Action.TIRER,
	Competence.JETE: ActionData.Action.TIRER,
	
	# Aisance - Réagir
	Competence.FLUIDITE: ActionData.Action.REAGIR,
	Competence.ESQUIVE: ActionData.Action.REAGIR,
	Competence.MINUTIE: ActionData.Action.REAGIR,
	
	# Aisance - Dérober
	Competence.ESCAMOTAGE: ActionData.Action.DEROBER,
	Competence.ILLUSIONS: ActionData.Action.DEROBER,
	Competence.DISSIMULATION: ActionData.Action.DEROBER,
	
	# Aisance - Coordonner
	Competence.GESTUELLE: ActionData.Action.COORDONNER,
	Competence.EVASION: ActionData.Action.COORDONNER,
	Competence.EQUILIBRE: ActionData.Action.COORDONNER,
	
	# Précision - Manier
	Competence.VISEE: ActionData.Action.MANIER,
	Competence.CONDUITE: ActionData.Action.MANIER,
	Competence.HABILETE: ActionData.Action.MANIER,
	
	# Précision - Façonner
	Competence.DEBROUILLARDISE: ActionData.Action.FACONNER,
	Competence.BRICOLAGE: ActionData.Action.FACONNER,
	Competence.SAVOIR_FAIRE: ActionData.Action.FACONNER,
	
	# Précision - Fignoler
	Competence.ARTIFICES: ActionData.Action.FIGNOLER,
	Competence.SECURITE: ActionData.Action.FIGNOLER,
	Competence.CASSE_TETES: ActionData.Action.FIGNOLER,
	
	# Athlétisme - Traverser
	Competence.PAS: ActionData.Action.TRAVERSER,
	Competence.GRIMPE: ActionData.Action.TRAVERSER,
	Competence.ACROBATIE: ActionData.Action.TRAVERSER,
	
	# Athlétisme - Efforcer
	Competence.POID: ActionData.Action.EFFORCER,
	Competence.SAUT: ActionData.Action.EFFORCER,
	Competence.NATATION: ActionData.Action.EFFORCER,
	
	# Athlétisme - Manœuvrer
	Competence.VOL: ActionData.Action.MANOEUVRER,
	Competence.FOUISSAGE: ActionData.Action.MANOEUVRER,
	Competence.CHEVAUCHEMENT: ActionData.Action.MANOEUVRER,
	
	# Charisme - Captiver
	Competence.SEDUCTION: ActionData.Action.CAPTIVER,
	Competence.MIMETISME: ActionData.Action.CAPTIVER,
	Competence.CHANT: ActionData.Action.CAPTIVER,
	
	# Charisme - Convaincre
	Competence.NEGOCIATION: ActionData.Action.CONVAINCRE,
	Competence.TROMPERIE: ActionData.Action.CONVAINCRE,
	Competence.PRESENTATION: ActionData.Action.CONVAINCRE,
	
	# Charisme - Interpréter
	Competence.INSTRUMENTAL: ActionData.Action.INTERPRETER,
	Competence.INSPIRATION: ActionData.Action.INTERPRETER,
	Competence.NARRATION: ActionData.Action.INTERPRETER,
	
	# Détection - Discerner
	Competence.VISION: ActionData.Action.DISCERNER,
	Competence.ESTIMATION: ActionData.Action.DISCERNER,
	Competence.TOUCHER: ActionData.Action.DISCERNER,
	
	# Détection - Découvrir
	Competence.INVESTIGATION: ActionData.Action.DECOUVRIR,
	Competence.GOUT: ActionData.Action.DECOUVRIR,
	Competence.RESSENTI: ActionData.Action.DECOUVRIR,
	
	# Détection - Dépister
	Competence.ODORAT: ActionData.Action.DEPISTER,
	Competence.AUDITION: ActionData.Action.DEPISTER,
	Competence.INTEROCEPTION: ActionData.Action.DEPISTER,
	
	# Réflexion - Concevoir
	Competence.ARTISANAT: ActionData.Action.CONCEVOIR,
	Competence.MEDECINE: ActionData.Action.CONCEVOIR,
	Competence.INGENIERIE: ActionData.Action.CONCEVOIR,
	
	# Réflexion - Acculturer
	Competence.JEUX: ActionData.Action.ACCULTURER,
	Competence.SOCIETE: ActionData.Action.ACCULTURER,
	Competence.GEOGRAPHIE: ActionData.Action.ACCULTURER,
	
	# Réflexion - Acclimater
	Competence.NATURE: ActionData.Action.ACCLIMATER,
	Competence.PASTORALISME: ActionData.Action.ACCLIMATER,
	Competence.AGRONOMIE: ActionData.Action.ACCLIMATER,
	
	# Domination - Discipliner
	Competence.COMMANDEMENT: ActionData.Action.DISCIPLINER,
	Competence.OBEISSANCE: ActionData.Action.DISCIPLINER,
	Competence.OBSTINANCE: ActionData.Action.DISCIPLINER,
	
	# Domination - Endurer
	Competence.GLOUTONNERIE: ActionData.Action.ENDURER,
	Competence.BEUVERIE: ActionData.Action.ENDURER,
	Competence.ENTRAILLES: ActionData.Action.ENDURER,
	
	# Domination - Dompter
	Competence.INTIMIDATION: ActionData.Action.DOMPTER,
	Competence.APPRIVOISEMENT: ActionData.Action.DOMPTER,
	Competence.DRESSAGE: ActionData.Action.DOMPTER
}

## Get competence name
static func get_competence_name(competence: Competence) -> String:
	return COMPETENCE_NAMES.get(competence, "Unknown")

## Get action for a competence
static func get_competence_action(competence: Competence) -> ActionData.Action:
	return COMPETENCE_ACTION.get(competence, ActionData.Action.FRAPPER)





