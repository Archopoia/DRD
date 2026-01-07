extends Resource
class_name CharacterStats

## Runtime character stats used by the actual gameplay systems (movement, combat, AI, etc.).
## This Resource is independent from the UI character sheet nodes and can be read by
## your player controller, combat system, NPC AI, and so on.
##
## Design goals:
## - Mostly deterministic, moment-to-moment gameplay (your aim/timing/positioning matters),
##   while Attributes / Aptitudes / Compétences / Maîtrises provide continuous bonuses.
## - Grouped by subsystems so you can test and tune each part in isolation.
## - CharacterStats should represent the *resolved* capabilities of the actor at a given time.

## HEALTH / SURVIVAL -------------------------------------------------------------------------

@export var max_health: float = 100.0
@export var health_regen_per_second: float = 0.0

@export var max_stamina: float = 100.0
@export var stamina_regen_per_second: float = 10.0

## How quickly fatigue accumulates from generic exertion (sprinting, jumping, etc.).
@export var fatigue_rate_mult: float = 1.0

## Resistances are multiplicative factors (0.8 means 20% less damage / effect).
@export var physical_damage_resistance: float = 1.0
@export var bleed_resistance: float = 1.0
@export var poison_resistance: float = 1.0
@export var disease_resistance: float = 1.0
@export var mental_resistance: float = 1.0
@export var environmental_cold_resistance: float = 1.0
@export var environmental_heat_resistance: float = 1.0
@export var environmental_toxic_resistance: float = 1.0

## Survival pacing (1.0 = baseline tabletop/setting expectation).
@export var hunger_rate_mult: float = 1.0
@export var thirst_rate_mult: float = 1.0
@export var sleep_deprivation_rate_mult: float = 1.0

@export var carry_weight_max: float = 30.0

@export var fall_safe_height: float = 3.0
@export var fall_lethal_height: float = 12.0
@export var fall_damage_mult: float = 1.0


## MOVEMENT / LOCOMOTION ---------------------------------------------------------------------

@export var walk_speed: float = 4.0
@export var run_speed: float = 6.0
@export var sprint_speed: float = 8.0
@export var crouch_speed: float = 2.5

@export var acceleration: float = 18.0
@export var deceleration: float = 18.0
@export var air_control: float = 0.4

@export var jump_height: float = 2.0
@export var climb_speed: float = 2.5
@export var swim_speed: float = 3.0

## Stamina multipliers for locomotion actions.
@export var sprint_stamina_cost_mult: float = 1.0
@export var jump_stamina_cost_mult: float = 1.0
@export var climb_stamina_cost_mult: float = 1.0
@export var swim_stamina_cost_mult: float = 1.0


## MELEE COMBAT -----------------------------------------------------------------------------

## Global melee output multipliers applied on top of weapon data.
@export var melee_damage_mult: float = 1.0
@export var melee_attack_speed_mult: float = 1.0
@export var melee_stamina_cost_mult: float = 1.0
@export var melee_impact_force_mult: float = 1.0
@export var melee_crit_chance_bonus: float = 0.0
@export var melee_crit_multiplier_mult: float = 1.0

## Melee control and accuracy (useful for directional attacks, hit-stop, etc.).
@export var melee_recovery_time_mult: float = 1.0
@export var melee_combo_window_mult: float = 1.0

## How well the character can stagger and be staggered.
@export var stagger_power_mult: float = 1.0
@export var stagger_resistance_mult: float = 1.0

## Blocking / parrying.
@export var block_effectiveness_mult: float = 1.0
@export var block_stability_mult: float = 1.0
@export var block_stamina_cost_mult: float = 1.0
@export var parry_window_mult: float = 1.0


## RANGED COMBAT ---------------------------------------------------------------------------

@export var ranged_damage_mult: float = 1.0
@export var ranged_attack_speed_mult: float = 1.0
@export var ranged_stamina_cost_mult: float = 1.0

## Aim handling (used by bow/crossbow/gun style systems).
@export var aim_spread_mult: float = 1.0
@export var aim_recoil_mult: float = 1.0
@export var aim_sway_mult: float = 1.0
@export var aim_spread_recovery_mult: float = 1.0

@export var reload_speed_mult: float = 1.0
@export var draw_holster_speed_mult: float = 1.0
@export var projectile_velocity_mult: float = 1.0


## STEALTH / DETECTION ---------------------------------------------------------------------

## How hidden the actor is (lower = harder to detect).
@export var visibility_mult: float = 1.0
@export var noise_radius_mult: float = 1.0

## Offensive stealth bonuses.
@export var backstab_damage_mult: float = 1.0
@export var surprise_attack_crit_bonus: float = 0.0

## Defensive anti-detection capabilities (how well you spot others).
@export var detection_radius_mult: float = 1.0
@export var detection_angle_mult: float = 1.0
@export var detection_speed_mult: float = 1.0
@export var trap_detection_chance_mult: float = 1.0

## Utility stealth skills.
@export var pickpocket_success_mult: float = 1.0
@export var lockpicking_speed_mult: float = 1.0
@export var lockpicking_stability_mult: float = 1.0
@export var trap_disarm_speed_mult: float = 1.0


## INTERACTION / CRAFTING ------------------------------------------------------------------

@export var generic_interaction_speed_mult: float = 1.0

## Crafting / repair.
@export var crafting_quality_bonus: float = 0.0
@export var crafting_speed_mult: float = 1.0
@export var repair_efficiency_mult: float = 1.0

## Resource harvesting.
@export var harvesting_yield_mult: float = 1.0
@export var harvesting_speed_mult: float = 1.0


## SOCIAL / LEADERSHIP / AI REACTION -------------------------------------------------------

## Conversation outcomes.
@export var persuasion_success_mult: float = 1.0
@export var intimidation_success_mult: float = 1.0
@export var deception_success_mult: float = 1.0

## Economy & prices (values < 1.0 mean better buying, worse selling for NPCs).
@export var buy_price_mult: float = 1.0
@export var sell_price_mult: float = 1.0

## Leadership over companions / followers.
@export var leadership_radius: float = 8.0
@export var companion_morale_gain_mult: float = 1.0
@export var companion_morale_loss_mult: float = 1.0
@export var command_effectiveness_mult: float = 1.0


## INFORMATION / INVESTIGATION -------------------------------------------------------------

## How good the actor is at extracting information from the world.
@export var clue_highlight_radius_mult: float = 1.0
@export var clue_highlight_intensity_mult: float = 1.0
@export var track_visibility_duration_mult: float = 1.0
@export var interactable_inspection_speed_mult: float = 1.0


## UTILITY ---------------------------------------------------------------------------------

func duplicate_stats() -> CharacterStats:
	## Returns a shallow duplicate of these stats.
	var stats := CharacterStats.new()
	for property_name in get_property_list():
		if not property_name.has("name"):
			continue
		var name: String = property_name["name"]
		if name.begins_with("_"):
			continue
		if has_meta(name):
			continue
		if has_method(name):
			continue
		stats.set(name, get(name))
	return stats


