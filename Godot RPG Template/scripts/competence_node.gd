extends VBoxContainer
class_name CompetenceNode

## Node representing a single Competence
## Handles dice count, level, marks, masteries, revelation, and realization

signal competence_changed(competence_id: CompetenceData.Competence)
signal competence_realized(competence_id: CompetenceData.Competence)
signal mark_changed(competence_id: CompetenceData.Competence, mark_index: int, is_eternal: bool)

@export var competence_id: CompetenceData.Competence = CompetenceData.Competence.ARME:
	set(value):
		competence_id = value
		if is_inside_tree():
			_update_reveal_checkbox_text()
			if name_label:
				name_label.text = CompetenceData.get_competence_name(competence_id)
			# Update masteries when competence changes
			_setup_masteries_ui()
@export var dice_count: int = 0  # Total dice (Degrés)
@export var is_revealed: bool = false
@export var eternal_marks: int = 0  # Number of eternal marks (Symbolic, Educated, Passionate)

var marks: Array[bool] = []  # 10 marks, true = filled
var eternal_mark_indices: Array[int] = []  # Which mark indices are eternal

@onready var reveal_checkbox: CheckBox = $RevealCheckBox
@onready var competence_content: VBoxContainer = $CompetenceContent
@onready var header_container: HBoxContainer = $CompetenceContent/HeaderContainer
@onready var name_label: Label = $CompetenceContent/HeaderContainer/NameLabel
@onready var dice_label: Label = $CompetenceContent/HeaderContainer/DiceLabel
@onready var level_label: Label = $CompetenceContent/HeaderContainer/LevelLabel
@onready var marks_progress_bar: ProgressBar = $CompetenceContent/MarksProgressBar
@onready var masteries_buttons_container: HBoxContainer = $CompetenceContent/MasteriesButtonsContainer
@onready var masteries_accordion_button: Button = $CompetenceContent/MasteriesButtonsContainer/MasteriesAccordionButton
@onready var masteries_container: VBoxContainer = $CompetenceContent/MasteriesContainer
@onready var add_mastery_button: Button = $CompetenceContent/MasteriesButtonsContainer/AddMasteryButton
@onready var realize_button: Button = $CompetenceContent/RealizeButton

var masteries_visible: bool = false

var added_masteries: Array[String] = []  # Track which masteries have been added

func _ready() -> void:
	# Initialize marks array
	marks.resize(10)
	for i in range(10):
		marks[i] = false
	
	# Set up UI
	if name_label:
		name_label.text = CompetenceData.get_competence_name(competence_id)
	
	if reveal_checkbox:
		reveal_checkbox.button_pressed = is_revealed
		reveal_checkbox.toggled.connect(_on_reveal_toggled)
		_update_reveal_checkbox_text()
	
	if realize_button:
		realize_button.pressed.connect(_on_realize_pressed)
		realize_button.visible = _is_eprouvee()
	
	if marks_progress_bar:
		marks_progress_bar.min_value = 0
		marks_progress_bar.max_value = 100
		marks_progress_bar.value = 0
	
	# Set initial visibility based on reveal state
	if reveal_checkbox:
		reveal_checkbox.visible = not is_revealed
	if competence_content:
		competence_content.visible = is_revealed
	
	_setup_masteries_ui()
	_update_display()
	_update_masteries_ui()
	
	# Connect buttons
	if add_mastery_button:
		add_mastery_button.pressed.connect(_on_add_mastery_button_pressed)
	if masteries_accordion_button:
		masteries_accordion_button.pressed.connect(_on_masteries_accordion_pressed)

func _update_reveal_checkbox_text() -> void:
	if reveal_checkbox:
		var competence_name: String = CompetenceData.get_competence_name(competence_id)
		reveal_checkbox.text = "Révéler %s?" % competence_name

func _setup_masteries_ui() -> void:
	if not masteries_container:
		return
	
	# Find existing masteries and track them
	added_masteries.clear()
	for child in masteries_container.get_children():
		if child is MasteryNode:
			added_masteries.append(child.mastery_name)
			child.set_max_dice(get_competence_level())
			# Connect signal if not already connected
			if not child.mastery_changed.is_connected(_on_mastery_changed):
				child.mastery_changed.connect(_on_mastery_changed)

