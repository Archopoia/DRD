extends Resource
class_name StatMathMapping

## Numeric mapping from Attributes / Aptitudes / Compétences / Maîtrises
## to the concrete `CharacterStats` values used at runtime.
##
## This script is intentionally deterministic: there are no dice rolls here.
## Real‑time gameplay (aim, timing, position) stays primary; stats simply
## bend the numbers in the player’s favour (or against them).

const ROLES := preload("res://scripts/stat_layer_roles.gd")
const KEY_PRIMARY_STATS := ROLES.KEY_PRIMARY_STATS
const KEY_SECONDARY_STATS := ROLES.KEY_SECONDARY_STATS
const KEY_TAGS := ROLES.KEY_TAGS


## PUBLIC ENTRYPOINT ------------------------------------------------------------------------

static func compute_stats(
	attribute_values: Dictionary,
	aptitude_levels: Dictionary,
	competence_levels: Dictionary,
	mastery_dice: Dictionary
) -> CharacterStats:
	## Builds a fresh CharacterStats instance from raw rules data.
	var stats := CharacterStats.new()

	_apply_attributes(stats, attribute_values)
	_apply_aptitudes(stats, aptitude_levels)
	_apply_competences(stats, competence_levels, mastery_dice)

	return stats


## ATTRIBUTE CONTRIBUTIONS ------------------------------------------------------------------

static func _apply_attributes(stats: CharacterStats, attribute_values: Dictionary) -> void:
	for attr in AttributeData.Attribute.values():
		var value: int = attribute_values.get(attr, 0)
		if value == 0:
			continue
		match attr:
			AttributeData.Attribute.FOR:
				# 3 PV par point de FOR, avec léger plafonnement.
				stats.max_health += 3.0 * _soft_cap(value, 15.0, 0.5)
				_multiply_stat(stats, "melee_damage_mult", value, 0.02)
				_multiply_stat(stats, "stagger_power_mult", value, 0.02)
				stats.carry_weight_max += 1.0 * value
			AttributeData.Attribute.AGI:
				_multiply_stat(stats, "run_speed", value, 0.015)
				_multiply_stat(stats, "sprint_speed", value, 0.02)
				_multiply_stat(stats, "acceleration", value, 0.02)
				_multiply_stat(stats, "air_control", value, 0.02)
				_multiply_stat(stats, "sprint_stamina_cost_mult", -value, 0.01)
			AttributeData.Attribute.DEX:
				_multiply_stat(stats, "aim_spread_mult", -value, 0.015)
				_multiply_stat(stats, "aim_sway_mult", -value, 0.015)
				_multiply_stat(stats, "reload_speed_mult", value, 0.015)
				_multiply_stat(stats, "lockpicking_speed_mult", value, 0.02)
				_multiply_stat(stats, "lockpicking_stability_mult", value, 0.02)
			AttributeData.Attribute.VIG:
				stats.max_stamina += 4.0 * _soft_cap(value, 15.0, 0.5)
				_multiply_stat(stats, "stamina_regen_per_second", value, 0.02)
				_multiply_stat(stats, "fatigue_rate_mult", -value, 0.015)
				_multiply_stat(stats, "swim_speed", value, 0.01)
			AttributeData.Attribute.EMP:
				_multiply_stat(stats, "persuasion_success_mult", value, 0.02)
				_multiply_stat(stats, "deception_success_mult", value, 0.015)
				_multiply_stat(stats, "companion_morale_gain_mult", value, 0.02)
			AttributeData.Attribute.PER:
				_multiply_stat(stats, "detection_radius_mult", value, 0.02)
				_multiply_stat(stats, "detection_speed_mult", value, 0.02)
				_multiply_stat(stats, "trap_detection_chance_mult", value, 0.02)
				_multiply_stat(stats, "clue_highlight_radius_mult", value, 0.015)
			AttributeData.Attribute.CRE:
				stats.crafting_quality_bonus += 0.01 * value
				_multiply_stat(stats, "crafting_speed_mult", value, 0.015)
				_multiply_stat(stats, "harvesting_yield_mult", value, 0.02)
				_multiply_stat(stats, "interactable_inspection_speed_mult", value, 0.015)
			AttributeData.Attribute.VOL:
				_multiply_stat(stats, "mental_resistance", value, 0.02)
				_multiply_stat(stats, "poison_resistance", value, 0.015)
				_multiply_stat(stats, "disease_resistance", value, 0.015)
				_multiply_stat(stats, "intimidation_success_mult", value, 0.02)


## APTITUDE CONTRIBUTIONS -------------------------------------------------------------------

static func _apply_aptitudes(stats: CharacterStats, aptitude_levels: Dictionary) -> void:
	for apt in AptitudeData.Aptitude.values():
		var level: int = aptitude_levels.get(apt, 0)
		if level == 0:
			continue

		var role: Dictionary = ROLES.APTITUDE_ROLES.get(apt, {})
		if role.is_empty():
			continue

		var primary_stats: Array = role.get(KEY_PRIMARY_STATS, [])
		var secondary_stats: Array = role.get(KEY_SECONDARY_STATS, [])

		# Treat aptitude level as a broad multiplier on its domain.
		for stat_name in primary_stats:
			_multiply_stat(stats, stat_name, level, 0.02) # ≈ +2% par niveau d’aptitude.

		for stat_name in secondary_stats:
			_multiply_stat(stats, stat_name, level, 0.01) # ≈ +1% par niveau.


## COMPÉTENCE + MAÎTRISE CONTRIBUTIONS ------------------------------------------------------

