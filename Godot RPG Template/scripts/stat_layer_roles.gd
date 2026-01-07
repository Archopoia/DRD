extends Resource
class_name StatLayerRoles

## Qualitative mapping between your rules layers (Attributes, Aptitudes, Actions,
## Compétences, Maîtrises) and the runtime gameplay variables in `CharacterStats`.
##
## This file does NOT apply numbers or formulas; it only answers:
## - “Which gameplay subsystems does this layer care about?”
## - “Which concrete `CharacterStats` fields can this layer influence?”
##
## Numeric scaling and stacking rules live in `stat_math_mapping.gd`.

## Helper type aliases (for clarity when reading dictionaries).
const KEY_PRIMARY_SUBSYSTEMS := "primary_subsystems"
const KEY_SECONDARY_SUBSYSTEMS := "secondary_subsystems"
const KEY_PRIMARY_STATS := "primary_stats"
const KEY_SECONDARY_STATS := "secondary_stats"
const KEY_DESCRIPTION := "description"
const KEY_TAGS := "tags"


## 1) ATTRIBUTE → GAMEPLAY ROLES ------------------------------------------------------------
##
## Attributes are broad physical / mental baselines. They:
## - Set starting ranges for core stats (HP, stamina, speed, resistances, etc.).
## - Bias how fast an actor improves in related Aptitudes and Compétences.

const ATTRIBUTE_ROLES: Dictionary = {
	AttributeData.Attribute.FOR: {
		KEY_DESCRIPTION: "Force physique, impact, masses déplacées.",
		KEY_PRIMARY_SUBSYSTEMS: ["melee", "survival"],
		KEY_SECONDARY_SUBSYSTEMS: ["movement", "domination"],
		KEY_PRIMARY_STATS: [
			"max_health",
			"melee_damage_mult",
			"stagger_power_mult",
			"carry_weight_max"
		],
		KEY_SECONDARY_STATS: [
			"block_effectiveness_mult",
			"fall_lethal_height",
			"fall_safe_height"
		]
	},
	AttributeData.Attribute.AGI: {
		KEY_DESCRIPTION: "Vivacité générale, changements de direction, initiatives.",
		KEY_PRIMARY_SUBSYSTEMS: ["movement", "melee"],
		KEY_SECONDARY_SUBSYSTEMS: ["stealth"],
		KEY_PRIMARY_STATS: [
			"run_speed",
			"sprint_speed",
			"acceleration",
			"melee_attack_speed_mult"
		],
		KEY_SECONDARY_STATS: [
			"air_control",
			"visibility_mult",
			"noise_radius_mult",
			"sprint_stamina_cost_mult"
		]
	},
	AttributeData.Attribute.DEX: {
		KEY_DESCRIPTION: "Précision gestuelle, maniement d’outils et d’armes fines.",
		KEY_PRIMARY_SUBSYSTEMS: ["ranged", "interaction"],
		KEY_SECONDARY_SUBSYSTEMS: ["stealth"],
		KEY_PRIMARY_STATS: [
			"aim_spread_mult",
			"aim_sway_mult",
			"reload_speed_mult",
			"lockpicking_speed_mult",
			"lockpicking_stability_mult"
		],
		KEY_SECONDARY_STATS: [
			"melee_recovery_time_mult",
			"trap_disarm_speed_mult",
			"generic_interaction_speed_mult"
		]
	},
	AttributeData.Attribute.VIG: {
		KEY_DESCRIPTION: "Vigueur, endurance organique, souffle.",
		KEY_PRIMARY_SUBSYSTEMS: ["survival", "movement"],
		KEY_SECONDARY_SUBSYSTEMS: ["melee"],
		KEY_PRIMARY_STATS: [
			"max_stamina",
			"stamina_regen_per_second",
			"fatigue_rate_mult",
			"hunger_rate_mult",
			"thirst_rate_mult",
			"sleep_deprivation_rate_mult"
		],
		KEY_SECONDARY_STATS: [
			"sprint_stamina_cost_mult",
			"jump_stamina_cost_mult",
			"swim_speed"
		]
	},
	AttributeData.Attribute.EMP: {
		KEY_DESCRIPTION: "Empathie, lecture émotionnelle, lien affectif.",
		KEY_PRIMARY_SUBSYSTEMS: ["social", "leadership"],
		KEY_SECONDARY_SUBSYSTEMS: ["detection"],
		KEY_PRIMARY_STATS: [
			"persuasion_success_mult",
			"deception_success_mult",
			"companion_morale_gain_mult"
		],
		KEY_SECONDARY_STATS: [
			"detection_speed_mult",
			"clue_highlight_intensity_mult"
		]
	},
	AttributeData.Attribute.PER: {
		KEY_DESCRIPTION: "Aiguisement sensoriel, attention au détail.",
		KEY_PRIMARY_SUBSYSTEMS: ["detection", "ranged"],
		KEY_SECONDARY_SUBSYSTEMS: ["stealth"],
		KEY_PRIMARY_STATS: [
			"detection_radius_mult",
			"detection_speed_mult",
			"trap_detection_chance_mult"
		],
		KEY_SECONDARY_STATS: [
			"aim_spread_mult",
			"clue_highlight_radius_mult",
			"track_visibility_duration_mult"
		]
	},
	AttributeData.Attribute.CRE: {
		KEY_DESCRIPTION: "Créativité, imagination, pensée latérale.",
		KEY_PRIMARY_SUBSYSTEMS: ["crafting", "investigation"],
		KEY_SECONDARY_SUBSYSTEMS: ["social"],
		KEY_PRIMARY_STATS: [
			"crafting_quality_bonus",
			"crafting_speed_mult",
			"harvesting_yield_mult"
		],
		KEY_SECONDARY_STATS: [
			"interactable_inspection_speed_mult",
			"generic_interaction_speed_mult"
		]
	},
	AttributeData.Attribute.VOL: {
		KEY_DESCRIPTION: "Volonté, détermination, résistance mentale.",
		KEY_PRIMARY_SUBSYSTEMS: ["survival", "domination"],
		KEY_SECONDARY_SUBSYSTEMS: ["social"],
		KEY_PRIMARY_STATS: [
			"mental_resistance",
			"poison_resistance",
			"disease_resistance"
		],
		KEY_SECONDARY_STATS: [
			"intimidation_success_mult",
			"leadership_radius",
			"command_effectiveness_mult"
		]
	}
}


