@tool
extends EditorScript
## EditorScript to build the complete character sheet scene
## This generates the .tscn file content with all nodes, including accordion buttons

func _run() -> void:
	var scene_content: String = build_complete_scene()
	var file_path: String = "res://scenes/character_sheet.tscn"
	var file: FileAccess = FileAccess.open(file_path, FileAccess.WRITE)
	if file:
		file.store_string(scene_content)
		file.close()
		print("Scene file generated successfully!")
		print("File saved to: ", file_path)
	else:
		push_error("Error opening file for writing: " + file_path)

func build_complete_scene() -> String:
	var content: PackedStringArray = []
	
	# Scene header
	content.append('[gd_scene load_steps=9 format=3 uid="uid://c0hor8vg8qc5x"]')
	content.append('')
	
	# External resources (must be before nodes)
	content.append('[ext_resource type="Script" path="res://scripts/character_sheet.gd" id="1_2ycnj"]')
	content.append('[ext_resource type="Script" path="res://scripts/attribute_node.gd" id="2_vvbld"]')
	content.append('[ext_resource type="Script" path="res://scripts/aptitude_column.gd" id="3_jqj34"]')
	content.append('[ext_resource type="Script" path="res://scripts/action_node.gd" id="4_7lrwm"]')
	content.append('[ext_resource type="Script" path="res://scripts/competence_node.gd" id="5_comp"]')
	content.append('[ext_resource type="Script" path="res://scripts/mark_checkbox.gd" id="6_mark"]')
	content.append('[ext_resource type="Script" path="res://scripts/mastery_node.gd" id="7_mast"]')
	content.append('[ext_resource type="Script" path="res://scripts/accordion_button.gd" id="8_accord"]')
	content.append('')
	
	# Root CharacterSheet
	content.append('[node name="CharacterSheet" type="Control"]')
	content.append('layout_mode = 3')
	content.append('anchors_preset = 15')
	content.append('anchor_right = 1.0')
	content.append('anchor_bottom = 1.0')
	content.append('grow_horizontal = 2')
	content.append('grow_vertical = 2')
	content.append('script = ExtResource("1_2ycnj")')
	content.append('')
	
	# ScrollContainer
	content.append('[node name="ScrollContainer" type="ScrollContainer" parent="."]')
	content.append('layout_mode = 1')
	content.append('anchors_preset = 15')
	content.append('anchor_right = 1.0')
	content.append('anchor_bottom = 1.0')
	content.append('grow_horizontal = 2')
	content.append('grow_vertical = 2')
	content.append('')
	
	# MainContainer
	content.append('[node name="MainContainer" type="VBoxContainer" parent="ScrollContainer"]')
	content.append('layout_mode = 2')
	content.append('')
	
	# Title
	content.append('[node name="TitleLabel" type="Label" parent="ScrollContainer/MainContainer"]')
	content.append('layout_mode = 2')
	content.append('text = "Feuille de Personnage - Des Recits Discordants"')
	content.append('')
	
	content.append('[node name="TitleSeparator" type="HSeparator" parent="ScrollContainer/MainContainer"]')
	content.append('layout_mode = 2')
	content.append('')
	
	# Attributes Section
	content.append('[node name="AttributesSectionLabel" type="Label" parent="ScrollContainer/MainContainer"]')
	content.append('layout_mode = 2')
	content.append('text = "ATTRIBUTS"')
	content.append('')
	
	content.append('[node name="AttributesSection" type="HBoxContainer" parent="ScrollContainer/MainContainer"]')
	content.append('layout_mode = 2')
	content.append('size_flags_horizontal = 3')
	content.append('')
	
	# Generate 8 attributes
	var attr_names = ["FOR", "AGI", "DEX", "VIG", "EMP", "PER", "CRE", "VOL"]
	var attr_full_names = ["Force", "Agilité", "Dextérité", "Vigueur", "Empathie", "Perception", "Créativité", "Volonté"]
	var attr_ids = [
		AttributeData.Attribute.FOR,
		AttributeData.Attribute.AGI,
		AttributeData.Attribute.DEX,
		AttributeData.Attribute.VIG,
		AttributeData.Attribute.EMP,
		AttributeData.Attribute.PER,
		AttributeData.Attribute.CRE,
		AttributeData.Attribute.VOL
	]
	
	for i in range(attr_names.size()):
		content.append_array(generate_attribute_node_string(attr_names[i], attr_full_names[i], attr_ids[i]))
	
	# Aptitudes Section Label
	content.append('[node name="AptitudesSectionLabel" type="Label" parent="ScrollContainer/MainContainer"]')
	content.append('layout_mode = 2')
	content.append('text = "APTITUDES"')
	content.append('')
	
	# Aptitudes Section
	content.append('[node name="AptitudesSection" type="HBoxContainer" parent="ScrollContainer/MainContainer"]')
	content.append('layout_mode = 2')
	content.append('size_flags_horizontal = 3')
	content.append('')
	
	# Generate all 8 Aptitude Columns
	var apt_names = ["PUISSANCE", "AISANCE", "PRECISION", "ATHLETISME", "CHARISME", "DETECTION", "REFLEXION", "DOMINATION"]
	var apt_ids = [
		AptitudeData.Aptitude.PUISSANCE,
		AptitudeData.Aptitude.AISANCE,
		AptitudeData.Aptitude.PRECISION,
		AptitudeData.Aptitude.ATHLETISME,
		AptitudeData.Aptitude.CHARISME,
		AptitudeData.Aptitude.DETECTION,
		AptitudeData.Aptitude.REFLEXION,
		AptitudeData.Aptitude.DOMINATION
	]
	
	for i in range(apt_names.size()):
		content.append_array(generate_aptitude_column_string(apt_names[i], apt_ids[i]))
	
	# Experience System
	content.append('[node name="ExperienceSystem" type="Control" parent="ScrollContainer/MainContainer"]')
	content.append('layout_mode = 2')
	content.append('size_flags_horizontal = 3')
	content.append('')
	
	content.append('[node name="FreeMarksLabel" type="Label" parent="ScrollContainer/MainContainer/ExperienceSystem"]')
	content.append('layout_mode = 1')
	content.append('anchors_preset = 15')
	content.append('anchor_right = 1.0')
	content.append('anchor_bottom = 1.0')
	content.append('grow_horizontal = 2')
	content.append('grow_vertical = 2')
	content.append('text = "Marques Gratuites: 0"')
	content.append('')
	
	return '\n'.join(content)

