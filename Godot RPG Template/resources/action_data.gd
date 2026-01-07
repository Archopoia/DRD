extends Resource
class_name ActionData

## Enum for the 24 Actions
enum Action {
	# Puissance (3 actions)
	FRAPPER,      # Frapper
	NEUTRALISER,  # Neutraliser
	TIRER,        # Tirer
	
	# Aisance (3 actions)
	REAGIR,       # Réagir
	DEROBER,      # Dérober
	COORDONNER,   # Coordonner
	
	# Précision (3 actions)
	MANIER,       # Manier
	FACONNER,     # Façonner
	FIGNOLER,     # Fignoler
	
	# Athlétisme (3 actions)
	TRAVERSER,    # Traverser
	EFFORCER,     # Efforcer
	MANOEUVRER,   # Manœuvrer
	
	# Charisme (3 actions)
	CAPTIVER,     # Captiver
	CONVAINCRE,   # Convaincre
	INTERPRETER,  # Interpréter
	
	# Détection (3 actions)
	DISCERNER,    # Discerner
	DECOUVRIR,    # Découvrir
	DEPISTER,     # Dépister
	
	# Réflexion (3 actions)
	CONCEVOIR,    # Concevoir
	ACCULTURER,   # Acculturer
	ACCLIMATER,   # Acclimater
	
	# Domination (3 actions)
	DISCIPLINER,  # Discipliner
	ENDURER,      # Endurer
	DOMPTER       # Dompter
}

## Action names in French
const ACTION_NAMES: Dictionary = {
	Action.FRAPPER: "Frapper",
	Action.NEUTRALISER: "Neutraliser",
	Action.TIRER: "Tirer",
	Action.REAGIR: "Réagir",
	Action.DEROBER: "Dérober",
	Action.COORDONNER: "Coordonner",
	Action.MANIER: "Manier",
	Action.FACONNER: "Façonner",
	Action.FIGNOLER: "Fignoler",
	Action.TRAVERSER: "Traverser",
	Action.EFFORCER: "Efforcer",
	Action.MANOEUVRER: "Manœuvrer",
	Action.CAPTIVER: "Captiver",
	Action.CONVAINCRE: "Convaincre",
	Action.INTERPRETER: "Interpréter",
	Action.DISCERNER: "Discerner",
	Action.DECOUVRIR: "Découvrir",
	Action.DEPISTER: "Dépister",
	Action.CONCEVOIR: "Concevoir",
	Action.ACCULTURER: "Acculturer",
	Action.ACCLIMATER: "Acclimater",
	Action.DISCIPLINER: "Discipliner",
	Action.ENDURER: "Endurer",
	Action.DOMPTER: "Dompter"
}

## Mapping: Each Action belongs to an Aptitude
const ACTION_APTITUDE: Dictionary = {
	Action.FRAPPER: AptitudeData.Aptitude.PUISSANCE,
	Action.NEUTRALISER: AptitudeData.Aptitude.PUISSANCE,
	Action.TIRER: AptitudeData.Aptitude.PUISSANCE,
	Action.REAGIR: AptitudeData.Aptitude.AISANCE,
	Action.DEROBER: AptitudeData.Aptitude.AISANCE,
	Action.COORDONNER: AptitudeData.Aptitude.AISANCE,
	Action.MANIER: AptitudeData.Aptitude.PRECISION,
	Action.FACONNER: AptitudeData.Aptitude.PRECISION,
	Action.FIGNOLER: AptitudeData.Aptitude.PRECISION,
	Action.TRAVERSER: AptitudeData.Aptitude.ATHLETISME,
	Action.EFFORCER: AptitudeData.Aptitude.ATHLETISME,
	Action.MANOEUVRER: AptitudeData.Aptitude.ATHLETISME,
	Action.CAPTIVER: AptitudeData.Aptitude.CHARISME,
	Action.CONVAINCRE: AptitudeData.Aptitude.CHARISME,
	Action.INTERPRETER: AptitudeData.Aptitude.CHARISME,
	Action.DISCERNER: AptitudeData.Aptitude.DETECTION,
	Action.DECOUVRIR: AptitudeData.Aptitude.DETECTION,
	Action.DEPISTER: AptitudeData.Aptitude.DETECTION,
	Action.CONCEVOIR: AptitudeData.Aptitude.REFLEXION,
	Action.ACCULTURER: AptitudeData.Aptitude.REFLEXION,
	Action.ACCLIMATER: AptitudeData.Aptitude.REFLEXION,
	Action.DISCIPLINER: AptitudeData.Aptitude.DOMINATION,
	Action.ENDURER: AptitudeData.Aptitude.DOMINATION,
	Action.DOMPTER: AptitudeData.Aptitude.DOMINATION
}