## 2) APTITUDE → GAMEPLAY ROLES -------------------------------------------------------------
##
## Aptitudes are 8 “paths” that define how a character tends to act in the world.
## They bias sets of variables and give each build a clear in‑game fantasy.

const APTITUDE_ROLES: Dictionary = {
	AptitudeData.Aptitude.PUISSANCE: {
		KEY_DESCRIPTION: "Puissance – frapper fort, casser, faire plier par la force.",
		KEY_PRIMARY_SUBSYSTEMS: ["melee", "survival"],
		KEY_SECONDARY_SUBSYSTEMS: ["domination"],
		KEY_PRIMARY_STATS: [
			"melee_damage_mult",
			"stagger_power_mult",
			"block_effectiveness_mult",
			"carry_weight_max"
		],
		KEY_SECONDARY_STATS: [
			"fall_lethal_height",
			"physical_damage_resistance"
		]
	},
	AptitudeData.Aptitude.AISANCE: {
		KEY_DESCRIPTION: "Aisance – se mouvoir avec fluidité, esquiver, se faufiler.",
		KEY_PRIMARY_SUBSYSTEMS: ["movement", "stealth"],
		KEY_SECONDARY_SUBSYSTEMS: ["melee"],
		KEY_PRIMARY_STATS: [
			"run_speed",
			"sprint_speed",
			"acceleration",
			"air_control"
		],
		KEY_SECONDARY_STATS: [
			"visibility_mult",
			"noise_radius_mult",
			"sprint_stamina_cost_mult"
		]
	},
	AptitudeData.Aptitude.PRECISION: {
		KEY_DESCRIPTION: "Précision – viser, manier des outils, exécuter des gestes fins.",
		KEY_PRIMARY_SUBSYSTEMS: ["ranged", "interaction"],
		KEY_SECONDARY_SUBSYSTEMS: ["detection"],
		KEY_PRIMARY_STATS: [
			"aim_spread_mult",
			"aim_sway_mult",
			"reload_speed_mult",
			"lockpicking_speed_mult"
		],
		KEY_SECONDARY_STATS: [
			"trap_disarm_speed_mult",
			"generic_interaction_speed_mult"
		]
	},
	AptitudeData.Aptitude.ATHLETISME: {
		KEY_DESCRIPTION: "Athlétisme – franchir, sauter, grimper, supporter l’effort.",
		KEY_PRIMARY_SUBSYSTEMS: ["movement", "survival"],
		KEY_SECONDARY_SUBSYSTEMS: ["melee"],
		KEY_PRIMARY_STATS: [
			"jump_height",
			"climb_speed",
			"swim_speed",
			"max_stamina"
		],
		KEY_SECONDARY_STATS: [
			"fatigue_rate_mult",
			"fall_safe_height",
			"fall_damage_mult"
		]
	},
	AptitudeData.Aptitude.CHARISME: {
		KEY_DESCRIPTION: "Charisme – capter l’attention, convaincre, émouvoir.",
		KEY_PRIMARY_SUBSYSTEMS: ["social"],
		KEY_SECONDARY_SUBSYSTEMS: ["leadership"],
		KEY_PRIMARY_STATS: [
			"persuasion_success_mult",
			"deception_success_mult",
			"buy_price_mult",
			"sell_price_mult"
		],
		KEY_SECONDARY_STATS: [
			"companion_morale_gain_mult",
			"companion_morale_loss_mult"
		]
	},
	AptitudeData.Aptitude.DETECTION: {
		KEY_DESCRIPTION: "Détection – remarquer, analyser, dépister.",
		KEY_PRIMARY_SUBSYSTEMS: ["detection", "investigation"],
		KEY_SECONDARY_SUBSYSTEMS: ["stealth"],
		KEY_PRIMARY_STATS: [
			"detection_radius_mult",
			"detection_speed_mult",
			"trap_detection_chance_mult",
			"clue_highlight_radius_mult"
		],
		KEY_SECONDARY_STATS: [
			"track_visibility_duration_mult",
			"interactable_inspection_speed_mult"
		]
	},
	AptitudeData.Aptitude.REFLEXION: {
		KEY_DESCRIPTION: "Réflexion – comprendre, concevoir, relier les savoirs.",
		KEY_PRIMARY_SUBSYSTEMS: ["crafting", "investigation"],
		KEY_SECONDARY_SUBSYSTEMS: ["social"],
		KEY_PRIMARY_STATS: [
			"crafting_quality_bonus",
			"crafting_speed_mult",
			"harvesting_yield_mult"
		],
		KEY_SECONDARY_STATS: [
			"generic_interaction_speed_mult",
			"clue_highlight_intensity_mult"
		]
	},
	AptitudeData.Aptitude.DOMINATION: {
		KEY_DESCRIPTION: "Domination – encaisser, imposer, tenir les rênes.",
		KEY_PRIMARY_SUBSYSTEMS: ["survival", "leadership"],
		KEY_SECONDARY_SUBSYSTEMS: ["social"],
		KEY_PRIMARY_STATS: [
			"mental_resistance",
			"poison_resistance",
			"disease_resistance",
			"leadership_radius"
		],
		KEY_SECONDARY_STATS: [
			"intimidation_success_mult",
			"command_effectiveness_mult"
		]
	}
}