func add_mastery(mastery_name: String) -> bool:
	# Check if mastery is already added
	if mastery_name in added_masteries:
		return false
	
	# Verify this mastery is valid for this competence
	var available_masteries: Array = MasteryRegistry.get_masteries(competence_id)
	if not mastery_name in available_masteries:
		return false
	
	# Create the mastery node
	var mastery_node: MasteryNode = MasteryNode.new()
	mastery_node.mastery_name = mastery_name
	mastery_node.max_dice = get_competence_level()
	mastery_node.mastery_changed.connect(_on_mastery_changed)
	
	# Create UI elements for the mastery node
	var mastery_name_label: Label = Label.new()
	mastery_name_label.text = mastery_name
	mastery_name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	mastery_name_label.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	mastery_name_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	mastery_name_label.add_theme_font_size_override("font_size", 8)
	mastery_node.add_child(mastery_name_label)
	
	var mastery_dice_spinbox: SpinBox = SpinBox.new()
	mastery_dice_spinbox.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	mastery_dice_spinbox.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	mastery_dice_spinbox.custom_minimum_size = Vector2(50, 18)
	mastery_dice_spinbox.min_value = 0
	mastery_dice_spinbox.max_value = get_competence_level()
	mastery_dice_spinbox.value = 0
	mastery_node.add_child(mastery_dice_spinbox)
	
	# Set spacing and size flags for the mastery node container
	mastery_node.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	mastery_node.add_theme_constant_override("separation", 4)
	
	# Add the mastery node to the container
	masteries_container.add_child(mastery_node)
	
	added_masteries.append(mastery_name)
	return true

func remove_mastery(mastery_name: String) -> void:
	for child in masteries_container.get_children():
		if child is MasteryNode and child.mastery_name == mastery_name:
			added_masteries.erase(mastery_name)
			child.queue_free()
			break
	# Update UI after removal
	_update_masteries_ui()

func _on_add_mastery_button_pressed() -> void:
	# Always show popup to add a mastery
	_show_add_mastery_popup()

func _on_masteries_accordion_pressed() -> void:
	# Toggle masteries visibility
	masteries_visible = not masteries_visible
	if masteries_container:
		masteries_container.visible = masteries_visible
	_update_masteries_accordion_button_text()

func _get_mastery_count() -> int:
	var count: int = 0
	if masteries_container:
		for child in masteries_container.get_children():
			if child is MasteryNode:
				count += 1
	return count

func _show_add_mastery_popup() -> void:
	# Get available masteries for this competence
	var available_masteries: Array = MasteryRegistry.get_masteries(competence_id)
	
	# Filter out already added masteries
	var unadded_masteries: Array = []
	for mastery_name in available_masteries:
		if not mastery_name in added_masteries:
			unadded_masteries.append(mastery_name)
	
	if unadded_masteries.is_empty():
		# No more masteries to add
		return
	
	# Create a popup menu to select a mastery
	var popup: PopupMenu = PopupMenu.new()
	popup.name = "MasterySelectionPopup"
	
	# Add each unadded mastery as a menu item
	for i in range(unadded_masteries.size()):
		popup.add_item(unadded_masteries[i], i)
	
	# Connect the popup signal
	popup.id_pressed.connect(func(id: int): _on_mastery_selected(unadded_masteries[id]))
	
	# Add popup to scene tree temporarily
	add_child(popup)
	
	# Show popup at mouse position or button position
	var button_global_pos: Vector2 = add_mastery_button.global_position
	var button_size: Vector2 = add_mastery_button.size
	popup.position = button_global_pos + Vector2(0, button_size.y)
	popup.popup()
	
	# Clean up popup when it closes
	popup.popup_hide.connect(func(): popup.queue_free())

func _update_masteries_accordion_button_text() -> void:
	if not masteries_accordion_button:
		return
	
	var mastery_count: int = _get_mastery_count()
	if mastery_count > 0:
		if masteries_visible:
			masteries_accordion_button.text = "▼ Maîtrises (%d)" % mastery_count
		else:
			masteries_accordion_button.text = "▶ Maîtrises (%d)" % mastery_count
	else:
		masteries_accordion_button.text = "▶ Maîtrises"

