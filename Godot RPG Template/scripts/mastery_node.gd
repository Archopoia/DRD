extends HBoxContainer
class_name MasteryNode

## Node representing a single Mastery within a Competence
## Displays mastery name and dice count

signal mastery_changed(mastery_name: String, dice_count: int)

@export var mastery_name: String = ""
@export var mastery_dice: int = 0
@export var max_dice: int = 5  # Limited by competence level

var name_label: Label
var dice_spinbox: SpinBox

func _ready() -> void:
	# Find children by type instead of by name to avoid issues with auto-renamed nodes
	for child in get_children():
		if child is Label and name_label == null:
			name_label = child
		elif child is SpinBox and dice_spinbox == null:
			dice_spinbox = child
	
	if name_label:
		name_label.text = mastery_name
	
	if dice_spinbox:
		dice_spinbox.min_value = 0
		dice_spinbox.max_value = max_dice
		dice_spinbox.value = mastery_dice
		dice_spinbox.value_changed.connect(_on_dice_changed)
	
	_update_display()

func _update_display() -> void:
	if name_label:
		name_label.text = mastery_name
	if dice_spinbox:
		dice_spinbox.max_value = max_dice

func _on_dice_changed(new_value: float) -> void:
	mastery_dice = int(new_value)
	mastery_changed.emit(mastery_name, mastery_dice)

func set_max_dice(value: int) -> void:
	max_dice = value
	if dice_spinbox:
		dice_spinbox.max_value = value

func set_mastery_dice(value: int) -> void:
	mastery_dice = clamp(value, 0, max_dice)
	if dice_spinbox:
		dice_spinbox.value = mastery_dice




