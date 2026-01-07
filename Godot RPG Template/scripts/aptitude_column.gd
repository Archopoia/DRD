extends VBoxContainer
class_name AptitudeColumn

## Node representing a single Aptitude column
## Contains columns container (attributes + aptitude) and actions below

signal aptitude_level_changed(aptitude_id: AptitudeData.Aptitude, new_level: int)
signal main_attribute_changed(aptitude_id: AptitudeData.Aptitude, attribute_id: AttributeData.Attribute, new_value: int)

@export var aptitude_id: AptitudeData.Aptitude = AptitudeData.Aptitude.PUISSANCE
@export var calculated_level: int = 0

# Main attribute value (input by user)
var main_attribute_value: int = 0
var main_attribute_id: AttributeData.Attribute

# Calculated ATB values (from fractions of attributes across columns)
var atb3_value: int = 0  # 6/10th of main attribute (from this column)
var atb2_value: int = 0  # 3/10th of attribute from another column
var atb1_value: int = 0  # 1/10th of attribute from another column

# Reference to all aptitude columns to get cross-column attribute values
var all_aptitude_columns: Dictionary = {}  # Set by character sheet

@onready var columns_container: HBoxContainer = $ColumnsContainer
@onready var attributes_column: VBoxContainer = $ColumnsContainer/AttributesColumn
@onready var main_attribute_label: Label = $ColumnsContainer/AttributesColumn/MainAttributeLabel
@onready var main_attribute_spinbox: SpinBox = $ColumnsContainer/AttributesColumn/MainAttributeSpinBox
@onready var atb3_label: Label = $ColumnsContainer/AttributesColumn/ATBValuesContainer/ATB3Label
@onready var atb2_label: Label = $ColumnsContainer/AttributesColumn/ATBValuesContainer/ATB2Label
@onready var atb1_label: Label = $ColumnsContainer/AttributesColumn/ATBValuesContainer/ATB1Label
@onready var aptitude_column: VBoxContainer = $ColumnsContainer/AptitudeColumn
@onready var header_container: VBoxContainer = $ColumnsContainer/AptitudeColumn/HeaderContainer
@onready var name_label: Label = $ColumnsContainer/AptitudeColumn/HeaderContainer/NameLabel
@onready var level_label: Label = $ColumnsContainer/AptitudeColumn/HeaderContainer/LevelLabel
@onready var souffrance_node: SouffranceNode = $SouffranceNode
@onready var actions_container: VBoxContainer = $ActionsContainer

var action_nodes: Array[ActionNode] = []

func _ready() -> void:
	if name_label:
		name_label.text = AptitudeData.get_aptitude_name(aptitude_id)
	
	_setup_main_attribute()
	_setup_souffrance()
	_find_action_nodes()
	_set_action_ids()
	_calculate_atb_values()
	_calculate_level()
	_update_display()

func _setup_souffrance() -> void:
	if not souffrance_node:
		return
	
	# Get the main attribute for this aptitude
	var attributes: Array = AptitudeData.get_aptitude_attributes(aptitude_id)
	if attributes.size() != 3:
		return
	
	var main_attr: AttributeData.Attribute = attributes[0]
	
	# Find the Souffrance tied to this attribute
	var souffrance_id: SouffranceData.Souffrance = SouffranceData.Souffrance.BLESSURES
	for souff in SouffranceData.Souffrance.values():
		if SouffranceData.get_souffrance_attribute(souff) == main_attr:
			souffrance_id = souff
			break
	
	souffrance_node.souffrance_id = souffrance_id

func set_all_aptitude_columns(columns: Dictionary) -> void:
	all_aptitude_columns = columns
	# Recalculate when we get all columns
	_calculate_atb_values()
	_calculate_level()
	_update_display()

func _setup_main_attribute() -> void:
	# Get the main attribute (ATB+3, first in the list)
	var attributes: Array = AptitudeData.get_aptitude_attributes(aptitude_id)
	if attributes.size() != 3:
		return
	
	main_attribute_id = attributes[0]  # ATB+3 is the main attribute
	var main_attr_name: String = AttributeData.get_attribute_name(main_attribute_id)
	
	if main_attribute_label:
		main_attribute_label.text = main_attr_name.to_upper()
	
	# Set ATB labels with abbreviations (ATB+3, ATB+2, ATB+1)
	var atb3_abbrev: String = AttributeData.get_attribute_abbreviation(attributes[0])  # ATB+3 (main)
	var atb2_abbrev: String = AttributeData.get_attribute_abbreviation(attributes[1])  # ATB+2
	var atb1_abbrev: String = AttributeData.get_attribute_abbreviation(attributes[2])  # ATB+1
	
	if atb3_label:
		atb3_label.text = atb3_abbrev
	if atb2_label:
		atb2_label.text = atb2_abbrev
	if atb1_label:
		atb1_label.text = atb1_abbrev
	
	# Connect main attribute spinbox
	if main_attribute_spinbox:
		main_attribute_spinbox.value_changed.connect(_on_main_attribute_changed)

