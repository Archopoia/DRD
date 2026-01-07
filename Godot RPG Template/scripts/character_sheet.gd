extends Control
class_name CharacterSheet

## Main character sheet controller
## Manages all attributes, aptitudes, actions, competences, and the experience system

signal free_marks_changed(count: int)

@export var free_marks: int = 0

var aptitude_columns: Dictionary = {}  # Maps Aptitude enum to AptitudeColumn
var attribute_nodes: Dictionary = {}   # Maps Attribute enum to AttributeNode

@onready var attributes_section: HBoxContainer = get_node_or_null("ScrollContainer/MainContainer/AttributesSection")

@onready var aptitudes_section: HBoxContainer = $ScrollContainer/MainContainer/AptitudesSection
@onready var free_marks_label: Label = $ScrollContainer/MainContainer/ExperienceSystem/FreeMarksLabel

func _ready() -> void:
	_find_all_nodes()
	_connect_all_signals()
	_update_free_marks_display()

func _find_all_nodes() -> void:
	# Find all attribute nodes
	attribute_nodes.clear()
	if attributes_section:
		for child in attributes_section.get_children():
			if child is AttributeNode:
				var attr_id: AttributeData.Attribute = child.attribute_id
				attribute_nodes[attr_id] = child
	
	# Find all aptitude columns
	aptitude_columns.clear()
	if aptitudes_section:
		for child in aptitudes_section.get_children():
			if child is AptitudeColumn:
				var apt_id: AptitudeData.Aptitude = child.aptitude_id
				aptitude_columns[apt_id] = child
	
	# Pass all columns to each column for cross-referencing
	for apt_column in aptitude_columns.values():
		apt_column.set_all_aptitude_columns(aptitude_columns)

func _connect_all_signals() -> void:
	# Connect competence realization signals
	for apt_column in aptitude_columns.values():
		_find_and_connect_competence_signals(apt_column)

func _find_and_connect_competence_signals(parent: Node) -> void:
	for child in parent.get_children():
		if child is CompetenceNode:
			if not child.competence_realized.is_connected(_on_competence_realized):
				child.competence_realized.connect(_on_competence_realized)
		else:
			_find_and_connect_competence_signals(child)

func _on_competence_realized(competence_id: CompetenceData.Competence) -> void:
	# Find the competence node
	var competence_node: CompetenceNode = _find_competence_node(competence_id)
	if not competence_node:
		return
	
	# Gain free marks = current level
	var level: int = competence_node.get_competence_level()
	free_marks += level
	
	# Emit signal
	free_marks_changed.emit(free_marks)
	_update_free_marks_display()

func _find_competence_node(comp_id: CompetenceData.Competence) -> CompetenceNode:
	for apt_column in aptitude_columns.values():
		var node: CompetenceNode = _search_for_competence(apt_column, comp_id)
		if node:
			return node
	return null

func _search_for_competence(parent: Node, comp_id: CompetenceData.Competence) -> CompetenceNode:
	for child in parent.get_children():
		if child is CompetenceNode and child.competence_id == comp_id:
			return child
		var result: CompetenceNode = _search_for_competence(child, comp_id)
		if result:
			return result
	return null

func _update_free_marks_display() -> void:
	if free_marks_label:
		free_marks_label.text = "Marques Gratuites: %d" % free_marks

func spend_free_marks(amount: int) -> bool:
	if free_marks >= amount:
		free_marks -= amount
		free_marks_changed.emit(free_marks)
		_update_free_marks_display()
		return true
	return false


## RUNTIME STATS BRIDGE ---------------------------------------------------------------------

func build_runtime_stats() -> CharacterStats:
	## Builds a `CharacterStats` snapshot from the current sheet values.
	## This does not mutate the sheet; it is safe to call at any time.
	var attribute_values: Dictionary = {}
	for attr in AttributeData.Attribute.values():
		var node: AttributeNode = attribute_nodes.get(attr)
		if node:
			attribute_values[attr] = node.attribute_value
	
	var aptitude_levels: Dictionary = {}
	for apt in aptitude_columns.keys():
		var col: AptitudeColumn = aptitude_columns[apt]
		if col:
			aptitude_levels[apt] = col.calculated_level
	
	var competence_levels: Dictionary = {}
	var mastery_dice: Dictionary = {}
	for apt_column in aptitude_columns.values():
		_collect_competence_data(apt_column, competence_levels, mastery_dice)
	
	return StatMathMapping.compute_stats(
		attribute_values,
		aptitude_levels,
		competence_levels,
		mastery_dice
	)


func _collect_competence_data(
	parent: Node,
	competence_levels: Dictionary,
	mastery_dice: Dictionary
) -> void:
	for child in parent.get_children():
		if child is CompetenceNode:
			var comp_node: CompetenceNode = child
			var comp_id: CompetenceData.Competence = comp_node.competence_id
			competence_levels[comp_id] = comp_node.get_competence_level()
			
			# Aggregate mastery dice per competence (keyed by enum index as String).
			var mastery_key := str(int(comp_id))
			var total_mastery: int = comp_node.get_total_mastery_dice()
			mastery_dice[mastery_key] = mastery_dice.get(mastery_key, 0) + total_mastery
		else:
			_collect_competence_data(child, competence_levels, mastery_dice)





