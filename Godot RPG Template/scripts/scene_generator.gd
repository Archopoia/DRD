extends EditorScript
## Helper script to generate the complete character sheet scene
## Run this once to generate the full scene structure

func _run() -> void:
	var scene_content: String = generate_scene_content()
	var file_path: String = "res://scenes/character_sheet.tscn"
	var file: FileAccess = FileAccess.open(file_path, FileAccess.WRITE)
	if file:
		file.store_string(scene_content)
		file.close()
		print("Scene generated successfully!")
	else:
		print("Error: Could not open file for writing")

func generate_scene_content() -> String:
	var content: String = '[gd_scene format=3 uid="uid://c0hor8vg8qc5x"]\n\n'
	
	# Root CharacterSheet Control
	content += '[node name="CharacterSheet" type="Control"]\n'
	content += 'layout_mode = 3\n'
	content += 'anchors_preset = 15\n'
	content += 'anchor_right = 1.0\n'
	content += 'anchor_bottom = 1.0\n'
	content += 'script = ExtResource("1")\n\n'
	
	# ScrollContainer
	content += '[node name="ScrollContainer" type="ScrollContainer" parent="."]\n'
	content += 'layout_mode = 1\n'
	content += 'anchors_preset = 15\n'
	content += 'anchor_right = 1.0\n'
	content += 'anchor_bottom = 1.0\n\n'
	
	# MainContainer
	content += '[node name="MainContainer" type="VBoxContainer" parent="ScrollContainer"]\n'
	content += 'layout_mode = 2\n\n'
	
	# Title
	content += '[node name="TitleLabel" type="Label" parent="ScrollContainer/MainContainer"]\n'
	content += 'layout_mode = 2\n'
	content += 'text = "Feuille de Personnage - Des Recits Discordants"\n\n'
	
	content += '[node name="TitleSeparator" type="HSeparator" parent="ScrollContainer/MainContainer"]\n'
	content += 'layout_mode = 2\n\n'
	
	# Attributes Section
	content += '[node name="AttributesSectionLabel" type="Label" parent="ScrollContainer/MainContainer"]\n'
	content += 'layout_mode = 2\n'
	content += 'text = "ATTRIBUTS (Niveau)"\n\n'
	
	content += '[node name="AttributesSection" type="HBoxContainer" parent="ScrollContainer/MainContainer"]\n'
	content += 'layout_mode = 2\n'
	content += 'size_flags_horizontal = 3\n\n'
	
	# Generate 8 Attribute nodes
	var attributes: Array = [
		AttributeData.Attribute.FOR,
		AttributeData.Attribute.AGI,
		AttributeData.Attribute.DEX,
		AttributeData.Attribute.VIG,
		AttributeData.Attribute.EMP,
		AttributeData.Attribute.PER,
		AttributeData.Attribute.CRE,
		AttributeData.Attribute.VOL
	]
	
	for attr in attributes:
		var attr_name: String = AttributeData.get_attribute_abbreviation(attr)
		content += generate_attribute_node(attr_name, attr)
	
	# Aptitudes Section
	content += '[node name="AptitudesSectionLabel" type="Label" parent="ScrollContainer/MainContainer"]\n'
	content += 'layout_mode = 2\n'
	content += 'text = "APTITUDES (Niveau)"\n\n'
	
	content += '[node name="AptitudesSection" type="HBoxContainer" parent="ScrollContainer/MainContainer"]\n'
	content += 'layout_mode = 2\n'
	content += 'size_flags_horizontal = 3\n\n'
	
	# Generate 8 Aptitude columns
	var aptitudes: Array = [
		AptitudeData.Aptitude.PUISSANCE,
		AptitudeData.Aptitude.AISANCE,
		AptitudeData.Aptitude.PRECISION,
		AptitudeData.Aptitude.ATHLETISME,
		AptitudeData.Aptitude.CHARISME,
		AptitudeData.Aptitude.DETECTION,
		AptitudeData.Aptitude.REFLEXION,
		AptitudeData.Aptitude.DOMINATION
	]
	
	for apt in aptitudes:
		content += generate_aptitude_column(apt)
	
	# Experience System
	content += '[node name="ExperienceSystem" type="Control" parent="ScrollContainer/MainContainer"]\n'
	content += 'layout_mode = 2\n'
	content += 'size_flags_horizontal = 3\n\n'
	
	content += '[node name="FreeMarksLabel" type="Label" parent="ScrollContainer/MainContainer/ExperienceSystem"]\n'
	content += 'layout_mode = 2\n'
	content += 'text = "Marques Gratuites: 0"\n\n'
	
	# External resources (scripts)
	content += '\n[ext_resource type="Script" path="res://scripts/character_sheet.gd" id="1"]\n'
	
	return content

