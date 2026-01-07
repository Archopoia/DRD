extends RefCounted
class_name AttributeCalculator

## Calculates Aptitude Level from 3 Attributes using the formula from page 16
## Formula:
## - +1 pt per 10th pt of ATB1 (Unique, weight +3)
## - +1 pt per 1st, 3rd, 6th pt of ATB2 (Double, weight +2)
## - +1 pt for rest (2-4, 5-7, 8-9) of ATB3 (Triple, weight +1)
## - Take unit (divide by 10) for final level

## Calculate aptitude level from three attribute values
## @param atb1_value: Attribute 1 value (Unique, weight +3) - typically -50 to +50
## @param atb2_value: Attribute 2 value (Double, weight +2) - typically -50 to +50
## @param atb3_value: Attribute 3 value (Triple, weight +1) - typically -50 to +50
## @return: Calculated aptitude level (integer, typically -5 to +5)
static func calculate_aptitude_level(atb1_value: int, atb2_value: int, atb3_value: int) -> int:
	var total_points: int = 0
	
	# ATB1 (Unique): +1 pt per 10th pt
	# For every 10 points (positive or negative), add/subtract 1 point
	# Using integer division (intentional - we want floor division)
	total_points += atb1_value / 10  # Integer division is intentional
	
	# ATB2 (Double): +1 pt per 1st, 3rd, 6th pt
	# Points at: 1, 3, 6, 11, 13, 16, 21, 23, 26, etc.
	# Simplified: for every 10, we get 1 point, plus additional points at positions 1, 3, 6 within each decade
	var atb2_abs: int = abs(atb2_value)
	var atb2_sign: int = 1 if atb2_value >= 0 else -1
	
	# Calculate points from full decades
	# Using integer division (intentional - we want floor division)
	var atb2_decades: int = atb2_abs / 10  # Integer division is intentional
	total_points += atb2_decades * atb2_sign
	
	# Calculate points from remainder (1st, 3rd, 6th positions)
	var atb2_remainder: int = atb2_abs % 10
	if atb2_remainder >= 1:
		total_points += atb2_sign  # 1st point
	if atb2_remainder >= 3:
		total_points += atb2_sign  # 3rd point
	if atb2_remainder >= 6:
		total_points += atb2_sign  # 6th point
	
	# ATB3 (Triple): +1 pt for rest (2-4, 5-7, 8-9)
	# Points at: 2, 3, 4, 5, 6, 7, 8, 9 (but not 1, not 10)
	# Simplified: for every 10, we get points for positions 2-9
	var atb3_abs: int = abs(atb3_value)
	var atb3_sign: int = 1 if atb3_value >= 0 else -1
	
	# Calculate points from full decades (each decade gives 8 points: 2-9)
	# Using integer division (intentional - we want floor division)
	var atb3_decades: int = atb3_abs / 10  # Integer division is intentional
	total_points += atb3_decades * 8 * atb3_sign
	
	# Calculate points from remainder (positions 2-9)
	var atb3_remainder: int = atb3_abs % 10
	if atb3_remainder >= 2:
		var remainder_points: int = min(atb3_remainder - 1, 8)  # 2-9 = 8 points max
		total_points += remainder_points * atb3_sign
	
	# Return the unit (divide by 10, where -37 = -3)
	# This gives us the final aptitude level
	# Using integer division (intentional - we want floor division)
	return total_points / 10  # Integer division is intentional

## Calculate aptitude level from attribute enum values and their values dictionary
## @param aptitude: The aptitude to calculate
## @param attribute_values: Dictionary mapping Attribute enum to int value
## @return: Calculated aptitude level
static func calculate_aptitude_level_from_dict(aptitude: AptitudeData.Aptitude, attribute_values: Dictionary) -> int:
	var attributes: Array = AptitudeData.get_aptitude_attributes(aptitude)
	if attributes.size() != 3:
		return 0
	
	var atb1: AttributeData.Attribute = attributes[0]
	var atb2: AttributeData.Attribute = attributes[1]
	var atb3: AttributeData.Attribute = attributes[2]
	
	var atb1_value: int = attribute_values.get(atb1, 0)
	var atb2_value: int = attribute_values.get(atb2, 0)
	var atb3_value: int = attribute_values.get(atb3, 0)
	
	return calculate_aptitude_level(atb1_value, atb2_value, atb3_value)

## Get the contribution breakdown for display purposes
## Returns a dictionary with individual contributions
static func get_aptitude_breakdown(atb1_value: int, atb2_value: int, atb3_value: int) -> Dictionary:
	var breakdown: Dictionary = {}
	
	# ATB1 contribution
	# Using integer division (intentional - we want floor division)
	breakdown["atb1_contribution"] = atb1_value / 10  # Integer division is intentional
	
	# ATB2 contribution
	var atb2_abs: int = abs(atb2_value)
	var atb2_sign: int = 1 if atb2_value >= 0 else -1
	# Using integer division (intentional - we want floor division)
	var atb2_decades: int = atb2_abs / 10  # Integer division is intentional
	var atb2_remainder: int = atb2_abs % 10
	var atb2_remainder_points: int = 0
	if atb2_remainder >= 1:
		atb2_remainder_points += 1
	if atb2_remainder >= 3:
		atb2_remainder_points += 1
	if atb2_remainder >= 6:
		atb2_remainder_points += 1
	breakdown["atb2_contribution"] = (atb2_decades + atb2_remainder_points) * atb2_sign
	
	# ATB3 contribution
	var atb3_abs: int = abs(atb3_value)
	var atb3_sign: int = 1 if atb3_value >= 0 else -1
	# Using integer division (intentional - we want floor division)
	var atb3_decades: int = atb3_abs / 10  # Integer division is intentional
	var atb3_remainder: int = atb3_abs % 10
	var atb3_remainder_points: int = 0
	if atb3_remainder >= 2:
		atb3_remainder_points = min(atb3_remainder - 1, 8)
	breakdown["atb3_contribution"] = (atb3_decades * 8 + atb3_remainder_points) * atb3_sign
	
	# Total
	breakdown["total_points"] = breakdown["atb1_contribution"] + breakdown["atb2_contribution"] + breakdown["atb3_contribution"]
	# Using integer division (intentional - we want floor division)
	breakdown["final_level"] = breakdown["total_points"] / 10  # Integer division is intentional
	
	return breakdown
