extends Resource
class_name AttributeData

## Enum for the 8 Attributes (ATB)
enum Attribute {
	FOR,  # Force
	AGI,  # Agilité
	DEX,  # Dextérité
	VIG,  # Vigueur
	EMP,  # Empathie
	PER,  # Perception
	CRE,  # Créativité
	VOL   # Volonté
}

## Attribute names in French
const ATTRIBUTE_NAMES: Dictionary = {
	Attribute.FOR: "Force",
	Attribute.AGI: "Agilité",
	Attribute.DEX: "Dextérité",
	Attribute.VIG: "Vigueur",
	Attribute.EMP: "Empathie",
	Attribute.PER: "Perception",
	Attribute.CRE: "Créativité",
	Attribute.VOL: "Volonté"
}

## Attribute abbreviations
const ATTRIBUTE_ABBREVIATIONS: Dictionary = {
	Attribute.FOR: "FOR",
	Attribute.AGI: "AGI",
	Attribute.DEX: "DEX",
	Attribute.VIG: "VIG",
	Attribute.EMP: "EMP",
	Attribute.PER: "PER",
	Attribute.CRE: "CRÉ",
	Attribute.VOL: "VOL"
}

## Get attribute name
static func get_attribute_name(attribute: Attribute) -> String:
	return ATTRIBUTE_NAMES.get(attribute, "Unknown")

## Get attribute abbreviation
static func get_attribute_abbreviation(attribute: Attribute) -> String:
	return ATTRIBUTE_ABBREVIATIONS.get(attribute, "???")

## Get the main aptitude for an attribute (where it's ATB+3)
static func get_attribute_main_aptitude(attribute: Attribute) -> AptitudeData.Aptitude:
	for aptitude in AptitudeData.Aptitude.values():
		var attrs: Array = AptitudeData.get_aptitude_attributes(aptitude)
		if attrs.size() > 0 and attrs[0] == attribute:
			return aptitude
	return AptitudeData.Aptitude.PUISSANCE  # Default fallback





