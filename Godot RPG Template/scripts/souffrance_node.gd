extends VBoxContainer
class_name SouffranceNode

## Node representing a single Souffrance (Suffering)
## Handles dice count, level, marks, and realization
## Similar to CompetenceNode but without masteries and always revealed

signal souffrance_changed(souffrance_id: SouffranceData.Souffrance)
signal souffrance_realized(souffrance_id: SouffranceData.Souffrance)
signal mark_changed(souffrance_id: SouffranceData.Souffrance, mark_index: int, is_eternal: bool)

@export var souffrance_id: SouffranceData.Souffrance = SouffranceData.Souffrance.BLESSURES:
	set(value):
		souffrance_id = value
		if is_inside_tree():
			if name_label:
				name_label.text = SouffranceData.get_souffrance_name(souffrance_id)

@export var dice_count: int = 0  # Total dice (Dés de Souffrance - DS)
@export var eternal_marks: int = 0  # Number of eternal marks

var marks: Array[bool] = []  # 10 marks, true = filled
var eternal_mark_indices: Array[int] = []  # Which mark indices are eternal

@onready var header_container: HBoxContainer = $HeaderContainer
@onready var name_label: Label = $HeaderContainer/NameLabel
@onready var dice_label: Label = $HeaderContainer/DiceLabel
@onready var level_label: Label = $HeaderContainer/LevelLabel
@onready var marks_progress_bar: ProgressBar = $MarksProgressBar
@onready var realize_button: Button = $RealizeButton

func _ready() -> void:
	# Initialize marks array
	marks.resize(10)
	for i in range(10):
		marks[i] = false
	
	# Set up UI
	if name_label:
		name_label.text = SouffranceData.get_souffrance_name(souffrance_id)
	
	if realize_button:
		realize_button.pressed.connect(_on_realize_pressed)
		realize_button.visible = _is_eprouvee()
	
	if marks_progress_bar:
		marks_progress_bar.min_value = 0
		marks_progress_bar.max_value = 100
		marks_progress_bar.value = 0
	
	_update_display()

func _update_display() -> void:
	# Update dice and level display
	if dice_label:
		dice_label.text = "%d Dés" % dice_count
	
	if level_label:
		level_label.text = "N%d" % get_souffrance_level()
	
	# Update progress bar (0-100 based on marks filled)
	if marks_progress_bar:
		var total_marks: int = get_total_marks()
		marks_progress_bar.value = (total_marks * 100.0) / 10.0
	
	# Update realize button visibility (only show when progress bar is full)
	if realize_button:
		realize_button.visible = _is_eprouvee()
	
	# Update realize separator visibility (same as button)
	var realize_separator: HSeparator = $RealizeSeparator
	if realize_separator:
		realize_separator.visible = _is_eprouvee()

func get_souffrance_level() -> int:
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
	souffrance_realized.emit(souffrance_id)

func add_mark(is_eternal: bool = false) -> void:
	# Find first empty mark slot
	for i in range(10):
		if not marks[i]:
			marks[i] = true
			if is_eternal:
				eternal_mark_indices.append(i)
				eternal_marks += 1
			_update_display()
			mark_changed.emit(souffrance_id, i, is_eternal)
			return

func set_dice_count(value: int) -> void:
	dice_count = value
	_update_display()
	souffrance_changed.emit(souffrance_id)