func _update_masteries_ui() -> void:
	var mastery_count: int = _get_mastery_count()
	
	# Enable/disable accordion button based on mastery count
	if masteries_accordion_button:
		masteries_accordion_button.disabled = mastery_count == 0
	
	# Update accordion button text
	_update_masteries_accordion_button_text()
	
	# Update container visibility
	if masteries_container:
		if mastery_count >= 1:
			# Respect accordion state when enabled
			masteries_container.visible = masteries_visible
		else:
			masteries_container.visible = false

func _on_mastery_selected(mastery_name: String) -> void:
	if add_mastery(mastery_name):
		# If this is the first mastery, show it by default
		if _get_mastery_count() == 1:
			masteries_visible = true
		# Update UI after adding
		_update_masteries_ui()

func _update_display() -> void:
	# Update dice and level display
	if dice_label:
		dice_label.text = "%d Dés" % dice_count
	
	if level_label:
		level_label.text = "N%d" % get_competence_level()
	
	# Update progress bar (0-100 based on marks filled)
	if marks_progress_bar:
		var total_marks: int = get_total_marks()
		marks_progress_bar.value = (total_marks * 100.0) / 10.0
	
	# Update realize button visibility (only show when progress bar is full)
	if realize_button:
		realize_button.visible = _is_eprouvee()
	
	# Update realize separator visibility (same as button)
	var realize_separator: HSeparator = $CompetenceContent/RealizeSeparator
	if realize_separator:
		realize_separator.visible = _is_eprouvee()
	
	# Update masteries max dice
	for child in masteries_container.get_children():
		if child is MasteryNode:
			child.set_max_dice(get_competence_level())

func get_competence_level() -> int:
	# N0 = 0 Dé, N1 = 1-2 Dés, N2 = 3-5 Dés, N3 = 6-9 Dés, N4 = 10-14 Dés, N5 = 15+ Dés
	if dice_count == 0:
		return 0
	elif dice_count <= 2:
		return 1
	elif dice_count <= 5:
		return 2
	elif dice_count <= 9:
		return 3
	elif dice_count <= 14:
		return 4
	else:
		return 5

func get_total_marks() -> int:
	var count: int = 0
	for mark in marks:
		if mark:
			count += 1
	return count

func _is_eprouvee() -> bool:
	# Éprouvée = 10 marks total (including eternal marks)
	return get_total_marks() >= 10

func _on_reveal_toggled(pressed: bool) -> void:
	is_revealed = pressed
	if reveal_checkbox:
		reveal_checkbox.visible = not is_revealed
	if competence_content:
		competence_content.visible = is_revealed
	competence_changed.emit(competence_id)

func _on_mark_toggled(_mark_index: int, _is_checked: bool, _is_eternal_mark: bool) -> void:
	# This function is kept for compatibility but marks are now managed differently
	# Marks can be added/removed via add_mark() function
	pass

func _on_mastery_changed(_mastery_name: String, _dice_count: int) -> void:
	competence_changed.emit(competence_id)

func _on_realize_pressed() -> void:
	if not _is_eprouvee():
		return
	
	# Realization: +1 Dé, clear marks (except eternal), gain free marks = current level
	dice_count += 1
	
	# Clear non-eternal marks
	for i in range(10):
		if not eternal_mark_indices.has(i):
			marks[i] = false
	
	# Update display (which updates progress bar)
	_update_display()
	
	# Emit signal for free marks
	competence_realized.emit(competence_id)

func add_mark(is_eternal: bool = false) -> void:
	# Find first empty mark slot
	for i in range(10):
		if not marks[i]:
			marks[i] = true
			if is_eternal:
				eternal_mark_indices.append(i)
				eternal_marks += 1
			_update_display()
			mark_changed.emit(competence_id, i, is_eternal)
			return

func set_dice_count(value: int) -> void:
	dice_count = value
	_update_display()
	competence_changed.emit(competence_id)


func get_total_mastery_dice() -> int:
	## Returns the sum of all `mastery_dice` values on child MasteryNode instances.
	var total: int = 0
	if not masteries_container:
		return total
	for child in masteries_container.get_children():
		if child is MasteryNode:
			total += child.mastery_dice
	return total