## Simple interpretation of hook tags → which CharacterStats to touch.
const TAG_TO_STATS: Dictionary = {
	"melee_armed": ["melee_damage_mult", "melee_attack_speed_mult"],
	"melee_unarmed": ["melee_damage_mult", "melee_recovery_time_mult"],
	"melee_improvised": ["melee_damage_mult", "harvesting_yield_mult"],
	"melee_damage": ["melee_damage_mult"],
	"melee_control": ["melee_recovery_time_mult", "melee_combo_window_mult"],
	"melee_defense": ["block_effectiveness_mult", "block_stability_mult"],
	"grappling": ["stagger_power_mult", "stagger_resistance_mult"],
	"counter_attacks": ["melee_crit_chance_bonus", "parry_window_mult"],
	"bows": ["ranged_damage_mult", "aim_sway_mult"],
	"propelled_weapons": ["ranged_attack_speed_mult", "ranged_stamina_cost_mult"],
	"thrown_weapons": ["ranged_damage_mult", "projectile_velocity_mult"],
	"movement_fluidity": ["run_speed", "sprint_speed"],
	"dodge": ["parry_window_mult", "visibility_mult"],
	"pickpocket": ["pickpocket_success_mult"],
	"misdirection": ["deception_success_mult"],
	"hiding": ["visibility_mult", "noise_radius_mult"],
	"performance": ["persuasion_success_mult"],
	"balance": ["fall_safe_height", "air_control"],
	"aim_precision": ["aim_spread_mult"],
	"vehicle_control": ["movement"], # Placeholder for future vehicle stats.
	"fine_gestures": ["lockpicking_speed_mult", "trap_disarm_speed_mult"],
	"campcraft": ["harvesting_speed_mult"],
	"explosives": ["trap_disarm_speed_mult"],
	"locks": ["lockpicking_speed_mult", "lockpicking_stability_mult"],
	"puzzles": ["clue_highlight_intensity_mult"],
	"ground_movement": ["run_speed", "fatigue_rate_mult"],
	"climbing": ["climb_speed"],
	"acrobatics": ["jump_height", "fall_damage_mult"],
	"lifting": ["carry_weight_max"],
	"jump_distance": ["jump_height"],
	"swimming": ["swim_speed"],
	"gliding": ["air_control"],
	"burrowing": ["movement"], # Placeholder.
	"mounted_travel": ["movement"], # Placeholder.
	"charm": ["persuasion_success_mult"],
	"lies": ["deception_success_mult"],
	"first_impression": ["persuasion_success_mult"],
	"medicine": ["health_regen_per_second"],
	"engineering": ["crafting_quality_bonus"],
	"games": ["deception_success_mult"],
	"societies": ["persuasion_success_mult"],
	"world_knowledge": ["clue_highlight_radius_mult"],
	"flora_fauna": ["harvesting_yield_mult"],
	"herding": ["command_effectiveness_mult"],
	"farming": ["harvesting_yield_mult"],
	"command": ["command_effectiveness_mult"],
	"submission": ["companion_morale_loss_mult"],
	"stubbornness": ["mental_resistance"],
	"ingestion": ["hunger_rate_mult", "thirst_rate_mult"],
	"alcohol_tolerance": ["disease_resistance"],
	"internal_resistance": ["poison_resistance"],
	"fear": ["intimidation_success_mult"],
	"taming": ["command_effectiveness_mult"]
}


static func _apply_competences(
	stats: CharacterStats,
	competence_levels: Dictionary,
	mastery_dice: Dictionary
) -> void:
	for comp in CompetenceData.Competence.values():
		var level: int = competence_levels.get(comp, 0)
		if level <= 0:
			continue

		var hooks: Dictionary = ROLES.COMPETENCE_HOOKS.get(comp, {})
		if hooks.is_empty():
			continue

		var tags: Array = hooks.get(KEY_TAGS, [])
		if tags.is_empty():
			continue

		# Each competence level gives a modest bonus on its tags.
		for tag in tags:
			var affected_stats: Array = TAG_TO_STATS.get(tag, [])
			if affected_stats.is_empty():
				continue
			for stat_name in affected_stats:
				_multiply_stat(stats, stat_name, level, 0.01) # ≈ +1% par niveau de CT.

		# Simple mastery synergy: total dice in masteries for this competence
		# slightly amplifies its effect.
		var mastery_key := str(int(comp))
		var mastery_total: int = mastery_dice.get(mastery_key, 0)
		if mastery_total > 0:
			for tag in tags:
				var affected_stats_m: Array = TAG_TO_STATS.get(tag, [])
				for stat_name_m in affected_stats_m:
					_multiply_stat(stats, stat_name_m, mastery_total, 0.005)


## HELPERS ----------------------------------------------------------------------------------

static func _soft_cap(value: float, threshold: float, post_cap_factor: float) -> float:
	## Simple soft‑cap: linear up to threshold, then slope reduced.
	var abs_v := absf(value)
	if abs_v <= threshold:
		return value
	var extra := abs_v - threshold
	var capped := threshold + extra * post_cap_factor
	return signf(value) * capped


static func _multiply_stat(stats: CharacterStats, stat_name: String, scalar: float, per_unit: float) -> void:
	if not stats.has_method("get") or not stats.has_method("set"):
		return
	if not _has_stat_property(stats, stat_name):
		return
	var current: float = float(stats.get(stat_name))
	var delta: float = scalar * per_unit
	# Convert to multiplicative factor and clamp to avoid negative / zero.
	var factor: float = 1.0 + delta
	if factor < 0.2:
		factor = 0.2
	if factor > 4.0:
		factor = 4.0
	stats.set(stat_name, current * factor)


static func _has_stat_property(stats: CharacterStats, stat_name: String) -> bool:
	for prop in stats.get_property_list():
		if not prop.has("name"):
			continue
		if String(prop["name"]) == stat_name:
			return true
	return false



