extends Resource
class_name AptitudeData

## Enum for the 8 Aptitudes (APT)
enum Aptitude {
	PUISSANCE,    # 1. Puissance (Fin d'Été)
	AISANCE,      # 2. Aisance (Début d'Automne)
	PRECISION,    # 3. Précision (Fin d'Automne)
	ATHLETISME,   # 4. Athlétisme (Début d'Hiver)
	CHARISME,     # 5. Charisme (Fin d'Hiver)
	DETECTION,    # 6. Détection (Début de Cycle)
	REFLEXION,    # 7. Réflexion (Fin de Cycle)
	DOMINATION    # 8. Domination (Début d'Été)
}

## Aptitude names in French
const APTITUDE_NAMES: Dictionary = {
	Aptitude.PUISSANCE: "Puissance",
	Aptitude.AISANCE: "Aisance",
	Aptitude.PRECISION: "Précision",
	Aptitude.ATHLETISME: "Athlétisme",
	Aptitude.CHARISME: "Charisme",
	Aptitude.DETECTION: "Détection",
	Aptitude.REFLEXION: "Réflexion",
	Aptitude.DOMINATION: "Domination"
}

## Mapping: Each Aptitude is calculated from 3 Attributes with weights
## Format: {Aptitude: [ATB1 (weight +3), ATB2 (weight +2), ATB3 (weight +1)]}
const APTITUDE_ATTRIBUTES: Dictionary = {
	Aptitude.PUISSANCE: [AttributeData.Attribute.FOR, AttributeData.Attribute.AGI, AttributeData.Attribute.DEX],
	Aptitude.AISANCE: [AttributeData.Attribute.AGI, AttributeData.Attribute.DEX, AttributeData.Attribute.VIG],
	Aptitude.PRECISION: [AttributeData.Attribute.DEX, AttributeData.Attribute.PER, AttributeData.Attribute.CRE],
	Aptitude.ATHLETISME: [AttributeData.Attribute.VIG, AttributeData.Attribute.FOR, AttributeData.Attribute.AGI],
	Aptitude.CHARISME: [AttributeData.Attribute.EMP, AttributeData.Attribute.VOL, AttributeData.Attribute.PER],
	Aptitude.DETECTION: [AttributeData.Attribute.PER, AttributeData.Attribute.CRE, AttributeData.Attribute.EMP],
	Aptitude.REFLEXION: [AttributeData.Attribute.CRE, AttributeData.Attribute.EMP, AttributeData.Attribute.VOL],
	Aptitude.DOMINATION: [AttributeData.Attribute.VOL, AttributeData.Attribute.VIG, AttributeData.Attribute.FOR]
}

## Get aptitude name
static func get_aptitude_name(aptitude: Aptitude) -> String:
	return APTITUDE_NAMES.get(aptitude, "Unknown")

## Get the 3 attributes for an aptitude
static func get_aptitude_attributes(aptitude: Aptitude) -> Array:
	return APTITUDE_ATTRIBUTES.get(aptitude, [])