## Mapping: Each Action is linked to one of the 3 attributes of its Aptitude
## The first action uses ATB1 (Triple), second uses ATB2 (Double), third uses ATB3 (Unique)
## Within each Aptitude, actions map to: [Triple, Double, Unique]
const ACTION_LINKED_ATTRIBUTE: Dictionary = {
	# Puissance: FOR+3, AGI+2, DEX+1
	Action.FRAPPER: AttributeData.Attribute.FOR,      # Triple
	Action.NEUTRALISER: AttributeData.Attribute.AGI, # Double
	Action.TIRER: AttributeData.Attribute.DEX,        # Unique
	
	# Aisance: AGI+3, DEX+2, VIG+1
	Action.REAGIR: AttributeData.Attribute.AGI,      # Triple
	Action.DEROBER: AttributeData.Attribute.DEX,     # Double
	Action.COORDONNER: AttributeData.Attribute.VIG,  # Unique
	
	# Précision: DEX+3, PER+2, CRE+1
	Action.MANIER: AttributeData.Attribute.DEX,      # Triple
	Action.FACONNER: AttributeData.Attribute.PER,   # Double
	Action.FIGNOLER: AttributeData.Attribute.CRE,    # Unique
	
	# Athlétisme: VIG+3, FOR+2, AGI+1
	Action.TRAVERSER: AttributeData.Attribute.VIG,   # Triple
	Action.EFFORCER: AttributeData.Attribute.FOR,     # Double
	Action.MANOEUVRER: AttributeData.Attribute.AGI,  # Unique
	
	# Charisme: EMP+3, VOL+2, PER+1
	Action.CAPTIVER: AttributeData.Attribute.EMP,    # Triple
	Action.CONVAINCRE: AttributeData.Attribute.VOL,  # Double
	Action.INTERPRETER: AttributeData.Attribute.PER,  # Unique
	
	# Détection: PER+3, CRE+2, EMP+1
	Action.DISCERNER: AttributeData.Attribute.PER,   # Triple
	Action.DECOUVRIR: AttributeData.Attribute.CRE,   # Double
	Action.DEPISTER: AttributeData.Attribute.EMP,     # Unique
	
	# Réflexion: CRE+3, EMP+2, VOL+1
	Action.CONCEVOIR: AttributeData.Attribute.CRE,   # Triple
	Action.ACCULTURER: AttributeData.Attribute.EMP,  # Double
	Action.ACCLIMATER: AttributeData.Attribute.VOL,  # Unique
	
	# Domination: VOL+3, VIG+2, FOR+1
	Action.DISCIPLINER: AttributeData.Attribute.VOL, # Triple
	Action.ENDURER: AttributeData.Attribute.VIG,      # Double
	Action.DOMPTER: AttributeData.Attribute.FOR      # Unique
}

## Get action name
static func get_action_name(action: Action) -> String:
	return ACTION_NAMES.get(action, "Unknown")

## Get aptitude for an action
static func get_action_aptitude(action: Action) -> AptitudeData.Aptitude:
	return ACTION_APTITUDE.get(action, AptitudeData.Aptitude.PUISSANCE)

## Get linked attribute for an action
static func get_action_linked_attribute(action: Action) -> AttributeData.Attribute:
	return ACTION_LINKED_ATTRIBUTE.get(action, AttributeData.Attribute.FOR)





