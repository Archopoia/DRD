extends Control
class_name StatsDebugOverlay

## Simple on-screen overlay to visualise key `CharacterStats` values at runtime.
## Scene setup expected:
## - This script is on a `Control` node.
## - It has a `ScrollContainer` child named `Scroll`.
## - Inside `Scroll` there is an `HBoxContainer` named `Columns`
##   containing four `Label`s laid out horizontally.
## This lets us show multiple vertical columns of stats across the viewport
## while still allowing vertical scrolling if needed.

@export var stats: CharacterStats

@onready var scroll: ScrollContainer = $Scroll
@onready var columns: HBoxContainer = $Scroll/Columns
@onready var col0_label: Label = $Scroll/Columns/StatsLabel
@onready var col1_label: Label = $Scroll/Columns/Col1
@onready var col2_label: Label = $Scroll/Columns/Col2
@onready var col3_label: Label = $Scroll/Columns/Col3


func _ready() -> void:
	_setup_layout()
	if stats:
		update_from_stats(stats)


func update_from_stats(new_stats: CharacterStats) -> void:
	stats = new_stats
	if not stats or not col0_label or not col1_label or not col2_label or not col3_label:
		return
	
	var col0_lines: PackedStringArray = []
	var col1_lines: PackedStringArray = []
	var col2_lines: PackedStringArray = []
	var col3_lines: PackedStringArray = []

	# Column 0: core + movement.
	col0_lines.append("=== CORE ===")
	col0_lines.append("HP Max       : %.1f" % stats.max_health)
	col0_lines.append("Sta Max      : %.1f (regen %.1f/s)" % [stats.max_stamina, stats.stamina_regen_per_second])
	col0_lines.append("")
	col0_lines.append("=== MOVEMENT ===")
	col0_lines.append("Walk/Run/Sprint : %.2f / %.2f / %.2f" % [stats.walk_speed, stats.run_speed, stats.sprint_speed])
	col0_lines.append("Crouch Speed     : %.2f" % stats.crouch_speed)
	col0_lines.append("Jump Height      : %.2f" % stats.jump_height)
	col0_lines.append("Climb/Swim       : %.2f / %.2f" % [stats.climb_speed, stats.swim_speed])

	# Column 1: melee.
	col1_lines.append("=== MELEE ===")
	col1_lines.append("DMG x%.2f | ATK SPD x%.2f | STAM x%.2f" % [
		stats.melee_damage_mult,
		stats.melee_attack_speed_mult,
		stats.melee_stamina_cost_mult
	])
	col1_lines.append("Stagger PWR x%.2f | RES x%.2f" % [
		stats.stagger_power_mult,
		stats.stagger_resistance_mult
	])
	col1_lines.append("Block x%.2f | Stability x%.2f | Cost x%.2f" % [
		stats.block_effectiveness_mult,
		stats.block_stability_mult,
		stats.block_stamina_cost_mult
	])
	# Column 2: ranged.
	col2_lines.append("=== RANGED ===")
	col2_lines.append("DMG x%.2f | ATK SPD x%.2f | STAM x%.2f" % [
		stats.ranged_damage_mult,
		stats.ranged_attack_speed_mult,
		stats.ranged_stamina_cost_mult
	])
	col2_lines.append("Spread x%.2f | Sway x%.2f | Recoil x%.2f" % [
		stats.aim_spread_mult,
		stats.aim_sway_mult,
		stats.aim_recoil_mult
	])
	col2_lines.append("Reload x%.2f | Draw/Holster x%.2f" % [
		stats.reload_speed_mult,
		stats.draw_holster_speed_mult
	])

	# Column 3: stealth/detection + social/leadership + craft/survival summary.
	col3_lines.append("=== STEALTH / DETECTION ===")
	col3_lines.append("Visibility x%.2f | Noise x%.2f" % [
		stats.visibility_mult,
		stats.noise_radius_mult
	])
	col3_lines.append("Detect Radius x%.2f | Speed x%.2f" % [
		stats.detection_radius_mult,
		stats.detection_speed_mult
	])
	col3_lines.append("")
	col3_lines.append("=== SOCIAL / LEADERSHIP ===")
	col3_lines.append("Persuade x%.2f | Intimidate x%.2f | Deception x%.2f" % [
		stats.persuasion_success_mult,
		stats.intimidation_success_mult,
		stats.deception_success_mult
	])
	col3_lines.append("Leadership Radius %.1f | Command x%.2f" % [
		stats.leadership_radius,
		stats.command_effectiveness_mult
	])
	col3_lines.append("")
	col3_lines.append("=== CRAFT / SURVIVAL ===")
	col3_lines.append("Craft Qual +%.1f | Speed x%.2f" % [
		stats.crafting_quality_bonus * 100.0,
		stats.crafting_speed_mult
	])
	col3_lines.append("Carry Max %.1f | Fall safe %.1f" % [
		stats.carry_weight_max,
		stats.fall_safe_height
	])

	col0_label.text = "\n".join(col0_lines)
	col1_label.text = "\n".join(col1_lines)
	col2_label.text = "\n".join(col2_lines)
	col3_label.text = "\n".join(col3_lines)


func _setup_layout() -> void:
	# Ensure the scroll container actually scrolls vertically and uses full width.
	if scroll:
		scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_ALWAYS
		scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	
	# Make the HBoxContainer and all four labels share width equally.
	if columns:
		columns.size_flags_horizontal = Control.SIZE_EXPAND | Control.SIZE_FILL
	
	var labels: Array = [col0_label, col1_label, col2_label, col3_label]
	for label in labels:
		if label:
			label.size_flags_horizontal = Control.SIZE_EXPAND | Control.SIZE_FILL
			label.autowrap_mode = TextServer.AUTOWRAP_WORD


