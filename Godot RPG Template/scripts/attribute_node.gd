extends VBoxContainer
class_name AttributeNode

## Node representing a single Attribute
## Displays attribute name and value input

signal attribute_changed(attribute_id: AttributeData.Attribute, new_value: int)

@export var attribute_id: AttributeData.Attribute = AttributeData.Attribute.FOR
@export var attribute_value: int = 0

@onready var name_label: Label = $NameLabel
@onready var value_spinbox: SpinBox = $ValueSpinBox

func _ready() -> void:
	# Set up UI
	if name_label:
		name_label.text = AttributeData.get_attribute_name(attribute_id)
	
	if value_spinbox:
		value_spinbox.min_value = -50
		value_spinbox.max_value = 50
		value_spinbox.value = attribute_value
		value_spinbox.value_changed.connect(_on_value_changed)
	
	_update_display()

func _update_display() -> void:
	if name_label:
		var abbrev: String = AttributeData.get_attribute_abbreviation(attribute_id)
		name_label.text = "%s (%s)" % [AttributeData.get_attribute_name(attribute_id), abbrev]

func _on_value_changed(new_value: float) -> void:
	attribute_value = int(new_value)
	attribute_changed.emit(attribute_id, attribute_value)

func set_attribute_value(value: int) -> void:
	attribute_value = value
	if value_spinbox:
		value_spinbox.value = value