## 3) ACTION → GAMEPLAY ROLES ---------------------------------------------------------------
##
## Actions are the main verbs tied to inputs (attack, neutralise, tirer, etc.).
## Each Action focuses on a subset of `CharacterStats` that are relevant whenever
## you perform that family of moves.

const ACTION_ROLES: Dictionary = {
	# Puissance
	ActionData.Action.FRAPPER: {
		KEY_DESCRIPTION: "Attaques de mêlée directes (coups armés ou à mains nues).",
		KEY_PRIMARY_STATS: [
			"melee_damage_mult",
			"melee_attack_speed_mult",
			"melee_stamina_cost_mult"
		],
		KEY_SECONDARY_STATS: [
			"stagger_power_mult",
			"melee_recovery_time_mult"
		]
	},
	ActionData.Action.NEUTRALISER: {
		KEY_DESCRIPTION: "Contrôler, mettre au sol, priver de moyens un adversaire.",
		KEY_PRIMARY_STATS: [
			"stagger_power_mult",
			"block_effectiveness_mult",
			"block_stability_mult"
		],
		KEY_SECONDARY_STATS: [
			"parry_window_mult",
			"melee_combo_window_mult"
		]
	},
	ActionData.Action.TIRER: {
		KEY_DESCRIPTION: "Tirs à distance (arc, arbalète, armes propulsées).",
		KEY_PRIMARY_STATS: [
			"ranged_damage_mult",
			"aim_spread_mult",
			"aim_sway_mult"
		],
		KEY_SECONDARY_STATS: [
			"reload_speed_mult",
			"projectile_velocity_mult"
		]
	},

	# Aisance
	ActionData.Action.REAGIR: {
		KEY_DESCRIPTION: "Réactions réflexes, esquives, contre-mouvements.",
		KEY_PRIMARY_STATS: [
			"run_speed",
			"acceleration",
			"melee_attack_speed_mult"
		],
		KEY_SECONDARY_STATS: [
			"parry_window_mult",
			"melee_combo_window_mult"
		]
	},
	ActionData.Action.DEROBER: {
		KEY_DESCRIPTION: "Vols, escamotages, filatures discrètes.",
		KEY_PRIMARY_STATS: [
			"pickpocket_success_mult",
			"visibility_mult",
			"noise_radius_mult"
		],
		KEY_SECONDARY_STATS: [
			"lockpicking_speed_mult",
			"lockpicking_stability_mult"
		]
	},
	ActionData.Action.COORDONNER: {
		KEY_DESCRIPTION: "Mettre en rythme, coordonner les mouvements d’un groupe.",
		KEY_PRIMARY_STATS: [
			"command_effectiveness_mult",
			"companion_morale_gain_mult"
		],
		KEY_SECONDARY_STATS: [
			"leadership_radius"
		]
	},

	# Précision
	ActionData.Action.MANIER: {
		KEY_DESCRIPTION: "Maniement précis d’armes/objets (viser, maintenir, recharger).",
		KEY_PRIMARY_STATS: [
			"aim_spread_mult",
			"aim_sway_mult",
			"reload_speed_mult"
		],
		KEY_SECONDARY_STATS: [
			"melee_recovery_time_mult",
			"draw_holster_speed_mult"
		]
	},
	ActionData.Action.FACONNER: {
		KEY_DESCRIPTION: "Fabriquer, bricoler, improviser des outils et dispositifs.",
		KEY_PRIMARY_STATS: [
			"crafting_quality_bonus",
			"crafting_speed_mult"
		],
		KEY_SECONDARY_STATS: [
			"repair_efficiency_mult",
			"harvesting_yield_mult"
		]
	},
	ActionData.Action.FIGNOLER: {
		KEY_DESCRIPTION: "Sécurité, pièges, mécanismes délicats.",
		KEY_PRIMARY_STATS: [
			"trap_disarm_speed_mult",
			"trap_detection_chance_mult"
		],
		KEY_SECONDARY_STATS: [
			"lockpicking_speed_mult",
			"lockpicking_stability_mult"
		]
	},

	# Athlétisme
	ActionData.Action.TRAVERSER: {
		KEY_DESCRIPTION: "Traversées longues (course, marche rapide, franchissements).",
		KEY_PRIMARY_STATS: [
			"run_speed",
			"sprint_speed",
			"sprint_stamina_cost_mult"
		],
		KEY_SECONDARY_STATS: [
			"fatigue_rate_mult",
			"fall_safe_height"
		]
	},
	ActionData.Action.EFFORCER: {
		KEY_DESCRIPTION: "Efforts soutenus, port de charges, tractions, sauts puissants.",
		KEY_PRIMARY_STATS: [
			"max_stamina",
			"jump_height",
			"carry_weight_max"
		],
		KEY_SECONDARY_STATS: [
			"fatigue_rate_mult",
			"fall_damage_mult"
		]
	},
	ActionData.Action.MANOEUVRER: {
		KEY_DESCRIPTION: "Manœuvres en terrain complexe ou en selle.",
		KEY_PRIMARY_STATS: [
			"climb_speed",
			"swim_speed",
			"air_control"
		],
		KEY_SECONDARY_STATS: [
			"movement",
			"fall_safe_height"
		]
	},

	# Charisme
	ActionData.Action.CAPTIVER: {
		KEY_DESCRIPTION: "Attirer, retenir l’attention, divertir.",
		KEY_PRIMARY_STATS: [
			"persuasion_success_mult",
			"deception_success_mult"
		],
		KEY_SECONDARY_STATS: [
			"companion_morale_gain_mult"
		]
	},
	ActionData.Action.CONVAINCRE: {
		KEY_DESCRIPTION: "Négocier, argumenter, conclure des accords.",
		KEY_PRIMARY_STATS: [
			"persuasion_success_mult",
			"buy_price_mult",
			"sell_price_mult"
		],
		KEY_SECONDARY_STATS: [
			"command_effectiveness_mult"
		]
	},
	ActionData.Action.INTERPRETER: {
		KEY_DESCRIPTION: "Jouer un rôle, interpréter, mettre en scène.",
		KEY_PRIMARY_STATS: [
			"deception_success_mult",
			"persuasion_success_mult"
		],
		KEY_SECONDARY_STATS: [
			"companion_morale_gain_mult"
		]
	},

	# Détection
	ActionData.Action.DISCERNER: {
		KEY_DESCRIPTION: "Observer, estimer, lire les corps et les objets.",
		KEY_PRIMARY_STATS: [
			"detection_radius_mult",
			"clue_highlight_intensity_mult"
		],
		KEY_SECONDARY_STATS: [
			"track_visibility_duration_mult",
			"interactable_inspection_speed_mult"
		]
	},
	ActionData.Action.DECOUVRIR: {
		KEY_DESCRIPTION: "Enquêter, fouiller, relier des indices.",
		KEY_PRIMARY_STATS: [
			"clue_highlight_radius_mult",
			"track_visibility_duration_mult"
		],
		KEY_SECONDARY_STATS: [
			"detection_speed_mult"
		]
	},
	ActionData.Action.DEPISTER: {
		KEY_DESCRIPTION: "Détecter des présences, des odeurs, des sons.",
		KEY_PRIMARY_STATS: [
			"detection_radius_mult",
			"trap_detection_chance_mult"
		],
		KEY_SECONDARY_STATS: [
			"noise_radius_mult"
		]
	},

	# Réflexion
	ActionData.Action.CONCEVOIR: {
		KEY_DESCRIPTION: "Concevoir des systèmes, protocoles, plans complexes.",
		KEY_PRIMARY_STATS: [
			"crafting_quality_bonus",
			"crafting_speed_mult"
		],
		KEY_SECONDARY_STATS: [
			"repair_efficiency_mult",
			"harvesting_yield_mult"
		]
	},
	ActionData.Action.ACCULTURER: {
		KEY_DESCRIPTION: "Connaître les sociétés, règles, jeux, cultures.",
		KEY_PRIMARY_STATS: [
			"generic_interaction_speed_mult"
		],
		KEY_SECONDARY_STATS: [
			"persuasion_success_mult",
			"deception_success_mult"
		]
	},
	ActionData.Action.ACCLIMATER: {
		KEY_DESCRIPTION: "Comprendre et tirer parti des milieux naturels.",
		KEY_PRIMARY_STATS: [
			"harvesting_yield_mult",
			"harvesting_speed_mult"
		],
		KEY_SECONDARY_STATS: [
			"environmental_cold_resistance",
			"environmental_heat_resistance",
			"environmental_toxic_resistance"
		]
	},

	# Domination
	ActionData.Action.DISCIPLINER: {
		KEY_DESCRIPTION: "Donner des ordres, maintenir la cohésion, sanctionner.",
		KEY_PRIMARY_STATS: [
			"command_effectiveness_mult",
			"leadership_radius"
		],
		KEY_SECONDARY_STATS: [
			"companion_morale_gain_mult",
			"companion_morale_loss_mult"
		]
	},
	ActionData.Action.ENDURER: {
		KEY_DESCRIPTION: "Endurer la douleur, l’inconfort, les excès.",
		KEY_PRIMARY_STATS: [
			"max_health",
			"max_stamina",
			"fatigue_rate_mult"
		],
		KEY_SECONDARY_STATS: [
			"hunger_rate_mult",
			"thirst_rate_mult",
			"sleep_deprivation_rate_mult"
		]
	},
	ActionData.Action.DOMPTER: {
		KEY_DESCRIPTION: "Intimider, briser, apprivoiser et dresser.",
		KEY_PRIMARY_STATS: [
			"intimidation_success_mult",
			"command_effectiveness_mult"
		],
		KEY_SECONDARY_STATS: [
			"companion_morale_loss_mult",
			"leadership_radius"
		]
	}
}