func _on_main_attribute_changed(new_value: float) -> void:
	main_attribute_value = int(new_value)
	main_attribute_changed.emit(aptitude_id, main_attribute_id, main_attribute_value)
	_calculate_atb_values()
	_calculate_level()
	_update_display()
	
	# Notify other columns that might depend on this attribute
	_notify_dependent_columns()

func _notify_dependent_columns() -> void:
	# Find which other columns use this attribute and notify them
	for other_apt_id in all_aptitude_columns.keys():
		if other_apt_id == aptitude_id:
			continue
		var other_column: AptitudeColumn = all_aptitude_columns[other_apt_id]
		if other_column:
			other_column._recalculate_from_other_columns()

func _recalculate_from_other_columns() -> void:
	_calculate_atb_values()
	_calculate_level()
	_update_display()

func _calculate_atb_values() -> void:
	# Get the 3 attributes for this aptitude
	var attributes: Array = AptitudeData.get_aptitude_attributes(aptitude_id)
	if attributes.size() != 3:
		return
	
	var atb2_attr: AttributeData.Attribute = attributes[1]  # ATB+2 (from another column)
	var atb3_attr: AttributeData.Attribute = attributes[2]  # ATB+1 (from another column)
	
	# ATB+3 = 6/10th of main attribute (from this column)
	atb3_value = int(main_attribute_value * 6.0 / 10.0)
	
	# ATB+2 = 3/10th of attribute from another column
	var atb2_source_value: int = _get_attribute_value_from_other_column(atb2_attr)
	atb2_value = int(atb2_source_value * 3.0 / 10.0)
	
	# ATB+1 = 1/10th of attribute from another column
	var atb1_source_value: int = _get_attribute_value_from_other_column(atb3_attr)
	atb1_value = int(atb1_source_value * 1.0 / 10.0)

func _get_attribute_value_from_other_column(attribute_id: AttributeData.Attribute) -> int:
	# Find which aptitude column has this attribute as its main attribute
	for other_apt_id in all_aptitude_columns.keys():
		if other_apt_id == aptitude_id:
			continue
		var other_column: AptitudeColumn = all_aptitude_columns[other_apt_id]
		if other_column and other_column.main_attribute_id == attribute_id:
			return other_column.main_attribute_value
	return 0

func _set_action_ids() -> void:
	# Get the 3 action IDs for this aptitude by finding all actions that belong to this aptitude
	var action_ids: Array = []
	for action_id in ActionData.Action.values():
		if ActionData.get_action_aptitude(action_id) == aptitude_id:
			action_ids.append(action_id)
	
	# Sort to ensure consistent order
	action_ids.sort()
	
	# Set action IDs on the 3 action nodes
	for i in range(min(action_nodes.size(), action_ids.size())):
		action_nodes[i].action_id = action_ids[i]

func _find_action_nodes() -> void:
	action_nodes.clear()
	if actions_container:
		for child in actions_container.get_children():
			if child is ActionNode:
				action_nodes.append(child)

func _calculate_level() -> void:
	# Calculate level as simple sum of ATB values
	var new_level: int = atb3_value + atb2_value + atb1_value
	
	if new_level != calculated_level:
		calculated_level = new_level
		aptitude_level_changed.emit(aptitude_id, calculated_level)
		_update_display()

func _update_display() -> void:
	# Update ATB value labels to show calculated values
	if atb3_label:
		var atb3_abbrev: String = atb3_label.text.split(" ")[0] if " " in atb3_label.text else atb3_label.text
		atb3_label.text = "%s %d" % [atb3_abbrev, atb3_value]
	if atb2_label:
		var atb2_abbrev: String = atb2_label.text.split(" ")[0] if " " in atb2_label.text else atb2_label.text
		atb2_label.text = "%s %d" % [atb2_abbrev, atb2_value]
	if atb1_label:
		var atb1_abbrev: String = atb1_label.text.split(" ")[0] if " " in atb1_label.text else atb1_label.text
		atb1_label.text = "%s %d" % [atb1_abbrev, atb1_value]
	
	if level_label:
		var sign_str: String = "+" if calculated_level >= 0 else ""
		level_label.text = "%s%d" % [sign_str, calculated_level]
