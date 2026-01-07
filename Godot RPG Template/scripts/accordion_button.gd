extends Button
class_name AccordionButton

## Button that toggles visibility of a target node
## Used for creating collapsible accordion sections

@export var target_node_path: NodePath = NodePath()
@export var start_collapsed: bool = true

var target_node: Control = null
var base_text: String = ""

func _ready() -> void:
	pressed.connect(_on_pressed)
	
	# Store base text (without arrow prefix)
	base_text = text.replace("▼ ", "").replace("▶ ", "")
	
	# Find target node
	if target_node_path != NodePath():
		target_node = get_node(target_node_path)
	
	# Set initial state
	if target_node:
		target_node.visible = not start_collapsed
		_update_button_text()

func _on_pressed() -> void:
	if target_node:
		target_node.visible = not target_node.visible
		_update_button_text()

func _update_button_text() -> void:
	if target_node:
		if target_node.visible:
			text = "▼ " + base_text
		else:
			text = "▶ " + base_text

