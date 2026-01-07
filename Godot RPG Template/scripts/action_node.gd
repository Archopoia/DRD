extends VBoxContainer
class_name ActionNode

## Node representing a single Action
## Contains 3 Competences

signal action_changed(action_id: ActionData.Action)

@export var action_id: ActionData.Action = ActionData.Action.FRAPPER:
	set(value):
		action_id = value
		if is_inside_tree():
			# Ensure competence nodes are found before setting IDs
			if competence_nodes.is_empty():
				_find_competence_nodes()
			_set_competence_ids()
			_update_action_display()

@onready var header_container: HBoxContainer = $HeaderContainer
@onready var name_button: Label = $HeaderContainer/NameButton
@onready var linked_attr_label: Label = $HeaderContainer/LinkedAttrLabel
@onready var potential_label: Label = $HeaderContainer/PotentialLabel
@onready var competences_separator: HSeparator = $CompetencesSeparator
@onready var competences_container: VBoxContainer = $CompetencesContainer

var competence_nodes: Array[CompetenceNode] = []
var competences_visible: bool = false

func _ready() -> void:
	if name_button:
		# Label needs gui_input signal for click handling
		if not name_button.gui_input.is_connected(_on_name_button_gui_input):
			name_button.gui_input.connect(_on_name_button_gui_input)
		# Ensure mouse filter allows clicks
		name_button.mouse_filter = Control.MOUSE_FILTER_STOP
		# text_overrun_behavior is already set to 3 (TEXT_OVERRUN_TRIM_ELLIPSIS) in the scene file
		# Ensure autowrap is off for proper truncation
		name_button.autowrap_mode = TextServer.AUTOWRAP_OFF
	
	if linked_attr_label:
		linked_attr_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	
	if potential_label:
		potential_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	
	# Set initial state - competences hidden by default
	if competences_container:
		competences_container.visible = competences_visible
	if competences_separator:
		competences_separator.visible = competences_visible
	
	# Competences will be created in the scene, not here
	# We'll find them in _ready
	_find_competence_nodes()
	# Wait a frame to ensure all nodes are ready before setting IDs
	await get_tree().process_frame
	_set_competence_ids()
	_connect_competence_signals()
	_update_action_display()
	_update_potential()

func _update_action_display() -> void:
	if name_button:
		var action_name: String = ActionData.get_action_name(action_id)
		if competences_visible:
			name_button.text = "▼ " + action_name
		else:
			name_button.text = "▶ " + action_name
	
	if linked_attr_label:
		var linked_attr: AttributeData.Attribute = ActionData.get_action_linked_attribute(action_id)
		var attr_name: String = AttributeData.get_attribute_abbreviation(linked_attr)
		linked_attr_label.text = "(%s)" % attr_name
	
	_update_potential()

func _update_potential() -> void:
	# Calculate potential as sum of all competence levels
	var total_potential: int = 0
	for competence_node in competence_nodes:
		if competence_node:
			total_potential += competence_node.get_competence_level()
	
	if potential_label:
		potential_label.text = "PT: %d" % total_potential

func _on_name_button_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mouse_event: InputEventMouseButton = event as InputEventMouseButton
		if mouse_event.button_index == MOUSE_BUTTON_LEFT and mouse_event.pressed:
			competences_visible = not competences_visible
			if competences_container:
				competences_container.visible = competences_visible
			if competences_separator:
				competences_separator.visible = competences_visible
			_update_name_button_text()

func _update_name_button_text() -> void:
	_update_action_display()

func _set_competence_ids() -> void:
	# Get the 3 competence IDs for this action by finding all competences that belong to this action
	var competence_ids: Array = []
	for comp_id in CompetenceData.Competence.values():
		if CompetenceData.get_competence_action(comp_id) == action_id:
			competence_ids.append(comp_id)
	
	# Sort to ensure consistent order
	competence_ids.sort()
	
	# Set competence IDs on the 3 competence nodes
	if competence_nodes.size() >= 3 and competence_ids.size() >= 3:
		for i in range(3):
			competence_nodes[i].competence_id = competence_ids[i]

func _find_competence_nodes() -> void:
	competence_nodes.clear()
	if competences_container:
		for child in competences_container.get_children():
			if child is CompetenceNode:
				competence_nodes.append(child)

func _connect_competence_signals() -> void:
	for competence_node in competence_nodes:
		if not competence_node.competence_changed.is_connected(_on_competence_changed):
			competence_node.competence_changed.connect(_on_competence_changed)

func _on_competence_changed(_competence_id: CompetenceData.Competence) -> void:
	_update_potential()
	action_changed.emit(action_id)

func get_total_potential_dice() -> int:
	# Potential is the sum of all competence levels
	var total: int = 0
	for competence_node in competence_nodes:
		if competence_node:
			total += competence_node.get_competence_level()
	return total