func generate_attribute_node_string(attr_name: String, attr_full_name: String, attr_id: AttributeData.Attribute) -> PackedStringArray:
	var lines: PackedStringArray = []
	lines.append('[node name="Attribute%s" type="VBoxContainer" parent="ScrollContainer/MainContainer/AttributesSection"]' % attr_name)
	lines.append('layout_mode = 2')
	lines.append('size_flags_horizontal = 3')
	lines.append('script = ExtResource("2_vvbld")')
	lines.append('attribute_id = %d' % attr_id)
	lines.append('attribute_value = 0')
	lines.append('')
	lines.append('[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AttributesSection/Attribute%s"]' % attr_name)
	lines.append('layout_mode = 2')
	lines.append('text = "%s (%s)"' % [attr_full_name, attr_name])
	lines.append('')
	lines.append('[node name="ValueSpinBox" type="SpinBox" parent="ScrollContainer/MainContainer/AttributesSection/Attribute%s"]' % attr_name)
	lines.append('layout_mode = 2')
	lines.append('min_value = -50.0')
	lines.append('max_value = 50.0')
	lines.append('')
	return lines

func generate_aptitude_column_string(apt_name: String, apt_id: AptitudeData.Aptitude) -> PackedStringArray:
	var lines: PackedStringArray = []
	var apt_display_name: String = AptitudeData.get_aptitude_name(apt_id)
	
	# Aptitude column
	lines.append('[node name="Aptitude%s" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection"]' % apt_name)
	lines.append('layout_mode = 2')
	lines.append('size_flags_horizontal = 3')
	lines.append('script = ExtResource("3_jqj34")')
	lines.append('aptitude_id = %d' % apt_id)
	lines.append('')
	
	# Header Container
	lines.append('[node name="HeaderContainer" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s"]' % apt_name)
	lines.append('layout_mode = 2')
	lines.append('')
	
	lines.append('[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/HeaderContainer"]' % apt_name)
	lines.append('layout_mode = 2')
	lines.append('text = "%s"' % apt_display_name)
	lines.append('')
	
	lines.append('[node name="LevelLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/HeaderContainer"]' % apt_name)
	lines.append('layout_mode = 2')
	lines.append('text = "Niveau: 0"')
	lines.append('')
	
	lines.append('[node name="AttrContribLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/HeaderContainer"]' % apt_name)
	lines.append('layout_mode = 2')
	lines.append('text = ""')
	lines.append('')
	
	# Actions Container
	lines.append('[node name="ActionsContainer" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s"]' % apt_name)
	lines.append('layout_mode = 2')
	lines.append('')
	
	# Get actions for this aptitude
	var actions: Array = []
	for action in ActionData.Action.values():
		if ActionData.get_action_aptitude(action) == apt_id:
			actions.append(action)
	
	# Generate 3 action nodes
	for action_id in actions:
		lines.append_array(generate_action_node_string(apt_name, action_id))
	
	return lines

