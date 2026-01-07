extends CharacterBody3D
class_name StatsPlayerController

## Simple first-person style controller that reads movement/jump from CharacterStats.

@export var stats: CharacterStats
@export var mouse_sensitivity: float = 0.1

var _yaw: float = 0.0
var _pitch: float = 0.0

@onready var camera_3d: Camera3D = $Camera3D


func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	if stats == null:
		stats = CharacterStats.new()
	_ensure_movement_actions()


func apply_stats(new_stats: CharacterStats) -> void:
	stats = new_stats


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and camera_3d:
		var mm := event as InputEventMouseMotion
		_yaw -= mm.relative.x * mouse_sensitivity * 0.01
		_pitch -= mm.relative.y * mouse_sensitivity * 0.01
		_pitch = clamp(_pitch, -1.2, 1.2)
		rotation.y = _yaw
		camera_3d.rotation.x = _pitch
	elif event is InputEventKey:
		var key_event := event as InputEventKey
		if key_event.pressed and not key_event.echo and key_event.keycode == KEY_ESCAPE:
			# First press: release mouse so you can reach window controls.
			# Second press (when already free): quit the game.
			if Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
				Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
			else:
				get_tree().quit()


func _physics_process(delta: float) -> void:
	var input_dir: Vector2 = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction: Vector3 = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

	var target_speed: float = stats.run_speed
	var velocity_3d: Vector3 = velocity

	if direction != Vector3.ZERO:
		velocity_3d.x = direction.x * target_speed
		velocity_3d.z = direction.z * target_speed
	else:
		velocity_3d.x = move_toward(velocity_3d.x, 0.0, stats.acceleration * delta)
		velocity_3d.z = move_toward(velocity_3d.z, 0.0, stats.acceleration * delta)

	if is_on_floor():
		if Input.is_action_just_pressed("ui_accept"):
			velocity_3d.y = sqrt(2.0 * ProjectSettings.get_setting("physics/3d/default_gravity") * stats.jump_height)
	else:
		velocity_3d.y -= ProjectSettings.get_setting("physics/3d/default_gravity") * delta

	velocity = velocity_3d
	move_and_slide()


func _ensure_movement_actions() -> void:
	var mapping: Dictionary = {
		"move_forward": KEY_W,
		"move_back": KEY_S,
		"move_left": KEY_A,
		"move_right": KEY_D,
	}

	for action_name in mapping.keys():
		var keycode: int = mapping[action_name]

		if not InputMap.has_action(action_name):
			InputMap.add_action(action_name)

		var exists := false
		for ev in InputMap.action_get_events(action_name):
			if ev is InputEventKey and ev.keycode == keycode:
				exists = true
				break

		if not exists:
			var ev := InputEventKey.new()
			ev.keycode = keycode
			InputMap.action_add_event(action_name, ev)