func generate_attribute_node(attr_name: String, attr_id: AttributeData.Attribute) -> String:
	var content: String = ''
	content += '[node name="Attribute%s" type="VBoxContainer" parent="ScrollContainer/MainContainer/AttributesSection"]\n' % attr_name
	content += 'layout_mode = 2\n'
	content += 'script = ExtResource("2")\n'
	content += 'attribute_id = %d\n' % attr_id
	content += 'attribute_value = 0\n\n'
	
	content += '[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AttributesSection/Attribute%s"]\n' % attr_name
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="ValueSpinBox" type="SpinBox" parent="ScrollContainer/MainContainer/AttributesSection/Attribute%s"]\n' % attr_name
	content += 'layout_mode = 2\n'
	content += 'min_value = -50.0\n'
	content += 'max_value = 50.0\n\n'
	
	return content

func generate_aptitude_column(apt_id: AptitudeData.Aptitude) -> String:
	var apt_name: String = AptitudeData.get_aptitude_name(apt_id).to_upper()
	var content: String = ''
	
	content += '[node name="Aptitude%s" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection"]\n' % apt_name
	content += 'layout_mode = 2\n'
	content += 'size_flags_horizontal = 3\n'
	content += 'script = ExtResource("3")\n'
	content += 'aptitude_id = %d\n\n' % apt_id
	
	# Header
	content += '[node name="HeaderContainer" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s"]\n' % apt_name
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/HeaderContainer"]\n' % apt_name
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="LevelLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/HeaderContainer"]\n' % apt_name
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="AttrContribLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/HeaderContainer"]\n' % apt_name
	content += 'layout_mode = 2\n\n'
	
	# Actions Container
	content += '[node name="ActionsContainer" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s"]\n' % apt_name
	content += 'layout_mode = 2\n\n'
	
	# Get 3 actions for this aptitude
	var actions: Array = get_actions_for_aptitude(apt_id)
	for action_id in actions:
		content += generate_action_node(apt_name, action_id)
	
	return content

func get_actions_for_aptitude(apt_id: AptitudeData.Aptitude) -> Array:
	var actions: Array = []
	for action in ActionData.Action.values():
		if ActionData.get_action_aptitude(action) == apt_id:
			actions.append(action)
	return actions

func generate_action_node(apt_name: String, action_id: ActionData.Action) -> String:
	var action_name: String = ActionData.get_action_name(action_id).to_upper()
	var content: String = ''
	
	content += '[node name="Action%s" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer"]\n' % [action_name, apt_name]
	content += 'layout_mode = 2\n'
	content += 'script = ExtResource("4")\n'
	content += 'action_id = %d\n\n' % action_id
	
	# Header
	content += '[node name="HeaderContainer" type="HBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s"]\n' % [apt_name, action_name]
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/HeaderContainer"]\n' % [apt_name, action_name]
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="LinkedAttrLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/HeaderContainer"]\n' % [apt_name, action_name]
	content += 'layout_mode = 2\n\n'
	
	# Competences Container
	content += '[node name="CompetencesContainer" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s"]\n' % [apt_name, action_name]
	content += 'layout_mode = 2\n\n'
	
	# Get 3 competences for this action
	var competences: Array = get_competences_for_action(action_id)
	for comp_id in competences:
		content += generate_competence_node(apt_name, action_name, comp_id)
	
	return content

func get_competences_for_action(action_id: ActionData.Action) -> Array:
	var competences: Array = []
	for comp in CompetenceData.Competence.values():
		if CompetenceData.get_competence_action(comp) == action_id:
			competences.append(comp)
	return competences