## 4) COMPÉTENCE → HOOK TAGS ----------------------------------------------------------------
##
## Compétences are very granular. Instead of hard‑coding 72 different formulas here,
## we give each one “hook tags” describing *what* it tends to buff. The math layer
## can then decide *how much* each tag contributes.

const COMPETENCE_HOOKS: Dictionary = {
	# Puissance - Frapper
	CompetenceData.Competence.ARME: {
		KEY_TAGS: ["melee_armed", "melee_damage", "melee_control"]
	},
	CompetenceData.Competence.DESARME: {
		KEY_TAGS: ["melee_unarmed", "melee_damage", "melee_defense"]
	},
	CompetenceData.Competence.IMPROVISE: {
		KEY_TAGS: ["melee_improvised", "melee_damage", "harvesting"]
	},

	# Puissance - Neutraliser
	CompetenceData.Competence.LUTTE: {
		KEY_TAGS: ["grappling", "stagger_power", "crowd_control"]
	},
	CompetenceData.Competence.BOTTES: {
		KEY_TAGS: ["weapon_control", "disarm", "block"]
	},
	CompetenceData.Competence.RUSES: {
		KEY_TAGS: ["counter_attacks", "melee_crit", "melee_control"]
	},

	# Puissance - Tirer
	CompetenceData.Competence.BANDE: {
		KEY_TAGS: ["bows", "draw_strength", "projectile_velocity"]
	},
	CompetenceData.Competence.PROPULSE: {
		KEY_TAGS: ["propelled_weapons", "rate_of_fire", "stamina_efficiency"]
	},
	CompetenceData.Competence.JETE: {
		KEY_TAGS: ["thrown_weapons", "projectile_velocity", "accuracy"]
	},

	# Aisance - Réagir
	CompetenceData.Competence.FLUIDITE: {
		KEY_TAGS: ["movement_fluidity", "reaction_time", "dodge"]
	},
	CompetenceData.Competence.ESQUIVE: {
		KEY_TAGS: ["dodge", "avoidance", "positioning"]
	},
	CompetenceData.Competence.MINUTIE: {
		KEY_TAGS: ["fine_gestures", "timing", "combo_control"]
	},

	# Aisance - Dérober
	CompetenceData.Competence.ESCAMOTAGE: {
		KEY_TAGS: ["pickpocket", "sleight_of_hand", "theft"]
	},
	CompetenceData.Competence.ILLUSIONS: {
		KEY_TAGS: ["misdirection", "diversion", "social_stealth"]
	},
	CompetenceData.Competence.DISSIMULATION: {
		KEY_TAGS: ["hiding", "sneaking", "ambush"]
	},

	# Aisance - Coordonner
	CompetenceData.Competence.GESTUELLE: {
		KEY_TAGS: ["performance", "rhythm", "social_presence"]
	},
	CompetenceData.Competence.EVASION: {
		KEY_TAGS: ["disengage", "escape", "positioning"]
	},
	CompetenceData.Competence.EQUILIBRE: {
		KEY_TAGS: ["balance", "narrow_surfaces", "load_balance"]
	},

	# Précision - Manier
	CompetenceData.Competence.VISEE: {
		KEY_TAGS: ["aim_precision", "long_range", "steady_aim"]
	},
	CompetenceData.Competence.CONDUITE: {
		KEY_TAGS: ["vehicle_control", "mount_control", "high_speed"]
	},
	CompetenceData.Competence.HABILETE: {
		KEY_TAGS: ["weapon_handling", "reloads", "dual_wield"]
	},

	# Précision - Façonner
	CompetenceData.Competence.DEBROUILLARDISE: {
		KEY_TAGS: ["campcraft", "field_crafting", "survival_tools"]
	},
	CompetenceData.Competence.BRICOLAGE: {
		KEY_TAGS: ["improvised_repairs", "device_mods", "jury_rigging"]
	},
	CompetenceData.Competence.SAVOIR_FAIRE: {
		KEY_TAGS: ["professional_crafting", "trade_skills", "resource_efficiency"]
	},

	# Précision - Fignoler
	CompetenceData.Competence.ARTIFICES: {
		KEY_TAGS: ["explosives", "distractions", "smoke"]
	},
	CompetenceData.Competence.SECURITE: {
		KEY_TAGS: ["locks", "mechanisms", "access_control"]
	},
	CompetenceData.Competence.CASSE_TETES: {
		KEY_TAGS: ["puzzles", "mechanical_riddles", "complex_locks"]
	},

	# Athlétisme - Traverser
	CompetenceData.Competence.PAS: {
		KEY_TAGS: ["ground_movement", "sprinting", "charging"]
	},
	CompetenceData.Competence.GRIMPE: {
		KEY_TAGS: ["climbing", "mountain_routes", "verticality"]
	},
	CompetenceData.Competence.ACROBATIE: {
		KEY_TAGS: ["acrobatics", "safe_falls", "aerial_control"]
	},

	# Athlétisme - Efforcer
	CompetenceData.Competence.POID: {
		KEY_TAGS: ["lifting", "pushing", "carrying"]
	},
	CompetenceData.Competence.SAUT: {
		KEY_TAGS: ["jump_distance", "jump_height", "precision_jumps"]
	},
	CompetenceData.Competence.NATATION: {
		KEY_TAGS: ["swimming", "underwater_control", "dive"]
	},

	# Athlétisme - Manœuvrer
	CompetenceData.Competence.VOL: {
		KEY_TAGS: ["gliding", "aerial_movement", "controlled_descent"]
	},
	CompetenceData.Competence.FOUISSAGE: {
		KEY_TAGS: ["burrowing", "difficult_terrain", "viscous_media"]
	},
	CompetenceData.Competence.CHEVAUCHEMENT: {
		KEY_TAGS: ["mounted_travel", "mounted_combat", "mount_control"]
	},

	# Charisme - Captiver
	CompetenceData.Competence.SEDUCTION: {
		KEY_TAGS: ["charm", "attraction", "favor"]
	},
	CompetenceData.Competence.MIMETISME: {
		KEY_TAGS: ["imitation", "disguise", "voice_acting"]
	},
	CompetenceData.Competence.CHANT: {
		KEY_TAGS: ["vocal_performance", "song_magicless", "crowd_control_soft"]
	},

	# Charisme - Convaincre
	CompetenceData.Competence.NEGOCIATION: {
		KEY_TAGS: ["trade", "bargaining", "contracts"]
	},
	CompetenceData.Competence.TROMPERIE: {
		KEY_TAGS: ["lies", "bluffs", "scams"]
	},
	CompetenceData.Competence.PRESENTATION: {
		KEY_TAGS: ["first_impression", "teaching", "networking"]
	},

	# Charisme - Interpréter
	CompetenceData.Competence.INSTRUMENTAL: {
		KEY_TAGS: ["instrument_performance", "mood_control", "audience_management"]
	},
	CompetenceData.Competence.INSPIRATION: {
		KEY_TAGS: ["rally", "motivate", "emotional_shift"]
	},
	CompetenceData.Competence.NARRATION: {
		KEY_TAGS: ["storytelling", "propaganda", "rumors"]
	},

	# Détection - Discerner
	CompetenceData.Competence.VISION: {
		KEY_TAGS: ["visual_detection", "reading", "body_language"]
	},
	CompetenceData.Competence.ESTIMATION: {
		KEY_TAGS: ["value_estimates", "economic_read", "art_judgement"]
	},
	CompetenceData.Competence.TOUCHER: {
		KEY_TAGS: ["tactile_detection", "textures", "blind_recognition"]
	},

	# Détection - Découvrir
	CompetenceData.Competence.INVESTIGATION: {
		KEY_TAGS: ["forensics", "clue_linking", "profiling"]
	},
	CompetenceData.Competence.GOUT: {
		KEY_TAGS: ["taste_detection", "culinary", "toxins_by_taste"]
	},
	CompetenceData.Competence.RESSENTI: {
		KEY_TAGS: ["intuition", "weather_sense", "emotional_read"]
	},

	# Détection - Dépister
	CompetenceData.Competence.ODORAT: {
		KEY_TAGS: ["smell_tracking", "airs_quality", "blind_detection"]
	},
	CompetenceData.Competence.AUDITION: {
		KEY_TAGS: ["hearing", "sound_tracking", "echolocation"]
	},
	CompetenceData.Competence.INTEROCEPTION: {
		KEY_TAGS: ["body_signals", "internal_state", "subtle_warnings"]
	},

	# Réflexion - Concevoir
	CompetenceData.Competence.ARTISANAT: {
		KEY_TAGS: ["craft_specialties", "resource_conversion", "production"]
	},
	CompetenceData.Competence.MEDECINE: {
		KEY_TAGS: ["medicine", "healing", "diagnosis"]
	},
	CompetenceData.Competence.INGENIERIE: {
		KEY_TAGS: ["engineering", "infrastructure", "complex_devices"]
	},

	# Réflexion - Acculturer
	CompetenceData.Competence.JEUX: {
		KEY_TAGS: ["games", "probabilities", "competition"]
	},
	CompetenceData.Competence.SOCIETE: {
		KEY_TAGS: ["societies", "institutions", "factions"]
	},
	CompetenceData.Competence.GEOGRAPHIE: {
		KEY_TAGS: ["world_knowledge", "biomes", "navigation"]
	},

	# Réflexion - Acclimater
	CompetenceData.Competence.NATURE: {
		KEY_TAGS: ["flora_fauna", "natural_resources", "environmental_read"]
	},
	CompetenceData.Competence.PASTORALISME: {
		KEY_TAGS: ["herding", "animal_husbandry", "livestock"]
	},
	CompetenceData.Competence.AGRONOMIE: {
		KEY_TAGS: ["farming", "crops", "food_production"]
	},

	# Domination - Discipliner
	CompetenceData.Competence.COMMANDEMENT: {
		KEY_TAGS: ["command", "tactics", "fear_respect"]
	},
	CompetenceData.Competence.OBEISSANCE: {
		KEY_TAGS: ["submission", "self_sacrifice", "adaptation"]
	},
	CompetenceData.Competence.OBSTINANCE: {
		KEY_TAGS: ["stubbornness", "principles", "long_term_focus"]
	},

	# Domination - Endurer
	CompetenceData.Competence.GLOUTONNERIE: {
		KEY_TAGS: ["ingestion", "capacity", "excess_intake"]
	},
	CompetenceData.Competence.BEUVERIE: {
		KEY_TAGS: ["alcohol_tolerance", "texture_resistance"]
	},
	CompetenceData.Competence.ENTRAILLES: {
		KEY_TAGS: ["internal_resistance", "toxins", "pollutants"]
	},

	# Domination - Dompter
	CompetenceData.Competence.INTIMIDATION: {
		KEY_TAGS: ["fear", "threats", "interrogation"]
	},
	CompetenceData.Competence.APPRIVOISEMENT: {
		KEY_TAGS: ["taming", "trust_building", "mount_training"]
	},
	CompetenceData.Competence.DRESSAGE: {
		KEY_TAGS: ["drill", "advanced_training", "breaking_will"]
	}
}


## 5) MAÎTRISES → GENERAL ROLE --------------------------------------------------------------
##
## Individual Maîtrises are listed in `MasteryRegistry`. Instead of duplicating them,
## we describe their *general* role here:
##
## - Unlock new move variants or interactions (ex: nouvelle attaque, charge, projection).
## - Turn flat bonuses into conditional ones (ex: +dégâts seulement en backstab).
## - Push or raise caps/soft-caps (ex: plafond sur la vitesse, la portée, etc.).
## - Add exception rules (ex: “pas de coût d’endurance en condition X”).
##
## The math layer can check which Maîtrises are active for a Compétence and:
## - Apply extra multipliers to specific `CharacterStats` fields.
## - Switch to alternative formulas for certain actions.