func generate_action_node_string(apt_name: String, action_id: ActionData.Action) -> PackedStringArray:
	var lines: PackedStringArray = []
	var action_name: String = ActionData.get_action_name(action_id)
	var action_node_name: String = action_name.to_upper().replace(" ", "_").replace("É", "E").replace("È", "E").replace("Ê", "E")
	var linked_attr: AttributeData.Attribute = ActionData.get_action_linked_attribute(action_id)
	var linked_attr_abbrev: String = AttributeData.get_attribute_abbreviation(linked_attr)
	
	# Action node
	lines.append('[node name="Action%s" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer"]' % [action_node_name, apt_name])
	lines.append('layout_mode = 2')
	lines.append('script = ExtResource("4_7lrwm")')
	lines.append('action_id = %d' % action_id)
	lines.append('')
	
	# Action Header
	lines.append('[node name="HeaderContainer" type="HBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s"]' % [apt_name, action_node_name])
	lines.append('layout_mode = 2')
	lines.append('')
	
	lines.append('[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/HeaderContainer"]' % [apt_name, action_node_name])
	lines.append('layout_mode = 2')
	lines.append('text = "%s"' % action_name)
	lines.append('')
	
	lines.append('[node name="LinkedAttrLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/HeaderContainer"]' % [apt_name, action_node_name])
	lines.append('layout_mode = 2')
	lines.append('text = "(%s)"' % linked_attr_abbrev)
	lines.append('')
	
	# Competences Accordion Button
	lines.append('[node name="CompetencesAccordionButton" type="Button" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s"]' % [apt_name, action_node_name])
	lines.append('layout_mode = 2')
	lines.append('script = ExtResource("8_accord")')
	lines.append('target_node_path = NodePath("../CompetencesContainer")')
	lines.append('start_collapsed = true')
	lines.append('text = "▶ Compétences"')
	lines.append('')
	
	# Competences Container (hidden by default)
	lines.append('[node name="CompetencesContainer" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s"]' % [apt_name, action_node_name])
	lines.append('layout_mode = 2')
	lines.append('visible = false')
	lines.append('')
	
	# Get competences for this action
	var competences: Array = []
	for comp in CompetenceData.Competence.values():
		if CompetenceData.get_competence_action(comp) == action_id:
			competences.append(comp)
	
	# Generate 3 competence nodes
	for comp_id in competences:
		lines.append_array(generate_competence_node_string(apt_name, action_node_name, comp_id))
	
	return lines