func generate_competence_node(apt_name: String, action_name: String, comp_id: CompetenceData.Competence) -> String:
	var comp_name: String = CompetenceData.get_competence_name(comp_id).replace("[", "").replace("]", "").to_upper().replace(" ", "_")
	var content: String = ''
	
	content += '[node name="Competence%s" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer"]\n' % [comp_name, apt_name, action_name]
	content += 'layout_mode = 2\n'
	content += 'script = ExtResource("5")\n'
	content += 'competence_id = %d\n' % comp_id
	content += 'dice_count = 0\n'
	content += 'potential_dice = 0\n'
	content += 'is_revealed = false\n'
	content += 'eternal_marks = 0\n\n'
	
	# Header
	content += '[node name="HeaderContainer" type="HBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]\n' % [apt_name, action_name, comp_name]
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/HeaderContainer"]\n' % [apt_name, action_name, comp_name]
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="DiceLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/HeaderContainer"]\n' % [apt_name, action_name, comp_name]
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="LevelLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/HeaderContainer"]\n' % [apt_name, action_name, comp_name]
	content += 'layout_mode = 2\n\n'
	
	content += '[node name="PotentialSpinBox" type="SpinBox" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/HeaderContainer"]\n' % [apt_name, action_name, comp_name]
	content += 'layout_mode = 2\n'
	content += 'min_value = 0.0\n'
	content += 'max_value = 5.0\n\n'
	
	# Marks Container
	content += '[node name="MarksContainer" type="HBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]\n' % [apt_name, action_name, comp_name]
	content += 'layout_mode = 2\n\n'
	
	# Generate 10 mark checkboxes
	for i in range(10):
		content += '[node name="Mark%d" type="CheckBox" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/MarksContainer"]\n' % [i, apt_name, action_name, comp_name]
		content += 'layout_mode = 2\n'
		content += 'script = ExtResource("6")\n'
		content += 'mark_index = %d\n' % i
		content += 'is_eternal = false\n\n'
	
	# Masteries Container
	content += '[node name="MasteriesContainer" type="VBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]\n' % [apt_name, action_name, comp_name]
	content += 'layout_mode = 2\n\n'
	
	# Generate masteries for this competence
	var masteries: Array = MasteryRegistry.get_masteries(comp_id)
	for i in range(masteries.size()):
		var mastery_name: String = masteries[i]
		var mastery_node_name: String = mastery_name.replace(" ", "_").replace("'", "").replace("(", "").replace(")", "").replace("/", "_").replace("&", "et").to_upper()
		content += '[node name="Mastery%s" type="HBoxContainer" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/MasteriesContainer"]\n' % [mastery_node_name, apt_name, action_name, comp_name]
		content += 'layout_mode = 2\n'
		content += 'script = ExtResource("7")\n'
		content += 'mastery_name = "%s"\n' % mastery_name
		content += 'mastery_dice = 0\n'
		content += 'max_dice = 5\n\n'
		
		content += '[node name="NameLabel" type="Label" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/MasteriesContainer/Mastery%s"]\n' % [apt_name, action_name, comp_name, mastery_node_name]
		content += 'layout_mode = 2\n\n'
		
		content += '[node name="DiceSpinBox" type="SpinBox" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s/MasteriesContainer/Mastery%s"]\n' % [apt_name, action_name, comp_name, mastery_node_name]
		content += 'layout_mode = 2\n'
		content += 'min_value = 0.0\n'
		content += 'max_value = 5.0\n\n'
	
	# Revealed checkbox
	content += '[node name="RevealedCheckBox" type="CheckBox" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]\n' % [apt_name, action_name, comp_name]
	content += 'layout_mode = 2\n'
	content += 'text = "Revelee"\n\n'
	
	# Realize button
	content += '[node name="RealizeButton" type="Button" parent="ScrollContainer/MainContainer/AptitudesSection/Aptitude%s/ActionsContainer/Action%s/CompetencesContainer/Competence%s"]\n' % [apt_name, action_name, comp_name]
	content += 'layout_mode = 2\n'
	content += 'text = "Realiser"\n'
	content += 'disabled = true\n\n'
	
	return content





