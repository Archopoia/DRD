extends Node3D
class_name StatsSandboxManager

@onready var character_sheet: CharacterSheet = $SheetLayer/CharacterSheetUI
@onready var player: StatsPlayerController = $Player
@onready var stats_overlay: StatsDebugOverlay = $UIRoot/StatsOverlay
@onready var rebuild_button: Button = $SheetLayer/RebuildStatsButton

func _ready() -> void:
	if rebuild_button and not rebuild_button.pressed.is_connected(_on_rebuild_stats_pressed):
		rebuild_button.pressed.connect(_on_rebuild_stats_pressed)
	_rebuild_stats()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey:
		var key_event := event as InputEventKey
		if not key_event.pressed or key_event.echo:
			return

		match key_event.keycode:
			KEY_TAB:
				if stats_overlay:
					stats_overlay.visible = not stats_overlay.visible
			KEY_C:
				if character_sheet:
					character_sheet.visible = not character_sheet.visible

func _on_rebuild_stats_pressed() -> void:
	_rebuild_stats()

func _rebuild_stats() -> void:
	if not character_sheet:
		return
	var stats: CharacterStats = character_sheet.build_runtime_stats()
	if player:
		player.apply_stats(stats)
	if stats_overlay:
		stats_overlay.update_from_stats(stats)