func generate_competence_node_string(apt_name: String, action_name: String, comp_id: CompetenceData.Competence) -> PackedStringArray:
	var lines: PackedStringArray = []
	var comp_name: String = CompetenceData.get_competence_name(comp_id)
	var comp_node_name: String = sanitize_node_name(comp_name)
	
	# Competence node
	lines.append('[node name="Competence%s" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer"]' % [comp_node_name, apt_name, action_name])
	lines.append('layout_mode = 2')
	lines.append('script = ExtResource("5_comp")')
	lines.append('competence_id = %d' % comp_id)
	lines.append('dice_count = 0')
	lines.append('potential_dice = 0')
	lines.append('is_revealed = false')
	lines.append('eternal_marks = 0')
	lines.append('')
	
	# Competence Header
	lines.append('[node name="HeaderContainer" type="HBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('')
	
	lines.append('[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/HeaderContainer"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('text = "%s"' % comp_name)
	lines.append('')
	
	lines.append('[node name="DiceLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/HeaderContainer"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('text = "Dés: 0"')
	lines.append('')
	
	lines.append('[node name="LevelLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/HeaderContainer"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('text = "Niv: 0"')
	lines.append('')
	
	lines.append('[node name="PotentialSpinBox" type="SpinBox" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/HeaderContainer"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('min_value = 0.0')
	lines.append('max_value = 5.0')
	lines.append('')
	
	# Marks Container - 10 checkboxes
	lines.append('[node name="MarksContainer" type="HBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('')
	
	for mark_idx in range(10):
		lines.append('[node name="Mark%d" type="CheckBox" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/MarksContainer"]' % [mark_idx, apt_name, action_name, comp_node_name])
		lines.append('layout_mode = 2')
		lines.append('script = ExtResource("6_mark")')
		lines.append('mark_index = %d' % mark_idx)
		lines.append('is_eternal = false')
		lines.append('')
	
	# Masteries Accordion Button
	lines.append('[node name="MasteriesAccordionButton" type="Button" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('script = ExtResource("8_accord")')
	lines.append('target_node_path = NodePath("../MasteriesContainer")')
	lines.append('start_collapsed = true')
	lines.append('text = "▶ Maîtrises"')
	lines.append('')
	
	# Masteries Container (hidden by default)
	lines.append('[node name="MasteriesContainer" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('visible = false')
	lines.append('')
	
	# Generate masteries
	var masteries: Array = MasteryRegistry.get_masteries(comp_id)
	for i in range(masteries.size()):
		var mastery_name: String = masteries[i]
		var mastery_node_name: String = sanitize_node_name(mastery_name)
		lines.append('[node name="Mastery%s" type="HBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/MasteriesContainer"]' % [mastery_node_name, apt_name, action_name, comp_node_name])
		lines.append('layout_mode = 2')
		lines.append('script = ExtResource("7_mast")')
		lines.append('mastery_name = "%s"' % mastery_name.replace('"', '\\"'))
		lines.append('mastery_dice = 0')
		lines.append('max_dice = 5')
		lines.append('')
		lines.append('[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/MasteriesContainer/Mastery%s"]' % [apt_name, action_name, comp_node_name, mastery_node_name])
		lines.append('layout_mode = 2')
		lines.append('text = "%s"' % mastery_name)
		lines.append('')
		lines.append('[node name="DiceSpinBox" type="SpinBox" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/MasteriesContainer/Mastery%s"]' % [apt_name, action_name, comp_node_name, mastery_node_name])
		lines.append('layout_mode = 2')
		lines.append('min_value = 0.0')
		lines.append('max_value = 5.0')
		lines.append('')
	
	# Revealed checkbox
	lines.append('[node name="RevealedCheckBox" type="CheckBox" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('text = "Révelée"')
	lines.append('')
	
	# Realize button
	lines.append('[node name="RealizeButton" type="Button" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]' % [apt_name, action_name, comp_node_name])
	lines.append('layout_mode = 2')
	lines.append('text = "Réaliser"')
	lines.append('disabled = true')
	lines.append('')
	
	return lines

func sanitize_node_name(name: String) -> String:
	return name.to_upper().replace(" ", "_").replace("'", "").replace("(", "").replace(")", "").replace("/", "_").replace("&", "ET").replace("É", "E").replace("é", "E").replace("è", "E").replace("ê", "E").replace("à", "A").replace("ô", "O").replace("ç", "C").replace("-", "_").replace(",", "").replace(".", "").replace("[", "").replace("]", "")
