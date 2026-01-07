extends Resource
class_name SouffranceData

## Enum for the 8 Souffrances (Sufferings)
## Each Souffrance is tied to a specific Attribute
enum Souffrance {
	BLESSURES,    # Blessures (FOR)
	FATIGUES,     # Fatigues (AGI)
	ENTRAVES,     # Entraves (DEX)
	DISETTES,     # Disettes (VIG)
	ADDICTIONS,   # Addictions (EMP)
	MALADIES,     # Maladies (PER)
	FOLIES,       # Folies (CRÉ)
	RANCOEURS,    # Rancœurs (VOL)
}

## Get the French name of a Souffrance
static func get_souffrance_name(souffrance: Souffrance) -> String:
	match souffrance:
		Souffrance.BLESSURES:
			return "Blessures"
		Souffrance.FATIGUES:
			return "Fatigues"
		Souffrance.ENTRAVES:
			return "Entraves"
		Souffrance.DISETTES:
			return "Disettes"
		Souffrance.ADDICTIONS:
			return "Addictions"
		Souffrance.MALADIES:
			return "Maladies"
		Souffrance.FOLIES:
			return "Folies"
		Souffrance.RANCOEURS:
			return "Rancœurs"
		_:
			return "Inconnu"

## Get the Attribute tied to a Souffrance
static func get_souffrance_attribute(souffrance: Souffrance) -> AttributeData.Attribute:
	match souffrance:
		Souffrance.BLESSURES:
			return AttributeData.Attribute.FOR
		Souffrance.FATIGUES:
			return AttributeData.Attribute.AGI
		Souffrance.ENTRAVES:
			return AttributeData.Attribute.DEX
		Souffrance.DISETTES:
			return AttributeData.Attribute.VIG
		Souffrance.ADDICTIONS:
			return AttributeData.Attribute.EMP
		Souffrance.MALADIES:
			return AttributeData.Attribute.PER
		Souffrance.FOLIES:
			return AttributeData.Attribute.CRE
		Souffrance.RANCOEURS:
			return AttributeData.Attribute.VOL
		_:
			return AttributeData.Attribute.FOR

## Get the Aptitude tied to a Souffrance (same as the attribute's main aptitude)
static func get_souffrance_aptitude(souffrance: Souffrance) -> AptitudeData.Aptitude:
	var attr: AttributeData.Attribute = get_souffrance_attribute(souffrance)
	return AttributeData.get_attribute_main_aptitude(attr)

